import { db } from "./db";
import { exercises } from "@shared/schema";

const exerciseData = [
  // CHEST EXERCISES
  {
    name: "Bench Press",
    description: "Classic chest exercise performed lying on a bench",
    instructions: "Lie on bench, grip bar with hands slightly wider than shoulders, lower to chest, press up",
    equipmentRequired: ["barbell", "bench"],
    muscleGroups: ["chest", "shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Incline Bench Press",
    description: "Upper chest focused barbell press on inclined bench",
    instructions: "Set bench to 30-45 degrees, press barbell from upper chest",
    equipmentRequired: ["barbell", "incline bench"],
    muscleGroups: ["chest", "shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Decline Bench Press",
    description: "Lower chest focused barbell press on declined bench",
    instructions: "Set bench to decline position, press barbell from lower chest",
    equipmentRequired: ["barbell", "decline bench"],
    muscleGroups: ["chest", "shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Dumbbell Bench Press",
    description: "Chest exercise using dumbbells for greater range of motion",
    instructions: "Lie on bench, press dumbbells from chest level to arms extended",
    equipmentRequired: ["dumbbells", "bench"],
    muscleGroups: ["chest", "shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Incline Dumbbell Press",
    description: "Upper chest focused dumbbell press",
    instructions: "Set bench to 30-45 degrees, press dumbbells from upper chest",
    equipmentRequired: ["dumbbells", "incline bench"],
    muscleGroups: ["chest", "shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Dumbbell Flyes",
    description: "Isolation exercise for chest using dumbbells",
    instructions: "Lie on bench, arc dumbbells down and out, then bring together over chest",
    equipmentRequired: ["dumbbells", "bench"],
    muscleGroups: ["chest"],
    movementPattern: "fly",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Push-ups",
    description: "Classic bodyweight chest exercise",
    instructions: "Start in plank position, lower chest to ground, push back up",
    equipmentRequired: [],
    muscleGroups: ["chest", "shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Chest Dips",
    description: "Bodyweight exercise targeting lower chest",
    instructions: "Support body on parallel bars, lower down by bending arms, push back up",
    equipmentRequired: ["parallel bars"],
    muscleGroups: ["chest", "shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Cable Chest Fly",
    description: "Cable variation of chest fly exercise",
    instructions: "Set cables at chest height, bring handles together in arc motion",
    equipmentRequired: ["cable machine"],
    muscleGroups: ["chest"],
    movementPattern: "fly",
    exerciseType: "weight_reps",
    equipmentType: "cable"
  },
  
  // BACK EXERCISES
  {
    name: "Pull-ups",
    description: "Classic bodyweight back exercise",
    instructions: "Hang from bar, pull body up until chin clears bar, lower with control",
    equipmentRequired: ["pull-up bar"],
    muscleGroups: ["back", "biceps"],
    movementPattern: "pull",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Deadlift",
    description: "Fundamental compound movement for posterior chain",
    instructions: "Grip bar, keep back straight, lift by extending hips and knees",
    equipmentRequired: ["barbell"],
    muscleGroups: ["back", "glutes", "hamstrings"],
    movementPattern: "hinge",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Bent-Over Barbell Row",
    description: "Compound back exercise using barbell",
    instructions: "Bend over holding barbell, row to lower chest keeping back straight",
    equipmentRequired: ["barbell"],
    muscleGroups: ["back", "biceps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Lat Pulldown",
    description: "Machine exercise targeting latissimus dorsi",
    instructions: "Pull bar down to upper chest, squeeze shoulder blades together",
    equipmentRequired: ["lat pulldown machine"],
    muscleGroups: ["back", "biceps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "machine"
  },
  {
    name: "Seated Cable Row",
    description: "Cable exercise for mid-back development",
    instructions: "Sit upright, pull handle to torso, squeeze shoulder blades",
    equipmentRequired: ["cable machine"],
    muscleGroups: ["back", "biceps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "cable"
  },
  {
    name: "T-Bar Row",
    description: "Back exercise using T-bar or landmine setup",
    instructions: "Straddle bar, pull to chest with neutral spine",
    equipmentRequired: ["t-bar", "plates"],
    muscleGroups: ["back", "biceps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Single-Arm Dumbbell Row",
    description: "Unilateral back exercise for muscle balance",
    instructions: "Support on bench, row dumbbell to hip, squeeze at top",
    equipmentRequired: ["dumbbell", "bench"],
    muscleGroups: ["back", "biceps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  
  // SHOULDER EXERCISES
  {
    name: "Overhead Press",
    description: "Primary shoulder exercise for overhead strength",
    instructions: "Press barbell from shoulders to overhead, keep core tight",
    equipmentRequired: ["barbell"],
    muscleGroups: ["shoulders", "triceps"],
    movementPattern: "press",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Dumbbell Shoulder Press",
    description: "Shoulder press using dumbbells for independent arm movement",
    instructions: "Press dumbbells from shoulder level to overhead",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["shoulders", "triceps"],
    movementPattern: "press",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Lateral Raises",
    description: "Isolation exercise for side deltoids",
    instructions: "Raise dumbbells out to sides until parallel to floor",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["shoulders"],
    movementPattern: "raise",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Front Raises",
    description: "Isolation exercise for front deltoids",
    instructions: "Raise dumbbells in front to shoulder height",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["shoulders"],
    movementPattern: "raise",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Rear Delt Flyes",
    description: "Isolation exercise for posterior deltoids",
    instructions: "Bend over, raise dumbbells back and out",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["shoulders"],
    movementPattern: "fly",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Upright Rows",
    description: "Compound exercise for shoulders and traps",
    instructions: "Pull barbell up along body to chest level",
    equipmentRequired: ["barbell"],
    muscleGroups: ["shoulders", "traps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  
  // LEG EXERCISES
  {
    name: "Squats",
    description: "Fundamental lower body compound movement",
    instructions: "Descend by bending knees and hips, return to standing",
    equipmentRequired: ["barbell"],
    muscleGroups: ["quads", "glutes", "hamstrings"],
    movementPattern: "squat",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Romanian Deadlift",
    description: "Hip hinge movement targeting hamstrings and glutes",
    instructions: "Lower barbell by pushing hips back, keep knees slightly bent",
    equipmentRequired: ["barbell"],
    muscleGroups: ["hamstrings", "glutes"],
    movementPattern: "hinge",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Bulgarian Split Squats",
    description: "Single-leg squat variation for unilateral strength",
    instructions: "Rear foot elevated, descend into lunge position",
    equipmentRequired: ["bench"],
    muscleGroups: ["quads", "glutes"],
    movementPattern: "squat",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Walking Lunges",
    description: "Dynamic lunge variation",
    instructions: "Step forward into lunge, alternate legs while moving forward",
    equipmentRequired: [],
    muscleGroups: ["quads", "glutes", "hamstrings"],
    movementPattern: "lunge",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Leg Press",
    description: "Machine-based leg exercise",
    instructions: "Press weight up by extending knees and hips",
    equipmentRequired: ["leg press machine"],
    muscleGroups: ["quads", "glutes"],
    movementPattern: "press",
    exerciseType: "weight_reps",
    equipmentType: "machine"
  },
  {
    name: "Leg Curls",
    description: "Isolation exercise for hamstrings",
    instructions: "Curl weight up by flexing knees while lying prone",
    equipmentRequired: ["leg curl machine"],
    muscleGroups: ["hamstrings"],
    movementPattern: "curl",
    exerciseType: "weight_reps",
    equipmentType: "machine"
  },
  {
    name: "Leg Extensions",
    description: "Isolation exercise for quadriceps",
    instructions: "Extend legs to straighten knees against resistance",
    equipmentRequired: ["leg extension machine"],
    muscleGroups: ["quads"],
    movementPattern: "extension",
    exerciseType: "weight_reps",
    equipmentType: "machine"
  },
  {
    name: "Calf Raises",
    description: "Isolation exercise for calf muscles",
    instructions: "Rise up on toes, lower under control",
    equipmentRequired: [],
    muscleGroups: ["calves"],
    movementPattern: "raise",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  
  // ARM EXERCISES
  {
    name: "Barbell Bicep Curls",
    description: "Classic bicep exercise using barbell",
    instructions: "Curl barbell up by flexing biceps, lower with control",
    equipmentRequired: ["barbell"],
    muscleGroups: ["biceps"],
    movementPattern: "curl",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Dumbbell Bicep Curls",
    description: "Bicep exercise using dumbbells",
    instructions: "Curl dumbbells up alternating or simultaneously",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["biceps"],
    movementPattern: "curl",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Hammer Curls",
    description: "Bicep variation with neutral grip",
    instructions: "Curl dumbbells with palms facing each other",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["biceps", "forearms"],
    movementPattern: "curl",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Close-Grip Bench Press",
    description: "Tricep-focused bench press variation",
    instructions: "Bench press with hands closer together, focus on triceps",
    equipmentRequired: ["barbell", "bench"],
    muscleGroups: ["triceps", "chest"],
    movementPattern: "press",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Tricep Dips",
    description: "Bodyweight exercise for triceps",
    instructions: "Lower body by bending arms, push back up",
    equipmentRequired: ["parallel bars"],
    muscleGroups: ["triceps"],
    movementPattern: "push",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Overhead Tricep Extension",
    description: "Isolation exercise for triceps",
    instructions: "Extend dumbbell overhead by straightening arms",
    equipmentRequired: ["dumbbell"],
    muscleGroups: ["triceps"],
    movementPattern: "extension",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  
  // CORE EXERCISES
  {
    name: "Plank",
    description: "Isometric core strengthening exercise",
    instructions: "Hold body straight in push-up position",
    equipmentRequired: [],
    muscleGroups: ["core"],
    movementPattern: "hold",
    exerciseType: "time",
    equipmentType: "bodyweight"
  },
  {
    name: "Russian Twists",
    description: "Rotational core exercise",
    instructions: "Sit with knees bent, rotate torso side to side",
    equipmentRequired: [],
    muscleGroups: ["core"],
    movementPattern: "rotation",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Mountain Climbers",
    description: "Dynamic core exercise",
    instructions: "In plank position, alternate bringing knees to chest",
    equipmentRequired: [],
    muscleGroups: ["core"],
    movementPattern: "dynamic",
    exerciseType: "time",
    equipmentType: "bodyweight"
  },
  {
    name: "Dead Bug",
    description: "Core stability exercise",
    instructions: "Lie on back, extend opposite arm and leg while keeping core stable",
    equipmentRequired: [],
    muscleGroups: ["core"],
    movementPattern: "stability",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Bicycle Crunches",
    description: "Dynamic abdominal exercise",
    instructions: "Bring opposite elbow to knee in cycling motion",
    equipmentRequired: [],
    muscleGroups: ["core"],
    movementPattern: "crunch",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Hanging Leg Raises",
    description: "Advanced core exercise",
    instructions: "Hang from bar, raise legs up while keeping core tight",
    equipmentRequired: ["pull-up bar"],
    muscleGroups: ["core"],
    movementPattern: "raise",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Ab Wheel Rollout",
    description: "Advanced core strengthening exercise",
    instructions: "Roll wheel forward while maintaining straight body line",
    equipmentRequired: ["ab wheel"],
    muscleGroups: ["core"],
    movementPattern: "rollout",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  }
];

export async function seedExercises() {
  try {
    console.log("Starting exercise seeding...");
    
    // Clear existing system exercises first
    await db.delete(exercises).where({ isCustom: false });
    
    // Insert exercises in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < exerciseData.length; i += batchSize) {
      const batch = exerciseData.slice(i, i + batchSize);
      await db.insert(exercises).values(
        batch.map(exercise => ({
          ...exercise,
          isCustom: false,
          createdBy: null
        }))
      );
      console.log(`Inserted exercises ${i + 1} to ${Math.min(i + batchSize, exerciseData.length)}`);
    }
    
    console.log(`Successfully seeded ${exerciseData.length} exercises`);
  } catch (error) {
    console.error("Error seeding exercises:", error);
    throw error;
  }
}