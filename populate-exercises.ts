import { db } from "./server/db";
import { exercises } from "./shared/schema";

const exerciseData = [
  // Traditional Weight + Reps Exercises
  {
    name: "Barbell Bench Press",
    description: "Lie on a bench and press the barbell from chest to full arm extension",
    muscleGroups: ["chest", "shoulders", "triceps"],
    equipment: "barbell",
    type: "weight_reps",
    instructions: "Lie flat on bench, grip barbell slightly wider than shoulders, lower to chest, press up explosively"
  },
  {
    name: "Barbell Back Squat",
    description: "Stand with barbell across upper back, squat down and drive up through heels",
    muscleGroups: ["quadriceps", "glutes", "hamstrings"],
    equipment: "barbell",
    type: "weight_reps",
    instructions: "Position bar on upper traps, feet shoulder-width apart, descend until thighs parallel, drive up"
  },
  {
    name: "Conventional Deadlift",
    description: "Lift barbell from floor to hip level with straight back",
    muscleGroups: ["hamstrings", "glutes", "back", "traps"],
    equipment: "barbell",
    type: "weight_reps",
    instructions: "Feet hip-width apart, grip bar outside legs, keep back straight, drive through heels"
  },
  {
    name: "Barbell Row",
    description: "Bend over and row barbell to lower chest",
    muscleGroups: ["back", "biceps", "rear_delts"],
    equipment: "barbell",
    type: "weight_reps",
    instructions: "Hinge at hips, maintain neutral spine, pull bar to lower chest, squeeze shoulder blades"
  },
  {
    name: "Overhead Press",
    description: "Press barbell from shoulders to overhead",
    muscleGroups: ["shoulders", "triceps", "core"],
    equipment: "barbell",
    type: "weight_reps",
    instructions: "Start at shoulder level, press straight up, lock out overhead, keep core tight"
  },

  // Bodyweight Exercises
  {
    name: "Push-ups",
    description: "Classic bodyweight pushing exercise",
    muscleGroups: ["chest", "shoulders", "triceps"],
    equipment: "bodyweight",
    type: "bodyweight",
    instructions: "Start in plank position, lower chest to floor, push back up, maintain straight line"
  },
  {
    name: "Pull-ups",
    description: "Hang from bar and pull body up until chin clears bar",
    muscleGroups: ["back", "biceps"],
    equipment: "pull_up_bar",
    type: "bodyweight",
    instructions: "Dead hang from bar, pull up until chin over bar, control descent"
  },
  {
    name: "Bodyweight Squats",
    description: "Squat using only bodyweight",
    muscleGroups: ["quadriceps", "glutes", "hamstrings"],
    equipment: "bodyweight",
    type: "bodyweight",
    instructions: "Feet shoulder-width apart, descend until thighs parallel, drive up through heels"
  },
  {
    name: "Dips",
    description: "Lower and raise body using parallel bars or bench",
    muscleGroups: ["chest", "shoulders", "triceps"],
    equipment: "dip_bars",
    type: "bodyweight",
    instructions: "Support body on bars, lower until shoulders below elbows, press back up"
  },

  // Assisted Bodyweight Exercises
  {
    name: "Assisted Pull-ups",
    description: "Pull-ups with assistance from resistance band or machine",
    muscleGroups: ["back", "biceps"],
    equipment: "pull_up_bar",
    type: "assisted_bodyweight",
    instructions: "Use resistance band or machine assistance, focus on proper form and full range of motion"
  },
  {
    name: "Assisted Dips",
    description: "Dips with assistance to reduce bodyweight load",
    muscleGroups: ["chest", "shoulders", "triceps"],
    equipment: "dip_bars",
    type: "assisted_bodyweight",
    instructions: "Use assistance machine or resistance band to reduce load while maintaining proper form"
  },
  {
    name: "Assisted Chin-ups",
    description: "Chin-ups with underhand grip and assistance",
    muscleGroups: ["back", "biceps"],
    equipment: "pull_up_bar",
    type: "assisted_bodyweight",
    instructions: "Underhand grip, use assistance to complete full range of motion with control"
  },

  // Weighted Bodyweight Exercises
  {
    name: "Weighted Pull-ups",
    description: "Pull-ups with additional weight attached",
    muscleGroups: ["back", "biceps"],
    equipment: "pull_up_bar",
    type: "weighted_bodyweight",
    instructions: "Attach weight via belt or vest, maintain strict form, control both up and down phases"
  },
  {
    name: "Weighted Dips",
    description: "Dips with additional weight for increased resistance",
    muscleGroups: ["chest", "shoulders", "triceps"],
    equipment: "dip_bars",
    type: "weighted_bodyweight",
    instructions: "Add weight via belt or vest, maintain full range of motion, control descent"
  },
  {
    name: "Weighted Push-ups",
    description: "Push-ups with weight plates or vest for added resistance",
    muscleGroups: ["chest", "shoulders", "triceps"],
    equipment: "bodyweight",
    type: "weighted_bodyweight",
    instructions: "Place weight on back or use weighted vest, maintain plank position throughout"
  },

  // Duration-based Exercises
  {
    name: "Plank",
    description: "Hold straight body position from forearms",
    muscleGroups: ["core", "shoulders"],
    equipment: "bodyweight",
    type: "duration",
    instructions: "Forearms on ground, straight line from head to heels, engage core, breathe normally"
  },
  {
    name: "Wall Sit",
    description: "Hold squat position against wall",
    muscleGroups: ["quadriceps", "glutes"],
    equipment: "bodyweight",
    type: "duration",
    instructions: "Back against wall, slide down to 90-degree knee angle, hold position"
  },
  {
    name: "Dead Hang",
    description: "Hang from pull-up bar to build grip strength",
    muscleGroups: ["forearms", "back"],
    equipment: "pull_up_bar",
    type: "duration",
    instructions: "Grip bar with both hands, hang with arms fully extended, engage lats"
  },

  // Duration + Weight Exercises
  {
    name: "Weighted Plank",
    description: "Plank hold with weight plate on back",
    muscleGroups: ["core", "shoulders"],
    equipment: "bodyweight",
    type: "duration_weight",
    instructions: "Standard plank position with weight plate on back, maintain straight line"
  },
  {
    name: "Farmer's Walk",
    description: "Walk while carrying heavy weights",
    muscleGroups: ["traps", "forearms", "core", "legs"],
    equipment: "dumbbells",
    type: "duration_weight",
    instructions: "Hold weights at sides, walk with straight posture, engage core"
  },
  {
    name: "Weighted Carries",
    description: "Carry weights for time or distance",
    muscleGroups: ["traps", "forearms", "core"],
    equipment: "dumbbells",
    type: "duration_weight",
    instructions: "Various carry positions (farmer's, suitcase, overhead), focus on posture"
  },

  // Distance + Duration Exercises
  {
    name: "Running",
    description: "Cardiovascular exercise covering distance over time",
    muscleGroups: ["legs", "cardio"],
    equipment: "none",
    type: "distance_duration",
    instructions: "Maintain steady pace, land on midfoot, keep relaxed upper body"
  },
  {
    name: "Cycling",
    description: "Ride bicycle for distance and time",
    muscleGroups: ["legs", "cardio"],
    equipment: "bicycle",
    type: "distance_duration",
    instructions: "Maintain cadence, proper bike fit, engage core for stability"
  },
  {
    name: "Rowing Machine",
    description: "Full body cardio exercise tracking distance and time",
    muscleGroups: ["back", "legs", "arms", "cardio"],
    equipment: "rowing_machine",
    type: "distance_duration",
    instructions: "Drive with legs first, lean back, pull with arms, reverse for recovery"
  },

  // Weight + Distance Exercises
  {
    name: "Sled Push",
    description: "Push weighted sled for distance",
    muscleGroups: ["legs", "core", "shoulders"],
    equipment: "sled",
    type: "weight_distance",
    instructions: "Low body position, drive through legs, maintain forward lean"
  },
  {
    name: "Sled Pull",
    description: "Pull weighted sled for distance",
    muscleGroups: ["back", "legs", "arms"],
    equipment: "sled",
    type: "weight_distance",
    instructions: "Rope or harness attachment, maintain good posture, steady pulling motion"
  },

  // Additional Traditional Exercises
  {
    name: "Incline Barbell Press",
    description: "Barbell press on inclined bench",
    muscleGroups: ["chest", "shoulders", "triceps"],
    equipment: "barbell",
    type: "weight_reps",
    instructions: "Set bench to 30-45 degrees, press from chest to full extension"
  },
  {
    name: "Romanian Deadlift",
    description: "Hip hinge movement focusing on hamstrings",
    muscleGroups: ["hamstrings", "glutes"],
    equipment: "barbell",
    type: "weight_reps",
    instructions: "Keep bar close to body, hinge at hips, feel stretch in hamstrings"
  },
  {
    name: "Barbell Curl",
    description: "Bicep isolation exercise with barbell",
    muscleGroups: ["biceps"],
    equipment: "barbell",
    type: "weight_reps",
    instructions: "Stand straight, curl bar up using biceps only, control descent"
  },
  {
    name: "Close-Grip Bench Press",
    description: "Bench press with narrow grip for triceps focus",
    muscleGroups: ["triceps", "chest"],
    equipment: "barbell",
    type: "weight_reps",
    instructions: "Hands closer than shoulders, focus on tricep engagement"
  },

  // More Bodyweight Variations
  {
    name: "Diamond Push-ups",
    description: "Push-ups with hands in diamond shape",
    muscleGroups: ["triceps", "chest"],
    equipment: "bodyweight",
    type: "bodyweight",
    instructions: "Form diamond with hands, maintain straight body line"
  },
  {
    name: "Pike Push-ups",
    description: "Push-ups in downward dog position",
    muscleGroups: ["shoulders", "triceps"],
    equipment: "bodyweight",
    type: "bodyweight",
    instructions: "Pike position, lower head toward hands, press back up"
  },
  {
    name: "Inverted Rows",
    description: "Horizontal rowing using body weight",
    muscleGroups: ["back", "biceps"],
    equipment: "barbell",
    type: "bodyweight",
    instructions: "Lie under bar, pull chest to bar, maintain straight body"
  }
];

async function populateExercises() {
  try {
    console.log("Adding exercises to the database...");
    
    for (const exercise of exerciseData) {
      await db.insert(exercises).values(exercise).onConflictDoNothing();
    }
    
    console.log(`Successfully added ${exerciseData.length} exercises to the database!`);
  } catch (error) {
    console.error("Error adding exercises:", error);
  }
}

// Run the script
populateExercises();