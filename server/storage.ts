import { db } from "./db";
import {
  users,
  workouts,
  workoutExercises,
  exerciseSets,
  exercises,
  workoutTemplates,
  templateExercises,
  templateFolders,
  bodyMeasurements,
  userBodyweight,
  fitnessGoals,
  customExercises,
  type User,
  type UpsertUser,
  type Workout,
  type InsertWorkout,
  type WorkoutExercise,
  type InsertWorkoutExercise,
  type ExerciseSet,
  type InsertExerciseSet,
  type Exercise,
  type InsertExercise,
  type WorkoutTemplate,
  type InsertWorkoutTemplate,
  type TemplateExercise,
  type InsertTemplateExercise,
  type TemplateFolder,
  type InsertTemplateFolder,
  type BodyMeasurement,
  type InsertBodyMeasurement,
  type UserBodyweight,
  type InsertUserBodyweight,
  type FitnessGoal,
  type InsertFitnessGoal,
  type CustomExercise,
  type InsertCustomExercise,
} from "@shared/schema";
import { eq, desc, sql, and, isNotNull } from "drizzle-orm";

export interface IStorage {
  // Core user methods needed for authentication
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Essential methods for basic functionality
  getExercises(): Promise<Exercise[]>;
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkoutById(id: number): Promise<Workout | undefined>;
  getWorkoutBySlug(slug: string): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout>;
  deleteWorkout(id: number, userId: string): Promise<void>;
  
  getWorkoutExercises(workoutId: number): Promise<(WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[]>;
  createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise>;
  createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet>;
  updateExerciseSet(id: number, updates: Partial<InsertExerciseSet>): Promise<ExerciseSet>;
  
  getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]>;
  getWorkoutTemplateById(id: number): Promise<WorkoutTemplate | undefined>;
  getWorkoutTemplateBySlug(slug: string): Promise<WorkoutTemplate | undefined>;
  createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate>;
  updateWorkoutTemplate(id: number, updates: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate>;
  deleteWorkoutTemplate(id: number, userId: string): Promise<void>;
  
  getTemplateExercises(templateId: number): Promise<(TemplateExercise & { exercise: Exercise })[]>;
  createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise>;
  deleteTemplateExercise(id: number): Promise<void>;
  
  getBodyMeasurements(userId: string): Promise<BodyMeasurement[]>;
  createBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement>;
  updateBodyMeasurement(id: number, updates: Partial<InsertBodyMeasurement>): Promise<BodyMeasurement>;
  
  getUserBodyweight(userId: string): Promise<UserBodyweight[]>;
  createBodyweightEntry(entry: InsertUserBodyweight): Promise<UserBodyweight>;
  updateUserCurrentBodyweight(userId: string, weight: number): Promise<User>;
  
  getCustomExercises(userId: string): Promise<CustomExercise[]>;
  createCustomExercise(exercise: InsertCustomExercise): Promise<CustomExercise>;
  
  getPreviousExerciseData(userId: string, exerciseId: number, templateId?: number): Promise<{ weight: number; reps: number; setNumber: number }[]>;
  
  getWorkoutStats(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalWorkouts: number;
    totalVolume: number;
    avgDuration: number;
    personalRecords: number;
  }>;
  
  getStrengthProgress(userId: string, exerciseId: number): Promise<{
    date: Date;
    maxWeight: number;
    sets?: { weight: number; reps: number; }[];
  }[]>;
  
  getVolumeChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    date: string;
    volume: number;
  }[]>;
  
  getRepsChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    date: string;
    totalReps: number;
  }[]>;
  
  getDurationChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    date: string;
    duration: number;
  }[]>;
  
  getWorkoutFrequencyChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    date: string;
    workoutCount: number;
  }[]>;
  
  getMuscleGroupChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    muscleGroup: string;
    volume: number;
    workoutCount: number;
  }[]>;
  
  // Template folders
  getTemplateFolders(userId: string): Promise<TemplateFolder[]>;
  createTemplateFolder(folder: InsertTemplateFolder): Promise<TemplateFolder>;
  updateRoutineFolder(id: number, userId: string, updates: Partial<InsertTemplateFolder>): Promise<TemplateFolder>;
  deleteRoutineFolder(id: number, userId: string): Promise<void>;
  
  // Fitness goals
  getFitnessGoals(userId: string): Promise<FitnessGoal[]>;
  createFitnessGoal(goal: InsertFitnessGoal): Promise<FitnessGoal>;
  updateFitnessGoal(id: number, updates: Partial<InsertFitnessGoal>): Promise<FitnessGoal>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const [upsertedUser] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        }
      })
      .returning();
    return upsertedUser;
  }

  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises).orderBy(exercises.name);
  }

  async getWorkouts(userId: string): Promise<Workout[]> {
    return await db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.createdAt));
  }

  async getWorkoutById(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout || undefined;
  }

  async getWorkoutBySlug(slug: string): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.slug, slug));
    return workout || undefined;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout> {
    const [updatedWorkout] = await db
      .update(workouts)
      .set(updates)
      .where(eq(workouts.id, id))
      .returning();
    return updatedWorkout;
  }

  async deleteWorkout(id: number, userId: string): Promise<void> {
    await db.delete(workouts).where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
  }

  async getWorkoutExercises(workoutId: number): Promise<(WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[]> {
    const workoutExercisesData = await db
      .select()
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, workoutId))
      .orderBy(workoutExercises.orderIndex);

    const result = [];
    for (const item of workoutExercisesData) {
      const sets = await db
        .select()
        .from(exerciseSets)
        .where(eq(exerciseSets.workoutExerciseId, item.workout_exercises.id))
        .orderBy(exerciseSets.setNumber);

      result.push({
        ...item.workout_exercises,
        exercise: item.exercises,
        sets,
      });
    }

    return result as (WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[];
  }

  async createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [newWorkoutExercise] = await db.insert(workoutExercises).values(workoutExercise).returning();
    return newWorkoutExercise;
  }

  async createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet> {
    const [newSet] = await db.insert(exerciseSets).values(set).returning();
    return newSet;
  }

  async updateExerciseSet(id: number, updates: Partial<InsertExerciseSet>): Promise<ExerciseSet> {
    const [updatedSet] = await db
      .update(exerciseSets)
      .set(updates)
      .where(eq(exerciseSets.id, id))
      .returning();
    return updatedSet;
  }

  async getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
    return await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.userId, userId))
      .orderBy(workoutTemplates.name);
  }

  async getWorkoutTemplateById(id: number): Promise<WorkoutTemplate | undefined> {
    const [template] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id));
    return template || undefined;
  }

  async getWorkoutTemplateBySlug(slug: string): Promise<WorkoutTemplate | undefined> {
    const [template] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.slug, slug));
    return template || undefined;
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const [newTemplate] = await db.insert(workoutTemplates).values(template).returning();
    return newTemplate;
  }

  async updateWorkoutTemplate(id: number, updates: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate> {
    const [updatedTemplate] = await db
      .update(workoutTemplates)
      .set(updates)
      .where(eq(workoutTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteWorkoutTemplate(id: number, userId: string): Promise<void> {
    await db.delete(workoutTemplates).where(and(eq(workoutTemplates.id, id), eq(workoutTemplates.userId, userId)));
  }

  async getTemplateExercises(templateId: number): Promise<(TemplateExercise & { exercise: Exercise })[]> {
    const results = await db
      .select()
      .from(templateExercises)
      .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
      .where(eq(templateExercises.templateId, templateId))
      .orderBy(templateExercises.orderIndex);

    return results.map(item => ({
      ...item.template_exercises,
      exercise: item.exercises,
    })) as (TemplateExercise & { exercise: Exercise })[];
  }

  async createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise> {
    const [newTemplateExercise] = await db.insert(templateExercises).values(templateExercise).returning();
    return newTemplateExercise;
  }

  async deleteTemplateExercise(id: number): Promise<void> {
    await db.delete(templateExercises).where(eq(templateExercises.id, id));
  }

  async getBodyMeasurements(userId: string): Promise<BodyMeasurement[]> {
    return await db.select().from(bodyMeasurements).where(eq(bodyMeasurements.userId, userId)).orderBy(desc(bodyMeasurements.date));
  }

  async createBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement> {
    const [newMeasurement] = await db.insert(bodyMeasurements).values(measurement).returning();
    return newMeasurement;
  }

  async updateBodyMeasurement(id: number, updates: Partial<InsertBodyMeasurement>): Promise<BodyMeasurement> {
    const [updatedMeasurement] = await db
      .update(bodyMeasurements)
      .set(updates)
      .where(eq(bodyMeasurements.id, id))
      .returning();
    return updatedMeasurement;
  }

  async getUserBodyweight(userId: string): Promise<UserBodyweight[]> {
    return await db.select().from(userBodyweight).where(eq(userBodyweight.userId, userId)).orderBy(desc(userBodyweight.measurementDate));
  }

  async createBodyweightEntry(entry: InsertUserBodyweight): Promise<UserBodyweight> {
    const [newEntry] = await db.insert(userBodyweight).values(entry).returning();
    return newEntry;
  }

  async updateUserCurrentBodyweight(userId: string, weight: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ currentBodyweight: weight.toString() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getCustomExercises(userId: string): Promise<CustomExercise[]> {
    return await db.select().from(customExercises).where(eq(customExercises.createdBy, userId));
  }

  async createCustomExercise(exercise: InsertCustomExercise): Promise<CustomExercise> {
    const [newExercise] = await db.insert(customExercises).values(exercise).returning();
    return newExercise;
  }

  async getPreviousExerciseData(userId: string, exerciseId: number, templateId?: number): Promise<{ weight: number; reps: number; setNumber: number }[]> {
    const results = await db
      .select({
        weight: exerciseSets.weight,
        reps: exerciseSets.reps,
        setNumber: exerciseSets.setNumber,
      })
      .from(exerciseSets)
      .innerJoin(workoutExercises, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(and(
        eq(workouts.userId, userId),
        eq(workoutExercises.exerciseId, exerciseId),
        isNotNull(exerciseSets.weight),
        isNotNull(exerciseSets.reps)
      ))
      .orderBy(desc(workouts.createdAt))
      .limit(20);

    return results.filter(r => r.reps !== null).map(r => ({
      weight: Number(r.weight) || 0,
      reps: r.reps!,
      setNumber: r.setNumber
    }));
  }

  async getWorkoutStats(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalWorkouts: number;
    totalVolume: number;
    avgDuration: number;
    personalRecords: number;
  }> {
    const conditions = [eq(workouts.userId, userId)];
    
    if (startDate) {
      conditions.push(sql`${workouts.createdAt} >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`${workouts.createdAt} <= ${endDate}`);
    }

    const [stats] = await db
      .select({
        totalWorkouts: sql<number>`COUNT(${workouts.id})`,
        avgDuration: sql<number>`COALESCE(AVG(${workouts.duration}), 0)`,
      })
      .from(workouts)
      .where(and(...conditions));

    return {
      totalWorkouts: stats.totalWorkouts,
      totalVolume: 0,
      avgDuration: stats.avgDuration,
      personalRecords: 0,
    };
  }

  async getStrengthProgress(userId: string, exerciseId: number): Promise<{
    date: Date;
    maxWeight: number;
    sets?: { weight: number; reps: number; }[];
  }[]> {
    const results = await db
      .select({
        date: workouts.createdAt,
        maxWeight: sql<number>`MAX(CAST(${exerciseSets.weight} AS DECIMAL))`,
      })
      .from(exerciseSets)
      .innerJoin(workoutExercises, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(and(
        eq(workouts.userId, userId),
        eq(workoutExercises.exerciseId, exerciseId),
        isNotNull(exerciseSets.weight)
      ))
      .groupBy(workouts.createdAt)
      .orderBy(workouts.createdAt);

    return results.map(r => ({
      date: r.date!,
      maxWeight: r.maxWeight,
    }));
  }

  async getVolumeChart(userId: string, startDate?: Date, endDate?: Date): Promise<{ date: string; volume: number; }[]> {
    return [];
  }

  async getRepsChart(userId: string, startDate?: Date, endDate?: Date): Promise<{ date: string; totalReps: number; }[]> {
    return [];
  }

  async getDurationChart(userId: string, startDate?: Date, endDate?: Date): Promise<{ date: string; duration: number; }[]> {
    return [];
  }

  async getWorkoutFrequencyChart(userId: string, startDate?: Date, endDate?: Date): Promise<{ date: string; workoutCount: number; }[]> {
    return [];
  }

  async getMuscleGroupChart(userId: string, startDate?: Date, endDate?: Date): Promise<{ muscleGroup: string; volume: number; workoutCount: number; }[]> {
    return [];
  }

  async getTemplateFolders(userId: string): Promise<TemplateFolder[]> {
    return await db.select().from(templateFolders).where(eq(templateFolders.userId, userId));
  }

  async createTemplateFolder(folder: InsertTemplateFolder): Promise<TemplateFolder> {
    const [newFolder] = await db.insert(templateFolders).values(folder).returning();
    return newFolder;
  }

  async updateRoutineFolder(id: number, userId: string, updates: Partial<InsertTemplateFolder>): Promise<TemplateFolder> {
    const [updatedFolder] = await db
      .update(templateFolders)
      .set(updates)
      .where(and(eq(templateFolders.id, id), eq(templateFolders.userId, userId)))
      .returning();
    return updatedFolder;
  }

  async deleteRoutineFolder(id: number, userId: string): Promise<void> {
    await db.delete(templateFolders).where(and(eq(templateFolders.id, id), eq(templateFolders.userId, userId)));
  }

  async getFitnessGoals(userId: string): Promise<FitnessGoal[]> {
    return await db.select().from(fitnessGoals).where(eq(fitnessGoals.userId, userId)).orderBy(desc(fitnessGoals.createdAt));
  }

  async createFitnessGoal(goal: InsertFitnessGoal): Promise<FitnessGoal> {
    const [newGoal] = await db.insert(fitnessGoals).values(goal).returning();
    return newGoal;
  }

  async updateFitnessGoal(id: number, updates: Partial<InsertFitnessGoal>): Promise<FitnessGoal> {
    const [updatedGoal] = await db
      .update(fitnessGoals)
      .set(updates)
      .where(eq(fitnessGoals.id, id))
      .returning();
    return updatedGoal;
  }
}

export const storage = new DatabaseStorage();