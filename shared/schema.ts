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
  experienceLevel: varchar("experience_level").default("beginner"),
  preferredUnits: varchar("preferred_units").default("metric"), // metric or imperial
  weightUnit: varchar("weight_unit").default("kg"), // kg or lbs
  distanceUnit: varchar("distance_unit").default("km"), // km or miles
  bodyMeasurementUnit: varchar("body_measurement_unit").default("cm"), // cm or inches
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bodyMeasurements = pgTable("body_measurements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  bodyFatPercentage: decimal("body_fat_percentage", { precision: 4, scale: 2 }),
  chest: decimal("chest", { precision: 5, scale: 2 }),
  waist: decimal("waist", { precision: 5, scale: 2 }),
  hips: decimal("hips", { precision: 5, scale: 2 }),
  bicepsLeft: decimal("biceps_left", { precision: 5, scale: 2 }),
  bicepsRight: decimal("biceps_right", { precision: 5, scale: 2 }),
  thighLeft: decimal("thigh_left", { precision: 5, scale: 2 }),
  thighRight: decimal("thigh_right", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fitnessGoals = pgTable("fitness_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  goalType: varchar("goal_type").notNull(), // strength, hypertrophy, endurance, weight_loss, etc.
  targetValue: decimal("target_value", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  startDate: date("start_date").notNull(),
  targetDate: date("target_date"),
  status: varchar("status").default("active"), // active, completed, paused
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  equipmentRequired: jsonb("equipment_required").default([]), // array of equipment names
  muscleGroups: jsonb("muscle_groups").notNull().default([]), // array of muscle group names
  movementPattern: varchar("movement_pattern"), // push, pull, squat, hinge, etc.
  videoUrl: varchar("video_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  // New custom exercise fields
  imageUrl: varchar("image_url"),
  youtubeUrl: varchar("youtube_url"),
  equipmentType: varchar("equipment_type"), // None, Barbell, Dumbbell, etc.
  primaryMuscleGroups: jsonb("primary_muscle_groups").default([]),
  secondaryMuscleGroups: jsonb("secondary_muscle_groups").default([]),
  exerciseType: varchar("exercise_type").default("weight_reps"), // weight_reps, bodyweight_reps, etc.
  isCustom: boolean("is_custom").default(false),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom exercises table - separate from system exercises
export const customExercises = pgTable("custom_exercises", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  imageUrl: varchar("image_url"),
  youtubeUrl: varchar("youtube_url"),
  equipmentType: varchar("equipment_type"), // None, Barbell, Dumbbell, etc.
  primaryMuscleGroups: jsonb("primary_muscle_groups").default([]),
  secondaryMuscleGroups: jsonb("secondary_muscle_groups").default([]),
  exerciseType: varchar("exercise_type").default("weight_reps"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workoutTemplates = pgTable("workout_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  difficultyLevel: varchar("difficulty_level").default("beginner"),
  targetMuscleGroups: jsonb("target_muscle_groups").default([]),
  isPublic: boolean("is_public").default(false),
  timesUsed: integer("times_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const templateExercises = pgTable("template_exercises", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => workoutTemplates.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  setsTarget: integer("sets_target").default(3),
  repsTarget: integer("reps_target"),
  weightTarget: decimal("weight_target", { precision: 6, scale: 2 }),
  restDuration: integer("rest_duration").default(90), // in seconds
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: integer("template_id").references(() => workoutTemplates.id, { onDelete: "set null" }),
  name: varchar("name").notNull(),
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
  rpe: integer("rpe"), // rate of perceived exertion 1-10
  isWarmup: boolean("is_warmup").default(false),
  isDropset: boolean("is_dropset").default(false),
  restAfter: integer("rest_after"), // in seconds
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const routineFolders = pgTable("routine_folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#3b82f6"), // Default blue color
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const routines = pgTable("routines", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId: integer("folder_id").references(() => routineFolders.id, { onDelete: "set null" }),
  name: varchar("name").notNull(),
  description: text("description"),
  goal: varchar("goal").notNull(),
  experience: varchar("experience").notNull(),
  duration: integer("duration").notNull(), // minutes
  daysPerWeek: integer("days_per_week").notNull(),
  equipment: varchar("equipment").notNull(),
  totalExercises: integer("total_exercises").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const routineExercises = pgTable("routine_exercises", {
  id: serial("id").primaryKey(),
  routineId: integer("routine_id").notNull().references(() => routines.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 1-7
  sets: integer("sets").notNull(),
  reps: varchar("reps"), // "8-12" or "45 seconds"
  weight: varchar("weight"), // "bodyweight" or "moderate"
  restTime: integer("rest_time"), // seconds
  notes: text("notes"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bodyMeasurements: many(bodyMeasurements),
  fitnessGoals: many(fitnessGoals),
  workoutTemplates: many(workoutTemplates),
  workouts: many(workouts),
  customExercises: many(customExercises),
  routines: many(routines),
  routineFolders: many(routineFolders),
}));

export const bodyMeasurementsRelations = relations(bodyMeasurements, ({ one }) => ({
  user: one(users, {
    fields: [bodyMeasurements.userId],
    references: [users.id],
  }),
}));

export const fitnessGoalsRelations = relations(fitnessGoals, ({ one }) => ({
  user: one(users, {
    fields: [fitnessGoals.userId],
    references: [users.id],
  }),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  creator: one(users, {
    fields: [exercises.createdBy],
    references: [users.id],
  }),
  templateExercises: many(templateExercises),
  workoutExercises: many(workoutExercises),
}));

export const workoutTemplatesRelations = relations(workoutTemplates, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutTemplates.userId],
    references: [users.id],
  }),
  templateExercises: many(templateExercises),
  workouts: many(workouts),
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
  workoutExercises: many(workoutExercises),
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

export const routineFoldersRelations = relations(routineFolders, ({ one, many }) => ({
  user: one(users, {
    fields: [routineFolders.userId],
    references: [users.id],
  }),
  routines: many(routines),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
  user: one(users, {
    fields: [routines.userId],
    references: [users.id],
  }),
  folder: one(routineFolders, {
    fields: [routines.folderId],
    references: [routineFolders.id],
  }),
  routineExercises: many(routineExercises),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  routine: one(routines, {
    fields: [routineExercises.routineId],
    references: [routines.id],
  }),
  exercise: one(exercises, {
    fields: [routineExercises.exerciseId],
    references: [exercises.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertBodyMeasurement = typeof bodyMeasurements.$inferInsert;
export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;

export type InsertFitnessGoal = typeof fitnessGoals.$inferInsert;
export type FitnessGoal = typeof fitnessGoals.$inferSelect;

export type InsertExercise = typeof exercises.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;

export type InsertWorkoutTemplate = typeof workoutTemplates.$inferInsert;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;

export type InsertTemplateExercise = typeof templateExercises.$inferInsert;
export type TemplateExercise = typeof templateExercises.$inferSelect;

export type InsertWorkout = typeof workouts.$inferInsert;
export type Workout = typeof workouts.$inferSelect;

export type InsertWorkoutExercise = typeof workoutExercises.$inferInsert;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;

export type InsertExerciseSet = typeof exerciseSets.$inferInsert;
export type ExerciseSet = typeof exerciseSets.$inferSelect;

export type InsertCustomExercise = typeof customExercises.$inferInsert;
export type CustomExercise = typeof customExercises.$inferSelect;

export type InsertRoutineFolder = typeof routineFolders.$inferInsert;
export type RoutineFolder = typeof routineFolders.$inferSelect;

export type InsertRoutine = typeof routines.$inferInsert;
export type Routine = typeof routines.$inferSelect;

export type InsertRoutineExercise = typeof routineExercises.$inferInsert;
export type RoutineExercise = typeof routineExercises.$inferSelect;

// Insert schemas
export const insertBodyMeasurementSchema = createInsertSchema(bodyMeasurements).omit({
  id: true,
  createdAt: true,
});

export const insertFitnessGoalSchema = createInsertSchema(fitnessGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkoutTemplateSchema = createInsertSchema(workoutTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateExerciseSchema = createInsertSchema(templateExercises).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExerciseSetSchema = createInsertSchema(exerciseSets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomExerciseSchema = createInsertSchema(customExercises).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoutineFolderSchema = createInsertSchema(routineFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
