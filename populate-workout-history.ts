import { db } from './server/db.js';
import { workouts, workoutExercises, exerciseSets } from './shared/schema.js';

interface WorkoutSession {
  name: string;
  templateId: number;
  exercises: {
    exerciseId: number;
    sets: {
      weight: number;
      reps: number;
      rpe?: number;
    }[];
  }[];
}

// Common workout templates with progressive overload
const workoutTemplates: WorkoutSession[] = [
  {
    name: "Push Day",
    templateId: 2,
    exercises: [
      { exerciseId: 4, sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 7 }, { weight: 80, reps: 6 }] }, // Bench Press
      { exerciseId: 18, sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 10 }, { weight: 25, reps: 9 }] }, // Incline Dumbbell Press
      { exerciseId: 32, sets: [{ weight: 15, reps: 15 }, { weight: 15, reps: 12 }, { weight: 15, reps: 10 }] }, // Shoulder Press
    ]
  },
  {
    name: "Pull Day", 
    templateId: 4,
    exercises: [
      { exerciseId: 8, sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }, { weight: 0, reps: 8 }] }, // Chest Dips (bodyweight)
      { exerciseId: 31, sets: [{ weight: 25, reps: 12 }, { weight: 25, reps: 10 }, { weight: 25, reps: 8 }] }, // Barbell Bicep Curls
      { exerciseId: 43, sets: [{ weight: 0, reps: 8 }, { weight: 0, reps: 6 }, { weight: 0, reps: 5 }] }, // Ab Wheel Rollout
    ]
  },
  {
    name: "Leg Day",
    templateId: 5, 
    exercises: [
      { exerciseId: 9, sets: [{ weight: 20, reps: 15 }, { weight: 20, reps: 12 }, { weight: 20, reps: 10 }] }, // Cable Chest Fly
    ]
  }
];

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function populateWorkoutHistory() {
  console.log('Starting to populate workout history...');
  
  const userId = "1455543"; // Your user ID
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3); // 3 months ago

  // Generate workouts every 2-3 days with progressive overload
  let currentDate = new Date(startDate);
  let workoutCount = 0;

  while (currentDate < endDate) {
    // Skip some days randomly (rest days)
    const daysToAdd = Math.random() < 0.3 ? 3 : 2; // 30% chance of 3-day gap, 70% chance of 2-day gap
    
    // Select a random workout template
    const template = workoutTemplates[Math.floor(Math.random() * workoutTemplates.length)];
    
    // Calculate progressive overload based on weeks passed
    const weeksElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const progressMultiplier = 1 + (weeksElapsed * 0.05); // 5% increase per week
    
    try {
      // Create workout
      const [newWorkout] = await db.insert(workouts).values({
        userId,
        templateId: template.templateId,
        name: template.name,
        slug: generateSlug(),
        startTime: new Date(currentDate),
        endTime: new Date(currentDate.getTime() + (45 * 60 * 1000)), // 45 min duration
        duration: 45,
        notes: `Generated workout session #${workoutCount + 1}`,
      }).returning();

      console.log(`Created workout: ${newWorkout.name} on ${currentDate.toDateString()}`);

      // Create workout exercises and sets
      for (const exercise of template.exercises) {
        const [workoutExercise] = await db.insert(workoutExercises).values({
          workoutId: newWorkout.id,
          exerciseId: exercise.exerciseId,
          orderIndex: template.exercises.indexOf(exercise),
        }).returning();

        // Create sets with progressive overload
        for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
          const originalSet = exercise.sets[setIndex];
          const progressedWeight = originalSet.weight > 0 
            ? Math.round(originalSet.weight * progressMultiplier * 2) / 2 // Round to nearest 0.5kg
            : originalSet.weight; // Keep bodyweight exercises at 0
          
          // Add some variance to reps (±1-2 reps)
          const repsVariance = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          const actualReps = Math.max(1, originalSet.reps + repsVariance);

          await db.insert(exerciseSets).values({
            workoutExerciseId: workoutExercise.id,
            setNumber: setIndex + 1,
            weight: progressedWeight.toString(),
            reps: actualReps,
            rpe: originalSet.rpe || Math.floor(Math.random() * 3) + 7, // RPE 7-9
            completed: true,
          });
        }
      }

      workoutCount++;
    } catch (error) {
      console.error(`Error creating workout for ${currentDate.toDateString()}:`, error);
    }

    // Move to next workout date
    currentDate.setDate(currentDate.getDate() + daysToAdd);
  }

  console.log(`✓ Generated ${workoutCount} workout sessions with progressive overload`);
  console.log('Workout history population complete!');
}

// Run the population
populateWorkoutHistory().catch(console.error);