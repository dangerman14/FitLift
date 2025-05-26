import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Check, Play, Pause, Timer } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WorkoutSession() {
  const [, setLocation] = useLocation();
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(-1);
  const [sets, setSets] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: exercises } = useQuery({
    queryKey: ["/api/exercises"],
  });

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

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
      setWorkoutExercises([...workoutExercises, workoutExercise]);
      setCurrentExerciseIndex(workoutExercises.length);
      setSets([]);
    },
  });

  const createSetMutation = useMutation({
    mutationFn: async (setData: any) => {
      const response = await apiRequest("POST", `/api/workout-exercises/${setData.workoutExerciseId}/sets`, setData);
      return response.json();
    },
  });

  // Initialize workout on page load
  useEffect(() => {
    if (!activeWorkout) {
      const workoutData = {
        name: "Quick Workout",
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
      setsTarget: 3,
      restDuration: 90,
    };
    
    createWorkoutExerciseMutation.mutate(exerciseData);
  };

  const completeSet = (setData: any) => {
    if (!activeWorkout || currentExerciseIndex === -1) return;

    const currentExercise = workoutExercises[currentExerciseIndex];
    const newSet = {
      ...setData,
      setNumber: sets.length + 1,
      workoutExerciseId: currentExercise?.id,
    };

    setSets([...sets, newSet]);
    createSetMutation.mutate(newSet);

    toast({
      title: "Set Completed!",
      description: `${setData.weight}lbs × ${setData.reps} reps`,
    });
  };

  const nextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setSets([]);
    } else {
      // Reset to exercise selection
      setCurrentExerciseIndex(-1);
      setSets([]);
    }
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;

    // Calculate duration in minutes
    const duration = Math.round(elapsedTime / 60);

    toast({
      title: "Workout Completed!",
      description: `Great job! Duration: ${duration} minutes`,
    });

    // Navigate back to dashboard
    setLocation("/");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = currentExerciseIndex >= 0 ? workoutExercises[currentExerciseIndex] : null;

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {activeWorkout?.name || "Loading..."}
            </h1>
            <div className="flex items-center space-x-2 text-neutral-600">
              <Timer className="h-4 w-4" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")}>
            <X className="h-4 w-4 mr-1" />
            Exit
          </Button>
        </div>

        {/* Exercise Selection */}
        {!currentExercise && (
          <Card>
            <CardHeader>
              <CardTitle>Add Exercise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(exercises && Array.isArray(exercises) ? exercises.slice(0, 10) : []).map((exercise: any) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExerciseToWorkout(exercise)}
                    className="w-full text-left p-4 rounded-lg border hover:bg-neutral-50 transition-colors"
                  >
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-sm text-neutral-600">
                      {exercise.muscleGroups?.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Exercise */}
        {currentExercise && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {currentExercise.exercise?.name || "Exercise"}
              </CardTitle>
              <div className="text-center text-sm text-neutral-600">
                Target: {currentExercise.setsTarget || 3} sets • Rest: {currentExercise.restDuration || 90}s
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-medium">Sets ({sets.length}/{currentExercise.setsTarget || 3})</h3>
                
                {/* Completed Sets */}
                {sets.map((set, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Set {set.setNumber}</span>
                      <div className="text-sm text-green-700">
                        {set.weight}lbs × {set.reps} reps {set.rpe && `@ RPE ${set.rpe}`}
                      </div>
                    </div>
                  </div>
                ))}

                {/* New Set Input */}
                {sets.length < (currentExercise.setsTarget || 3) && (
                  <SetInput
                    setNumber={sets.length + 1}
                    onComplete={completeSet}
                  />
                )}

                {/* Navigation */}
                <div className="flex space-x-3 pt-4">
                  <Button 
                    onClick={nextExercise}
                    className="flex-1"
                    style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
                  >
                    {currentExerciseIndex < workoutExercises.length - 1 ? "Next Exercise" : "Add Another Exercise"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={finishWorkout}
                    className="flex-1"
                  >
                    Finish Workout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workout Summary */}
        {workoutExercises.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Workout Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workoutExercises.map((ex, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{ex.exercise?.name}</span>
                    <Badge variant="secondary">{ex.setsTarget} sets</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface SetInputProps {
  setNumber: number;
  onComplete: (setData: any) => void;
}

function SetInput({ setNumber, onComplete }: SetInputProps) {
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

    // Reset form
    setWeight("");
    setReps("");
    setRpe("");
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
          {setNumber}
        </div>
        <span className="font-medium">New Set</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <Label className="text-xs text-neutral-600">Weight (lbs)</Label>
          <Input
            type="number"
            placeholder="185"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="text-center"
          />
        </div>
        
        <div>
          <Label className="text-xs text-neutral-600">Reps</Label>
          <Input
            type="number"
            placeholder="10"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="text-center"
          />
        </div>
        
        <div>
          <Label className="text-xs text-neutral-600">RPE (optional)</Label>
          <Input
            type="number"
            placeholder="8"
            min="1"
            max="10"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className="text-center"
          />
        </div>
      </div>
      
      <Button 
        onClick={handleComplete}
        disabled={!weight || !reps}
        className="w-full"
        style={{ backgroundColor: '#22C55E', color: '#FFFFFF' }}
      >
        <Check className="h-4 w-4 mr-1" />
        Complete Set
      </Button>
    </div>
  );
}