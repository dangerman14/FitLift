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
  insertTemplateFolderSchema,
} from "@shared/schema";
import { z } from "zod";

// Helper function to extract user ID in both development and production
function getUserId(req: any): string {
  return process.env.NODE_ENV === 'development' ? req.user.id : req.user.claims.sub;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Handle development mode
      if (process.env.NODE_ENV === 'development') {
        const userId = req.user.id;
        let user = await storage.getUser(userId);
        
        // Create user if doesn't exist in development
        if (!user) {
          user = await storage.upsertUser({
            id: userId,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
          });
        }
        
        return res.json(user);
      }

      const userId = getUserId(req);
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
      const userId = getUserId(req);
      const { weightUnit, distanceUnit, bodyMeasurementUnit, partialRepsEnabled, partialRepsVolumeWeight } = req.body;
      
      const updatedUser = await storage.updateUserSettings(userId, {
        weightUnit,
        distanceUnit,
        bodyMeasurementUnit,
        partialRepsEnabled,
        partialRepsVolumeWeight,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get current body weight
  app.get('/api/user/bodyweight/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const currentWeight = await storage.getCurrentBodyweight(userId);
      res.json(currentWeight);
    } catch (error) {
      console.error("Error fetching current bodyweight:", error);
      res.status(500).json({ message: "Failed to fetch current bodyweight" });
    }
  });

  // Get bodyweight history
  app.get('/api/user/bodyweight', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const bodyweightHistory = await storage.getUserBodyweight(userId);
      res.json(bodyweightHistory);
    } catch (error) {
      console.error("Error fetching bodyweight history:", error);
      res.status(500).json({ message: "Failed to fetch bodyweight history" });
    }
  });

  // Add/update body weight
  app.post('/api/user/bodyweight', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { weight } = req.body;
      
      if (!weight || typeof weight !== 'number' || weight <= 0) {
        return res.status(400).json({ message: "Valid weight is required" });
      }
      
      // Create new bodyweight entry
      const bodyweightEntry = await storage.createBodyweightEntry({
        userId,
        weight,
        measurementDate: new Date().toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      });
      
      // Update user's current bodyweight
      await storage.updateUserCurrentBodyweight(userId, weight);
      
      res.json(bodyweightEntry);
    } catch (error) {
      console.error("Error updating bodyweight:", error);
      res.status(500).json({ message: "Failed to update bodyweight" });
    }
  });

  // Exercise routes
  app.get('/api/exercises', isAuthenticated, async (req, res) => {
    try {
      const { muscleGroup, equipment } = req.query;
      
      const userId = getUserId(req);
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

  // Get individual exercise details
  app.get('/api/exercises/:exerciseId', isAuthenticated, async (req: any, res) => {
    try {
      const exerciseId = parseInt(req.params.exerciseId);
      const userId = getUserId(req);
      
      // Get all exercises (system + custom) and find the specific one
      const exercises = await storage.getExercises(userId);
      const customExercises = await storage.getCustomExercises(userId);
      const allExercises = [...exercises, ...customExercises];
      
      const exercise = allExercises.find(ex => ex.id === exerciseId);
      
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      res.json(exercise);
    } catch (error) {
      console.error("Error fetching exercise details:", error);
      res.status(500).json({ message: "Failed to fetch exercise details" });
    }
  });

  // Get exercise history for progress tracking
  app.get('/api/exercises/:exerciseId/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const exerciseId = parseInt(req.params.exerciseId);
      
      console.log(`Fetching exercise history for exercise ${exerciseId}, user ${userId}`);
      
      // Get all workouts for this user that included this exercise
      const history = await storage.getStrengthProgress(userId, exerciseId);
      
      console.log(`Exercise ${exerciseId} history for user ${userId}:`, JSON.stringify(history, null, 2));
      
      // Disable caching for this endpoint
      res.set('Cache-Control', 'no-store');
      res.json(history);
    } catch (error) {
      console.error("Error fetching exercise history:", error);
      res.status(500).json({ message: "Failed to fetch exercise history" });
    }
  });

  // Get mini chart data for exercise progress
  app.get('/api/exercises/:exerciseId/mini-chart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const exerciseId = parseInt(req.params.exerciseId);
      
      // Get strength progress data
      const progressData = await storage.getStrengthProgress(userId, exerciseId);
      
      // Transform to chart format - last 4 sessions only
      const chartData = progressData.slice(-4).map(session => {
        // Find the best set (highest weight × reps) for this session
        let bestSet = session.sets?.[0] || { weight: session.maxWeight, reps: 1 };
        let maxStrengthScore = bestSet.weight * bestSet.reps;
        
        session.sets?.forEach(set => {
          const strengthScore = set.weight * set.reps;
          if (strengthScore > maxStrengthScore) {
            maxStrengthScore = strengthScore;
            bestSet = set;
          }
        });
        
        return {
          date: session.date.toISOString().split('T')[0],
          maxWeight: bestSet.weight,
          repsAtMaxWeight: bestSet.reps,
          strengthScore: maxStrengthScore
        };
      });
      
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching mini chart data:", error);
      res.status(500).json({ message: "Failed to fetch mini chart data" });
    }
  });

  // Get personal records for an exercise
  app.get('/api/exercises/:exerciseId/records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const exerciseId = parseInt(req.params.exerciseId);
      
      // Get strength progress data to calculate records
      const progressData = await storage.getStrengthProgress(userId, exerciseId);
      
      let maxWeight = 0;
      let maxWeightDate = null;
      let bestVolume = 0;
      let bestVolumeDate = null;
      let lastPerformed = null;
      
      if (progressData && progressData.length > 0) {
        // Find max weight
        const maxWeightRecord = progressData.reduce((max, current) => 
          current.maxWeight > max.maxWeight ? current : max
        );
        maxWeight = maxWeightRecord.maxWeight;
        maxWeightDate = maxWeightRecord.date;
        
        // For volume, we'll use max weight as a proxy for now
        bestVolume = maxWeight;
        bestVolumeDate = maxWeightDate;
        
        // Last performed is the most recent date
        lastPerformed = progressData[progressData.length - 1]?.date;
      }
      
      const records = {
        maxWeight,
        maxWeightDate,
        bestVolume,
        bestVolumeDate,
        timesPerformed: progressData?.length || 0,
        lastPerformed
      };
      
      res.json(records);
    } catch (error) {
      console.error("Error fetching exercise records:", error);
      res.status(500).json({ message: "Failed to fetch exercise records" });
    }
  });

  // Custom exercise creation using separate table
  app.post('/api/exercises/custom', isAuthenticated, async (req, res) => {
    console.log("🎯 CUSTOM EXERCISE ROUTE HIT!");
    try {
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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
        createdBy: getUserId(req),
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
      const userId = getUserId(req);
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
        userId: getUserId(req),
        slug: slug,
      };

      console.log("Data with slug:", dataWithSlug);
      
      const templateData = insertWorkoutTemplateSchema.extend({ slug: z.string() }).parse(dataWithSlug);
      console.log("Parsed template data:", templateData);
      
      const template = await storage.createWorkoutTemplate(templateData);
      
      // Add exercises to template if provided
      if (req.body.exercises && Array.isArray(req.body.exercises)) {
        for (let i = 0; i < req.body.exercises.length; i++) {
          const exerciseInput = req.body.exercises[i];
          const exerciseData = insertTemplateExerciseSchema.parse({
            templateId: template.id,
            exerciseId: exerciseInput.exerciseId,
            orderIndex: i,
            setsTarget: exerciseInput.setsTarget,
            repsTarget: exerciseInput.repsTarget,
            weightTarget: exerciseInput.weightTarget,
            restDuration: exerciseInput.restDuration,
            notes: exerciseInput.notes,
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
      const userId = getUserId(req);
      
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
      const userId = getUserId(req);
      
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
      const workouts = await storage.getWorkouts(userId);
      
      // Filter only completed workouts (those with endTime)
      const completedWorkouts = workouts.filter(workout => workout.endTime);
      const recentCompletedWorkouts = completedWorkouts.slice(0, 3);
      
      // For each completed workout, get the actual workout exercises that were performed
      const workoutsWithExercises = await Promise.all(
        recentCompletedWorkouts.map(async (workout) => {
          let exercises = [];
          let totalVolume = 0;
          let personalRecords = 0;
          let workoutExercises = [];
          
          try {
            // Get actual workout exercises (the ones that were performed)
            workoutExercises = await storage.getWorkoutExercises(workout.id);
            exercises = workoutExercises.slice(0, 3); // Show first 3 exercises
            
            // Calculate actual volume and PR count from exercise sets
            for (const workoutExercise of workoutExercises) {
              for (const set of workoutExercise.sets) {
                const weight = parseFloat(set.weight || '0');
                const reps = set.reps || 0;
                totalVolume += weight * reps;
                // Note: isPersonalRecord is not stored in exercise_sets table, 
                // so we'll skip PR counting for now or implement it differently
              }
            }
          } catch (error) {
            console.error(`Error fetching workout exercises for workout ${workout.id}:`, error);
          }
          
          return {
            ...workout,
            exercises,
            totalExercises: workoutExercises.length, // Total exercises performed, not just displayed
            totalVolume,
            personalRecords
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
      
      console.log("Fetching workout with parameter:", idParam);
      console.log("Is numeric test result:", /^\d+$/.test(idParam));
      
      // Check if the parameter is a numeric ID or an alphanumeric slug
      if (/^\d+$/.test(idParam)) {
        // It's a numeric ID
        console.log("Treating as numeric ID");
        const id = parseInt(idParam);
        workout = await storage.getWorkoutById(id);
      } else {
        // It's a slug - make sure we call the correct method
        console.log("Treating as slug, looking up workout by slug:", idParam);
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
        userId: getUserId(req),
        templateId: req.body.templateId || null,
        routineId: req.body.routineId || null,
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
      
      console.log("Final update data before storage:", updateData);
      
      const workout = await storage.updateWorkout(id, updateData);
      console.log("Workout returned from storage:", workout);
      res.json(workout);
    } catch (error) {
      console.error("Error updating workout:", error);
      res.status(500).json({ message: "Failed to update workout" });
    }
  });

  // Update workout details (name, description, image)
  app.patch('/api/workouts/:id/details', isAuthenticated, async (req: any, res) => {
    try {
      const param = req.params.id;
      const userId = getUserId(req);
      
      // Check if parameter is numeric (ID) or string (slug)
      const isNumeric = !isNaN(Number(param)) && Number(param).toString() === param;
      let existingWorkout;
      
      if (isNumeric) {
        const id = parseInt(param);
        existingWorkout = await storage.getWorkoutById(id);
      } else {
        // Handle slug
        existingWorkout = await storage.getWorkoutBySlug(param);
      }
      
      if (!existingWorkout || existingWorkout.userId !== userId) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      const { name, description, imageUrl, startTime, endTime, duration } = req.body;
      
      const updateData: any = {
        name,
        description,
        imageUrl
      };
      
      // Convert date strings to Date objects if they exist
      if (startTime) {
        updateData.startTime = new Date(startTime);
      }
      if (endTime) {
        updateData.endTime = new Date(endTime);
      }
      if (duration !== undefined) {
        updateData.duration = duration;
      }
      
      console.log("Details endpoint update data:", updateData);
      
      const updatedWorkout = await storage.updateWorkout(existingWorkout.id, updateData);
      
      res.json(updatedWorkout);
    } catch (error) {
      console.error("Error updating workout details:", error);
      res.status(500).json({ message: "Failed to update workout details" });
    }
  });

  // Delete workout
  app.delete('/api/workouts/:param', isAuthenticated, async (req: any, res) => {
    try {
      const param = req.params.param;
      const userId = getUserId(req);
      
      // Check if param is numeric (ID) or slug
      const isNumeric = /^\d+$/.test(param);
      let existingWorkout;
      
      if (isNumeric) {
        const id = parseInt(param);
        existingWorkout = await storage.getWorkoutById(id);
      } else {
        // Handle slug
        existingWorkout = await storage.getWorkoutBySlug(param);
      }
      
      if (!existingWorkout || existingWorkout.userId !== userId) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Delete the workout (this should cascade to delete related data)
      await storage.deleteWorkout(existingWorkout.id, userId);
      
      res.status(200).json({ message: "Workout deleted successfully" });
    } catch (error) {
      console.error("Error deleting workout:", error);
      res.status(500).json({ message: "Failed to delete workout" });
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
        partialReps: req.body.partialReps || 0,
        duration: req.body.duration || null,
        distance: req.body.distance || null,
        restTime: req.body.restTime || null,
        notes: req.body.notes || null,
        completed: req.body.completed || false,
        rpe: req.body.rpe || null,
      };
      
      console.log('Creating set with data:', setData);
      
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

  // Get previous exercise data
  app.get('/api/exercises/:exerciseId/previous-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const exerciseId = parseInt(req.params.exerciseId);
      const templateId = req.query.templateId ? parseInt(req.query.templateId) : undefined;

      const previousData = await storage.getPreviousExerciseData(userId, exerciseId, templateId);
      res.json(previousData);
    } catch (error) {
      console.error("Error getting previous exercise data:", error);
      res.status(500).json({ message: "Failed to get previous exercise data" });
    }
  });

  // Get progressive overload suggestion
  app.get('/api/exercises/:exerciseId/progression-suggestion', isAuthenticated, async (req: any, res) => {
    try {
      const { ProgressiveOverloadCalculator } = await import('../shared/progressive-overload.js');
      const userId = getUserId(req);
      const exerciseId = parseInt(req.params.exerciseId);
      const templateId = req.query.templateId ? parseInt(req.query.templateId) : undefined;
      const minReps = req.query.minReps ? parseInt(req.query.minReps) : undefined;
      const maxReps = req.query.maxReps ? parseInt(req.query.maxReps) : undefined;
      const weightTarget = req.query.weightTarget ? parseFloat(req.query.weightTarget) : undefined;

      // Get user settings for increment preferences
      const user = await storage.getUser(userId);
      const userIncrements = {
        barbellIncrement: user?.barbellIncrement || 2.5,
        dumbbellIncrement: user?.dumbbellIncrement || 2.5,
        machineIncrement: user?.machineIncrement || 2.5,
        cableIncrement: user?.cableIncrement || 2.5,
        kettlebellIncrement: user?.kettlebellIncrement || 4.0,
        plateLoadedIncrement: user?.plateLoadedIncrement || 2.5,
        defaultIncrement: user?.defaultIncrement || 2.5,
      };

      // Get previous exercise data
      const previousData = await storage.getPreviousExerciseData(userId, exerciseId, templateId);
      
      // Get exercise details to determine equipment type and if it's bodyweight
      const exercises = await storage.getExercises(userId);
      const exercise = exercises.find(ex => ex.id === exerciseId);
      const isBodyweight = exercise?.exerciseType === 'bodyweight' || exercise?.exerciseType === 'bodyweight_plus_weight';

      const targets = { minReps, maxReps, weightTarget };
      
      let suggestion;
      if (isBodyweight && exercise?.exerciseType === 'bodyweight') {
        suggestion = ProgressiveOverloadCalculator.calculateBodyweightProgression(previousData, targets);
      } else {
        const weightIncrement = exercise ? ProgressiveOverloadCalculator.getWeightIncrement(exercise.equipmentType, userIncrements) : 2.5;
        const muscleGroups = exercise?.primaryMuscleGroups || [];
        const muscleGroupsArray = Array.isArray(muscleGroups) ? muscleGroups : [];
        suggestion = ProgressiveOverloadCalculator.calculateProgression(previousData, targets, weightIncrement, muscleGroupsArray);
      }

      res.json(suggestion);
    } catch (error) {
      console.error("Error calculating progression suggestion:", error);
      res.status(500).json({ message: "Failed to calculate progression suggestion" });
    }
  });

  // Get best set for an exercise
  app.get('/api/exercises/:exerciseId/best-set', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const exerciseId = parseInt(req.params.exerciseId);

      const previousData = await storage.getPreviousExerciseData(userId, exerciseId);
      
      if (!previousData || previousData.length === 0) {
        return res.json({ weight: null, reps: null });
      }

      // Filter out unrealistic data with maximum strictness to eliminate corrupted entries
      const validSets = previousData.filter(set => 
        set.reps > 0 && 
        set.weight > 0 && 
        set.reps <= 20 && 
        set.weight <= 75 && // Allow reasonable weights but exclude extreme outliers
        set.reps !== set.weight && // Filter data entry errors
        set.weight >= 5 && // Minimum realistic weight
        set.reps >= 3 && // Minimum realistic reps
        !(set.weight > 100) // Explicitly exclude weights over 100kg to filter corrupted data
      );

      if (validSets.length === 0) {
        return res.json({ weight: null, reps: null });
      }

      // Find best set (highest weight, or highest reps if same weight)
      const bestSet = validSets.reduce((best, current) => {
        if (current.weight > best.weight) return current;
        if (current.weight === best.weight && current.reps > best.reps) return current;
        return best;
      });

      res.json({
        weight: bestSet.weight,
        reps: bestSet.reps
      });
    } catch (error) {
      console.error("Error fetching best set:", error);
      res.status(500).json({ message: "Failed to fetch best set" });
    }
  });

  // Check personal records for a set
  app.post('/api/exercises/:exerciseId/check-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const exerciseId = parseInt(req.params.exerciseId);
      const { weight, reps } = req.body;

      console.log(`Checking records for user ${userId}, exercise ${exerciseId}, weight ${weight}, reps ${reps}`);

      if (!weight || !reps) {
        console.log("Missing weight or reps:", { weight, reps });
        return res.status(400).json({ message: "Weight and reps are required" });
      }

      const records = await storage.checkPersonalRecords(userId, exerciseId, weight, reps);
      console.log("Records result:", records);
      
      // Ensure we return a proper JSON response
      res.status(200).json(records);
    } catch (error) {
      console.error("Error checking personal records:", error);
      res.status(500).json({ message: "Failed to check personal records" });
    }
  });

  // Fitness goal routes
  app.get('/api/fitness-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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
        userId: getUserId(req),
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
      const userId = getUserId(req);
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
        userId: getUserId(req),
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
      const exerciseId = parseInt(req.params.exerciseId);
      
      const progress = await storage.getStrengthProgress(userId, exerciseId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching strength progress:", error);
      res.status(500).json({ message: "Failed to fetch strength progress" });
    }
  });

  // Chart data endpoints
  app.get('/api/analytics/volume-chart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { period } = req.query;
      let startDate: Date | undefined;
      
      if (period === '30d') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === '3m') {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      } else if (period === '1y') {
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }
      
      const data = await storage.getVolumeChart(userId, startDate);
      res.json(data);
    } catch (error) {
      console.error("Error getting volume chart data:", error);
      res.status(500).json({ error: "Failed to get volume chart data" });
    }
  });

  app.get('/api/analytics/reps-chart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { period } = req.query;
      let startDate: Date | undefined;
      
      if (period === '30d') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === '3m') {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      } else if (period === '1y') {
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }
      
      const data = await storage.getRepsChart(userId, startDate);
      res.json(data);
    } catch (error) {
      console.error("Error getting reps chart data:", error);
      res.status(500).json({ error: "Failed to get reps chart data" });
    }
  });

  app.get('/api/analytics/duration-chart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { period } = req.query;
      let startDate: Date | undefined;
      
      if (period === '30d') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === '3m') {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      } else if (period === '1y') {
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }
      
      const data = await storage.getDurationChart(userId, startDate);
      res.json(data);
    } catch (error) {
      console.error("Error getting duration chart data:", error);
      res.status(500).json({ error: "Failed to get duration chart data" });
    }
  });

  app.get('/api/analytics/frequency-chart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { period } = req.query;
      let startDate: Date | undefined;
      
      if (period === '30d') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === '3m') {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      } else if (period === '1y') {
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }
      
      const data = await storage.getWorkoutFrequencyChart(userId, startDate);
      res.json(data);
    } catch (error) {
      console.error("Error getting frequency chart data:", error);
      res.status(500).json({ error: "Failed to get frequency chart data" });
    }
  });

  app.get('/api/analytics/muscle-groups-chart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { period } = req.query;
      let startDate: Date | undefined;
      
      if (period === '30d') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (period === '3m') {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      } else if (period === '1y') {
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }
      
      const data = await storage.getMuscleGroupChart(userId, startDate);
      res.json(data);
    } catch (error) {
      console.error("Error getting muscle groups chart data:", error);
      res.status(500).json({ error: "Failed to get muscle groups chart data" });
    }
  });

  // Routines routes
  app.get('/api/routines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const routines = await storage.getUserWorkoutTemplates(userId);
      res.json(routines);
    } catch (error) {
      console.error("Error fetching routines:", error);
      res.status(500).json({ message: "Failed to fetch routines" });
    }
  });

  app.get('/api/routines/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const templateId = parseInt(req.params.id);
      const template = await storage.getWorkoutTemplate(templateId);
      
      if (!template || template.userId !== userId) {
        return res.status(404).json({ message: "Routine not found" });
      }

      // Get template exercises with proper rep range data
      const templateExercises = await storage.getTemplateExercises(templateId);
      
      res.json({
        ...template,
        exercises: templateExercises
      });
    } catch (error) {
      console.error("Error fetching routine:", error);
      res.status(500).json({ message: "Failed to fetch routine" });
    }
  });

  app.post('/api/routines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      console.log('Creating routine with request body:', req.body);
      
      // Create the routine
      const routineData = {
        userId,
        name: req.body.name,
        slug: req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now(),
        description: req.body.description || '',
        folderId: req.body.folderId || null,
        goal: req.body.goal || 'general',
        experience: req.body.experience || 'intermediate',
        estimatedDuration: req.body.duration || 60,
        daysPerWeek: req.body.daysPerWeek || 3,
        equipment: req.body.equipment || 'gym',
        totalExercises: req.body.exercises?.length || 0,
        isSystemTemplate: false
      };
      
      console.log('Routine data:', routineData);
      const routine = await storage.createWorkoutTemplate(routineData);
      console.log('Created routine:', routine);
      
      // Add exercises to routine if provided
      if (req.body.exercises && Array.isArray(req.body.exercises)) {
        for (let i = 0; i < req.body.exercises.length; i++) {
          const exerciseInput = req.body.exercises[i];
          console.log('Creating routine exercise:', exerciseInput);
          
          // Parse rep ranges from the notes field or use defaults
          let minReps = 8, maxReps = 12;
          if (exerciseInput.notes) {
            try {
              const notesData = JSON.parse(exerciseInput.notes);
              if (notesData.setsData && notesData.setsData[0] && notesData.setsData[0].reps) {
                const repsRange = notesData.setsData[0].reps;
                if (repsRange.includes('-')) {
                  const [min, max] = repsRange.split('-').map(Number);
                  minReps = min || 8;
                  maxReps = max || 12;
                } else {
                  const reps = parseInt(repsRange);
                  minReps = maxReps = reps || 10;
                }
              }
            } catch (e) {
              console.log('Could not parse notes for rep ranges, using defaults');
            }
          }

          const templateExerciseData = {
            templateId: routine.id,
            exerciseId: exerciseInput.exerciseId,
            orderIndex: i,
            dayOfWeek: null,
            setsTarget: exerciseInput.setsTarget || 3,
            minReps: minReps,
            maxReps: maxReps,
            defaultRpe: null,
            weightTarget: exerciseInput.weightTarget?.toString() || null,
            restDuration: exerciseInput.restDuration || 120,
            supersetId: null,
            notes: exerciseInput.notes || null
          };
          
          console.log('Template exercise data:', templateExerciseData);
          await storage.createTemplateExercise(templateExerciseData);
        }
      }
      
      res.status(201).json(routine);
    } catch (error) {
      console.error("Error creating routine:", error);
      res.status(500).json({ message: "Failed to create routine" });
    }
  });

  app.post('/api/routines/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
      const folders = await storage.getTemplateFolders(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching routine folders:", error);
      res.status(500).json({ message: "Failed to fetch routine folders" });
    }
  });

  app.post('/api/routine-folders', isAuthenticated, async (req: any, res) => {
    console.log("Creating folder with data:", req.body);
    try {
      const folderData = insertTemplateFolderSchema.parse({
        ...req.body,
        userId: getUserId(req),
      });
      
      console.log("Parsed folder data:", folderData);
      const folder = await storage.createTemplateFolder(folderData);
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
      const folderId = parseInt(req.params.id);
      await storage.deleteRoutineFolder(folderId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting routine folder:", error);
      res.status(500).json({ message: "Failed to delete routine folder" });
    }
  });

  // Comprehensive body entry endpoint
  app.post('/api/body-entry', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const formData = req.body;
      
      console.log('Received body entry data:', formData);
      
      let results: any = {};
      const today = new Date().toISOString().split('T')[0];
      
      // Handle weight entry
      if (formData.weight && !isNaN(parseFloat(formData.weight))) {
        const weight = parseFloat(formData.weight);
        results.bodyweight = await storage.createBodyweightEntry({
          userId,
          weight: weight.toString(),
          measurementDate: today,
        });
        await storage.updateUserCurrentBodyweight(userId, weight);
      }
      
      // Handle body measurements
      const measurements: any = {};
      let hasMeasurements = false;
      
      ['chest', 'shoulders', 'waist', 'abdomen', 'hips', 'bicepsLeft', 'bicepsRight', 'thighLeft', 'thighRight', 'bodyFatPercentage'].forEach(field => {
        if (formData[field] && !isNaN(parseFloat(formData[field]))) {
          measurements[field] = parseFloat(formData[field]).toString();
          hasMeasurements = true;
        }
      });
      
      console.log('Measurements to save:', measurements, 'Has measurements:', hasMeasurements);
      
      if (hasMeasurements) {
        results.measurement = await storage.createBodyMeasurement({
          userId,
          date: today,
          ...measurements,
          notes: formData.notes || null,
        });
        console.log('Saved measurement:', results.measurement);
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error creating body entry:", error);
      res.status(500).json({ message: "Failed to create body entry" });
    }
  });

  // Update existing body entry endpoint
  app.put('/api/body-entry', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const formData = req.body;
      const entryDate = formData.date || new Date().toISOString().split('T')[0];
      
      console.log('Updating body entry for date:', entryDate, 'Data:', formData);
      
      let results: any = {};
      
      // Handle weight entry update
      if (formData.weight && !isNaN(parseFloat(formData.weight))) {
        const weight = parseFloat(formData.weight);
        
        // First check if there's an existing weight entry for this date
        const existingWeight = await storage.getUserBodyweight(userId);
        const existingEntryForDate = existingWeight.find((entry: any) => 
          new Date(entry.measurementDate).toISOString().split('T')[0] === entryDate
        );
        
        if (existingEntryForDate) {
          // Update existing entry
          results.bodyweight = await storage.updateExistingBodyweight(existingEntryForDate.id, weight);
        } else {
          // Create new entry if none exists for this date
          results.bodyweight = await storage.createBodyweightEntry({
            userId,
            weight: weight.toString(),
            measurementDate: entryDate,
          });
        }
        
        await storage.updateUserCurrentBodyweight(userId, weight);
      }
      
      // Handle body measurements update
      const measurements: any = {};
      let hasMeasurements = false;
      
      ['chest', 'shoulders', 'waist', 'abdomen', 'hips', 'bicepsLeft', 'bicepsRight', 'thighLeft', 'thighRight', 'bodyFatPercentage'].forEach(field => {
        if (formData[field] && !isNaN(parseFloat(formData[field]))) {
          measurements[field] = parseFloat(formData[field]).toString();
          hasMeasurements = true;
        }
      });
      
      if (hasMeasurements) {
        // Check if there's an existing measurement for this date
        const existingMeasurements = await storage.getBodyMeasurements(userId);
        const existingMeasurementForDate = existingMeasurements.find((measurement: any) => 
          new Date(measurement.date).toISOString().split('T')[0] === entryDate
        );
        
        if (existingMeasurementForDate) {
          // Update existing measurement
          results.measurement = await storage.updateBodyMeasurement(existingMeasurementForDate.id, {
            ...measurements,
            notes: formData.notes || null,
          });
        } else {
          // Create new measurement if none exists for this date
          results.measurement = await storage.createBodyMeasurement({
            userId,
            date: entryDate,
            ...measurements,
            notes: formData.notes || null,
          });
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error updating body entry:", error);
      res.status(500).json({ message: "Failed to update body entry" });
    }
  });

  // Progress photos routes
  app.get('/api/progress-photos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      // For now return empty array since we haven't implemented photo storage yet
      res.json([]);
    } catch (error) {
      console.error("Error fetching progress photos:", error);
      res.status(500).json({ message: "Failed to fetch progress photos" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
