import { db } from './server/db.js';
import { 
  workouts, 
  workoutExercises, 
  exerciseSets, 
  userBodyweight, 
  bodyMeasurements,
  workoutTemplates,
  templateExercises
} from './shared/schema.js';

const userId = 'dev-user-1';

// Helper function to generate dates over the past 3 months
function generateDateRange(startDaysAgo: number, endDaysAgo: number, frequency: number): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  
  for (let i = startDaysAgo; i >= endDaysAgo; i -= frequency) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  return dates;
}

// Helper to generate workout slug
function generateSlug(): string {
  return Math.random().toString(36).substring(2, 15);
}

async function populateComprehensiveFitnessData() {
  console.log('Starting comprehensive fitness data population...');

  try {
    // First, create some workout templates
    const templates = [
      {
        name: 'Push Day',
        description: 'Chest, shoulders, and triceps workout',
        exercises: [
          { exerciseId: 8, sets: 4, reps: 8, weight: 80, rest: 180 }, // Bench Press
          { exerciseId: 49, sets: 3, reps: 10, weight: 25, rest: 120 }, // Dumbbell Shoulder Press
          { exerciseId: 35, sets: 3, reps: 12, weight: 20, rest: 90 }, // Dumbbell Flyes
          { exerciseId: 51, sets: 3, reps: 15, weight: 15, rest: 90 }, // Tricep Dips
        ]
      },
      {
        name: 'Pull Day',
        description: 'Back and biceps workout',
        exercises: [
          { exerciseId: 11, sets: 4, reps: 5, weight: 120, rest: 240 }, // Deadlift
          { exerciseId: 12, sets: 4, reps: 8, weight: 70, rest: 180 }, // Bent-Over Barbell Row
          { exerciseId: 26, sets: 3, reps: 10, weight: 0, rest: 120 }, // Pull-ups
          { exerciseId: 28, sets: 3, reps: 12, weight: 15, rest: 90 }, // Dumbbell Bicep Curls
        ]
      },
      {
        name: 'Leg Day',
        description: 'Lower body strength and power',
        exercises: [
          { exerciseId: 30, sets: 4, reps: 8, weight: 100, rest: 240 }, // Squats
          { exerciseId: 24, sets: 3, reps: 10, weight: 80, rest: 180 }, // Romanian Deadlift
          { exerciseId: 25, sets: 3, reps: 12, weight: 50, rest: 120 }, // Bulgarian Split Squats
          { exerciseId: 22, sets: 4, reps: 15, weight: 40, rest: 90 }, // Calf Raises
        ]
      },
      {
        name: 'Upper Body',
        description: 'Full upper body workout',
        exercises: [
          { exerciseId: 8, sets: 3, reps: 10, weight: 75, rest: 180 }, // Bench Press
          { exerciseId: 12, sets: 3, reps: 10, weight: 65, rest: 180 }, // Bent-Over Row
          { exerciseId: 49, sets: 3, reps: 12, weight: 22, rest: 120 }, // Shoulder Press
          { exerciseId: 28, sets: 3, reps: 12, weight: 15, rest: 90 }, // Bicep Curls
        ]
      },
      {
        name: 'Cardio & Core',
        description: 'Cardiovascular and core strengthening',
        exercises: [
          { exerciseId: 43, sets: 3, reps: 15, weight: 0, rest: 60 }, // Ab Wheel Rollout
          { exerciseId: 17, sets: 3, reps: 20, weight: 0, rest: 60 }, // Mountain Climbers
          { exerciseId: 16, sets: 4, reps: 30, weight: 0, rest: 45 }, // Jumping Jacks
          { exerciseId: 27, sets: 3, reps: 60, weight: 0, rest: 90 }, // Plank (seconds)
        ]
      }
    ];

    // Create templates
    const createdTemplates = [];
    for (const template of templates) {
      const [createdTemplate] = await db.insert(workoutTemplates).values({
        userId,
        name: template.name,
        description: template.description,
        slug: generateSlug(),
      }).returning();
      
      // Add exercises to template
      for (let i = 0; i < template.exercises.length; i++) {
        const exercise = template.exercises[i];
        await db.insert(templateExercises).values({
          templateId: createdTemplate.id,
          exerciseId: exercise.exerciseId,
          orderIndex: i,
          setsTarget: exercise.sets,
          repsTarget: exercise.reps,
          weightTarget: exercise.weight,
          restDuration: exercise.rest,
        });
      }
      
      createdTemplates.push({ ...createdTemplate, exercises: template.exercises });
    }

    console.log(`Created ${createdTemplates.length} workout templates`);

    // Generate workout dates over 3 months (every 2-3 days with some variation)
    const workoutDates = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 90); // Start 3 months ago
    
    let currentDate = new Date(baseDate);
    while (currentDate < new Date()) {
      workoutDates.push(new Date(currentDate));
      // Add 2-4 days randomly for realistic spacing
      currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 3) + 2);
    }

    console.log(`Generated ${workoutDates.length} workout dates`);

    // Create workouts with progressive overload
    let workoutCount = 0;
    for (const workoutDate of workoutDates) {
      const templateIndex = workoutCount % createdTemplates.length;
      const template = createdTemplates[templateIndex];
      
      // Calculate duration (45-90 minutes)
      const duration = Math.floor(Math.random() * 45) + 45;
      const endTime = new Date(workoutDate);
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      // Create workout
      const [workout] = await db.insert(workouts).values({
        userId,
        templateId: template.id,
        name: template.name,
        slug: generateSlug(),
        startTime: workoutDate,
        endTime,
        duration,
        rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
        perceivedExertion: Math.floor(Math.random() * 4) + 6, // 6-10 RPE
      }).returning();

      // Add exercises to workout with progressive overload
      for (let i = 0; i < template.exercises.length; i++) {
        const exerciseTemplate = template.exercises[i];
        
        // Progressive overload: small increases over time
        const progressFactor = workoutCount * 0.02; // 2% increase per workout
        const weight = exerciseTemplate.weight > 0 
          ? Math.round(exerciseTemplate.weight * (1 + progressFactor)) 
          : 0;
        
        const [workoutExercise] = await db.insert(workoutExercises).values({
          workoutId: workout.id,
          exerciseId: exerciseTemplate.exerciseId,
          orderIndex: i,
          sets: exerciseTemplate.sets,
          targetReps: exerciseTemplate.reps,
          targetWeight: weight,
        }).returning();

        // Create sets for this exercise
        for (let setIndex = 0; setIndex < exerciseTemplate.sets; setIndex++) {
          // Add some variation to reps and weight
          const actualReps = exerciseTemplate.reps + Math.floor(Math.random() * 3) - 1;
          const actualWeight = weight > 0 ? weight + Math.floor(Math.random() * 5) - 2 : 0;
          
          await db.insert(exerciseSets).values({
            workoutExerciseId: workoutExercise.id,
            setNumber: setIndex + 1,
            reps: Math.max(1, actualReps),
            weight: Math.max(0, actualWeight),
            rpe: Math.floor(Math.random() * 3) + 7, // 7-10 RPE
            restDuration: exerciseTemplate.rest,
          });
        }
      }
      
      workoutCount++;
    }

    console.log(`Created ${workoutCount} workouts with exercises and sets`);

    // Generate bodyweight data (weekly weigh-ins with gradual progress)
    const weightDates = generateDateRange(90, 0, 7); // Weekly for 3 months
    let currentWeight = 75; // Starting weight in kg
    
    for (const date of weightDates) {
      // Gradual weight change (could be loss or gain)
      const weightChange = (Math.random() - 0.5) * 0.5; // ±0.25kg variation
      currentWeight += weightChange;
      
      await db.insert(userBodyweight).values({
        userId,
        weight: Math.round(currentWeight * 10) / 10, // Round to 1 decimal
        date,
      });
    }

    console.log(`Created ${weightDates.length} bodyweight entries`);

    // Generate body measurements (monthly)
    const measurementDates = generateDateRange(90, 0, 30); // Monthly for 3 months
    const measurements = [
      { type: 'chest', startValue: 100, change: 2 },
      { type: 'waist', startValue: 85, change: -3 },
      { type: 'bicep_left', startValue: 35, change: 1.5 },
      { type: 'bicep_right', startValue: 35, change: 1.5 },
      { type: 'thigh_left', startValue: 58, change: 1 },
      { type: 'thigh_right', startValue: 58, change: 1 },
    ];

    for (const date of measurementDates) {
      const progressFactor = (90 - Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24))) / 90;
      
      for (const measurement of measurements) {
        const value = measurement.startValue + (measurement.change * progressFactor);
        
        await db.insert(bodyMeasurements).values({
          userId,
          measurementType: measurement.type,
          value: Math.round(value * 10) / 10,
          unit: 'cm',
          date,
        });
      }
    }

    console.log(`Created ${measurementDates.length * measurements.length} body measurements`);

    console.log('✅ Comprehensive fitness data population completed successfully!');
    console.log('📊 Data includes:');
    console.log(`   - ${createdTemplates.length} workout templates`);
    console.log(`   - ${workoutCount} completed workouts over 3 months`);
    console.log(`   - ${weightDates.length} bodyweight entries`);
    console.log(`   - ${measurementDates.length * measurements.length} body measurements`);
    console.log('   - Progressive overload in strength exercises');
    console.log('   - Realistic workout frequency and ratings');

  } catch (error) {
    console.error('❌ Error populating comprehensive fitness data:', error);
    throw error;
  }
}

// Run the population if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateComprehensiveFitnessData()
    .then(() => {
      console.log('Data population completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Data population failed:', error);
      process.exit(1);
    });
}

export { populateComprehensiveFitnessData };