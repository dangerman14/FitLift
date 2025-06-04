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
  getWorkout(id: number): Promise<(Workout & { exercises: (WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[] }) | undefined>;
  getWorkoutBySlug(slug: string): Promise<(Workout & { exercises: (WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[] }) | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, updates: Partial<InsertWorkout>): Promise<Workout>;

  // Workout Exercise methods
  createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise>;
  getWorkoutExercises(workoutId: number): Promise<(WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[]>;

  // Exercise Set methods
  createExerciseSet(set: InsertExerciseSet): Promise<ExerciseSet>;
  updateExerciseSet(id: number, updates: Partial<InsertExerciseSet>): Promise<ExerciseSet>;
  deleteExerciseSet(id: number): Promise<void>;

  // Body tracking methods
  getBodyMeasurements(userId: string): Promise<BodyMeasurement[]>;
  createBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement>;
  getUserBodyweight(userId: string): Promise<UserBodyweight[]>;
  createUserBodyweight(bodyweight: InsertUserBodyweight): Promise<UserBodyweight>;

  // Fitness Goals methods
  getFitnessGoals(userId: string): Promise<FitnessGoal[]>;
  createFitnessGoal(goal: InsertFitnessGoal): Promise<FitnessGoal>;
  updateFitnessGoal(id: number, updates: Partial<InsertFitnessGoal>): Promise<FitnessGoal>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
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
      // Search in both primary and secondary muscle groups
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
      .select({
        ...workoutTemplates,
        exerciseCount: sql<number>`COALESCE(${count(templateExercises.id)}, 0)`,
      })
      .from(workoutTemplates)
      .leftJoin(templateExercises, eq(workoutTemplates.id, templateExercises.templateId))
      .where(eq(workoutTemplates.isSystemTemplate, true))
      .groupBy(workoutTemplates.id)
      .orderBy(workoutTemplates.name);
  }

  async getUserWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
    return await db
      .select({
        ...workoutTemplates,
        exerciseCount: sql<number>`COALESCE(${count(templateExercises.id)}, 0)`,
      })
      .from(workoutTemplates)
      .leftJoin(templateExercises, eq(workoutTemplates.id, templateExercises.templateId))
      .where(and(
        eq(workoutTemplates.userId, userId),
        eq(workoutTemplates.isSystemTemplate, false)
      ))
      .groupBy(workoutTemplates.id)
      .orderBy(workoutTemplates.name);
  }

  async getWorkoutTemplate(id: number): Promise<(WorkoutTemplate & { exercises: (TemplateExercise & { exercise: Exercise })[] }) | undefined> {
    const [template] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id));
    
    if (!template) return undefined;

    const templateExercisesList = await db
      .select({
        ...templateExercises,
        exercise: exercises,
      })
      .from(templateExercises)
      .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
      .where(eq(templateExercises.templateId, id))
      .orderBy(templateExercises.orderIndex);

    return {
      ...template,
      exercises: templateExercisesList,
    };
  }

  async getWorkoutTemplateBySlug(slug: string): Promise<(WorkoutTemplate & { exercises: (TemplateExercise & { exercise: Exercise })[] }) | undefined> {
    const [template] = await db.select().from(workoutTemplates).where(eq(workoutTemplates.slug, slug));
    
    if (!template) return undefined;

    const templateExercisesList = await db
      .select({
        ...templateExercises,
        exercise: exercises,
      })
      .from(templateExercises)
      .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
      .where(eq(templateExercises.templateId, template.id))
      .orderBy(templateExercises.orderIndex);

    return {
      ...template,
      exercises: templateExercisesList,
    };
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
        ...templateExercises,
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
    return await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.startTime));
  }

  async getWorkout(id: number): Promise<(Workout & { exercises: (WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[] }) | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    
    if (!workout) return undefined;

    const workoutExercisesList = await db
      .select({
        ...workoutExercises,
        exercise: exercises,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(workoutExercises.orderIndex);

    const exercisesWithSets = await Promise.all(
      workoutExercisesList.map(async (we) => {
        const sets = await db
          .select()
          .from(exerciseSets)
          .where(eq(exerciseSets.workoutExerciseId, we.id))
          .orderBy(exerciseSets.setNumber);
        
        return {
          ...we,
          sets,
        };
      })
    );

    return {
      ...workout,
      exercises: exercisesWithSets,
    };
  }

  async getWorkoutBySlug(slug: string): Promise<(Workout & { exercises: (WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[] }) | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.slug, slug));
    
    if (!workout) return undefined;

    return this.getWorkout(workout.id);
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

  async createWorkoutExercise(workoutExercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [newWorkoutExercise] = await db.insert(workoutExercises).values(workoutExercise).returning();
    return newWorkoutExercise;
  }

  async getWorkoutExercises(workoutId: number): Promise<(WorkoutExercise & { exercise: Exercise; sets: ExerciseSet[] })[]> {
    const workoutExercisesList = await db
      .select({
        ...workoutExercises,
        exercise: exercises,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, workoutId))
      .orderBy(workoutExercises.orderIndex);

    const exercisesWithSets = await Promise.all(
      workoutExercisesList.map(async (we) => {
        const sets = await db
          .select()
          .from(exerciseSets)
          .where(eq(exerciseSets.workoutExerciseId, we.id))
          .orderBy(exerciseSets.setNumber);
        
        return {
          ...we,
          sets,
        };
      })
    );

    return exercisesWithSets;
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

  async deleteExerciseSet(id: number): Promise<void> {
    await db.delete(exerciseSets).where(eq(exerciseSets.id, id));
  }

  async getBodyMeasurements(userId: string): Promise<BodyMeasurement[]> {
    return await db
      .select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.userId, userId))
      .orderBy(desc(bodyMeasurements.date));
  }

  async createBodyMeasurement(measurement: InsertBodyMeasurement): Promise<BodyMeasurement> {
    const [newMeasurement] = await db.insert(bodyMeasurements).values(measurement).returning();
    return newMeasurement;
  }

  async getUserBodyweight(userId: string): Promise<UserBodyweight[]> {
    return await db
      .select()
      .from(userBodyweight)
      .where(eq(userBodyweight.userId, userId))
      .orderBy(desc(userBodyweight.measurementDate));
  }

  async createUserBodyweight(bodyweight: InsertUserBodyweight): Promise<UserBodyweight> {
    const [newBodyweight] = await db.insert(userBodyweight).values(bodyweight).returning();
    return newBodyweight;
  }

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

  async updateFitnessGoal(id: number, updates: Partial<InsertFitnessGoal>): Promise<FitnessGoal> {
    const [updatedGoal] = await db
      .update(fitnessGoals)
      .set(updates)
      .where(eq(fitnessGoals.id, id))
      .returning();
    return updatedGoal;
  }

  async getUserWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
    return await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.userId, userId));
  }

  async getPreviousExerciseData(userId: string, exerciseId: number, templateId?: number): Promise<{ weight: number; reps: number; setNumber: number }[]> {
    const query = db
      .select({
        weight: sql<number>`CAST(${exerciseSets.weight} AS DECIMAL)`,
        reps: exerciseSets.reps,
        setNumber: exerciseSets.setNumber
      })
      .from(exerciseSets)
      .innerJoin(workoutExercises, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workouts.userId, userId),
          eq(workoutExercises.exerciseId, exerciseId),
          isNotNull(exerciseSets.weight),
          isNotNull(exerciseSets.reps)
        )
      )
      .orderBy(desc(workouts.createdAt), desc(exerciseSets.setNumber))
      .limit(10);

    return await query;
  }

  async getStrengthProgress(userId: string, exerciseId: number): Promise<{ date: Date; maxWeight: number }[]> {
    const result = await db
      .select({
        date: workouts.createdAt,
        maxWeight: sql<number>`MAX(CAST(${exerciseSets.weight} AS DECIMAL))`
      })
      .from(exerciseSets)
      .innerJoin(workoutExercises, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workouts.userId, userId),
          eq(workoutExercises.exerciseId, exerciseId),
          isNotNull(exerciseSets.weight)
        )
      )
      .groupBy(workouts.createdAt)
      .orderBy(workouts.createdAt)
      .limit(20);

    return result.map(row => ({
      date: row.date!,
      maxWeight: row.maxWeight
    }));
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
    // Get previous records for this exercise
    const previousSets = await db
      .select({
        weight: sql<number>`CAST(${exerciseSets.weight} AS DECIMAL)`,
        reps: exerciseSets.reps
      })
      .from(exerciseSets)
      .innerJoin(workoutExercises, eq(exerciseSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workouts.userId, userId),
          eq(workoutExercises.exerciseId, exerciseId),
          isNotNull(exerciseSets.weight),
          isNotNull(exerciseSets.reps)
        )
      );

    let heaviestWeight = 0;
    let best1RM = 0;
    let bestVolume = 0;

    previousSets.forEach(set => {
      if (set.weight && set.reps) {
        heaviestWeight = Math.max(heaviestWeight, set.weight);
        // Calculate 1RM using Brzycki formula: weight / (1.0278 - 0.0278 * reps)
        const estimated1RM = set.weight / (1.0278 - 0.0278 * set.reps);
        best1RM = Math.max(best1RM, estimated1RM);
        bestVolume = Math.max(bestVolume, set.weight * set.reps);
      }
    });

    const current1RM = weight / (1.0278 - 0.0278 * reps);
    const currentVolume = weight * reps;

    return {
      isHeaviestWeight: weight > heaviestWeight,
      isBest1RM: current1RM > best1RM,
      isVolumeRecord: currentVolume > bestVolume,
      previousRecords: {
        heaviestWeight: heaviestWeight || undefined,
        best1RM: best1RM || undefined,
        bestVolume: bestVolume || undefined
      }
    };
  }
}

export const storage = new DatabaseStorage();