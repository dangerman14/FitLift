import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Timer, MoreVertical, Check } from "lucide-react";
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

  const toggleWeightUnit = () => {
    const units: ('default' | 'kg' | 'lbs')[] = ['default', 'kg', 'lbs'];
    const currentIndex = units.indexOf(weightUnitOverride);
    const nextIndex = (currentIndex + 1) % units.length;
    setWeightUnitOverride(units[nextIndex]);
  };

  const getWeightUnitDisplay = () => {
    if (weightUnitOverride === 'default') {
      return `${(user?.weightUnit || 'kg').toUpperCase()} (Default)`;
    }
    return weightUnitOverride.toUpperCase();
  };

  const { data: exercises } = useQuery({
    queryKey: ["/api/exercises"],
  });

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

  // Initialize workout
  useEffect(() => {
    if (!activeWorkout) {
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

  const finishWorkout = () => {
    const duration = Math.round(elapsedTime / 60);
    toast({
      title: "Workout Completed!",
      description: `Duration: ${duration}min • ${getTotalSets()} sets • ${Math.round(getTotalVolume())}kg volume`
    });
    setLocation("/");
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
                <div>{getWeightUnit().toUpperCase()}</div>
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
                    value={getDisplayWeight(set.weight || 0) || ""}
                    onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'weight', getStorageWeight(parseFloat(e.target.value) || 0))}
                    className="h-10 text-center font-medium text-lg"
                    placeholder={getWeightUnit() === 'lbs' ? "165" : "75"}
                    disabled={set.completed}
                  />
                  
                  <Input
                    type="number"
                    value={set.reps || ""}
                    onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                    className="h-10 text-center font-medium text-lg"
                    placeholder="12"
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