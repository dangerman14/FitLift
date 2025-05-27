import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X, Plus, Timer, MoreVertical, Check, Edit3, Camera, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWorkout } from "@/contexts/WorkoutContext";

interface WorkoutExercise {
  id: number;
  exercise: {
    id: number;
    name: string;
    muscleGroups: string[];
  };
  sets: WorkoutSet[];
  restTimer?: number;
  restStartTime?: Date;
  comment?: string;
}

interface WorkoutSet {
  id?: number;
  setNumber: number;
  weight: number;
  reps: number;
  minReps?: number;
  maxReps?: number;
  rpe?: number;
  completed: boolean;
  previousWeight?: number;
  previousReps?: number;
}

export default function WorkoutSession() {
  const [location, setLocation] = useLocation();
  const [activeWorkout, setActiveWorkoutState] = useState<any>(null);
  const { setActiveWorkout, activeWorkout: globalActiveWorkout } = useWorkout();
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
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
  const [restTimers, setRestTimers] = useState<{[key: number]: number}>({});
  const [floatingCountdown, setFloatingCountdown] = useState<{exerciseIndex: number, timeLeft: number} | null>(null);
  const [exerciseRestTimes, setExerciseRestTimes] = useState<{[key: number]: number}>({});
  const [weightUnitOverride, setWeightUnitOverride] = useState<'default' | 'kg' | 'lbs'>('default');
  const [editWorkoutOpen, setEditWorkoutOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutImageUrl, setWorkoutImageUrl] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Timer effect to update elapsed time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Weight unit conversion helpers
  const getWeightUnit = () => {
    if (weightUnitOverride === 'default') {
      return user?.weightUnit || 'kg';
    }
    return weightUnitOverride;
  };
  
  const getDisplayWeight = (weight: number) => {
    if (getWeightUnit() === 'lbs' && weight > 0) {
      return Math.round(weight * 2.20462 * 10) / 10; // Convert kg to lbs
    }
    return weight;
  };
  
  const getStorageWeight = (displayWeight: number) => {
    if (getWeightUnit() === 'lbs' && displayWeight > 0) {
      return Math.round(displayWeight / 2.20462 * 10) / 10; // Convert lbs to kg for storage
    }
    return displayWeight;
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
      const response = await apiRequest("POST", "/api/workouts", workoutData);
      return await response.json();
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
    if (isEditingExisting && workoutSlug && !activeWorkout) {
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
            const formattedExercises = exercisesWithSets.map((ex: any) => ({
              ...ex,
              sets: ex.sets.map((set: any) => ({
                setNumber: set.setNumber,
                weight: set.weight || 0,
                reps: set.reps || 0,
                completed: true, // Mark as completed since it's an existing workout
                previousWeight: set.weight || 0,
                previousReps: set.reps || 0
              }))
            }));
            setWorkoutExercises(formattedExercises);
          }
        } catch (error) {
          console.error('Error loading existing workout:', error);
        }
      };
      
      loadExistingWorkout();
    }
  }, [isEditingExisting, workoutSlug, activeWorkout]);

  // Load template from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    
    if (templateId && !activeWorkout && workoutExercises.length === 0 && !createWorkoutMutation.isPending && !isCreatingWorkoutRef.current && !isEditingExisting) {
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
                    } catch (error) {
                      console.log('Could not parse notes data:', error);
                    }

                    // Create sets based on the parsed data
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
                          minReps: templateEx.repsTarget || 8,
                          maxReps: templateEx.repsTarget || 12,
                          completed: false,
                          previousWeight: 75,
                          previousReps: 10
                        }));

                    const exerciseData = await workoutExercise.json();
                    return {
                      id: exerciseData.id, // Now we have a proper database ID
                      exercise: templateEx.exercise,
                      sets,
                      restTimer: templateEx.restDuration || 120,
                      comment: ''
                    };
                  } catch (error) {
                    console.error('Failed to create workout exercise:', error);
                    return null;
                  }
                });

                // Wait for all workout exercises to be created, then set them
                const exercises = await Promise.all(exerciseCreationPromises);
                const validExercises = exercises.filter(ex => ex !== null);
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
  }, [activeWorkout, createWorkoutMutation]);

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
      
      const recordData = await recordResponse.json();
      console.log("Record checking response:", recordData);
      
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

      // Save to database
      console.log("Saving set for exercise ID:", exercise.id);
      createSetMutation.mutate({
        workoutExerciseId: exercise.id,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe
      });

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
    setWorkoutExercises(prev => 
      prev.map((ex, exIndex) => 
        exIndex === exerciseIndex 
          ? {
              ...ex,
              sets: ex.sets.map((s, sIndex) => 
                sIndex === setIndex ? { ...s, [field]: value } : s
              )
            }
          : ex
      )
    );
  };

  const updateSetWeight = (exerciseIndex: number, setIndex: number, displayWeight: string) => {
    const numericWeight = parseFloat(displayWeight) || 0;
    const storageWeight = getStorageWeight(numericWeight);
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
    return workoutExercises.reduce((sum, ex) => 
      sum + ex.sets.filter(s => s.completed).reduce((setSum, set) => 
        setSum + (set.weight * set.reps), 0), 0);
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
      
      // Invalidate workout cache to ensure fresh data on completion page
      queryClient.invalidateQueries({ queryKey: [`/api/workouts/${activeWorkout.id}`] });
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 via-teal-500 to-cyan-600 text-white px-6 py-6 sticky top-0 z-10 shadow-large">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="hover:bg-white hover:bg-opacity-20 rounded-xl text-white">
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">{workoutName || "Loading Workout..."}</h1>
              {workoutDescription && <p className="text-green-100">{workoutDescription}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={finishWorkout}
              style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
              size="sm"
            >
              Finish
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex space-x-8 mt-3 text-sm">
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
      <div className="p-4 space-y-4 pb-8">
        {workoutExercises.map((workoutExercise, exerciseIndex) => (
          <Card key={`exercise-${exerciseIndex}-${workoutExercise.exercise?.id}`} className="shadow-sm">
            <CardContent className="p-4">
              {/* Exercise Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💪</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-600 text-lg">
                      {workoutExercise.exercise?.name}
                    </h3>
                    <Textarea
                      placeholder="Add comment for this exercise..."
                      value={workoutExercise.comment || ""}
                      onChange={(e) => updateComment(exerciseIndex, e.target.value)}
                      className="mt-2 text-sm resize-none min-h-[2rem] h-8"
                      rows={1}
                    />
                    
                    {/* Exercise Rest Timer */}
                    <div className="flex items-center space-x-2 mt-3 p-2 bg-neutral-50 rounded-lg">
                      <span className="text-lg">⏱️</span>
                      <span className="text-sm text-neutral-600">Rest Timer:</span>
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
              <div className="grid grid-cols-6 gap-2 text-xs text-neutral-500 font-medium mb-2 px-1">
                <div>SET</div>
                <div>PREVIOUS</div>
                <div>
                  <Select value={weightUnitOverride} onValueChange={handleWeightUnitChange}>
                    <SelectTrigger className="h-6 text-xs border-0 shadow-none p-0 bg-transparent hover:bg-blue-50 focus:ring-0">
                      <SelectValue className="text-xs font-medium">
                        {getWeightUnitDisplay()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="min-w-fit">
                      <SelectItem value="default" className="text-xs">
                        {(user?.weightUnit || 'kg').toUpperCase()} (Default)
                      </SelectItem>
                      <SelectItem value="kg" className="text-xs">KG</SelectItem>
                      <SelectItem value="lbs" className="text-xs">LBS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>REPS</div>
                <div>RPE</div>
                <div className="text-center">✓</div>
              </div>

              {/* Sets List */}
              {workoutExercise.sets.map((set, setIndex) => (
                <div key={`${exerciseIndex}-${setIndex}-${set.setNumber}`} className="grid grid-cols-6 gap-2 items-center py-2 px-1">
                  <div className="font-medium text-lg flex items-center space-x-1">
                    {/* Desktop: Trophy next to set number */}
                    <span className="hidden sm:inline">{set.setNumber}</span>
                    {set.isPersonalRecord && (
                      <span 
                        className="text-yellow-500 hidden sm:inline" 
                        title={`Personal Record: ${set.recordTypes?.heaviestWeight ? 'Heaviest Weight' : ''} ${set.recordTypes?.best1RM ? 'Best 1RM' : ''} ${set.recordTypes?.volumeRecord ? 'Volume Record' : ''}`.trim()}
                      >
                        🏆
                      </span>
                    )}
                    
                    {/* Mobile: Replace set number with trophy */}
                    {set.isPersonalRecord ? (
                      <span 
                        className="text-yellow-500 sm:hidden" 
                        title={`Personal Record: ${set.recordTypes?.heaviestWeight ? 'Heaviest Weight' : ''} ${set.recordTypes?.best1RM ? 'Best 1RM' : ''} ${set.recordTypes?.volumeRecord ? 'Volume Record' : ''}`.trim()}
                      >
                        🏆
                      </span>
                    ) : (
                      <span className="sm:hidden">{set.setNumber}</span>
                    )}
                  </div>
                  
                  <div className="text-sm text-neutral-500">
                    {getDisplayWeight(set.previousWeight || 0)}{getWeightUnit()} x {set.previousReps}
                  </div>
                  
                  <Input
                    type="number"
                    value={set.weight || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      updateSetValue(exerciseIndex, setIndex, 'weight', value);
                    }}
                    className="h-10 text-center font-medium text-lg"
                    placeholder={getWeightUnit() === 'lbs' ? "165" : "75"}
                  />
                  
                  <Input
                    type="number"
                    value={set.completed ? set.reps.toString() : (set.reps > 0 ? set.reps.toString() : "")}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateSetValue(exerciseIndex, setIndex, 'reps', value === "" ? 0 : parseInt(value) || 0);
                    }}
                    className="h-10 text-center font-medium text-lg"
                    placeholder={set.minReps && set.maxReps && set.minReps !== set.maxReps ? `${set.minReps}-${set.maxReps}` : (set.maxReps?.toString() || "12")}
                  />
                  
                  <Input
                    type="number"
                    value={set.rpe || ""}
                    onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'rpe', parseInt(e.target.value) || 0)}
                    className="h-10 text-center font-medium text-lg"
                    placeholder="9"
                    min="1"
                    max="10"
                  />
                  
                  <div className="flex justify-center">
                    <Checkbox
                      checked={set.completed}
                      onCheckedChange={() => completeSet(exerciseIndex, setIndex)}
                      className="w-6 h-6 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                  </div>
                </div>
              ))}

              {/* Add Set Button */}
              <Button
                variant="outline"
                className="w-full mt-4 py-3"
                onClick={() => addSet(exerciseIndex)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Set
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Add Exercise Button */}
        <div className="p-4">
          <Button
            onClick={() => setShowExerciseSelector(true)}
            className="w-full py-4 text-lg"
            style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
          >
            <Plus className="h-5 w-5 mr-2" />
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