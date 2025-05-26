import { db } from "./db";
import { exercises } from "@shared/schema";

const exerciseData = [
  // CHEST EXERCISES
  {
    name: "Bench Press",
    description: "Classic chest exercise performed lying on a bench",
    instructions: "Lie on bench, grip bar with hands slightly wider than shoulders, lower to chest, press up",
    difficultyLevel: "intermediate",
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
    difficultyLevel: "intermediate",
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
    difficultyLevel: "intermediate",
    equipmentRequired: ["barbell", "decline bench"],
    muscleGroups: ["chest", "shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Dumbbell Bench Press",
    description: "Chest exercise with dumbbells for greater range of motion",
    instructions: "Lie on bench, press dumbbells from chest level to arms extended",
    difficultyLevel: "beginner",
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
    difficultyLevel: "beginner",
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
    difficultyLevel: "intermediate",
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
    difficultyLevel: "beginner",
    equipmentRequired: [],
    muscleGroups: ["chest", "shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Diamond Push-ups",
    description: "Tricep-focused push-up variation",
    instructions: "Form diamond shape with hands, perform push-up with narrow grip",
    difficultyLevel: "intermediate",
    equipmentRequired: [],
    muscleGroups: ["triceps", "chest", "shoulders"],
    movementPattern: "push",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Chest Dips",
    description: "Bodyweight exercise targeting lower chest",
    instructions: "Lean forward on parallel bars, lower body, push back up",
    difficultyLevel: "intermediate",
    equipmentRequired: ["parallel bars"],
    muscleGroups: ["chest", "triceps", "shoulders"],
    movementPattern: "push",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },

  // BACK EXERCISES
  {
    name: "Pull-ups",
    description: "Upper body pulling exercise",
    instructions: "Hang from bar with overhand grip, pull body up until chin clears bar",
    difficultyLevel: "intermediate",
    equipmentRequired: ["pull-up bar"],
    muscleGroups: ["lats", "rhomboids", "biceps"],
    movementPattern: "pull",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Chin-ups",
    description: "Pull-up variation with underhand grip",
    instructions: "Hang from bar with underhand grip, pull body up",
    difficultyLevel: "intermediate",
    equipmentRequired: ["pull-up bar"],
    muscleGroups: ["lats", "biceps", "rhomboids"],
    movementPattern: "pull",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Bent-over Barbell Row",
    description: "Compound back exercise with barbell",
    instructions: "Bend over at hips, pull barbell to lower chest",
    difficultyLevel: "intermediate",
    equipmentRequired: ["barbell"],
    muscleGroups: ["lats", "rhomboids", "middle traps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Dumbbell Rows",
    description: "Unilateral back exercise with dumbbell",
    instructions: "Support body with one hand, row dumbbell to hip with other arm",
    difficultyLevel: "beginner",
    equipmentRequired: ["dumbbell", "bench"],
    muscleGroups: ["lats", "rhomboids", "middle traps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "T-Bar Row",
    description: "Thick grip rowing exercise",
    instructions: "Straddle T-bar, pull handle to chest while bent over",
    difficultyLevel: "intermediate",
    equipmentRequired: ["t-bar"],
    muscleGroups: ["lats", "rhomboids", "middle traps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "machine"
  },
  {
    name: "Lat Pulldown",
    description: "Machine exercise targeting latissimus dorsi",
    instructions: "Pull bar down to upper chest while seated",
    difficultyLevel: "beginner",
    equipmentRequired: ["cable machine"],
    muscleGroups: ["lats", "rhomboids", "biceps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "machine"
  },
  {
    name: "Seated Cable Row",
    description: "Horizontal pulling exercise using cable machine",
    instructions: "Pull cable handle to abdomen while seated",
    difficultyLevel: "beginner",
    equipmentRequired: ["cable machine"],
    muscleGroups: ["lats", "rhomboids", "middle traps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "machine"
  },
  {
    name: "Deadlift",
    description: "King of all exercises - full body compound movement",
    instructions: "Lift bar from ground by extending hips and knees simultaneously",
    difficultyLevel: "advanced",
    equipmentRequired: ["barbell"],
    muscleGroups: ["hamstrings", "glutes", "erector spinae", "traps"],
    movementPattern: "hinge",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },

  // SHOULDERS
  {
    name: "Overhead Press",
    description: "Standing barbell shoulder press",
    instructions: "Press barbell from shoulders to overhead position",
    difficultyLevel: "intermediate",
    equipmentRequired: ["barbell"],
    muscleGroups: ["shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Dumbbell Shoulder Press",
    description: "Seated or standing dumbbell press",
    instructions: "Press dumbbells from shoulder level to overhead",
    difficultyLevel: "beginner",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["shoulders", "triceps"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Lateral Raises",
    description: "Isolation exercise for side deltoids",
    instructions: "Raise dumbbells out to sides until parallel with ground",
    difficultyLevel: "beginner",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["shoulders"],
    movementPattern: "raise",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Front Raises",
    description: "Isolation exercise for front deltoids",
    instructions: "Raise dumbbell in front of body to shoulder height",
    difficultyLevel: "beginner",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["shoulders"],
    movementPattern: "raise",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Rear Delt Flyes",
    description: "Isolation exercise for rear deltoids",
    instructions: "Bent over, raise dumbbells out to sides",
    difficultyLevel: "beginner",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["rear delts"],
    movementPattern: "fly",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Upright Rows",
    description: "Compound exercise for shoulders and traps",
    instructions: "Pull barbell straight up along body to chin level",
    difficultyLevel: "intermediate",
    equipmentRequired: ["barbell"],
    muscleGroups: ["shoulders", "traps"],
    movementPattern: "pull",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Arnold Press",
    description: "Dumbbell press with rotation for full deltoid development",
    instructions: "Start palms facing you, rotate and press overhead",
    difficultyLevel: "intermediate",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["shoulders"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },

  // LEGS
  {
    name: "Squats",
    description: "King of leg exercises - compound movement",
    instructions: "Lower body by bending knees and hips, return to standing",
    difficultyLevel: "intermediate",
    equipmentRequired: ["barbell", "squat rack"],
    muscleGroups: ["quads", "glutes", "hamstrings"],
    movementPattern: "squat",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Front Squats",
    description: "Quad-focused squat variation",
    instructions: "Hold bar across front of shoulders, squat down and up",
    difficultyLevel: "advanced",
    equipmentRequired: ["barbell", "squat rack"],
    muscleGroups: ["quads", "glutes", "core"],
    movementPattern: "squat",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Goblet Squats",
    description: "Beginner-friendly squat with dumbbell",
    instructions: "Hold dumbbell at chest, squat down keeping chest up",
    difficultyLevel: "beginner",
    equipmentRequired: ["dumbbell"],
    muscleGroups: ["quads", "glutes"],
    movementPattern: "squat",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Lunges",
    description: "Single-leg lower body exercise",
    instructions: "Step forward into lunge position, lower back knee toward ground",
    difficultyLevel: "beginner",
    equipmentRequired: [],
    muscleGroups: ["quads", "glutes", "hamstrings"],
    movementPattern: "lunge",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Dumbbell Lunges",
    description: "Weighted lunges with dumbbells",
    instructions: "Hold dumbbells, step forward into lunge position",
    difficultyLevel: "intermediate",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["quads", "glutes", "hamstrings"],
    movementPattern: "lunge",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Romanian Deadlift",
    description: "Hip hinge movement targeting hamstrings",
    instructions: "Keep legs straight, hinge at hips to lower bar",
    difficultyLevel: "intermediate",
    equipmentRequired: ["barbell"],
    muscleGroups: ["hamstrings", "glutes"],
    movementPattern: "hinge",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Bulgarian Split Squats",
    description: "Single-leg squat with rear foot elevated",
    instructions: "Place rear foot on bench, squat down on front leg",
    difficultyLevel: "intermediate",
    equipmentRequired: ["bench"],
    muscleGroups: ["quads", "glutes"],
    movementPattern: "squat",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Leg Press",
    description: "Machine exercise for overall leg development",
    instructions: "Press weight sled with feet, lower under control",
    difficultyLevel: "beginner",
    equipmentRequired: ["leg press machine"],
    muscleGroups: ["quads", "glutes", "hamstrings"],
    movementPattern: "squat",
    exerciseType: "weight_reps",
    equipmentType: "machine"
  },
  {
    name: "Leg Curls",
    description: "Isolation exercise for hamstrings",
    instructions: "Curl weight up by flexing knees while lying prone",
    difficultyLevel: "beginner",
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
    difficultyLevel: "beginner",
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
    difficultyLevel: "beginner",
    equipmentRequired: [],
    muscleGroups: ["calves"],
    movementPattern: "raise",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },

  // ARMS - BICEPS
  {
    name: "Barbell Curls",
    description: "Classic bicep exercise with barbell",
    instructions: "Curl barbell up by flexing biceps, lower under control",
    difficultyLevel: "beginner",
    equipmentRequired: ["barbell"],
    muscleGroups: ["biceps"],
    movementPattern: "curl",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Dumbbell Curls",
    description: "Bicep exercise allowing for unilateral training",
    instructions: "Curl dumbbells up alternating or simultaneously",
    difficultyLevel: "beginner",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["biceps"],
    movementPattern: "curl",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Hammer Curls",
    description: "Neutral grip curl targeting biceps and brachialis",
    instructions: "Curl dumbbells with neutral grip (thumbs up)",
    difficultyLevel: "beginner",
    equipmentRequired: ["dumbbells"],
    muscleGroups: ["biceps", "brachialis"],
    movementPattern: "curl",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Preacher Curls",
    description: "Isolated bicep curl using preacher bench",
    instructions: "Curl weight while arms supported on preacher bench",
    difficultyLevel: "intermediate",
    equipmentRequired: ["preacher bench", "barbell"],
    muscleGroups: ["biceps"],
    movementPattern: "curl",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },

  // ARMS - TRICEPS
  {
    name: "Tricep Dips",
    description: "Bodyweight exercise for triceps",
    instructions: "Lower body by bending elbows, push back up",
    difficultyLevel: "intermediate",
    equipmentRequired: ["parallel bars"],
    muscleGroups: ["triceps"],
    movementPattern: "push",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Close-Grip Bench Press",
    description: "Tricep-focused bench press variation",
    instructions: "Bench press with hands closer than shoulder width",
    difficultyLevel: "intermediate",
    equipmentRequired: ["barbell", "bench"],
    muscleGroups: ["triceps", "chest"],
    movementPattern: "push",
    exerciseType: "weight_reps",
    equipmentType: "barbell"
  },
  {
    name: "Overhead Tricep Extension",
    description: "Isolation exercise for triceps",
    instructions: "Extend dumbbell overhead by straightening elbows",
    difficultyLevel: "beginner",
    equipmentRequired: ["dumbbell"],
    muscleGroups: ["triceps"],
    movementPattern: "extension",
    exerciseType: "weight_reps",
    equipmentType: "dumbbell"
  },
  {
    name: "Tricep Pushdowns",
    description: "Cable exercise for tricep isolation",
    instructions: "Push cable attachment down by extending elbows",
    difficultyLevel: "beginner",
    equipmentRequired: ["cable machine"],
    muscleGroups: ["triceps"],
    movementPattern: "extension",
    exerciseType: "weight_reps",
    equipmentType: "machine"
  },

  // CORE
  {
    name: "Plank",
    description: "Isometric core strengthening exercise",
    instructions: "Hold straight body position supported on forearms",
    difficultyLevel: "beginner",
    equipmentRequired: [],
    muscleGroups: ["core"],
    movementPattern: "hold",
    exerciseType: "time",
    equipmentType: "bodyweight"
  },
  {
    name: "Crunches",
    description: "Classic abdominal exercise",
    instructions: "Curl upper body toward knees while lying on back",
    difficultyLevel: "beginner",
    equipmentRequired: [],
    muscleGroups: ["abs"],
    movementPattern: "crunch",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Russian Twists",
    description: "Rotational core exercise",
    instructions: "Twist torso side to side while seated",
    difficultyLevel: "beginner",
    equipmentRequired: [],
    muscleGroups: ["obliques", "core"],
    movementPattern: "twist",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Mountain Climbers",
    description: "Dynamic core and cardio exercise",
    instructions: "Alternate bringing knees to chest in plank position",
    difficultyLevel: "intermediate",
    equipmentRequired: [],
    muscleGroups: ["core", "shoulders"],
    movementPattern: "dynamic",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Dead Bug",
    description: "Core stability exercise",
    instructions: "Lie on back, extend opposite arm and leg while maintaining neutral spine",
    difficultyLevel: "beginner",
    equipmentRequired: [],
    muscleGroups: ["core"],
    movementPattern: "stability",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  },
  {
    name: "Hanging Leg Raises",
    description: "Advanced core exercise",
    instructions: "Hang from bar, raise legs up to 90 degrees",
    difficultyLevel: "advanced",
    equipmentRequired: ["pull-up bar"],
    muscleGroups: ["abs", "hip flexors"],
    movementPattern: "raise",
    exerciseType: "bodyweight",
    equipmentType: "bodyweight"
  }
];

export async function seedExercises() {
  console.log('Starting exercise seeding...');
  
  try {
    // Insert all exercises
    for (const exercise of exerciseData) {
      await db.insert(exercises).values(exercise).onConflictDoNothing();
    }
    
    console.log(`Successfully seeded ${exerciseData.length} exercises!`);
  } catch (error) {
    console.error('Error seeding exercises:', error);
  }
}

// Run seeding
seedExercises().then(() => {
  console.log('Exercise seeding complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Failed to seed exercises:', error);
  process.exit(1);
});