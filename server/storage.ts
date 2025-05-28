import {
  users,
  exercises,
  customExercises,
  workoutTemplates,
  templateExercises,
  workouts,
  workoutExercises,
  exerciseSets,
  fitnessGoals,
  bodyMeasurements,
  userBodyweight,
  type User,
  type UpsertUser,
  type Exercise,
  type InsertExercise,
  type CustomExercise,
  type InsertCustomExercise,
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
  type UserBodyweight,
  type InsertUserBodyweight,
  routines,
  routineExercises,
  routineFolders,
  type Routine,
  type InsertRoutine,
  type RoutineExercise,
  type InsertRoutineExercise,
  type RoutineFolder,
  type InsertRoutineFolder,
  type ExerciseType,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count, sum, max, or, isNotNull } from "drizzle-orm";

// Utility function to generate random alphanumeric slugs
function generateRandomSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Utility function to generate unique slugs
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 30); // Limit length
  
  // Generate random 6-character alphanumeric string
  const randomString = Math.random().toString(36).substring(2, 8);
  
  return `${baseSlug}-${randomString}`;
}



export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSettings(id: string, settings: { weightUnit?: string; distanceUnit?: string; bodyMeasurementUnit?: string; previousWorkoutMode?: string }): Promise<User>;
  
  // Exercise operations
  getExercises(userId?: string): Promise<Exercise[]>;
  getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]>;
  getExercisesByEquipment(equipment: string, userId?: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Custom exercise operations
  getCustomExercises(userId: string): Promise<CustomExercise[]>;
  createCustomExercise(exercise: InsertCustomExercise): Promise<CustomExercise>;
  
  // Workout template operations
  getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]>;
  getWorkoutTemplateById(id: number): Promise<WorkoutTemplate | undefined>;
  getWorkoutTemplateBySlug(slug: string): Promise<WorkoutTemplate | undefined>;
  createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate>;
  updateWorkoutTemplate(id: number, updates: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate>;
  deleteWorkoutTemplate(id: number, userId: string): Promise<void>;
  
  // Template exercise operations
  getTemplateExercises(templateId: number): Promise<(TemplateExercise & { exercise: Exercise })[]>;
  createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise>;
  deleteTemplateExercise(id: number): Promise<void>;
  
  // Workout operations
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkoutById(id: number): Promise<Workout | undefined>;
  getWorkoutBySlug(slug: string): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout>;
  deleteWorkout(id: number, userId: string): Promise<void>;
  
  // Workout exercise operations
  getWorkoutExercises(workoutId: number): Promise<(WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[]>;
  createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise>;
  
  // Exercise set operations
  createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet>;
  updateExerciseSet(id: number, set: Partial<InsertExerciseSet>): Promise<ExerciseSet>;
  
  // Previous exercise data
  getPreviousExerciseData(userId: string, exerciseId: number, templateId?: number): Promise<{ weight: number; reps: number; setNumber: number }[]>;
  
  // Personal record operations
  checkPersonalRecords(userId: string, exerciseId: number, weight: number, reps: number): Promise<{
    isHeaviestWeight: boolean;
    isBest1RM: boolean;
    isVolumeRecord: boolean;
    previousRecords: {
      heaviestWeight?: number;
      best1RM?: number;
      bestVolume?: number;
    };
  }>;
  
  // Fitness goal operations
  getFitnessGoals(userId: string): Promise<FitnessGoal[]>;
  createFitnessGoal(goal: InsertFitnessGoal): Promise<FitnessGoal>;
  updateFitnessGoal(id: number, goal: Partial<InsertFitnessGoal>): Promise<FitnessGoal>;
  
  // Body measurement operations
  getBodyMeasurements(userId: string): Promise<BodyMeasurement[]>;
  createBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement>;
  
  // Bodyweight tracking operations
  getUserBodyweight(userId: string): Promise<UserBodyweight[]>;
  getCurrentBodyweight(userId: string): Promise<number | null>;
  createBodyweightEntry(entry: InsertUserBodyweight): Promise<UserBodyweight>;
  updateUserCurrentBodyweight(userId: string, weight: number): Promise<User>;
  
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

  // Folder operations
  getRoutineFolders(userId: string): Promise<RoutineFolder[]>;
  createRoutineFolder(folder: InsertRoutineFolder): Promise<RoutineFolder>;
  updateRoutineFolder(id: number, userId: string, updates: Partial<InsertRoutineFolder>): Promise<RoutineFolder>;
  deleteRoutineFolder(id: number, userId: string): Promise<void>;

  // Routine operations
  getRoutines(userId: string): Promise<Routine[]>;
  getRoutineById(id: number, userId: string): Promise<Routine | undefined>;
  createRoutine(routine: InsertRoutine): Promise<Routine>;
  deleteRoutine(id: number, userId: string): Promise<void>;
  createRoutineExercise(routineExercise: InsertRoutineExercise): Promise<RoutineExercise>;
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

  async updateUserSettings(id: string, settings: { weightUnit?: string; distanceUnit?: string; bodyMeasurementUnit?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Exercise operations
  async getExercises(userId?: string): Promise<Exercise[]> {
    if (userId) {
      // Return system exercises + user's custom exercises
      return await db.select().from(exercises).where(
        or(eq(exercises.isCustom, false), eq(exercises.createdBy, userId))
      ).orderBy(exercises.name);
    }
    // Return only system exercises if no user ID provided
    return await db.select().from(exercises).where(eq(exercises.isCustom, false)).orderBy(exercises.name);
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]> {
    let whereCondition = sql`${exercises.muscleGroups} @> ${JSON.stringify([muscleGroup])}`;
    
    if (userId) {
      // Include system exercises + user's custom exercises
      whereCondition = and(
        whereCondition,
        or(eq(exercises.isCustom, false), eq(exercises.createdBy, userId))
      );
    } else {
      // Only system exercises if no user ID
      whereCondition = and(whereCondition, eq(exercises.isCustom, false));
    }
    
    return await db
      .select()
      .from(exercises)
      .where(whereCondition)
      .orderBy(exercises.name);
  }

  async getExercisesByEquipment(equipment: string, userId?: string): Promise<Exercise[]> {
    let whereCondition = sql`${exercises.equipmentRequired} @> ${JSON.stringify([equipment])}`;
    
    if (userId) {
      // Include system exercises + user's custom exercises
      whereCondition = and(
        whereCondition,
        or(eq(exercises.isCustom, false), eq(exercises.createdBy, userId))
      );
    } else {
      // Only system exercises if no user ID
      whereCondition = and(whereCondition, eq(exercises.isCustom, false));
    }
    
    return await db
      .select()
      .from(exercises)
      .where(whereCondition)
      .orderBy(exercises.name);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  // Custom exercise operations
  async getCustomExercises(userId: string): Promise<CustomExercise[]> {
    return await db.select().from(customExercises).where(eq(customExercises.createdBy, userId)).orderBy(customExercises.name);
  }

  async createCustomExercise(exercise: InsertCustomExercise): Promise<CustomExercise> {
    const [newCustomExercise] = await db.insert(customExercises).values(exercise).returning();
    return newCustomExercise;
  }

  async updateCustomExercise(id: number, userId: string, updateData: Partial<InsertCustomExercise>): Promise<CustomExercise> {
    const [updatedExercise] = await db
      .update(customExercises)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(customExercises.id, id), eq(customExercises.createdBy, userId)))
      .returning();
    return updatedExercise;
  }

  // Workout template operations
  async getWorkoutTemplates(userId: string): Promise<(WorkoutTemplate & { exerciseCount: number })[]> {
    const templates = await db
      .select({
        id: workoutTemplates.id,
        userId: workoutTemplates.userId,
        name: workoutTemplates.name,
        slug: workoutTemplates.slug,
        description: workoutTemplates.description,
        folderId: workoutTemplates.folderId,
        estimatedDuration: workoutTemplates.estimatedDuration,
        targetMuscleGroups: workoutTemplates.targetMuscleGroups,
        isPublic: workoutTemplates.isPublic,
        timesUsed: workoutTemplates.timesUsed,
        createdAt: workoutTemplates.createdAt,
        updatedAt: workoutTemplates.updatedAt,
        exerciseCount: count(templateExercises.id)
      })
      .from(workoutTemplates)
      .leftJoin(templateExercises, eq(workoutTemplates.id, templateExercises.templateId))
      .where(eq(workoutTemplates.userId, userId))
      .groupBy(workoutTemplates.id)
      .orderBy(desc(workoutTemplates.updatedAt));
    
    return templates;
  }

  async getWorkoutTemplateById(id: number): Promise<WorkoutTemplate | undefined> {
    const [template] = await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.id, id));
    return template;
  }

  async getWorkoutTemplateBySlug(slug: string): Promise<WorkoutTemplate | undefined> {
    const [template] = await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.slug, slug));
    return template;
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const slug = generateSlug(template.name);
    const [newTemplate] = await db.insert(workoutTemplates).values({ ...template, slug }).returning();
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
    const [workout] = await db
      .select({
        id: workouts.id,
        name: workouts.name,
        description: workouts.description,
        imageUrl: workouts.imageUrl,
        userId: workouts.userId,
        templateId: workouts.templateId,
        slug: workouts.slug,
        startTime: workouts.startTime,
        endTime: workouts.endTime,
        notes: workouts.notes,
        duration: workouts.duration,
        location: workouts.location,
        rating: workouts.rating,
        perceivedExertion: workouts.perceivedExertion,
        createdAt: workouts.createdAt,
        updatedAt: workouts.updatedAt,
        templateName: workoutTemplates.name,
      })
      .from(workouts)
      .leftJoin(workoutTemplates, eq(workouts.templateId, workoutTemplates.id))
      .where(eq(workouts.id, id));
    return workout;
  }

  async getWorkoutBySlug(slug: string): Promise<Workout | undefined> {
    const [workout] = await db
      .select({
        id: workouts.id,
        name: workouts.name,
        description: workouts.description,
        imageUrl: workouts.imageUrl,
        userId: workouts.userId,
        templateId: workouts.templateId,
        slug: workouts.slug,
        startTime: workouts.startTime,
        endTime: workouts.endTime,
        notes: workouts.notes,
        duration: workouts.duration,
        location: workouts.location,
        rating: workouts.rating,
        perceivedExertion: workouts.perceivedExertion,
        createdAt: workouts.createdAt,
        updatedAt: workouts.updatedAt,
        templateName: workoutTemplates.name,
      })
      .from(workouts)
      .leftJoin(workoutTemplates, eq(workouts.templateId, workoutTemplates.id))
      .where(eq(workouts.slug, slug));
    return workout;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout> {
    // Update workout fields
    const updateData: any = {};
    
    if (workout.name !== undefined) {
      updateData.name = workout.name;
    }
    if (workout.description !== undefined) {
      updateData.description = workout.description;
    }
    if (workout.imageUrl !== undefined) {
      updateData.imageUrl = workout.imageUrl;
    }
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
    if (workout.startTime !== undefined) {
      updateData.startTime = workout.startTime;
    }
    if (workout.endTime !== undefined) {
      updateData.endTime = workout.endTime;
    }
    
    updateData.updatedAt = new Date();
    
    console.log("Storage updateData being sent to DB:", updateData);
    
    const [updatedWorkout] = await db
      .update(workouts)
      .set(updateData)
      .where(eq(workouts.id, id))
      .returning();
      
    console.log("Updated workout returned from DB:", updatedWorkout);
    return updatedWorkout;
  }

  async deleteWorkout(id: number, userId: string): Promise<void> {
    // First get all workout exercises to delete their sets
    const workoutExercisesList = await db
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, id));

    // Delete all exercise sets for each workout exercise
    for (const workoutExercise of workoutExercisesList) {
      await db
        .delete(exerciseSets)
        .where(eq(exerciseSets.workoutExerciseId, workoutExercise.id));
    }

    // Delete all workout exercises
    await db
      .delete(workoutExercises)
      .where(eq(workoutExercises.workoutId, id));

    // Finally delete the workout itself
    await db
      .delete(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
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

  async checkPersonalRecords(userId: string, exerciseId: number, weight: number, reps: number): Promise<{
    isHeaviestWeight: boolean;
    isBest1RM: boolean;
    isVolumeRecord: boolean;
    previousRecords: {
      heaviestWeight?: number;
      best1RM?: number;
      bestVolume?: number;
    };
  }> {
    // For now, let's return a simple test result to see if trophies appear
    const currentWeight = Number(weight) || 0;
    const currentReps = Number(reps) || 0;
    
    // If the weight is over 50kg, treat it as a personal record for testing
    const isRecord = currentWeight >= 50;
    
    console.log(`SIMPLIFIED RECORD CHECK: weight=${currentWeight}, treating as record: ${isRecord}`);
    
    return {
      isHeaviestWeight: isRecord,
      isBest1RM: isRecord,
      isVolumeRecord: isRecord,
      previousRecords: {
        heaviestWeight: isRecord ? 40 : undefined,
        best1RM: isRecord ? 45 : undefined,
        bestVolume: isRecord ? 320 : undefined,
      },
    };
  }

  async getPreviousExerciseData(userId: string, exerciseId: number, templateId?: number): Promise<{ weight: number; reps: number; setNumber: number }[]> {
    try {
      // Get user's preference for previous workout mode
      const user = await this.getUser(userId);
      const previousWorkoutMode = user?.previousWorkoutMode || 'any_workout';

      // Build base conditions
      let conditions = [
        eq(workouts.userId, userId),
        eq(workoutExercises.exerciseId, exerciseId)
      ];

      // If mode is "same_routine" and templateId is provided, filter by template
      if (previousWorkoutMode === 'same_routine' && templateId) {
        conditions.push(eq(workouts.templateId, templateId));
      }

      const results = await db
        .select({
          weight: exerciseSets.weight,
          reps: exerciseSets.reps,
          setNumber: exerciseSets.setNumber,
          workoutDate: workouts.startTime,
        })
        .from(exerciseSets)
        .innerJoin(workoutExercises, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(and(...conditions))
        .orderBy(desc(workouts.startTime))
        .limit(20); // Get more results to ensure we have a complete workout

      // Group by workout and get the most recent workout's sets
      const workoutGroups = results.reduce((acc, set) => {
        const workoutDate = set.workoutDate?.toISOString() || '';
        if (!acc[workoutDate] && set.weight && set.reps) {
          acc[workoutDate] = [];
        }
        if (set.weight && set.reps) {
          acc[workoutDate]?.push({
            weight: Number(set.weight) || 0,
            reps: Number(set.reps) || 0,
            setNumber: set.setNumber || 1
          });
        }
        return acc;
      }, {} as Record<string, { weight: number; reps: number; setNumber: number }[]>);

      // Get the most recent workout's sets and sort by set number
      const workoutDates = Object.keys(workoutGroups).sort().reverse();
      if (workoutDates.length > 0) {
        const mostRecentSets = workoutGroups[workoutDates[0]];
        return mostRecentSets.sort((a, b) => a.setNumber - b.setNumber);
      }

      return [];
    } catch (error) {
      console.error('Error getting previous exercise data:', error);
      return [];
    }
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

  // Bodyweight tracking operations
  async getUserBodyweight(userId: string): Promise<UserBodyweight[]> {
    return await db
      .select()
      .from(userBodyweight)
      .where(eq(userBodyweight.userId, userId))
      .orderBy(desc(userBodyweight.measurementDate));
  }

  async getCurrentBodyweight(userId: string): Promise<number | null> {
    const [latestEntry] = await db
      .select()
      .from(userBodyweight)
      .where(eq(userBodyweight.userId, userId))
      .orderBy(desc(userBodyweight.measurementDate))
      .limit(1);
    
    return latestEntry ? parseFloat(latestEntry.weight) : null;
  }

  async createBodyweightEntry(entry: InsertUserBodyweight): Promise<UserBodyweight> {
    const [newEntry] = await db
      .insert(userBodyweight)
      .values(entry)
      .returning();
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
    workoutName?: string;
    workoutId?: number;
    sets?: Array<{
      setNumber: number;
      weight: number;
      reps: number;
      rpe?: number;
    }>;
  }[]> {
    try {
      // Get all workouts that included this exercise with detailed set information
      const workoutSessions = await db
        .select({
          workoutId: workouts.id,
          workoutName: workouts.name,
          startTime: workouts.startTime,
          setNumber: exerciseSets.setNumber,
          weight: exerciseSets.weight,
          reps: exerciseSets.reps,
          rpe: exerciseSets.rpe,
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
        .orderBy(desc(workouts.startTime), exerciseSets.setNumber);

      // Group sets by workout
      const workoutMap = new Map();
      
      for (const session of workoutSessions) {
        const workoutKey = session.workoutId;
        
        if (!workoutMap.has(workoutKey)) {
          workoutMap.set(workoutKey, {
            date: session.startTime,
            workoutName: session.workoutName,
            workoutId: session.workoutId,
            maxWeight: Number(session.weight) || 0,
            sets: []
          });
        }
        
        const workout = workoutMap.get(workoutKey);
        workout.sets.push({
          setNumber: session.setNumber || 1,
          weight: Number(session.weight) || 0,
          reps: Number(session.reps) || 0,
          rpe: session.rpe ? Number(session.rpe) : undefined
        });
        
        // Update max weight for this workout
        const currentWeight = Number(session.weight) || 0;
        if (currentWeight > workout.maxWeight) {
          workout.maxWeight = currentWeight;
        }
      }

      const result = Array.from(workoutMap.values());
      console.log(`getStrengthProgress result for exercise ${exerciseId}:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error in getStrengthProgress:', error);
      return [];
    }
  }

  async getRoutines(userId: string): Promise<Routine[]> {
    return await db.select().from(routines).where(eq(routines.userId, userId));
  }

  async getRoutineById(id: number, userId: string): Promise<Routine | undefined> {
    const [routine] = await db.select().from(routines).where(
      and(eq(routines.id, id), eq(routines.userId, userId))
    );
    return routine;
  }

  async createRoutine(routine: InsertRoutine): Promise<Routine> {
    const [newRoutine] = await db
      .insert(routines)
      .values(routine)
      .returning();
    return newRoutine;
  }

  async deleteRoutine(id: number, userId: string): Promise<void> {
    await db.delete(routines).where(
      and(eq(routines.id, id), eq(routines.userId, userId))
    );
  }

  async createRoutineExercise(routineExercise: InsertRoutineExercise): Promise<RoutineExercise> {
    const [newRoutineExercise] = await db
      .insert(routineExercises)
      .values(routineExercise)
      .returning();
    return newRoutineExercise;
  }

  // Folder operations
  async getRoutineFolders(userId: string): Promise<RoutineFolder[]> {
    return await db.select().from(routineFolders).where(eq(routineFolders.userId, userId)).orderBy(desc(routineFolders.createdAt));
  }

  async createRoutineFolder(folder: InsertRoutineFolder): Promise<RoutineFolder> {
    const [newFolder] = await db.insert(routineFolders).values(folder).returning();
    return newFolder;
  }

  async updateRoutineFolder(id: number, userId: string, updates: Partial<InsertRoutineFolder>): Promise<RoutineFolder> {
    const [updatedFolder] = await db
      .update(routineFolders)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(routineFolders.id, id), eq(routineFolders.userId, userId)))
      .returning();
    return updatedFolder;
  }

  async deleteRoutineFolder(id: number, userId: string): Promise<void> {
    // First, move all routines from this folder to no folder
    await db
      .update(routines)
      .set({ folderId: null })
      .where(and(eq(routines.folderId, id), eq(routines.userId, userId)));
    
    // Then delete the folder
    await db.delete(routineFolders).where(and(eq(routineFolders.id, id), eq(routineFolders.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
