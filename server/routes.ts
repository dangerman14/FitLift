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
      console.log("Templates with exercise counts:", templates.map(t => ({ id: t.id, name: t.name, exerciseCount: t.exerciseCount })));
      res.set('Cache-Control', 'no-cache');
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
      console.log(`Fetched template ${id} with ${exercises.length} exercises:`, exercises);
      res.json({ ...template, exercises });
    } catch (error) {
      console.error("Error fetching workout template:", error);
      res.status(500).json({ message: "Failed to fetch workout template" });
    }
  });

  // Route to get workout template by slug
  app.get('/api/workout-templates/slug/:slug', isAuthenticated, async (req, res) => {
    try {
      const slug = req.params.slug;
      const template = await storage.getWorkoutTemplateBySlug(slug);
      
      if (!template) {
        return res.status(404).json({ message: "Workout template not found" });
      }
      
      const exercises = await storage.getTemplateExercises(template.id);
      console.log(`Fetched template ${slug} with ${exercises.length} exercises:`, exercises);
      res.json({ ...template, exercises });
    } catch (error) {
      console.error("Error fetching workout template by slug:", error);
      res.status(500).json({ message: "Failed to fetch workout template" });
    }
  });

  app.post('/api/workout-templates', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Creating routine with data:", req.body);
      
      // Generate slug for the routine
      const generateSlug = (name: string): string => {
        if (!name || typeof name !== 'string') {
          name = 'routine'; // Fallback name
        }
        const baseSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
          .substring(0, 50);
        const uniqueId = Math.random().toString(36).substring(2, 8);
        return `${baseSlug}-${uniqueId}`;
      };

      // Ensure slug is always present
      const slug = generateSlug(req.body.name || 'routine');
      console.log("Generated slug:", slug);

      // Add slug to the request body before validation
      const dataWithSlug = {
        ...req.body,
        userId: req.user.claims.sub,
        slug: slug,
      };

      console.log("Data with slug:", dataWithSlug);
      
      const templateData = insertWorkoutTemplateSchema.parse(dataWithSlug);
      console.log("Parsed template data:", templateData);
      
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

  app.put('/api/workout-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      console.log("Updating routine with data:", req.body);
      
      // Check if template exists and belongs to user
      const existingTemplate = await storage.getWorkoutTemplateById(id);
      if (!existingTemplate || existingTemplate.userId !== userId) {
        return res.status(404).json({ message: "Workout template not found" });
      }
      
      // Update the template with new data
      const updateData = {
        name: req.body.name,
        description: req.body.description,
        folderId: req.body.folderId,
      };
      console.log("Update data:", updateData);
      
      const updatedTemplate = await storage.updateWorkoutTemplate(id, updateData);
      
      // Remove existing template exercises
      const existingExercises = await storage.getTemplateExercises(id);
      for (const exercise of existingExercises) {
        await storage.deleteTemplateExercise(exercise.id);
      }
      
      // Add new exercises to template if provided
      if (req.body.exercises && Array.isArray(req.body.exercises)) {
        for (let i = 0; i < req.body.exercises.length; i++) {
          const exerciseData = insertTemplateExerciseSchema.parse({
            ...req.body.exercises[i],
            templateId: id,
            orderIndex: i,
          });
          await storage.createTemplateExercise(exerciseData);
        }
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating workout template:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid template data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update workout template" });
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

  // Recent workouts with exercise details for dashboard
  app.get('/api/workouts/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workouts = await storage.getWorkouts(userId);
      
      // Filter only completed workouts (those with endTime)
      const completedWorkouts = workouts.filter(workout => workout.endTime);
      const recentCompletedWorkouts = completedWorkouts.slice(0, 3);
      
      // For each completed workout, get the template exercises if it has a templateId
      const workoutsWithExercises = await Promise.all(
        recentCompletedWorkouts.map(async (workout) => {
          let exercises = [];
          let totalExercises = 0;
          
          if (workout.templateId) {
            try {
              const templateExercises = await storage.getTemplateExercises(workout.templateId);
              exercises = templateExercises.slice(0, 3);
              totalExercises = templateExercises.length;
            } catch (error) {
              console.error(`Error fetching template exercises for workout ${workout.id}:`, error);
            }
          }
          
          return {
            ...workout,
            exercises,
            totalExercises
          };
        })
      );
      
      res.json(workoutsWithExercises);
    } catch (error) {
      console.error("Error fetching recent workouts:", error);
      res.status(500).json({ message: "Failed to fetch recent workouts" });
    }
  });

  app.get('/api/workouts/:id', isAuthenticated, async (req, res) => {
    try {
      const idParam = req.params.id;
      let workout;
      
      // Check if the parameter is a numeric ID or an alphanumeric slug
      if (/^\d+$/.test(idParam)) {
        // It's a numeric ID
        const id = parseInt(idParam);
        workout = await storage.getWorkoutById(id);
      } else {
        // It's a slug
        workout = await storage.getWorkoutBySlug(idParam);
      }
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      const exercises = await storage.getWorkoutExercises(workout.id);
      
      // If workout has a templateId, get the template name
      let templateName = null;
      if (workout.templateId) {
        try {
          const template = await storage.getWorkoutTemplateById(workout.templateId);
          templateName = template?.name || null;
        } catch (error) {
          console.error(`Error fetching template name for workout ${workout.id}:`, error);
        }
      }
      
      res.json({ ...workout, exercises, templateName });
    } catch (error) {
      console.error("Error fetching workout:", error);
      res.status(500).json({ message: "Failed to fetch workout" });
    }
  });

  app.post('/api/workouts', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Creating workout with request body:", req.body);
      
      // Generate random alphanumeric slug
      const generateRandomSlug = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const slug = generateRandomSlug();
      console.log("Generated slug:", slug);

      // Create workout data directly without schema validation to avoid date issues
      const workoutData: any = {
        name: req.body.name || "Quick Workout",
        userId: req.user.claims.sub,
        templateId: req.body.templateId || null,
        slug: slug,
        startTime: req.body.startTime ? new Date(req.body.startTime) : new Date(),
        endTime: req.body.endTime ? new Date(req.body.endTime) : null,
        duration: req.body.duration || null,
        notes: req.body.notes || null,
        location: req.body.location || null,
        rating: req.body.rating || null,
        perceivedExertion: req.body.perceivedExertion || null,
      };
      
      console.log("Workout data with slug:", workoutData);
      console.log("Slug field specifically:", workoutData.slug);
      const workout = await storage.createWorkout(workoutData);
      console.log("Created workout:", workout);
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

  // Routine folder routes
  app.get('/api/routine-folders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folders = await storage.getRoutineFolders(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching routine folders:", error);
      res.status(500).json({ message: "Failed to fetch routine folders" });
    }
  });

  app.post('/api/routine-folders', isAuthenticated, async (req: any, res) => {
    console.log("Creating folder with data:", req.body);
    try {
      const folderData = insertRoutineFolderSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });
      
      console.log("Parsed folder data:", folderData);
      const folder = await storage.createRoutineFolder(folderData);
      console.log("Created folder:", folder);
      
      res.setHeader('Content-Type', 'application/json');
      return res.status(201).json(folder);
    } catch (error) {
      console.error("Error creating routine folder:", error);
      res.setHeader('Content-Type', 'application/json');
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      } else {
        return res.status(500).json({ message: "Failed to create routine folder" });
      }
    }
  });

  app.put('/api/routine-folders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.id);
      const updates = req.body;
      
      const folder = await storage.updateRoutineFolder(folderId, userId, updates);
      res.json(folder);
    } catch (error) {
      console.error("Error updating routine folder:", error);
      res.status(500).json({ message: "Failed to update routine folder" });
    }
  });

  app.delete('/api/routine-folders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.id);
      await storage.deleteRoutineFolder(folderId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting routine folder:", error);
      res.status(500).json({ message: "Failed to delete routine folder" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
