import { useState, useEffect } from "react";
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
  const [, setLocation] = useLocation();
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [restTimers, setRestTimers] = useState<{[key: number]: number}>({});
  const [weightUnitOverride, setWeightUnitOverride] = useState<'default' | 'kg' | 'lbs'>('default');
  const [editWorkoutOpen, setEditWorkoutOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutImageUrl, setWorkoutImageUrl] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

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
      return await apiRequest(`/api/workouts/${activeWorkout?.id}/details`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (updatedWorkout) => {
      setActiveWorkout(updatedWorkout);
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

  // Initialize workout details form when activeWorkout loads
  useEffect(() => {
    if (activeWorkout) {
      setWorkoutName(activeWorkout.name || '');
      setWorkoutDescription(activeWorkout.description || '');
      setWorkoutImageUrl(activeWorkout.imageUrl || '');
    }
  }, [activeWorkout]);

  const { data: exercises } = useQuery({
    queryKey: ["/api/exercises"],
  });

  const createWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      const response = await apiRequest("POST", "/api/workouts", workoutData);
      return response.json();
    },
    onSuccess: (workout) => {
      setActiveWorkout(workout);
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
    },
  });

  // Load template from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    
    if (templateId && !activeWorkout) {
      // Fetch template and load it
      const loadTemplate = async () => {
        try {
          const response = await fetch(`/api/workout-templates/${templateId}`, {
            credentials: 'include'
          });
          const template = await response.json();
          
          if (template && template.exercises) {
            // Create a new workout session based on the template
            createWorkoutMutation.mutate({
              name: template.name,
              description: template.description,
              templateId: parseInt(templateId),
              startTime: new Date().toISOString(),
            });
            
            // Set workout name
            setWorkoutName(template.name);
            setWorkoutDescription(template.description || '');
            
            // Load template exercises with proper reps data parsing
            const templateExercises = template.exercises.map((templateEx: any, index: number) => {
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
                      reps: minReps, // Default to min reps for input
                      minReps,
                      maxReps,
                      completed: false,
                      previousWeight: 0,
                      previousReps: 0
                    };
                  })
                : Array.from({ length: templateEx.setsTarget || 3 }, (_, setIndex) => ({
                    setNumber: setIndex + 1,
                    weight: 0,
                    reps: templateEx.repsTarget || 0,
                    minReps: templateEx.repsTarget || 0,
                    maxReps: templateEx.repsTarget || 0,
                    completed: false,
                    previousWeight: 0,
                    previousReps: 0
                  }));

              return {
                id: null,
                exercise: templateEx.exercise,
                sets,
                restTimer: templateEx.restDuration || 120,
                comment: '' // Start with empty comment for user notes
              };
            });
            
            setWorkoutExercises(templateExercises);
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
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
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

  // Initialize workout (only if no template is being loaded)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    
    if (!activeWorkout && !templateId) {
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

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = workoutExercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    
    if (!set.weight || !set.reps) {
      toast({
        title: "Please enter weight and reps",
        variant: "destructive"
      });
      return;
    }

    // Mark set as completed
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

    // Start rest timer
    setRestTimers(prev => ({
      ...prev,
      [exerciseIndex]: 270 // 4min 30s rest timer
    }));

    // Save to database
    createSetMutation.mutate({
      workoutExerciseId: exercise.id,
      setNumber: set.setNumber,
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe
    });

    toast({
      title: "Set Completed!",
      description: `${set.weight}kg × ${set.reps} reps`
    });
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
      // Update workout with end time using fetch directly
      const response = await fetch(`/api/workouts/${activeWorkout.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          endTime: new Date().toISOString()
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error('Failed to finish workout');
      }

      // Navigate to completion screen
      setLocation(`/workout-complete/${activeWorkout.id}`);
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
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Workout Session</h1>
              <p className="text-green-100">Push your limits today</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-white bg-opacity-20 px-6 py-3 rounded-2xl backdrop-blur-sm">
              <Timer className="h-5 w-5 text-white" />
              <span className="font-bold text-white text-lg">{formatTime(elapsedTime)}</span>
            </div>
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
            <div className="font-medium text-blue-600">{formatTime(elapsedTime)}</div>
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
      <div className="p-4 space-y-4 pb-24">
        {workoutExercises.map((workoutExercise, exerciseIndex) => (
          <Card key={workoutExercise.id} className="shadow-sm">
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
                      className="mt-2 text-sm resize-none"
                      rows={1}
                    />
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
                <div key={setIndex} className="grid grid-cols-6 gap-2 items-center py-2 px-1">
                  <div className="font-medium text-lg">{set.setNumber}</div>
                  
                  <div className="text-sm text-neutral-500">
                    {getDisplayWeight(set.previousWeight || 0)}{getWeightUnit()} x {set.previousReps}
                  </div>
                  
                  <Input
                    type="number"
                    value={set.weight ? getDisplayWeight(set.weight).toString() : ""}
                    onChange={(e) => updateSetWeight(exerciseIndex, setIndex, e.target.value)}
                    className="h-10 text-center font-medium text-lg"
                    placeholder={getWeightUnit() === 'lbs' ? "165" : "75"}
                    disabled={set.completed}
                  />
                  
                  <Input
                    type="number"
                    value={set.completed ? set.reps.toString() : (set.reps > 0 ? set.reps.toString() : "")}
                    onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                    className="h-10 text-center font-medium text-lg"
                    placeholder={formatRepsDisplay(set) || "12"}
                    disabled={set.completed}
                  />
                  
                  <Input
                    type="number"
                    value={set.rpe || ""}
                    onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'rpe', parseInt(e.target.value) || 0)}
                    className="h-10 text-center font-medium text-lg"
                    placeholder="9"
                    min="1"
                    max="10"
                    disabled={set.completed}
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
      </div>

      {/* Fixed Add Exercise Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button
          onClick={() => setShowExerciseSelector(true)}
          className="w-full py-4 text-lg"
          style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Exercise
        </Button>
      </div>

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