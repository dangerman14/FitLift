import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Check, Play, Pause, SkipForward } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import WorkoutTimer from "@/components/workout-timer";

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: any;
}

export default function WorkoutModal({ isOpen, onClose, template }: WorkoutModalProps) {
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<any[]>([]);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: exercises } = useQuery({
    queryKey: ["/api/exercises"],
    enabled: !template,
  });

  const { data: templateExercises } = useQuery({
    queryKey: [`/api/workout-templates/${template?.id}`],
    enabled: !!template?.id,
  });

  const createWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      const response = await apiRequest("POST", "/api/workouts", workoutData);
      return response.json();
    },
    onSuccess: (workout) => {
      setActiveWorkout(workout);
      if (template && templateExercises?.exercises) {
        setWorkoutExercises(templateExercises.exercises);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
    },
  });

  const createWorkoutExerciseMutation = useMutation({
    mutationFn: async (exerciseData: any) => {
      const response = await apiRequest("POST", `/api/workouts/${activeWorkout?.id}/exercises`, exerciseData);
      return response.json();
    },
    onSuccess: (workoutExercise) => {
      setWorkoutExercises([...workoutExercises, workoutExercise]);
      setCurrentExerciseIndex(workoutExercises.length);
      setSets([]);
    },
  });

  const updateWorkoutMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/workouts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Success",
        description: "Workout completed successfully!",
      });
      onClose();
    },
  });

  const createSetMutation = useMutation({
    mutationFn: async (setData: any) => {
      const response = await apiRequest("POST", `/api/workout-exercises/${setData.workoutExerciseId}/sets`, setData);
      return response.json();
    },
  });

  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const currentExercise = workoutExercises[currentExerciseIndex];

  const startWorkout = () => {
    const workoutData = {
      name: template ? template.name : "Quick Workout",
      templateId: template?.id || null,
      startTime: new Date().toISOString(),
    };
    
    createWorkoutMutation.mutate(workoutData);
  };

  const addExerciseToWorkout = (exercise: any) => {
    if (!activeWorkout) return;
    
    const exerciseData = {
      exerciseId: exercise.id,
      orderIndex: workoutExercises.length,
      setsTarget: 3,
      restDuration: 90,
    };
    
    createWorkoutExerciseMutation.mutate(exerciseData);
  };

  const completeSet = (setData: any) => {
    if (!activeWorkout) return;

    const newSet = {
      ...setData,
      setNumber: sets.length + 1,
      workoutExerciseId: currentExercise?.id, // This would need to be properly managed
    };

    setSets([...sets, newSet]);
    createSetMutation.mutate(newSet);

    // Start rest timer
    setRestTimer(currentExercise?.restDuration || 90);
    setIsResting(true);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setSets([]);
      setIsResting(false);
      setRestTimer(0);
    } else {
      // Reset to exercise selection to add another exercise
      setCurrentExerciseIndex(-1);
      setSets([]);
      setIsResting(false);
      setRestTimer(0);
    }
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;

    const endTime = new Date();
    const startTime = new Date(activeWorkout.startTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    updateWorkoutMutation.mutate({
      id: activeWorkout.id,
      data: {
        endTime: endTime.toISOString(),
        duration,
      },
    });
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const startRestTimer = () => {
    setRestTimer(currentExercise?.restDuration || 90);
    setIsResting(true);
  };

  // Rest timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            toast({
              title: "Rest Complete",
              description: "Time for your next set!",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isResting, restTimer, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {!activeWorkout ? (
          // Pre-workout setup
          <div>
            <DialogHeader>
              <DialogTitle>
                {template ? `Start ${template.name}` : "Quick Workout"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              {template ? (
                <div className="space-y-4">
                  <p className="text-neutral-600">{template.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-neutral-600">
                    <span>Duration: {template.estimatedDuration || 60} min</span>
                    <span>Exercises: {workoutExercises.length}</span>
                  </div>
                  
                  {workoutExercises.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Exercises:</h3>
                      <div className="space-y-2">
                        {workoutExercises.slice(0, 5).map((ex: any, index: number) => (
                          <div key={index} className="text-sm text-neutral-600">
                            {index + 1}. {ex.exercise?.name} - {ex.setsTarget} sets
                          </div>
                        ))}
                        {workoutExercises.length > 5 && (
                          <div className="text-sm text-neutral-500">
                            +{workoutExercises.length - 5} more exercises
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-neutral-600">
                  Start a quick workout session. You can add exercises as you go.
                </p>
              )}
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  onClick={startWorkout}
                  className="flex-1"
                  style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
                  disabled={createWorkoutMutation.isPending}
                >
                  {createWorkoutMutation.isPending ? "Starting..." : "Start Workout"}
                </Button>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Active workout
          <div>
            <DialogHeader>
              <div className="flex justify-between items-center">
                <div>
                  <DialogTitle>{activeWorkout.name}</DialogTitle>
                  <p className="text-sm text-neutral-600">
                    Exercise {currentExerciseIndex + 1} of {workoutExercises.length}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Workout Timer */}
              <div className="flex justify-center mt-3">
                <WorkoutTimer startTime={activeWorkout.startTime} />
              </div>
            </DialogHeader>

            {activeWorkout && (
              <div className="py-4 space-y-6">
                {/* Exercise Selection */}
                {!currentExercise && (
                  <div>
                    <h4 className="text-lg font-medium text-neutral-900 mb-4">Add Exercise</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {exercises?.slice(0, 10).map((exercise: any) => (
                        <button
                          key={exercise.id}
                          onClick={() => addExerciseToWorkout(exercise)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-neutral-50 transition-colors"
                        >
                          <div className="font-medium">{exercise.name}</div>
                          <div className="text-sm text-neutral-600">
                            {exercise.muscleGroups?.join(', ')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Exercise */}
                {currentExercise && (
                  <div className="text-center">
                    <h4 className="text-xl font-medium text-neutral-900 mb-2">
                      {currentExercise.exercise?.name}
                    </h4>
                    <div className="flex justify-center space-x-4 text-sm text-neutral-600">
                      <span>Target: {currentExercise.setsTarget || 3} sets</span>
                      <span>•</span>
                      <span>Rest: {currentExercise.restDuration || 90}s</span>
                    </div>
                  </div>
                )}

                {/* Set Tracking */}
                {currentExercise && (
                  <div>
                    <h5 className="font-medium text-neutral-700 mb-3">Sets</h5>
                    <div className="space-y-3">
                      {Array.from({ length: currentExercise.setsTarget || 3 }).map((_, index) => (
                        <SetInput
                          key={index}
                          setNumber={index + 1}
                          onComplete={completeSet}
                          completed={sets.length > index}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rest Timer */}
                {isResting && (
                  <Card className="bg-warning/10 border border-warning/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-warning font-medium mb-2">Rest Timer</div>
                      <div className="text-3xl font-mono font-bold text-warning mb-3">
                        {formatTime(restTimer)}
                      </div>
                      <div className="flex justify-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={skipRest}
                          className="border-warning text-warning hover:bg-warning/10"
                        >
                          Skip Rest
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {currentExercise ? (
                    <>
                      <Button 
                        onClick={nextExercise}
                        className="flex-1"
                        style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
                      >
                        <SkipForward className="h-4 w-4 mr-1" />
                        {currentExerciseIndex < workoutExercises.length - 1 ? "Next Exercise" : "Add Another Exercise"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={finishWorkout}
                        className="flex-1"
                      >
                        End Workout
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={finishWorkout}
                      className="w-full"
                    >
                      End Workout
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface SetInputProps {
  setNumber: number;
  onComplete: (setData: any) => void;
  completed: boolean;
}

function SetInput({ setNumber, onComplete, completed }: SetInputProps) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");

  const handleComplete = () => {
    if (!weight || !reps) return;
    
    onComplete({
      setNumber,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      rpe: rpe ? parseInt(rpe) : null,
    });
  };

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg ${
      completed ? "bg-secondary-50 border border-secondary-200" : "bg-neutral-50"
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
        completed 
          ? "bg-secondary-500 text-white" 
          : "bg-primary-500 text-white"
      }`}>
        {completed ? <Check className="h-4 w-4" /> : setNumber}
      </div>
      
      <div className="flex-1 grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-neutral-600">Weight (lbs)</Label>
          <Input
            type="number"
            placeholder="185"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={completed}
            className="text-center text-sm"
          />
        </div>
        
        <div>
          <Label className="text-xs text-neutral-600">Reps</Label>
          <Input
            type="number"
            placeholder="10"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            disabled={completed}
            className="text-center text-sm"
          />
        </div>
        
        <div>
          <Label className="text-xs text-neutral-600">RPE</Label>
          <Input
            type="number"
            placeholder="8"
            min="1"
            max="10"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            disabled={completed}
            className="text-center text-sm"
          />
        </div>
      </div>
      
      {!completed && (
        <Button 
          size="sm" 
          onClick={handleComplete}
          disabled={!weight || !reps}
          className="w-8 h-8 p-0 bg-secondary-500 hover:bg-secondary-600"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
