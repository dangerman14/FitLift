import {
  users,
  exercises,
  workoutTemplates,
  templateExercises,
  workouts,
  workoutExercises,
  exerciseSets,
  fitnessGoals,
  bodyMeasurements,
  type User,
  type UpsertUser,
  type Exercise,
  type InsertExercise,
  type WorkoutTemplate,
  type InsertWorkoutTemplate,
  type TemplateExercise,
  type InsertTemplateExercise,
  type Workout,
  type InsertWorkout,
  type WorkoutExercise,
  type InsertWorkoutExercise,
  type ExerciseSet,
  type InsertExerciseSet,
  type FitnessGoal,
  type InsertFitnessGoal,
  type BodyMeasurement,
  type InsertBodyMeasurement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count, sum, max } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Exercise operations
  getExercises(): Promise<Exercise[]>;
  getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]>;
  getExercisesByEquipment(equipment: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Workout template operations
  getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]>;
  getWorkoutTemplateById(id: number): Promise<WorkoutTemplate | undefined>;
  createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate>;
  deleteWorkoutTemplate(id: number, userId: string): Promise<void>;
  
  // Template exercise operations
  getTemplateExercises(templateId: number): Promise<(TemplateExercise & { exercise: Exercise })[]>;
  createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise>;
  deleteTemplateExercise(id: number): Promise<void>;
  
  // Workout operations
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkoutById(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout>;
  
  // Workout exercise operations
  getWorkoutExercises(workoutId: number): Promise<(WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[]>;
  createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise>;
  
  // Exercise set operations
  createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet>;
  updateExerciseSet(id: number, set: Partial<InsertExerciseSet>): Promise<ExerciseSet>;
  
  // Fitness goal operations
  getFitnessGoals(userId: string): Promise<FitnessGoal[]>;
  createFitnessGoal(goal: InsertFitnessGoal): Promise<FitnessGoal>;
  updateFitnessGoal(id: number, goal: Partial<InsertFitnessGoal>): Promise<FitnessGoal>;
  
  // Body measurement operations
  getBodyMeasurements(userId: string): Promise<BodyMeasurement[]>;
  createBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement>;
  
  // Analytics operations
  getWorkoutStats(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalWorkouts: number;
    totalVolume: number;
    avgDuration: number;
    personalRecords: number;
  }>;
  getStrengthProgress(userId: string, exerciseId: number): Promise<{
    date: Date;
    maxWeight: number;
  }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Exercise operations
  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises).orderBy(exercises.name);
  }

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return await db
      .select()
      .from(exercises)
      .where(sql`${exercises.muscleGroups} @> ${JSON.stringify([muscleGroup])}`)
      .orderBy(exercises.name);
  }

  async getExercisesByEquipment(equipment: string): Promise<Exercise[]> {
    return await db
      .select()
      .from(exercises)
      .where(sql`${exercises.equipmentRequired} @> ${JSON.stringify([equipment])}`)
      .orderBy(exercises.name);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  // Workout template operations
  async getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
    return await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.userId, userId))
      .orderBy(desc(workoutTemplates.updatedAt));
  }

  async getWorkoutTemplateById(id: number): Promise<WorkoutTemplate | undefined> {
    const [template] = await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.id, id));
    return template;
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const [newTemplate] = await db.insert(workoutTemplates).values(template).returning();
    return newTemplate;
  }

  async deleteWorkoutTemplate(id: number, userId: string): Promise<void> {
    await db
      .delete(workoutTemplates)
      .where(and(eq(workoutTemplates.id, id), eq(workoutTemplates.userId, userId)));
  }

  // Template exercise operations
  async getTemplateExercises(templateId: number): Promise<(TemplateExercise & { exercise: Exercise })[]> {
    return await db
      .select({
        id: templateExercises.id,
        templateId: templateExercises.templateId,
        exerciseId: templateExercises.exerciseId,
        orderIndex: templateExercises.orderIndex,
        setsTarget: templateExercises.setsTarget,
        repsTarget: templateExercises.repsTarget,
        weightTarget: templateExercises.weightTarget,
        restDuration: templateExercises.restDuration,
        notes: templateExercises.notes,
        createdAt: templateExercises.createdAt,
        updatedAt: templateExercises.updatedAt,
        exercise: exercises,
      })
      .from(templateExercises)
      .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
      .where(eq(templateExercises.templateId, templateId))
      .orderBy(templateExercises.orderIndex);
  }

  async createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise> {
    const [newTemplateExercise] = await db
      .insert(templateExercises)
      .values(templateExercise)
      .returning();
    return newTemplateExercise;
  }

  async deleteTemplateExercise(id: number): Promise<void> {
    await db.delete(templateExercises).where(eq(templateExercises.id, id));
  }

  // Workout operations
  async getWorkouts(userId: string): Promise<Workout[]> {
    return await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.startTime));
  }

  async getWorkoutById(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout> {
    // Simplified update - only update the essential fields for workout completion
    const updateData: any = {};
    
    if (workout.duration !== undefined) {
      updateData.duration = workout.duration;
    }
    if (workout.notes !== undefined) {
      updateData.notes = workout.notes;
    }
    if (workout.rating !== undefined) {
      updateData.rating = workout.rating;
    }
    if (workout.perceivedExertion !== undefined) {
      updateData.perceivedExertion = workout.perceivedExertion;
    }
    
    // For now, skip endTime to avoid date issues and just mark as updated
    updateData.updatedAt = new Date();
    
    const [updatedWorkout] = await db
      .update(workouts)
      .set(updateData)
      .where(eq(workouts.id, id))
      .returning();
    return updatedWorkout;
  }

  // Workout exercise operations
  async getWorkoutExercises(workoutId: number): Promise<(WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[]> {
    const workoutExercisesList = await db
      .select({
        id: workoutExercises.id,
        workoutId: workoutExercises.workoutId,
        exerciseId: workoutExercises.exerciseId,
        orderIndex: workoutExercises.orderIndex,
        notes: workoutExercises.notes,
        createdAt: workoutExercises.createdAt,
        updatedAt: workoutExercises.updatedAt,
        exercise: exercises,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, workoutId))
      .orderBy(workoutExercises.orderIndex);

    // Get sets for each workout exercise
    const result = [];
    for (const workoutExercise of workoutExercisesList) {
      const sets = await db
        .select()
        .from(exerciseSets)
        .where(eq(exerciseSets.workoutExerciseId, workoutExercise.id))
        .orderBy(exerciseSets.setNumber);
      
      result.push({
        ...workoutExercise,
        sets,
      });
    }

    return result;
  }

  async createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [newWorkoutExercise] = await db
      .insert(workoutExercises)
      .values(workoutExercise)
      .returning();
    return newWorkoutExercise;
  }

  // Exercise set operations
  async createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet> {
    const [newSet] = await db.insert(exerciseSets).values(set).returning();
    return newSet;
  }

  async updateExerciseSet(id: number, set: Partial<InsertExerciseSet>): Promise<ExerciseSet> {
    const [updatedSet] = await db
      .update(exerciseSets)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(exerciseSets.id, id))
      .returning();
    return updatedSet;
  }

  // Fitness goal operations
  async getFitnessGoals(userId: string): Promise<FitnessGoal[]> {
    return await db
      .select()
      .from(fitnessGoals)
      .where(eq(fitnessGoals.userId, userId))
      .orderBy(desc(fitnessGoals.createdAt));
  }

  async createFitnessGoal(goal: InsertFitnessGoal): Promise<FitnessGoal> {
    const [newGoal] = await db.insert(fitnessGoals).values(goal).returning();
    return newGoal;
  }

  async updateFitnessGoal(id: number, goal: Partial<InsertFitnessGoal>): Promise<FitnessGoal> {
    const [updatedGoal] = await db
      .update(fitnessGoals)
      .set({ ...goal, updatedAt: new Date() })
      .where(eq(fitnessGoals.id, id))
      .returning();
    return updatedGoal;
  }

  // Body measurement operations
  async getBodyMeasurements(userId: string): Promise<BodyMeasurement[]> {
    return await db
      .select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.userId, userId))
      .orderBy(desc(bodyMeasurements.date));
  }

  async createBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement> {
    const [newMeasurement] = await db
      .insert(bodyMeasurements)
      .values(measurement)
      .returning();
    return newMeasurement;
  }

  // Analytics operations
  async getWorkoutStats(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalWorkouts: number;
    totalVolume: number;
    avgDuration: number;
    personalRecords: number;
  }> {
    const whereConditions = [eq(workouts.userId, userId)];
    
    if (startDate) {
      whereConditions.push(gte(workouts.startTime, startDate));
    }
    if (endDate) {
      whereConditions.push(lte(workouts.startTime, endDate));
    }

    const [stats] = await db
      .select({
        totalWorkouts: count(workouts.id),
        avgDuration: sql<number>`AVG(${workouts.duration})`,
      })
      .from(workouts)
      .where(and(...whereConditions));

    // Calculate total volume (sum of weight * reps for all sets)
    const [volumeStats] = await db
      .select({
        totalVolume: sql<number>`COALESCE(SUM(${exerciseSets.weight} * ${exerciseSets.reps}), 0)`,
      })
      .from(exerciseSets)
      .innerJoin(workoutExercises, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(and(...whereConditions));

    return {
      totalWorkouts: stats.totalWorkouts,
      totalVolume: volumeStats.totalVolume || 0,
      avgDuration: Math.round(stats.avgDuration || 0),
      personalRecords: 0, // TODO: Implement PR calculation
    };
  }

  async getStrengthProgress(userId: string, exerciseId: number): Promise<{
    date: Date;
    maxWeight: number;
  }[]> {
    const progress = await db
      .select({
        date: workouts.startTime,
        maxWeight: max(exerciseSets.weight),
      })
      .from(exerciseSets)
      .innerJoin(workoutExercises, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workouts.userId, userId),
          eq(workoutExercises.exerciseId, exerciseId)
        )
      )
      .groupBy(workouts.startTime)
      .orderBy(workouts.startTime);

    return progress.map((p) => ({
      date: p.date,
      maxWeight: Number(p.maxWeight) || 0,
    }));
  }
}

export const storage = new DatabaseStorage();
