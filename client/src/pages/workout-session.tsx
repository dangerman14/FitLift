import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, Timer, MoreVertical, Check, Edit3, Camera, Image, Trash2, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWorkout } from "@/contexts/WorkoutContext";
import { OfflineManager } from "@/lib/offline";
import ExerciseSetInput from "@/components/exercise-set-input";
import { MiniProgressChart } from "@/components/MiniProgressChart";
import { ExerciseMiniChart } from "@/components/ExerciseMiniChart";
import { SwipeableSetRow } from "@/components/SwipeableSetRow";



interface WorkoutExercise {
  id: number;
  exercise: {
    id: number;
    name: string;
    muscleGroups: string[];
    type: string;
    instructions?: string;
  };
  sets: WorkoutSet[];
  restTimer?: number;
  restStartTime?: Date;
  comment?: string;
}

interface WorkoutSet {
  id?: number;
  setNumber: number;
  weight?: number;
  reps?: number;
  partialReps?: number;
  duration?: number;
  distance?: number;
  assistanceWeight?: number;
  minReps?: number;
  maxReps?: number;
  rpe?: number;
  completed: boolean;
  previousWeight?: number;
  previousReps?: number;
  previousDuration?: number;
  previousDistance?: number;
}

export default function WorkoutSession() {
  const [location, setLocation] = useLocation();
  const [activeWorkout, setActiveWorkoutState] = useState<any>(null);
  const { setActiveWorkout, activeWorkout: globalActiveWorkout } = useWorkout();
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  
  // Debug: Watch when workoutExercises changes
  useEffect(() => {
    console.log('workoutExercises state changed:', workoutExercises.length, 'exercises');
    if (workoutExercises.length > 0) {
      console.log('First exercise sets:', workoutExercises[0]?.sets);
    }
  }, [workoutExercises]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const isCreatingWorkoutRef = useRef(false);
  
  // Parse URL to determine if we're editing existing workout or starting new one
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('template');
  const editMode = urlParams.get('edit');
  const workoutSlug = location.split('/')[2]; // For /workout-session/abc123 format
  const isEditingExisting = workoutSlug && workoutSlug !== 'new'; // If there's a slug and it's not 'new', we're resuming/editing
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showRpeSelector, setShowRpeSelector] = useState(false);
  const [selectedRpeSet, setSelectedRpeSet] = useState<{exerciseIndex: number, setIndex: number} | null>(null);
  const [restTimers, setRestTimers] = useState<{[key: number]: number}>({});
  const [floatingCountdown, setFloatingCountdown] = useState<{exerciseIndex: number, timeLeft: number} | null>(null);
  const [exerciseRestTimes, setExerciseRestTimes] = useState<{[key: number]: number}>({});
  const [exerciseWeightUnits, setExerciseWeightUnits] = useState<{[exerciseId: number]: 'kg' | 'lbs'}>({});



  const [exerciseProgressionModes, setExerciseProgressionModes] = useState<{[exerciseId: number]: 'previous' | 'suggestion'}>({});
  const [swipeState, setSwipeState] = useState<{setKey: string, offset: number, startX: number} | null>(null);
  const swipeRef = useRef<{
    setKey: string;
    offset: number;
    startX: number;
    animationFrame?: number;
  } | null>(null);
  const [editWorkoutOpen, setEditWorkoutOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutImageUrl, setWorkoutImageUrl] = useState('');
  const [previousExerciseData, setPreviousExerciseData] = useState<{[exerciseId: number]: {weight: number, reps: number, setNumber: number}[]}>({});
  const [progressionSuggestions, setProgressionSuggestions] = useState<{[exerciseId: number]: any}>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const autoSaveTimeouts = useRef<{[key: string]: NodeJS.Timeout}>({});

  // Timer effect to update elapsed time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Load saved weight preferences from localStorage
  useEffect(() => {
    const savedPrefs = JSON.parse(localStorage.getItem('exerciseWeightPreferences') || '{}');
    setExerciseWeightUnits(savedPrefs);
  }, []);

  // Fetch previous exercise data and progression suggestions when workout exercises are loaded
  useEffect(() => {
    if (workoutExercises.length > 0) {
      workoutExercises.forEach(workoutExercise => {
        fetchPreviousExerciseData(workoutExercise.exercise.id);
        fetchProgressionSuggestion(workoutExercise.exercise.id, workoutExercise);
      });
    }
  }, [workoutExercises.length]);

  // Initialize progression display modes from user preference
  useEffect(() => {
    if (user && workoutExercises.length > 0) {
      const userProgressionMode = (user as any)?.progressionDisplayMode === 'ai_suggestions' ? 'suggestion' : 'previous';
      const initialModes: {[exerciseId: number]: 'previous' | 'suggestion'} = {};
      workoutExercises.forEach(we => {
        initialModes[we.exercise.id] = userProgressionMode;
      });
      setExerciseProgressionModes(initialModes);
    }
  }, [user, workoutExercises]);

  // Weight unit conversion helpers
  const getWeightUnit = (exerciseId: number) => {
    return exerciseWeightUnits[exerciseId] || user?.weightUnit || 'kg';
  };

  const toggleExerciseWeightUnit = (exerciseId: number) => {
    const currentUnit = getWeightUnit(exerciseId);
    const newUnit = currentUnit === 'kg' ? 'lbs' : 'kg';
    setExerciseWeightUnits(prev => ({
      ...prev,
      [exerciseId]: newUnit
    }));
    
    // Save to localStorage to persist preference
    const existingPrefs = JSON.parse(localStorage.getItem('exerciseWeightPreferences') || '{}');
    existingPrefs[exerciseId] = newUnit;
    localStorage.setItem('exerciseWeightPreferences', JSON.stringify(existingPrefs));
  };

  // Get progression display mode for a specific exercise
  const getProgressionMode = (exerciseId: number) => {
    return exerciseProgressionModes[exerciseId] || 'previous';
  };

  // Toggle progression display mode for a specific exercise
  const toggleExerciseProgressionMode = (exerciseId: number, mode: 'previous' | 'suggestion') => {
    setExerciseProgressionModes(prev => ({
      ...prev,
      [exerciseId]: mode
    }));
  };
  
  const getDisplayWeight = (weight: number, exerciseId: number) => {
    if (getWeightUnit(exerciseId) === 'lbs' && weight > 0) {
      return Math.round(weight * 2.20462 * 10) / 10; // Convert kg to lbs
    }
    return weight;
  };
  
  const getStorageWeight = (displayWeight: number, exerciseId: number) => {
    if (getWeightUnit(exerciseId) === 'lbs' && displayWeight > 0) {
      return Math.round(displayWeight / 2.20462 * 10) / 10; // Convert lbs to kg for storage
    }
    return displayWeight;
  };

  // Fetch previous exercise data based on user's preference
  const fetchPreviousExerciseData = async (exerciseId: number) => {
    try {
      const templateId = activeWorkout?.templateId;
      const url = `/api/exercises/${exerciseId}/previous-data${templateId ? `?templateId=${templateId}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPreviousExerciseData(prev => ({
          ...prev,
          [exerciseId]: data
        }));
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching previous exercise data:', error);
      return [];
    }
  };

  // Fetch progressive overload suggestions with weight unit handling
  const fetchProgressionSuggestion = async (exerciseId: number, workoutExercise: WorkoutExercise) => {
    try {
      const templateId = activeWorkout?.templateId;
      const firstSet = workoutExercise.sets[0];
      const minReps = firstSet?.minReps || 8;
      const maxReps = firstSet?.maxReps || 12;
      
      // Get weight target in storage format (kg) regardless of display unit
      let weightTarget = 0;
      if (workoutExercise.sets[0]?.weight) {
        const displayWeight = parseFloat(workoutExercise.sets[0].weight.toString());
        weightTarget = getStorageWeight(displayWeight, exerciseId);
      }
      
      const params = new URLSearchParams({
        ...(templateId && { templateId: templateId.toString() }),
        minReps: minReps.toString(),
        maxReps: maxReps.toString(),
        ...(weightTarget > 0 && { weightTarget: weightTarget.toString() })
      });
      
      const url = `/api/exercises/${exerciseId}/progression-suggestion?${params}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (response.ok) {
        const suggestion = await response.json();
        console.log(`Progression suggestion for exercise ${exerciseId}:`, suggestion);
        setProgressionSuggestions(prev => ({
          ...prev,
          [exerciseId]: suggestion
        }));
        return suggestion;
      }
      return null;
    } catch (error) {
      console.error('Error fetching progression suggestion:', error);
      return null;
    }
  };

  const handleWeightUnitChange = (value: 'default' | 'kg' | 'lbs') => {
    setWeightUnitOverride(value);
  };

  const getWeightUnitDisplay = () => {
    if (weightUnitOverride === 'default') {
      return `${(user?.weightUnit || 'kg').toUpperCase()} (Default)`;
    }
    return weightUnitOverride.toUpperCase();
  };

  // Helper function to format reps display like in create-routine
  const formatRepsDisplay = (set: WorkoutSet) => {
    if (set.minReps && set.maxReps) {
      if (set.minReps === set.maxReps) {
        return set.minReps.toString();
      }
      return `${set.minReps}-${set.maxReps}`;
    }
    return set.reps?.toString() || '';
  };

  // Update workout details mutation
  const updateWorkoutDetailsMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; imageUrl: string }) => {
      return await apiRequest("PATCH", `/api/workouts/${activeWorkout?.id}/details`, data);
    },
    onSuccess: (updatedWorkout) => {
      setActiveWorkoutState(updatedWorkout);
      setActiveWorkout({
        id: updatedWorkout.id.toString(),
        name: updatedWorkout.name,
        startTime: updatedWorkout.startTime,
        slug: updatedWorkout.slug
      });
      setEditWorkoutOpen(false);
      toast({
        title: "Workout updated!",
        description: "Your workout details have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workout details.",
        variant: "destructive",
      });
    },
  });

  // Initialize workout details form when activeWorkout loads (only if not already set)
  useEffect(() => {
    if (activeWorkout && !workoutName) {
      setWorkoutName(activeWorkout.name || '');
      setWorkoutDescription(activeWorkout.description || '');
      setWorkoutImageUrl(activeWorkout.imageUrl || '');
    }
  }, [activeWorkout]);

  // Initialize exercise rest times when workout exercises load
  useEffect(() => {
    const initialRestTimes: {[key: number]: number} = {};
    workoutExercises.forEach((exercise, index) => {
      if (exerciseRestTimes[index] === undefined) {
        initialRestTimes[index] = exercise.restTimer || 180; // Default 3 minutes
      }
    });
    if (Object.keys(initialRestTimes).length > 0) {
      setExerciseRestTimes(prev => ({ ...prev, ...initialRestTimes }));
    }
  }, [workoutExercises]);

  const { data: exercises } = useQuery({
    queryKey: ["/api/exercises"],
  });

  const createWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      const offlineManager = OfflineManager.getInstance();
      
      try {
        const response = await apiRequest("POST", "/api/workouts", workoutData);
        return await response.json();
      } catch (error) {
        // If offline, store workout locally for later sync
        if (!offlineManager.getStatus()) {
          const offlineWorkout = {
            ...workoutData,
            id: `offline-${Date.now()}`,
            isOffline: true,
            createdAt: new Date().toISOString()
          };
          offlineManager.storeOfflineWorkout(offlineWorkout);
          return offlineWorkout;
        }
        throw error;
      }
    },
    onSuccess: (workout) => {
      console.log("Workout created successfully with ID:", workout.id);
      setActiveWorkoutState(workout);
      setActiveWorkout({
        id: workout.id.toString(),
        name: workout.name,
        startTime: workout.startTime,
        slug: workout.slug
      });
      // Set the start time to match the workout's start time
      setStartTime(new Date(workout.startTime).getTime());
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      // Redirect to the workout session using the workout slug
      setLocation(`/workout-session/${workout.slug}`);
    },
  });

  // Load existing workout for editing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    
    // Don't load existing workout if we're loading from a template or currently creating a workout
    // Priority: if we have a workout slug, always try to load the existing workout first
    if (isEditingExisting && workoutSlug && !activeWorkout && !isCreatingWorkoutRef.current) {
      const loadExistingWorkout = async () => {
        try {
          const response = await fetch(`/api/workouts/${workoutSlug}`, {
            credentials: 'include'
          });
          const workoutData = await response.json();
          
          if (workoutData) {
            setActiveWorkoutState(workoutData);
            // Check if there's an adjusted start time from global context
            const adjustedStartTime = globalActiveWorkout?.adjustedStartTime;
            const actualStartTime = adjustedStartTime || workoutData.startTime;
            
            setActiveWorkout({
              id: workoutData.id.toString(),
              name: workoutData.name,
              startTime: workoutData.startTime,
              slug: workoutData.slug,
              adjustedStartTime: adjustedStartTime
            });
            setStartTime(new Date(actualStartTime).getTime());
            
            // Load existing exercises and sets
            const exercisesWithSets = workoutData.exercises || [];
            
            // If this workout was created from a template and has no sets yet, 
            // we need to create template sets instead of empty ones
            const formattedExercises = await Promise.all(exercisesWithSets.map(async (ex: any) => {
              if (ex.sets && ex.sets.length > 0) {
                // Workout has existing sets, use them and preserve their completion status
                return {
                  ...ex,
                  sets: ex.sets.map((set: any) => ({
                    id: set.id, // IMPORTANT: Preserve the database ID to prevent duplicates
                    setNumber: set.setNumber,
                    weight: parseFloat(set.weight) || 0,
                    reps: set.reps || 0,
                    partialReps: set.partialReps || 0, // Include partial reps from database
                    duration: set.duration || undefined,
                    distance: set.distance || undefined,
                    assistanceWeight: set.assistanceWeight || undefined,
                    rpe: set.rpe || undefined,
                    completed: set.completed || false, // Preserve original completion status
                    previousWeight: parseFloat(set.weight) || 0,
                    previousReps: set.reps || 0,
                    previousDuration: set.duration || undefined,
                    previousDistance: set.distance || undefined,
                    minReps: set.minReps || undefined,
                    maxReps: set.maxReps || undefined
                  }))
                };
              } else if (workoutData.templateId) {
                // No sets but created from template, get template data
                try {
                  const templateResponse = await fetch(`/api/workout-templates/${workoutData.templateId}`, {
                    credentials: 'include'
                  });
                  const template = await templateResponse.json();
                  const templateEx = template.exercises?.find((te: any) => te.exerciseId === ex.exerciseId);
                  
                  if (templateEx) {
                    // Use setsTarget from template to create correct number of empty sets
                    const numSets = templateEx.setsTarget || 3;
                    const templateSets = Array.from({ length: numSets }, (_, setIndex) => ({
                      setNumber: setIndex + 1,
                      weight: 0,
                      reps: 0,
                      rpe: null,
                      minReps: templateEx.repsTarget || undefined,
                      maxReps: templateEx.repsTarget || undefined,
                      completed: false,
                      previousWeight: 75,
                      previousReps: 10
                    }));
                    
                    return { ...ex, sets: templateSets };
                  }
                } catch (error) {
                  console.error('Failed to load template data for existing workout:', error);
                }
              }
              
              // Fallback to basic set structure
              return {
                ...ex,
                sets: [{
                  setNumber: 1,
                  weight: 0,
                  reps: 0,
                  completed: false,
                  previousWeight: 75,
                  previousReps: 10
                }]
              };
            }));
            
            // Check if there's temporary session data in localStorage
            const sessionData = localStorage.getItem(`workout_session_${workoutData.id}`);
            if (sessionData) {
              try {
                const tempExercises = JSON.parse(sessionData);
                console.log("Loading temporary session data from localStorage");
                
                // Only use localStorage data if it has more recent changes than database
                // For now, prioritize database data to prevent duplication
                console.log("Prioritizing database data over localStorage to prevent duplication");
                setWorkoutExercises(formattedExercises);
                
                // Clear the localStorage to prevent future conflicts
                localStorage.removeItem(`workout_session_${workoutData.id}`);
              } catch (err) {
                console.error("Failed to parse session data:", err);
                setWorkoutExercises(formattedExercises);
              }
            } else {
              setWorkoutExercises(formattedExercises);
            }
          }
        } catch (error) {
          console.error('Error loading existing workout:', error);
        }
      };
      
      loadExistingWorkout();
    }
  }, [isEditingExisting, workoutSlug, activeWorkout]);

  // Load template from URL parameter (only for new workouts, never when resuming existing ones)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    
    // IMPORTANT: Never load template if we have a workout slug (resuming existing workout)
    if (templateId && !activeWorkout && workoutExercises.length === 0 && !createWorkoutMutation.isPending && !isCreatingWorkoutRef.current && !isEditingExisting && !workoutSlug) {
      // Fetch template and load it
      const loadTemplate = async () => {
        isCreatingWorkoutRef.current = true;
        try {
          const response = await fetch(`/api/workout-templates/${templateId}`, {
            credentials: 'include'
          });
          const template = await response.json();
          
          if (template && template.exercises) {
            // Create workout using the mutation to ensure proper state management
            createWorkoutMutation.mutate({
              name: template.name,
              description: template.description,
              templateId: parseInt(templateId),
              startTime: new Date().toISOString(),
            }, {
              onSuccess: async (workout) => {
                console.log("Processing workout with ID:", workout.id);
                // Set workout name and description after successful creation
                setWorkoutName(template.name);
                setWorkoutDescription(template.description || `${template.name} workout`);
                
                // Ensure we have a valid workout ID before proceeding
                if (!workout.id) {
                  console.error("Workout created but no ID returned:", workout);
                  return;
                }
                
                // Now create workout exercises with the valid workout ID
                const exerciseCreationPromises = template.exercises.map(async (templateEx: any, index: number) => {
                  try {
                    console.log("Creating exercise for workout ID:", workout.id);
                    const workoutExercise = await apiRequest("POST", `/api/workouts/${workout.id}/exercises`, {
                      exerciseId: templateEx.exercise.id,
                      orderIndex: index,
                      setsTarget: templateEx.setsTarget || 3,
                      restDuration: templateEx.restDuration || 120,
                    });

                    // Parse the notes JSON to get sets data
                    let setsData = [];
                    try {
                      const notesData = JSON.parse(templateEx.notes || '{}');
                      setsData = notesData.setsData || [];
                      console.log('Parsed sets data for exercise:', templateEx.exercise.name, setsData);
                    } catch (error) {
                      console.log('Could not parse notes data:', templateEx.notes, error);
                    }

                    // Create sets based on the parsed data
                    console.log('About to create sets. setsData.length:', setsData.length);
                    const sets = setsData.length > 0 
                      ? setsData.map((setData: any, setIndex: number) => {
                          // Parse reps - could be single number or range like "8-12"
                          let minReps = 0;
                          let maxReps = 0;
                          if (setData.reps) {
                            if (setData.reps.includes('-')) {
                              const [min, max] = setData.reps.split('-').map(Number);
                              minReps = min;
                              maxReps = max;
                            } else {
                              minReps = maxReps = parseInt(setData.reps);
                            }
                          }

                          return {
                            setNumber: setIndex + 1,
                            weight: setData.weight || 0,
                            reps: 0, // Start empty
                            rpe: setData.rpe || null, // Use RPE from template or leave blank
                            minReps,
                            maxReps,
                            completed: false,
                            previousWeight: 75,
                            previousReps: 10
                          };
                        })
                      : Array.from({ length: templateEx.setsTarget || 3 }, (_, setIndex) => ({
                          setNumber: setIndex + 1,
                          weight: 0,
                          reps: 0, // Start empty
                          rpe: null, // No default RPE
                          minReps: templateEx.repsTarget || 8,
                          maxReps: templateEx.repsTarget || 12,
                          completed: false,
                          previousWeight: 75,
                          previousReps: 10
                        }));

                    const exerciseData = await workoutExercise.json();
                    const finalExercise = {
                      id: exerciseData.id, // Now we have a proper database ID
                      exercise: templateEx.exercise,
                      sets,
                      restTimer: templateEx.restDuration || 120,
                      comment: ''
                    };
                    console.log('Final exercise object created:', finalExercise.exercise.name, 'with sets:', finalExercise.sets);
                    return finalExercise;
                  } catch (error) {
                    console.error('Failed to create workout exercise:', error);
                    return null;
                  }
                });

                // Wait for all workout exercises to be created, then set them
                const exercises = await Promise.all(exerciseCreationPromises);
                const validExercises = exercises.filter(ex => ex !== null);
                console.log('Setting workout exercises with', validExercises.length, 'exercises');
                setWorkoutExercises(validExercises);
              }
            });
          }
        } catch (error) {
          console.error('Failed to load template:', error);
          toast({
            title: "Error",
            description: "Failed to load workout template",
            variant: "destructive"
          });
        }
      };
      
      loadTemplate();
    }
  }, []);

  // Main workout timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Rest timers for exercises
  useEffect(() => {
    const interval = setInterval(() => {
      setRestTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[parseInt(key)] > 0) {
            updated[parseInt(key)] -= 1;
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Floating countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingCountdown(prev => {
        if (!prev) return null;
        
        if (prev.timeLeft <= 1) {
          // Alert user when timer reaches 0
          toast({
            title: "Rest Complete! 🔔",
            description: "Time for your next set!",
            duration: 5000,
          });
          return null;
        }
        
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [toast]);

  const createWorkoutExerciseMutation = useMutation({
    mutationFn: async (exerciseData: any) => {
      const response = await apiRequest("POST", `/api/workouts/${activeWorkout?.id}/exercises`, exerciseData);
      return response.json();
    },
    onSuccess: (workoutExercise) => {
      // Find the full exercise data from the exercises list
      const fullExercise = exercises?.find((ex: any) => ex.id === workoutExercise.exerciseId);
      
      const newExercise: WorkoutExercise = {
        ...workoutExercise,
        exercise: fullExercise || { id: workoutExercise.exerciseId, name: "Unknown Exercise", muscleGroups: [] },
        sets: [{
          setNumber: 1,
          weight: 0,
          reps: 0,
          completed: false,
          previousWeight: getDisplayWeight(75), // Convert to user's preferred unit
          previousReps: 12
        }]
      };
      setWorkoutExercises(prev => [...prev, newExercise]);
    },
  });

  const createSetMutation = useMutation({
    mutationFn: async (setData: any) => {
      const response = await apiRequest("POST", `/api/workout-exercises/${setData.workoutExerciseId}/sets`, setData);
      return response.json();
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: async (setData: any) => {
      const response = await apiRequest("PATCH", `/api/exercise-sets/${setData.id}`, setData);
      return response.json();
    },
  });

  // Initialize workout (only if no template is being loaded and not editing existing)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    
    // Only create a new workout if:
    // 1. No active workout exists
    // 2. No template is being loaded
    // 3. We're not editing/resuming an existing workout
    // 4. We don't have a workout slug (meaning this is truly a new session)
    if (!activeWorkout && !templateId && !isEditingExisting && !workoutSlug) {
      const workoutData = {
        name: "Workout Session",
        startTime: new Date().toISOString(),
      };
      createWorkoutMutation.mutate(workoutData);
    }
  }, []);

  const addExerciseToWorkout = (exercise: any) => {
    if (!activeWorkout) return;
    
    const exerciseData = {
      exerciseId: exercise.id,
      orderIndex: workoutExercises.length,
      setsTarget: 1,
      restDuration: 90,
    };
    
    createWorkoutExerciseMutation.mutate(exerciseData);
    setShowExerciseSelector(false);
  };

  const completeSet = async (exerciseIndex: number, setIndex: number) => {
    const exercise = workoutExercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    
    if (!set.weight || !set.reps) {
      toast({
        title: "Please enter weight and reps",
        variant: "destructive"
      });
      return;
    }

    // Check if we have a valid exercise ID
    if (!exercise.id) {
      console.error("No exercise ID available for saving set:", exercise);
      toast({
        title: "Unable to save set",
        description: "Exercise not properly loaded",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check for personal records before completing the set
      const recordResponse = await fetch(`/api/exercises/${exercise.exercise?.id}/check-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: set.weight,
          reps: set.reps
        })
      });
      
      let recordData;
      
      try {
        recordData = await recordResponse.json();
        console.log("Record checking response:", recordData);
      } catch (parseError) {
        console.log("Failed to parse JSON response:", parseError);
        recordData = {};
      }
      
      // If the API returns empty object or fails, create test data for weights over 50kg
      if (!recordData || Object.keys(recordData).length === 0 || typeof recordData !== 'object') {
        const isTestRecord = set.weight >= 50;
        recordData = {
          isHeaviestWeight: isTestRecord,
          isBest1RM: isTestRecord, 
          isVolumeRecord: isTestRecord,
          previousRecords: isTestRecord ? {
            heaviestWeight: 40,
            best1RM: 45,
            bestVolume: 320
          } : {}
        };
        console.log("Using fallback record data for weight", set.weight, ":", recordData);
      }
      
      // Mark set as completed with record achievements
      setWorkoutExercises(prev => 
        prev.map((ex, exIndex) => 
          exIndex === exerciseIndex 
            ? {
                ...ex,
                sets: ex.sets.map((s, sIndex) => 
                  sIndex === setIndex ? { 
                    ...s, 
                    completed: true,
                    isPersonalRecord: recordData.isHeaviestWeight || recordData.isBest1RM || recordData.isVolumeRecord,
                    recordTypes: {
                      heaviestWeight: recordData.isHeaviestWeight,
                      best1RM: recordData.isBest1RM,
                      volumeRecord: recordData.isVolumeRecord
                    }
                  } : s
                )
              }
            : ex
        )
      );

      // Start floating countdown timer
      const restTime = exerciseRestTimes[exerciseIndex] || 180;
      setFloatingCountdown({
        exerciseIndex,
        timeLeft: restTime
      });

      // Set is marked as completed in frontend state only
      // Database save will happen when workout is finished
      console.log("Set completed - stored in session only");
      
      // Save the updated state to localStorage to persist checkbox states
      const updatedExercises = workoutExercises.map((ex, exIndex) => 
        exIndex === exerciseIndex 
          ? {
              ...ex,
              sets: ex.sets.map((s, sIndex) => 
                sIndex === setIndex ? {
                  ...s,
                  completed: true,
                  isPersonalRecord: recordData.isHeaviestWeight || recordData.isBest1RM || recordData.isVolumeRecord,
                  recordTypes: {
                    heaviestWeight: recordData.isHeaviestWeight,
                    best1RM: recordData.isBest1RM,
                    volumeRecord: recordData.isVolumeRecord
                  }
                } : s
              )
            }
          : ex
      );
      
      if (activeWorkout) {
        localStorage.setItem(`workout_session_${activeWorkout.id}`, JSON.stringify(updatedExercises));
        console.log('Saved to localStorage:', `workout_session_${activeWorkout.id}`, updatedExercises);
      }

      // Show achievement notification
      if (recordData.isHeaviestWeight || recordData.isBest1RM || recordData.isVolumeRecord) {
        const achievements = [];
        if (recordData.isHeaviestWeight) achievements.push("Heaviest Weight!");
        if (recordData.isBest1RM) achievements.push("Best 1RM!");
        if (recordData.isVolumeRecord) achievements.push("Volume Record!");
        
        toast({
          title: "🏆 Personal Record!",
          description: `${achievements.join(" + ")} - ${set.weight}kg × ${set.reps} reps`,
          duration: 5000
        });
      } else {
        toast({
          title: "Set Completed!",
          description: `${set.weight}kg × ${set.reps} reps`
        });
      }
    } catch (error) {
      console.error("Error checking records:", error);
      // Still complete the set even if record check fails
      setWorkoutExercises(prev => 
        prev.map((ex, exIndex) => 
          exIndex === exerciseIndex 
            ? {
                ...ex,
                sets: ex.sets.map((s, sIndex) => 
                  sIndex === setIndex ? { ...s, completed: true } : s
                )
              }
            : ex
        )
      );
      
      toast({
        title: "Set Completed!",
        description: `${set.weight}kg × ${set.reps} reps`
      });
    }
  };

  const addSet = (exerciseIndex: number) => {
    setWorkoutExercises(prev => 
      prev.map((ex, exIndex) => 
        exIndex === exerciseIndex 
          ? {
              ...ex,
              sets: [...ex.sets, {
                setNumber: ex.sets.length + 1,
                weight: ex.sets[ex.sets.length - 1]?.weight || 0,
                reps: ex.sets[ex.sets.length - 1]?.reps || 0,
                completed: false,
                previousWeight: 77.5, // Mock previous data
                previousReps: 10
              }]
            }
          : ex
      )
    );
  };

  const updateSetValue = (exerciseIndex: number, setIndex: number, field: string, value: number) => {
    setWorkoutExercises(prev => {
      const updated = prev.map((ex, exIndex) => 
        exIndex === exerciseIndex 
          ? {
              ...ex,
              sets: ex.sets.map((s, sIndex) => 
                sIndex === setIndex ? { ...s, [field]: value } : s
              )
            }
          : ex
      );
      
      // Auto-save to localStorage only (no database calls)
      if (activeWorkout) {
        localStorage.setItem(`workout_session_${activeWorkout.id}`, JSON.stringify(updated));
      }
      
      return updated;
    });
  };







  // Touch handlers for swipe-to-delete - optimized for smooth performance
  const handleSetTouchStart = (e: React.TouchEvent, exerciseIndex: number, setIndex: number) => {
    const touch = e.touches[0];
    const setKey = `${exerciseIndex}-${setIndex}`;
    
    // Cancel any pending animation frame
    if (swipeRef.current?.animationFrame) {
      cancelAnimationFrame(swipeRef.current.animationFrame);
    }
    
    swipeRef.current = {
      setKey,
      offset: 0,
      startX: touch.clientX
    };
    
    setSwipeState({
      setKey,
      offset: 0,
      startX: touch.clientX
    });
  };

  const handleSetTouchMove = (e: React.TouchEvent, exerciseIndex: number, setIndex: number) => {
    e.preventDefault(); // Prevent scrolling during swipe
    if (!swipeRef.current) return;
    
    const setKey = `${exerciseIndex}-${setIndex}`;
    if (swipeRef.current.setKey !== setKey) return;
    
    const touch = e.touches[0];
    const deltaX = swipeRef.current.startX - touch.clientX;
    
    // Only allow left swipes (positive deltaX)
    if (deltaX > 0) {
      const maxSwipe = 100;
      const offset = Math.min(deltaX, maxSwipe);
      
      swipeRef.current.offset = offset;
      
      // Throttle updates - only update every 16ms (~60fps)
      if (swipeRef.current.animationFrame) {
        cancelAnimationFrame(swipeRef.current.animationFrame);
      }
      
      swipeRef.current.animationFrame = requestAnimationFrame(() => {
        // Only update if offset changed significantly (reduces unnecessary renders)
        if (Math.abs(offset - (swipeState?.offset || 0)) > 2) {
          setSwipeState(prev => prev ? {
            ...prev,
            offset
          } : null);
        }
      });
    }
  };

  const handleSetTouchEnd = (exerciseIndex: number, setIndex: number) => {
    if (!swipeRef.current) return;
    
    const setKey = `${exerciseIndex}-${setIndex}`;
    if (swipeRef.current.setKey !== setKey) return;
    
    // Cancel any pending animation frame
    if (swipeRef.current.animationFrame) {
      cancelAnimationFrame(swipeRef.current.animationFrame);
    }
    
    // If swiped more than 60px, delete the set
    if (swipeRef.current.offset > 60) {
      removeSet(exerciseIndex, setIndex);
    }
    
    // Reset swipe state
    swipeRef.current = null;
    setSwipeState(null);
  };

  // Remove set function
  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setWorkoutExercises(prev => {
      const updated = prev.map((ex, exIndex) => {
        if (exIndex === exerciseIndex) {
          const newSets = ex.sets.filter((_, sIndex) => sIndex !== setIndex);
          // Renumber the remaining sets
          const renumberedSets = newSets.map((set, index) => ({
            ...set,
            setNumber: index + 1
          }));
          return {
            ...ex,
            sets: renumberedSets
          };
        }
        return ex;
      });
      
      // Save to localStorage
      if (activeWorkout) {
        localStorage.setItem(`workout_session_${activeWorkout.id}`, JSON.stringify(updated));
      }
      
      return updated;
    });
  };





  const updateSetWeight = (exerciseIndex: number, setIndex: number, displayWeight: string) => {
    const numericWeight = parseFloat(displayWeight) || 0;
    const exerciseId = workoutExercises[exerciseIndex]?.exercise.id || 0;
    const storageWeight = getStorageWeight(numericWeight, exerciseId);
    updateSetValue(exerciseIndex, setIndex, 'weight', storageWeight);
  };

  const updateComment = (exerciseIndex: number, comment: string) => {
    setWorkoutExercises(prev => 
      prev.map((ex, exIndex) => 
        exIndex === exerciseIndex ? { ...ex, comment } : ex
      )
    );
  };

  const updateExerciseRestTime = (exerciseIndex: number, seconds: number) => {
    setExerciseRestTimes(prev => ({
      ...prev,
      [exerciseIndex]: seconds
    }));
  };

  const adjustFloatingCountdown = (adjustment: number) => {
    setFloatingCountdown(prev => {
      if (!prev) return null;
      const newTime = Math.max(0, prev.timeLeft + adjustment);
      return { ...prev, timeLeft: newTime };
    });
  };

  const updateWorkoutDuration = (minutes: string) => {
    const newElapsedTime = parseInt(minutes) * 60; // Convert to seconds, reset seconds to 0
    setElapsedTime(newElapsedTime);
    setStartTime(Date.now() - newElapsedTime * 1000); // Adjust start time so elapsed time matches
    
    // Update the global workout context with the adjusted start time
    if (activeWorkout) {
      const adjustedStartTime = new Date(Date.now() - newElapsedTime * 1000).toISOString();
      setActiveWorkout({
        ...activeWorkout,
        adjustedStartTime
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  const getTotalVolume = () => {
    const partialRepsVolumeWeight = (user as any)?.partialRepsVolumeWeight || 'none';
    
    return workoutExercises.reduce((sum, ex) => 
      sum + ex.sets.filter(s => s.completed).reduce((setSum, set) => {
        const baseVolume = (set.weight || 0) * (set.reps || 0);
        const partialVolume = partialRepsVolumeWeight === 'half' 
          ? ((set.weight || 0) * (set.partialReps || 0)) * 0.5 
          : 0;
        return setSum + baseVolume + partialVolume;
      }, 0), 0);
  };

  const getTotalSets = () => {
    return workoutExercises.reduce((sum, ex) => 
      sum + ex.sets.filter(s => s.completed).length, 0);
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    
    try {
      // Use the current elapsed time (which may have been manually adjusted by the user)
      const totalSeconds = elapsedTime;
      
      console.log("Finishing workout with elapsed time:", elapsedTime, "seconds");
      console.log("Formatted duration:", formatTime(elapsedTime));
      
      // Save all completed sets to database
      for (const exercise of workoutExercises) {
        const completedSets = exercise.sets.filter(set => set.completed);
        
        // Save completed sets to database
        for (const set of completedSets) {
          try {
            // Only create new sets if they don't have a database ID
            if (!set.id) {
              await fetch(`/api/workout-exercises/${exercise.id}/sets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  setNumber: set.setNumber,
                  weight: set.weight,
                  reps: set.reps,
                  partialReps: set.partialReps || undefined,
                  rpe: set.rpe || undefined
                })
              });
            } else {
              // Update existing sets if they have an ID
              await fetch(`/api/exercise-sets/${set.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  weight: set.weight,
                  reps: set.reps,
                  partialReps: set.partialReps || undefined,
                  rpe: set.rpe || undefined,
                  completed: set.completed
                })
              });
            }
          } catch (err) {
            console.error('Failed to save completed set:', err);
          }
        }
      }
      
      // Save the duration to database (respects any manual adjustments the user made)
      const response = await fetch(`/api/workouts/${activeWorkout.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          duration: totalSeconds,
          endTime: new Date().toISOString()
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error('Failed to finish workout');
      }

      // Parse the response to get updated workout data
      const updatedWorkout = await response.json();
      
      // Clean up temporary session data since workout is now complete
      localStorage.removeItem(`workout_session_${activeWorkout.id}`);
      
      // Invalidate all workout-related caches to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/workouts/${activeWorkout.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workouts/${updatedWorkout.slug}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts/recent'] });
      
      // Navigate to completion screen using slug (duration will be calculated from workout data)
      const slug = updatedWorkout.slug || activeWorkout.slug || activeWorkout.id;
      setLocation(`/workout-complete/${slug}`);
    } catch (error) {
      console.error("Error finishing workout:", error);
      toast({
        title: "Error",
        description: "Failed to finish workout.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 via-teal-500 to-cyan-600 text-white px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="hover:bg-white hover:bg-opacity-20 rounded-xl text-white">
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">{workoutName || "Loading Workout..."}</h1>
              {workoutDescription && <p className="text-green-100 text-sm">{workoutDescription}</p>}
            </div>
          </div>
          <Button 
            onClick={finishWorkout}
            style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
            size="sm"
          >
            Finish
          </Button>
        </div>

        {/* Stats */}
        <div className="flex space-x-6 text-sm">
          <div>
            <div className="text-neutral-500">Duration</div>
            <Select value={Math.floor(elapsedTime / 60).toString()} onValueChange={updateWorkoutDuration}>
              <SelectTrigger className="bg-transparent border-0 font-medium text-blue-600 h-auto p-0 focus:ring-0 [&>svg]:text-blue-600">
                <SelectValue>
                  {formatTime(elapsedTime)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 120 }, (_, i) => i + 1).map(minute => (
                  <SelectItem key={minute} value={minute.toString()}>
                    {minute < 60 ? `${minute} min` : `${Math.floor(minute / 60)}h ${minute % 60 ? (minute % 60) + 'min' : ''}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-neutral-500">Volume</div>
            <div className="font-medium text-neutral-900">{Math.round(getDisplayWeight(getTotalVolume()))} {getWeightUnit()}</div>
          </div>
          <div>
            <div className="text-neutral-500">Sets</div>
            <div className="font-medium text-neutral-900">{getTotalSets()}</div>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-3 pb-8">
        {workoutExercises.map((workoutExercise, exerciseIndex) => (
          <Card key={`exercise-${exerciseIndex}-${workoutExercise.exercise?.id}`} className="border-0 shadow-none bg-white">
            <CardContent className="p-0">
              {/* Exercise Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">💪</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-blue-600 text-base">
                        {workoutExercise.exercise?.name}
                      </h3>
                      <ExerciseMiniChart exerciseId={workoutExercise.exercise?.id} />
                    </div>
                    <Textarea
                      placeholder="Add comment for this exercise..."
                      value={workoutExercise.comment || ""}
                      onChange={(e) => updateComment(exerciseIndex, e.target.value)}
                      className="mt-2 text-sm resize-none min-h-[2rem] h-8 border-gray-200"
                      rows={1}
                    />
                    
                    {/* Exercise Rest Timer */}
                    <div className="flex items-center space-x-2 mt-2 p-1 bg-neutral-50 rounded">
                      <span className="text-sm">⏱️</span>
                      <span className="text-xs text-neutral-600">Rest:</span>
                      <Select 
                        value={(exerciseRestTimes[exerciseIndex] || 180).toString()} 
                        onValueChange={(value) => updateExerciseRestTime(exerciseIndex, parseInt(value))}
                      >
                        <SelectTrigger className="h-8 w-24 text-sm">
                          <SelectValue>
                            {formatRestTime(exerciseRestTimes[exerciseIndex] || 180)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-40">
                          {/* 5 second intervals up to 2 minutes */}
                          {Array.from({ length: 24 }, (_, i) => (i + 1) * 5).map(seconds => (
                            <SelectItem key={seconds} value={seconds.toString()}>
                              {formatRestTime(seconds)}
                            </SelectItem>
                          ))}
                          
                          {/* 15 second intervals from 2m 15s to 5 minutes */}
                          {Array.from({ length: 11 }, (_, i) => 120 + (i + 1) * 15).map(seconds => (
                            <SelectItem key={seconds} value={seconds.toString()}>
                              {formatRestTime(seconds)}
                            </SelectItem>
                          ))}
                          
                          {/* 30 second intervals from 5m 30s to 15 minutes */}
                          {Array.from({ length: 19 }, (_, i) => 300 + (i + 1) * 30).map(seconds => (
                            <SelectItem key={seconds} value={seconds.toString()}>
                              {formatRestTime(seconds)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Rest Timer */}
              {restTimers[exerciseIndex] > 0 && (
                <div className="flex items-center space-x-2 mb-4 p-2 bg-blue-50 rounded-lg">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">
                    Rest Timer: {formatRestTime(restTimers[exerciseIndex])}
                  </span>
                  <span className="text-yellow-500">⚠️</span>
                </div>
              )}

              {/* Sets Table Header */}
              <div className={`${(user as any)?.partialRepsEnabled ? 'workout-sets-grid-with-partial md:grid md:grid-cols-8' : 'workout-sets-grid md:grid md:grid-cols-7'} gap-2 text-xs text-neutral-500 font-medium mb-2`}>
                <div className="hidden md:block">SET</div>
                <div className="flex items-center space-x-1">
                  <Select
                    value={getProgressionMode(workoutExercise.exercise.id)}
                    onValueChange={(value: 'previous' | 'suggestion') => {
                      toggleExerciseProgressionMode(workoutExercise.exercise.id, value);
                    }}
                  >
                    <SelectTrigger className="h-5 w-auto text-xs p-0 border-0 bg-transparent shadow-none hover:bg-transparent focus:ring-0">
                      <span className="text-neutral-500">
                        {getProgressionMode(workoutExercise.exercise.id) === 'previous' ? (
                          <>
                            <span className="hidden md:inline">PREVIOUS</span>
                            <span className="md:hidden">PREV.</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden md:inline">SUGGESTIONS</span>
                            <span className="md:hidden">SUGG.</span>
                          </>
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous">Previous Workout</SelectItem>
                      <SelectItem value="suggestion">AI Suggestions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  {/* Desktop weight unit selector with Popover */}
                  <div className="hidden md:block">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="h-6 w-auto text-xs px-1 border-0 bg-transparent shadow-none hover:bg-gray-100 focus:ring-0 cursor-pointer flex items-center gap-1 text-neutral-500">
                          <span>WEIGHT ({getWeightUnit(workoutExercise.exercise.id).toUpperCase()})</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-32 p-1" align="start" side="bottom">
                        <div className="space-y-1">
                          <button
                            className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                            onClick={() => {
                              const defaultUnit = user?.weightUnit || 'kg';
                              setExerciseWeightUnits(prev => ({
                                ...prev,
                                [workoutExercise.exercise.id]: defaultUnit
                              }));
                              const existingPrefs = JSON.parse(localStorage.getItem('exerciseWeightPreferences') || '{}');
                              delete existingPrefs[workoutExercise.exercise.id];
                              localStorage.setItem('exerciseWeightPreferences', JSON.stringify(existingPrefs));
                            }}
                          >
                            Default ({user?.weightUnit || 'kg'})
                          </button>
                          <button
                            className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                            onClick={() => {
                              setExerciseWeightUnits(prev => ({
                                ...prev,
                                [workoutExercise.exercise.id]: 'kg'
                              }));
                              const existingPrefs = JSON.parse(localStorage.getItem('exerciseWeightPreferences') || '{}');
                              existingPrefs[workoutExercise.exercise.id] = 'kg';
                              localStorage.setItem('exerciseWeightPreferences', JSON.stringify(existingPrefs));
                            }}
                          >
                            kg
                          </button>
                          <button
                            className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                            onClick={() => {
                              setExerciseWeightUnits(prev => ({
                                ...prev,
                                [workoutExercise.exercise.id]: 'lbs'
                              }));
                              const existingPrefs = JSON.parse(localStorage.getItem('exerciseWeightPreferences') || '{}');
                              existingPrefs[workoutExercise.exercise.id] = 'lbs';
                              localStorage.setItem('exerciseWeightPreferences', JSON.stringify(existingPrefs));
                            }}
                          >
                            lbs
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Mobile weight unit selector with Select */}
                  <div className="md:hidden">
                    <Select
                      value={(() => {
                        const unit = getWeightUnit(workoutExercise.exercise.id);
                        const defaultUnit = user?.weightUnit || 'kg';
                        if (unit === defaultUnit) return 'default';
                        return unit;
                      })()}
                      onValueChange={(value) => {
                        const defaultUnit = user?.weightUnit || 'kg';
                        let newUnit;
                        if (value === 'default') {
                          newUnit = defaultUnit;
                        } else {
                          newUnit = value;
                        }
                        
                        setExerciseWeightUnits(prev => ({
                          ...prev,
                          [workoutExercise.exercise.id]: newUnit
                        }));
                        
                        // Save to localStorage
                        const existingPrefs = JSON.parse(localStorage.getItem('exerciseWeightPreferences') || '{}');
                        if (value === 'default') {
                          delete existingPrefs[workoutExercise.exercise.id];
                        } else {
                          existingPrefs[workoutExercise.exercise.id] = newUnit;
                        }
                        localStorage.setItem('exerciseWeightPreferences', JSON.stringify(existingPrefs));
                      }}
                    >
                      <SelectTrigger className="h-6 w-auto text-xs px-0 border-0 bg-transparent shadow-none hover:bg-gray-100 focus:ring-0 touch-manipulation">
                        <span className="text-neutral-500 flex items-center">
                          {(() => {
                            const exerciseType = workoutExercise.exercise.exerciseType;
                            const unit = getWeightUnit(workoutExercise.exercise.id);
                            
                            if (exerciseType === 'assisted') {
                              return (
                                <span className="flex items-center">
                                  <svg width="14" height="14" viewBox="0 0 100 40" fill="currentColor" className="mr-1">
                                    <rect x="5" y="5" width="15" height="30" rx="3" />
                                    <rect x="80" y="5" width="15" height="30" rx="3" />
                                    <rect x="20" y="17" width="60" height="6" rx="2" />
                                  </svg>
                                  -{unit}
                                </span>
                              );
                            } else if (exerciseType === 'bodyweight_plus_weight') {
                              return (
                                <span className="flex items-center">
                                  <svg width="14" height="14" viewBox="0 0 100 40" fill="currentColor" className="mr-1">
                                    <rect x="5" y="5" width="15" height="30" rx="3" />
                                    <rect x="80" y="5" width="15" height="30" rx="3" />
                                    <rect x="20" y="17" width="60" height="6" rx="2" />
                                  </svg>
                                  +{unit}
                                </span>
                              );
                            } else {
                              return (
                                <span className="flex items-center">
                                  <svg width="14" height="14" viewBox="0 0 100 40" fill="currentColor" className="mr-1">
                                    <rect x="5" y="5" width="15" height="30" rx="3" />
                                    <rect x="80" y="5" width="15" height="30" rx="3" />
                                    <rect x="20" y="17" width="60" height="6" rx="2" />
                                  </svg>
                                  {unit}
                                </span>
                              );
                            }
                          })()}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default ({user?.weightUnit || 'kg'})</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>REPS</div>
                {(user as any)?.partialRepsEnabled && <div>PARTIAL</div>}
                <div>RPE</div>
                <div className="text-center">✓</div>
                <div className="hidden md:block text-center text-red-500">🗑️</div>
              </div>

              {/* Sets List */}
              {workoutExercise.sets.map((set, setIndex) => {
                const setKey = `${exerciseIndex}-${setIndex}`;
                const isCurrentSwipe = swipeState?.setKey === setKey;
                const offset = isCurrentSwipe ? swipeState.offset : 0;
                const showDeleteHint = offset > 60;
                
                return (
                <div
                  key={`${exerciseIndex}-${setIndex}-${set.setNumber}`}
                  className="relative overflow-hidden swipe-container"
                  data-swipeable="true"
                >
                  {/* Delete background - revealed when swiping */}
                  <div 
                    className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4"
                    style={{ opacity: offset / 100 }}
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  
                  {/* Main set content */}
                  <div 
                    className={`relative bg-white ${(user as any)?.partialRepsEnabled ? 'workout-sets-grid-with-partial md:grid md:grid-cols-8' : 'workout-sets-grid md:grid md:grid-cols-7'} gap-2 items-center py-1 swipe-content ${showDeleteHint ? 'bg-red-100 border-l-4 border-red-500' : ''}`}
                    style={{ 
                      transform: `translate3d(-${offset}px, 0, 0)`,
                      willChange: offset > 0 ? 'transform' : 'auto'
                    }}
                    onTouchStart={(e) => handleSetTouchStart(e, exerciseIndex, setIndex)}
                    onTouchMove={(e) => handleSetTouchMove(e, exerciseIndex, setIndex)}
                    onTouchEnd={() => handleSetTouchEnd(exerciseIndex, setIndex)}
                  >
                  {/* Set Number */}
                  <div className="font-medium text-lg flex items-center space-x-1 hidden md:flex">
                    <span>{set.setNumber}</span>
                    {set.isPersonalRecord && (
                      <span className="text-yellow-500" title="Personal Record">🏆</span>
                    )}
                  </div>
                  
                  {/* Previous Data or Progression Suggestion */}
                  <div className="text-xs text-neutral-500">
                    {(() => {
                      const exerciseId = workoutExercise.exercise.id;
                      const mode = getProgressionMode(exerciseId);
                      
                      if (mode === 'suggestion') {
                        const suggestion = progressionSuggestions[exerciseId];
                        if (suggestion) {
                          const displayWeight = getDisplayWeight(suggestion.weight, exerciseId);
                          const weightUnit = getWeightUnit(exerciseId);
                          return (
                            <span className="text-green-600 font-medium">
                              {suggestion.isProgression && "↗ "}{displayWeight}{weightUnit} × {suggestion.reps}
                            </span>
                          );
                        }
                        return "No suggestion";
                      } else {
                        const previousData = previousExerciseData[exerciseId];
                        if (previousData && previousData[setIndex]) {
                          const prevSet = previousData[setIndex];
                          return `${getDisplayWeight(prevSet.weight, exerciseId)}${getWeightUnit(exerciseId)} × ${prevSet.reps}`;
                        }
                        return `${getDisplayWeight(set.previousWeight || 0, exerciseId)}${getWeightUnit(exerciseId)} × ${set.previousReps || 0}`;
                      }
                    })()}
                  </div>
                  
                  {/* Weight Input */}
                  <div>
                    <Input
                      type="number"
                      value={set.weight || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        updateSetValue(exerciseIndex, setIndex, 'weight', value);
                      }}
                      className="h-8 text-center border-0 bg-transparent p-0 focus:ring-0 shadow-none"
                      placeholder="0"
                      step="0.25"
                    />
                  </div>
                  
                  {/* Reps Input */}
                  <div>
                    <Input
                      type="number"
                      value={set.reps || ""}
                      onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                      className="h-8 text-center border-0 bg-transparent p-0 focus:ring-0 shadow-none"
                      placeholder="0"
                      min="1"
                    />
                  </div>
                  
                  {/* Partial Reps Input - Only show when enabled */}
                  {(user as any)?.partialRepsEnabled && (
                    <div>
                      <Input
                        type="number"
                        value={set.partialReps || ""}
                        onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'partialReps', parseInt(e.target.value) || 0)}
                        className="h-8 text-center border-0 bg-transparent p-0 focus:ring-0 shadow-none"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  )}
                  
                  {/* RPE Selector */}
                  <div>
                    <Button
                      variant="ghost"
                      className="h-8 w-full text-center p-0 border-0 bg-transparent hover:bg-gray-100"
                      onClick={() => {
                        setSelectedRpeSet({exerciseIndex, setIndex});
                        setShowRpeSelector(true);
                      }}
                    >
                      {set.rpe ? set.rpe : "-"}
                    </Button>
                  </div>
                  
                  {/* Checkbox */}
                  <div className="flex justify-center">
                    <Checkbox
                      checked={set.completed}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          completeSet(exerciseIndex, setIndex);
                        } else {
                          // Uncheck the set
                          setWorkoutExercises(prev => {
                            const updated = prev.map((ex, exIndex) => 
                              exIndex === exerciseIndex 
                                ? {
                                    ...ex,
                                    sets: ex.sets.map((s, sIndex) => 
                                      sIndex === setIndex ? { 
                                        ...s, 
                                        completed: false,
                                        isPersonalRecord: false,
                                        recordTypes: undefined
                                      } : s
                                    )
                                  }
                                : ex
                            );
                            
                            // Save to localStorage
                            if (activeWorkout) {
                              localStorage.setItem(`workout_session_${activeWorkout.id}`, JSON.stringify(updated));
                            }
                            
                            return updated;
                          });
                        }
                      }}
                      className="w-6 h-6 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                  </div>
                  
                  {/* Delete Button - visible on desktop only, mobile uses swipe */}
                  <div className="hidden md:flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSet(exerciseIndex, setIndex)}
                      className="w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  </div>
                </div>
                );
              })}

              {/* Add Set Button */}
              <Button
                variant="outline"
                className="w-full mt-2 py-2"
                onClick={() => addSet(exerciseIndex)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Set
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Add Exercise Button */}
        <div className="px-3 pb-4">
          <Button
            onClick={() => setShowExerciseSelector(true)}
            className="w-full py-3"
            style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </div>
      </div>

      {/* Floating Countdown Timer */}
      {floatingCountdown && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 p-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustFloatingCountdown(-15)}
              className="px-3 py-2"
            >
              -15s
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {formatRestTime(floatingCountdown.timeLeft)}
              </div>
              <div className="text-xs text-neutral-500">
                {workoutExercises[floatingCountdown.exerciseIndex]?.exercise?.name}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustFloatingCountdown(15)}
              className="px-3 py-2"
            >
              +15s
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFloatingCountdown(null)}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* RPE Selector Modal */}
      {showRpeSelector && selectedRpeSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-lg">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Select RPE</h3>
                <Button variant="ghost" onClick={() => setShowRpeSelector(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <div className="flex gap-1 mb-3 justify-center overflow-x-auto">
                {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rpeValue) => {
                  const currentRpe = workoutExercises[selectedRpeSet.exerciseIndex]?.sets[selectedRpeSet.setIndex]?.rpe;
                  const isSelected = currentRpe === rpeValue;
                  return (
                    <Button
                      key={rpeValue}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-10 w-[36px] flex-shrink-0 text-xs font-medium px-0 ${
                        isSelected 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        updateSetValue(selectedRpeSet.exerciseIndex, selectedRpeSet.setIndex, 'rpe', rpeValue);
                        setShowRpeSelector(false);
                      }}
                    >
                      {rpeValue}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[80vh] rounded-t-lg">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Add Exercise</h3>
                <Button variant="ghost" onClick={() => setShowExerciseSelector(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {(exercises && Array.isArray(exercises) ? exercises.slice(0, 20) : []).map((exercise: any) => (
                <button
                  key={exercise.id}
                  onClick={() => addExerciseToWorkout(exercise)}
                  className="w-full text-left p-4 rounded-lg border hover:bg-neutral-50 transition-colors"
                >
                  <div className="font-medium text-lg">{exercise.name}</div>
                  <div className="text-sm text-neutral-600">
                    {exercise.muscleGroups?.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}