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
import { eq, desc, sql, and, inArray, count, max, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;

  // Exercise methods
  getExercises(): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  searchExercises(query: string, muscleGroups?: string[], equipmentType?: string): Promise<Exercise[]>;

  // Custom Exercise methods
  getCustomExercises(userId: string): Promise<CustomExercise[]>;
  createCustomExercise(exercise: InsertCustomExercise): Promise<CustomExercise>;

  // Workout Template methods
  getWorkoutTemplates(): Promise<WorkoutTemplate[]>;
  getWorkoutTemplate(id: number): Promise<(WorkoutTemplate & { exercises: (TemplateExercise & { exercise: Exercise })[] }) | undefined>;
  getWorkoutTemplateBySlug(slug: string): Promise<(WorkoutTemplate & { exercises: (TemplateExercise & { exercise: Exercise })[] }) | undefined>;
  createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate>;
  getUserWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]>;

  // Template Exercise methods
  createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise>;
  getTemplateExercises(templateId: number): Promise<(TemplateExercise & { exercise: Exercise })[]>;

  // Template Folder methods
  getTemplateFolders(userId: string): Promise<TemplateFolder[]>;
  createTemplateFolder(folder: InsertTemplateFolder): Promise<TemplateFolder>;

  // Workout methods
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  getWorkoutBySlug(slug: string): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout>;
  deleteWorkout(id: number, userId: string): Promise<void>;

  // Workout Exercise methods
  getWorkoutExercises(workoutId: number): Promise<(WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[]>;
  createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise>;

  // Exercise Set methods
  createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet>;
  updateExerciseSet(id: number, updates: Partial<InsertExerciseSet>): Promise<ExerciseSet>;

  // Body measurement methods
  getBodyMeasurements(userId: string): Promise<BodyMeasurement[]>;
  createBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement>;
  updateBodyMeasurement(id: number, updates: Partial<InsertBodyMeasurement>): Promise<BodyMeasurement>;

  // Bodyweight methods
  getUserBodyweight(userId: string): Promise<UserBodyweight[]>;
  createBodyweightEntry(entry: InsertUserBodyweight): Promise<UserBodyweight>;
  updateUserCurrentBodyweight(userId: string, weight: number): Promise<User>;

  // Fitness goal methods
  getFitnessGoals(userId: string): Promise<FitnessGoal[]>;
  createFitnessGoal(goal: InsertFitnessGoal): Promise<FitnessGoal>;
  updateFitnessGoal(id: number, updates: Partial<InsertFitnessGoal>): Promise<FitnessGoal>;

  // Previous exercise data
  getPreviousExerciseData(userId: string, exerciseId: number, templateId?: number): Promise<{ weight: number; reps: number; setNumber: number }[]>;

  // Analytics
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
  
  // Chart data
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

  async createUser(user: UpsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises).orderBy(exercises.name);
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise || undefined;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  async searchExercises(query: string, muscleGroups?: string[], equipmentType?: string): Promise<Exercise[]> {
    let queryBuilder = db.select().from(exercises);
    
    const conditions = [];
    
    if (query) {
      conditions.push(sql`LOWER(${exercises.name}) LIKE LOWER(${`%${query}%`})`);
    }
    
    if (muscleGroups && muscleGroups.length > 0) {
      const muscleGroupConditions = muscleGroups.map(mg => 
        sql`(${exercises.primaryMuscleGroups}::text LIKE ${'%' + mg + '%'} OR ${exercises.secondaryMuscleGroups}::text LIKE ${'%' + mg + '%'})`
      );
      conditions.push(sql`(${sql.join(muscleGroupConditions, sql` OR `)})`);
    }
    
    if (equipmentType) {
      conditions.push(eq(exercises.equipmentType, equipmentType));
    }

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(sql.join(conditions, sql` AND `));
    }

    return await queryBuilder.orderBy(exercises.name);
  }

  async getCustomExercises(userId: string): Promise<CustomExercise[]> {
    return await db.select().from(customExercises).where(eq(customExercises.createdBy, userId));
  }

  async createCustomExercise(exercise: InsertCustomExercise): Promise<CustomExercise> {
    const [newExercise] = await db.insert(customExercises).values(exercise).returning();
    return newExercise;
  }

  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.isSystemTemplate, true))
      .orderBy(workoutTemplates.name);
  }

  async getUserWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
    return await db
      .select()
      .from(workoutTemplates)
      .where(and(
        eq(workoutTemplates.userId, userId),
        eq(workoutTemplates.isSystemTemplate, false)
      ))
      .orderBy(workoutTemplates.name);
  }

  async getWorkoutTemplate(id: number): Promise<(WorkoutTemplate & { exercises: (TemplateExercise & { exercise: Exercise })[] }) | undefined> {
    const [template] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id));
    if (!template) return undefined;

    const exercises = await this.getTemplateExercises(id);
    return { ...template, exercises };
  }

  async getWorkoutTemplateBySlug(slug: string): Promise<(WorkoutTemplate & { exercises: (TemplateExercise & { exercise: Exercise })[] }) | undefined> {
    const [template] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.slug, slug));
    if (!template) return undefined;

    const exercises = await this.getTemplateExercises(template.id);
    return { ...template, exercises };
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const [newTemplate] = await db.insert(workoutTemplates).values(template).returning();
    return newTemplate;
  }

  async createTemplateExercise(templateExercise: InsertTemplateExercise): Promise<TemplateExercise> {
    const [newTemplateExercise] = await db.insert(templateExercises).values(templateExercise).returning();
    return newTemplateExercise;
  }

  async getTemplateExercises(templateId: number): Promise<(TemplateExercise & { exercise: Exercise })[]> {
    return await db
      .select({
        id: templateExercises.id,
        templateId: templateExercises.templateId,
        exerciseId: templateExercises.exerciseId,
        orderIndex: templateExercises.orderIndex,
        dayOfWeek: templateExercises.dayOfWeek,
        setsTarget: templateExercises.setsTarget,
        minReps: templateExercises.minReps,
        maxReps: templateExercises.maxReps,
        defaultRpe: templateExercises.defaultRpe,
        weightTarget: templateExercises.weightTarget,
        restDuration: templateExercises.restDuration,
        supersetId: templateExercises.supersetId,
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

  async getTemplateFolders(userId: string): Promise<TemplateFolder[]> {
    return await db.select().from(templateFolders).where(eq(templateFolders.userId, userId));
  }

  async createTemplateFolder(folder: InsertTemplateFolder): Promise<TemplateFolder> {
    const [newFolder] = await db.insert(templateFolders).values(folder).returning();
    return newFolder;
  }

  async getWorkouts(userId: string): Promise<Workout[]> {
    return await db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.createdAt));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
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

    const result = [];
    for (const workoutExercise of workoutExercisesData) {
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

  async getPreviousExerciseData(userId: string, exerciseId: number, templateId?: number): Promise<{ weight: number; reps: number; setNumber: number }[]> {
    const query = db
      .select({
        weight: sql<number>`CAST(${exerciseSets.weight} AS DECIMAL)`,
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

    const results = await query;
    return results.filter(r => r.reps !== null).map(r => ({
      ...r,
      reps: r.reps!
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
        totalWorkouts: count(workouts.id),
        avgDuration: sql<number>`COALESCE(AVG(${workouts.duration}), 0)`,
      })
      .from(workouts)
      .where(and(...conditions));

    return {
      totalWorkouts: stats.totalWorkouts,
      totalVolume: 0, // Would need complex calculation
      avgDuration: stats.avgDuration,
      personalRecords: 0, // Would need complex calculation
    };
  }

  async getStrengthProgress(userId: string, exerciseId: number): Promise<{
    date: Date;
    maxWeight: number;
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

  async getVolumeChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    date: string;
    volume: number;
  }[]> {
    return [];
  }

  async getRepsChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    date: string;
    totalReps: number;
  }[]> {
    return [];
  }

  async getDurationChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    date: string;
    duration: number;
  }[]> {
    return [];
  }

  async getWorkoutFrequencyChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    date: string;
    workoutCount: number;
  }[]> {
    return [];
  }

  async getMuscleGroupChart(userId: string, startDate?: Date, endDate?: Date): Promise<{
    muscleGroup: string;
    volume: number;
    workoutCount: number;
  }[]> {
    return [];
  }
}

export const storage = new DatabaseStorage();