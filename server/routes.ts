import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertExerciseSchema,
  insertWorkoutTemplateSchema,
  insertTemplateExerciseSchema,
  insertWorkoutSchema,
  insertWorkoutExerciseSchema,
  insertExerciseSetSchema,
  insertFitnessGoalSchema,
  insertBodyMeasurementSchema,
  insertCustomExerciseSchema,
  insertRoutineFolderSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User settings route
  app.patch('/api/user/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { weightUnit, distanceUnit, bodyMeasurementUnit } = req.body;
      
      const updatedUser = await storage.updateUserSettings(userId, {
        weightUnit,
        distanceUnit,
        bodyMeasurementUnit,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Exercise routes
  app.get('/api/exercises', isAuthenticated, async (req, res) => {
    try {
      const { muscleGroup, equipment } = req.query;
      
      const userId = (req as any).user?.claims?.sub;
      let exercises;
      let customExercises = [];
      
      if (muscleGroup) {
        exercises = await storage.getExercisesByMuscleGroup(muscleGroup as string, userId);
      } else if (equipment) {
        exercises = await storage.getExercisesByEquipment(equipment as string, userId);
      } else {
        exercises = await storage.getExercises(userId);
      }
      
      // Always get custom exercises for the user
      if (userId) {
        customExercises = await storage.getCustomExercises(userId);
      }
      
      // Combine system exercises with custom exercises
      const allExercises = [...exercises, ...customExercises];
      
      console.log(`Found ${exercises.length} system exercises and ${customExercises.length} custom exercises`);
      console.log('Custom exercises:', customExercises);
      console.log(`Total exercises being returned: ${allExercises.length}`);
      
      // Add cache-busting header to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(allExercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  // Custom exercise creation using separate table
  app.post('/api/exercises/custom', isAuthenticated, async (req, res) => {
    console.log("🎯 CUSTOM EXERCISE ROUTE HIT!");
    try {
      const userId = (req as any).user?.claims?.sub;
      console.log("Creating custom exercise for user:", userId);
      console.log("Request body:", req.body);
      
      const customExerciseData = {
        ...req.body,
        createdBy: userId,
      };
      
      console.log("Final custom exercise data:", customExerciseData);
      const customExercise = await storage.createCustomExercise(customExerciseData);
      console.log("Created custom exercise:", customExercise);
      res.status(201).json(customExercise);
    } catch (error) {
      console.error("Error creating custom exercise:", error);
      res.status(500).json({ message: "Failed to create custom exercise" });
    }
  });

  // Custom exercise update
  app.patch("/api/exercises/custom/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exerciseId = parseInt(req.params.id);
      
      const updateData = insertCustomExerciseSchema.partial().parse(req.body);
      const updatedExercise = await storage.updateCustomExercise(exerciseId, userId, updateData);
      
      res.json(updatedExercise);
    } catch (error) {
      console.error("Error updating custom exercise:", error);
      res.status(500).json({ message: "Failed to update custom exercise" });
    }
  });

  app.post('/api/exercises', isAuthenticated, async (req: any, res) => {
    console.log("⚠️ GENERIC EXERCISE ROUTE HIT - THIS SHOULD NOT HAPPEN FOR CUSTOM EXERCISES");
    try {
      const exerciseData = insertExerciseSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
        isCustom: true,
      });
      
      const exercise = await storage.createExercise(exerciseData);
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid exercise data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create exercise" });
      }
    }
  });

  // Workout template routes
  app.get('/api/workout-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getWorkoutTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching workout templates:", error);
      res.status(500).json({ message: "Failed to fetch workout templates" });
    }
  });

  app.get('/api/workout-templates/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getWorkoutTemplateById(id);
      
      if (!template) {
        return res.status(404).json({ message: "Workout template not found" });
      }
      
      const exercises = await storage.getTemplateExercises(id);
      res.json({ ...template, exercises });
    } catch (error) {
      console.error("Error fetching workout template:", error);
      res.status(500).json({ message: "Failed to fetch workout template" });
    }
  });

  app.post('/api/workout-templates', isAuthenticated, async (req: any, res) => {
    try {
      const templateData = insertWorkoutTemplateSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });
      
      const template = await storage.createWorkoutTemplate(templateData);
      
      // Add exercises to template if provided
      if (req.body.exercises && Array.isArray(req.body.exercises)) {
        for (let i = 0; i < req.body.exercises.length; i++) {
          const exerciseData = insertTemplateExerciseSchema.parse({
            ...req.body.exercises[i],
            templateId: template.id,
            orderIndex: i,
          });
          await storage.createTemplateExercise(exerciseData);
        }
      }
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating workout template:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid template data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create workout template" });
      }
    }
  });

  app.delete('/api/workout-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      await storage.deleteWorkoutTemplate(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workout template:", error);
      res.status(500).json({ message: "Failed to delete workout template" });
    }
  });

  // Workout routes
  app.get('/api/workouts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workouts = await storage.getWorkouts(userId);
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  app.get('/api/workouts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.getWorkoutById(id);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      const exercises = await storage.getWorkoutExercises(id);
      res.json({ ...workout, exercises });
    } catch (error) {
      console.error("Error fetching workout:", error);
      res.status(500).json({ message: "Failed to fetch workout" });
    }
  });

  app.post('/api/workouts', isAuthenticated, async (req: any, res) => {
    try {
      // Create workout data directly without schema validation to avoid date issues
      const workoutData = {
        name: req.body.name || "Quick Workout",
        userId: req.user.claims.sub,
        templateId: req.body.templateId || null,
        startTime: req.body.startTime ? new Date(req.body.startTime) : new Date(),
        endTime: req.body.endTime ? new Date(req.body.endTime) : null,
        duration: req.body.duration || null,
        notes: req.body.notes || null,
        location: req.body.location || null,
        rating: req.body.rating || null,
        perceivedExertion: req.body.perceivedExertion || null,
      };
      
      const workout = await storage.createWorkout(workoutData);
      res.status(201).json(workout);
    } catch (error) {
      console.error("Error creating workout:", error);
      res.status(500).json({ message: "Failed to create workout" });
    }
  });

  app.patch('/api/workouts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = { ...req.body };
      
      console.log("Update data received:", updateData);
      
      // Convert date strings to Date objects if they exist
      if (updateData.endTime) {
        console.log("Converting endTime:", updateData.endTime, typeof updateData.endTime);
        updateData.endTime = updateData.endTime instanceof Date ? updateData.endTime : new Date(updateData.endTime);
      }
      if (updateData.startTime) {
        console.log("Converting startTime:", updateData.startTime, typeof updateData.startTime);
        updateData.startTime = updateData.startTime instanceof Date ? updateData.startTime : new Date(updateData.startTime);
      }
      
      console.log("Final update data:", updateData);
      
      const workout = await storage.updateWorkout(id, updateData);
      res.json(workout);
    } catch (error) {
      console.error("Error updating workout:", error);
      res.status(500).json({ message: "Failed to update workout" });
    }
  });

  // Update workout details (name, description, image)
  app.patch('/api/workouts/:id/details', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Validate that the workout belongs to the user
      const existingWorkout = await storage.getWorkoutById(id);
      if (!existingWorkout || existingWorkout.userId !== userId) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      const { name, description, imageUrl } = req.body;
      
      const updatedWorkout = await storage.updateWorkout(id, {
        name,
        description,
        imageUrl
      });
      
      res.json(updatedWorkout);
    } catch (error) {
      console.error("Error updating workout details:", error);
      res.status(500).json({ message: "Failed to update workout details" });
    }
  });

  // Workout exercise routes
  app.post('/api/workouts/:workoutId/exercises', isAuthenticated, async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const exerciseData = insertWorkoutExerciseSchema.parse({
        ...req.body,
        workoutId,
      });
      
      const workoutExercise = await storage.createWorkoutExercise(exerciseData);
      res.status(201).json(workoutExercise);
    } catch (error) {
      console.error("Error adding exercise to workout:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid exercise data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add exercise to workout" });
      }
    }
  });

  // Exercise set routes
  app.post('/api/workout-exercises/:workoutExerciseId/sets', isAuthenticated, async (req, res) => {
    try {
      const workoutExerciseId = parseInt(req.params.workoutExerciseId);
      
      // Create set data without strict validation to handle type mismatches
      const setData = {
        workoutExerciseId,
        setNumber: req.body.setNumber || 1,
        reps: req.body.reps || 0,
        weight: req.body.weight || 0,
        duration: req.body.duration || null,
        distance: req.body.distance || null,
        restTime: req.body.restTime || null,
        notes: req.body.notes || null,
        completed: req.body.completed || false,
        rpe: req.body.rpe || null,
      };
      
      const set = await storage.createExerciseSet(setData);
      res.status(201).json(set);
    } catch (error) {
      console.error("Error creating exercise set:", error);
      res.status(500).json({ message: "Failed to create exercise set" });
    }
  });

  app.patch('/api/exercise-sets/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const set = await storage.updateExerciseSet(id, updateData);
      res.json(set);
    } catch (error) {
      console.error("Error updating exercise set:", error);
      res.status(500).json({ message: "Failed to update exercise set" });
    }
  });

  // Fitness goal routes
  app.get('/api/fitness-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getFitnessGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching fitness goals:", error);
      res.status(500).json({ message: "Failed to fetch fitness goals" });
    }
  });

  app.post('/api/fitness-goals', isAuthenticated, async (req: any, res) => {
    try {
      const goalData = insertFitnessGoalSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });
      
      const goal = await storage.createFitnessGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating fitness goal:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create fitness goal" });
      }
    }
  });

  // Body measurement routes
  app.get('/api/body-measurements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const measurements = await storage.getBodyMeasurements(userId);
      res.json(measurements);
    } catch (error) {
      console.error("Error fetching body measurements:", error);
      res.status(500).json({ message: "Failed to fetch body measurements" });
    }
  });

  app.post('/api/body-measurements', isAuthenticated, async (req: any, res) => {
    try {
      const measurementData = insertBodyMeasurementSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });
      
      const measurement = await storage.createBodyMeasurement(measurementData);
      res.status(201).json(measurement);
    } catch (error) {
      console.error("Error creating body measurement:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid measurement data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create body measurement" });
      }
    }
  });

  // Analytics routes
  app.get('/api/analytics/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      const stats = await storage.getWorkoutStats(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching workout stats:", error);
      res.status(500).json({ message: "Failed to fetch workout stats" });
    }
  });

  app.get('/api/analytics/strength/:exerciseId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exerciseId = parseInt(req.params.exerciseId);
      
      const progress = await storage.getStrengthProgress(userId, exerciseId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching strength progress:", error);
      res.status(500).json({ message: "Failed to fetch strength progress" });
    }
  });

  // Routines routes
  app.get('/api/routines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const routines = await storage.getRoutines(userId);
      res.json(routines);
    } catch (error) {
      console.error("Error fetching routines:", error);
      res.status(500).json({ message: "Failed to fetch routines" });
    }
  });

  app.post('/api/routines/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { goal, experience, duration, daysPerWeek, equipment } = req.body;
      
      // Create a simple routine without AI for now
      const routine = await storage.createRoutine({
        userId,
        name: `${goal} Routine`,
        description: `A ${experience} level ${goal} routine for ${daysPerWeek} days per week`,
        goal,
        experience,
        duration: parseInt(duration),
        daysPerWeek: parseInt(daysPerWeek),
        equipment,
        totalExercises: 6
      });

      res.json(routine);
    } catch (error) {
      console.error("Error generating routine:", error);
      res.status(500).json({ message: "Failed to generate routine" });
    }
  });

  app.delete('/api/routines/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const routineId = parseInt(req.params.id);
      await storage.deleteRoutine(routineId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting routine:", error);
      res.status(500).json({ message: "Failed to delete routine" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
