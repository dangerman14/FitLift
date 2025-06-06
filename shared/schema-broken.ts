import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Exercise type constants
export const EXERCISE_TYPES = [
  'weight_reps',
  'duration', 
  'duration_weight',
  'distance_duration',
  'weight_distance',
  'bodyweight',
  'assisted_bodyweight', 
  'weighted_bodyweight'
] as const;

export type ExerciseType = typeof EXERCISE_TYPES[number];

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender"),
  height: integer("height"), // in cm
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  currentBodyweight: decimal("current_bodyweight", { precision: 6, scale: 2 }), // current bodyweight for calculations
  experienceLevel: varchar("experience_level").default("beginner"),
  preferredUnits: varchar("preferred_units").default("metric"), // metric or imperial
  weightUnit: varchar("weight_unit").default("kg"), // kg or lbs
  distanceUnit: varchar("distance_unit").default("km"), // km or miles
  bodyMeasurementUnit: varchar("body_measurement_unit").default("cm"), // cm or inches
  previousWorkoutMode: varchar("previous_workout_mode").default("any_workout"), // any_workout or same_routine
  partialRepsEnabled: boolean("partial_reps_enabled").default(false),
  partialRepsVolumeWeight: varchar("partial_reps_volume_weight").default("none"), // 'none', 'half', 'full'
  progressionDisplayMode: varchar("progression_display_mode").default("previous"), // 'previous' or 'suggestion'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exercise database - both system and custom exercises
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  imageUrl: varchar("image_url"),
  youtubeUrl: varchar("youtube_url"),
  equipmentType: varchar("equipment_type"),
  primaryMuscleGroups: jsonb("primary_muscle_groups"),
  secondaryMuscleGroups: jsonb("secondary_muscle_groups"),
  exerciseType: varchar("exercise_type").notNull().default("weight_reps"),
  defaultDurationUnit: varchar("default_duration_unit").default("seconds"),
  defaultDistanceUnit: varchar("default_distance_unit").default("miles"),
  requiresBodyweight: boolean("requires_bodyweight").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom user-created exercises
export const customExercises = pgTable("custom_exercises", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  imageUrl: varchar("image_url"),
  youtubeUrl: varchar("youtube_url"),
  equipmentType: varchar("equipment_type"),
  primaryMuscleGroups: jsonb("primary_muscle_groups"),
  secondaryMuscleGroups: jsonb("secondary_muscle_groups"),
  exerciseType: varchar("exercise_type").notNull().default("weight_reps"),
  defaultDurationUnit: varchar("default_duration_unit").default("seconds"),
  defaultDistanceUnit: varchar("default_distance_unit").default("miles"),
  requiresBodyweight: boolean("requires_bodyweight").default(false),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Unified workout templates - covers both system templates and user custom routines
export const workoutTemplates = pgTable("workout_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // null for system templates
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  targetMuscleGroups: jsonb("target_muscle_groups"), // Array of muscle groups
  difficulty: varchar("difficulty"), // beginner, intermediate, advanced
  estimatedDuration: integer("estimated_duration"), // in minutes
  isPublic: boolean("is_public").default(false),
  // Additional fields for custom templates (user routines)
  goal: varchar("goal"),
  experience: varchar("experience"),
  daysPerWeek: integer("days_per_week"),
  equipment: varchar("equipment"),
  totalExercises: integer("total_exercises").default(0),
  folderId: integer("folder_id"), // will reference templateFolders
  isSystemTemplate: boolean("is_system_template").default(false), // true for built-in templates
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Template folders for organizing user's custom templates
export const templateFolders = pgTable("template_folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#3b82f6"), // Default blue color
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exercises within templates - unified structure
export const templateExercises = pgTable("template_exercises", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => workoutTemplates.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  dayOfWeek: integer("day_of_week"), // for multi-day templates, null for single workout templates
  setsTarget: integer("sets_target"),
  repsTarget: text("reps_target"), // Store as JSON string for complex rep ranges and RPE
  weightTarget: varchar("weight_target"), // "bodyweight", "moderate", "heavy", or specific weight
  restDuration: integer("rest_duration"), // in seconds
  supersetId: varchar("superset_id"), // groups exercises in supersets
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Actual workout instances
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: integer("template_id").references(() => workoutTemplates.id, { onDelete: "set null" }),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  location: varchar("location"),
  notes: text("notes"),
  rating: integer("rating"), // 1-5 stars
  perceivedExertion: integer("perceived_exertion"), // 1-10 RPE
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const exerciseSets = pgTable("exercise_sets", {
  id: serial("id").primaryKey(),
  workoutExerciseId: integer("workout_exercise_id").notNull().references(() => workoutExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  weight: decimal("weight", { precision: 6, scale: 2 }),
  reps: integer("reps"),
  partialReps: integer("partial_reps"), // partial reps performed after full reps
  rpe: integer("rpe"), // rate of perceived exertion 1-10
  // Fields for different exercise types
  duration: integer("duration"), // seconds for duration-based exercises
  distance: decimal("distance", { precision: 8, scale: 2 }), // miles/km for distance exercises
  assistanceWeight: decimal("assistance_weight", { precision: 6, scale: 2 }), // for assisted bodyweight exercises
  pace: decimal("pace", { precision: 6, scale: 2 }), // calculated pace (minutes per mile/km)
  effectiveWeight: decimal("effective_weight", { precision: 8, scale: 2 }), // calculated total weight including bodyweight
  isWarmup: boolean("is_warmup").default(false),
  isDropset: boolean("is_dropset").default(false),
  restAfter: integer("rest_after"), // in seconds
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Other tables remain the same
export const bodyMeasurements = pgTable("body_measurements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  bodyFatPercentage: decimal("body_fat_percentage", { precision: 4, scale: 2 }),
  chest: decimal("chest", { precision: 5, scale: 2 }),
  shoulders: decimal("shoulders", { precision: 5, scale: 2 }),
  waist: decimal("waist", { precision: 5, scale: 2 }),
  abdomen: decimal("abdomen", { precision: 5, scale: 2 }),
  hips: decimal("hips", { precision: 5, scale: 2 }),
  bicepsLeft: decimal("biceps_left", { precision: 5, scale: 2 }),
  bicepsRight: decimal("biceps_right", { precision: 5, scale: 2 }),
  thighLeft: decimal("thigh_left", { precision: 5, scale: 2 }),
  thighRight: decimal("thigh_right", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBodyweight = pgTable("user_bodyweight", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weight: decimal("weight", { precision: 6, scale: 2 }).notNull(),
  measurementDate: date("measurement_date").notNull(),
  source: varchar("source").default("manual"), // manual, device_sync, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const fitnessGoals = pgTable("fitness_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // weight_loss, muscle_gain, strength, endurance
  targetValue: decimal("target_value", { precision: 8, scale: 2 }),
  currentValue: decimal("current_value", { precision: 8, scale: 2 }),
  unit: varchar("unit"), // kg, lbs, %
  targetDate: date("target_date"),
  status: varchar("status").default("active"), // active, paused, completed, abandoned
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bodyMeasurements: many(bodyMeasurements),
  userBodyweight: many(userBodyweight),
  fitnessGoals: many(fitnessGoals),
  workoutTemplates: many(workoutTemplates),
  workouts: many(workouts),
  customExercises: many(customExercises),
  templateFolders: many(templateFolders),
}));

export const workoutTemplatesRelations = relations(workoutTemplates, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutTemplates.userId],
    references: [users.id],
  }),
  folder: one(templateFolders, {
    fields: [workoutTemplates.folderId],
    references: [templateFolders.id],
  }),
  exercises: many(templateExercises),
  workouts: many(workouts),
}));

export const templateFoldersRelations = relations(templateFolders, ({ one, many }) => ({
  user: one(users, {
    fields: [templateFolders.userId],
    references: [users.id],
  }),
  templates: many(workoutTemplates),
}));

export const templateExercisesRelations = relations(templateExercises, ({ one }) => ({
  template: one(workoutTemplates, {
    fields: [templateExercises.templateId],
    references: [workoutTemplates.id],
  }),
  exercise: one(exercises, {
    fields: [templateExercises.exerciseId],
    references: [exercises.id],
  }),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  template: one(workoutTemplates, {
    fields: [workouts.templateId],
    references: [workoutTemplates.id],
  }),
  exercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
  sets: many(exerciseSets),
}));

export const exerciseSetsRelations = relations(exerciseSets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [exerciseSets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

export const customExercisesRelations = relations(customExercises, ({ one }) => ({
  creator: one(users, {
    fields: [customExercises.createdBy],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertWorkoutTemplateSchema = createInsertSchema(workoutTemplates);
export const insertTemplateFolderSchema = createInsertSchema(templateFolders);
export const insertTemplateExerciseSchema = createInsertSchema(templateExercises);
export const insertWorkoutSchema = createInsertSchema(workouts);
export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises);
export const insertExerciseSetSchema = createInsertSchema(exerciseSets);
export const insertCustomExerciseSchema = createInsertSchema(customExercises);
export const insertBodyMeasurementSchema = createInsertSchema(bodyMeasurements);
export const insertUserBodyweightSchema = createInsertSchema(userBodyweight);
export const insertFitnessGoalSchema = createInsertSchema(fitnessGoals);

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;
export type TemplateFolder = typeof templateFolders.$inferSelect;
export type InsertTemplateFolder = z.infer<typeof insertTemplateFolderSchema>;
export type TemplateExercise = typeof templateExercises.$inferSelect;
export type InsertTemplateExercise = z.infer<typeof insertTemplateExerciseSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>;
export type ExerciseSet = typeof exerciseSets.$inferSelect;
export type InsertExerciseSet = z.infer<typeof insertExerciseSetSchema>;
export type Exercise = typeof exercises.$inferSelect;
export const insertExerciseSchema = createInsertSchema(exercises);
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type CustomExercise = typeof customExercises.$inferSelect;
export type InsertCustomExercise = z.infer<typeof insertCustomExerciseSchema>;
export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type InsertBodyMeasurement = z.infer<typeof insertBodyMeasurementSchema>;
export type UserBodyweight = typeof userBodyweight.$inferSelect;
export type InsertUserBodyweight = z.infer<typeof insertUserBodyweightSchema>;
export type FitnessGoal = typeof fitnessGoals.$inferSelect;
export type InsertFitnessGoal = z.infer<typeof insertFitnessGoalSchema>;