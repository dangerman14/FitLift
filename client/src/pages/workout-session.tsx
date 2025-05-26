import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Check, Plus, Timer, MoreVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WorkoutSession() {
  const [, setLocation] = useLocation();
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
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
      setWorkoutExercises(prev => [...prev, { ...workoutExercise, sets: [] }]);
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
    setShowExerciseSelector(false);
  };

  const completeSet = (exerciseIndex: number, setData: any) => {
    if (!activeWorkout) return;

    const workoutExercise = workoutExercises[exerciseIndex];
    if (!workoutExercise) return;

    const currentSets = workoutExercise.sets || [];
    const newSet = {
      ...setData,
      setNumber: currentSets.length + 1,
      workoutExerciseId: workoutExercise.id,
    };

    // Update local state
    setWorkoutExercises(prev => 
      prev.map((we, index) => 
        index === exerciseIndex 
          ? { ...we, sets: [...(we.sets || []), newSet] }
          : we
      )
    );

    createSetMutation.mutate(newSet);

    toast({
      title: "Set Completed!",
      description: `${setData.weight}lbs × ${setData.reps} reps`,
    });
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;

    const duration = Math.round(elapsedTime / 60);
    const totalSets = workoutExercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
    const totalVolume = workoutExercises.reduce((sum, ex) => 
      sum + (ex.sets?.reduce((setSum: number, set: any) => 
        setSum + ((set.weight || 0) * (set.reps || 0)), 0) || 0), 0);

    toast({
      title: "Workout Completed!",
      description: `Duration: ${duration}min • ${totalSets} sets • ${Math.round(totalVolume)}lbs volume`,
    });

    setLocation("/");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalVolume = () => {
    return workoutExercises.reduce((sum, ex) => 
      sum + (ex.sets?.reduce((setSum: number, set: any) => 
        setSum + ((set.weight || 0) * (set.reps || 0)), 0) || 0), 0);
  };

  const getTotalSets = () => {
    return workoutExercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-medium text-neutral-900">Log Workout</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-sm text-neutral-600">
              <Timer className="h-4 w-4" />
              <span>{formatTime(elapsedTime)}</span>
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
        <div className="flex space-x-6 mt-3 text-sm">
          <div>
            <span className="text-neutral-500">Duration</span>
            <div className="font-medium text-blue-600">{formatTime(elapsedTime)}</div>
          </div>
          <div>
            <span className="text-neutral-500">Volume</span>
            <div className="font-medium text-neutral-900">{Math.round(getTotalVolume())} kg</div>
          </div>
          <div>
            <span className="text-neutral-500">Sets</span>
            <div className="font-medium text-neutral-900">{getTotalSets()}</div>
          </div>
        </div>
      </div>

      {/* Workout Content */}
      <div className="p-4 space-y-4">
        {/* Exercise List */}
        {workoutExercises.map((workoutExercise, exerciseIndex) => (
          <ExerciseCard
            key={workoutExercise.id}
            workoutExercise={workoutExercise}
            exerciseIndex={exerciseIndex}
            onCompleteSet={completeSet}
          />
        ))}

        {/* Add Exercise Button */}
        <Button
          onClick={() => setShowExerciseSelector(true)}
          className="w-full py-6"
          style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Exercise
        </Button>

        {/* Exercise Selector Modal */}
        {showExerciseSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div className="bg-white w-full max-h-[80vh] rounded-t-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Add Exercise</h3>
                <Button variant="ghost" onClick={() => setShowExerciseSelector(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(exercises && Array.isArray(exercises) ? exercises.slice(0, 15) : []).map((exercise: any) => (
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
          </div>
        )}
      </div>
    </div>
  );
}

interface ExerciseCardProps {
  workoutExercise: any;
  exerciseIndex: number;
  onCompleteSet: (exerciseIndex: number, setData: any) => void;
}

function ExerciseCard({ workoutExercise, exerciseIndex, onCompleteSet }: ExerciseCardProps) {
  const [showAddSet, setShowAddSet] = useState(true); // Start with Set 1 visible

  return (
    <Card>
      <CardContent className="p-4">
        {/* Exercise Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">💪</span>
            </div>
            <div>
              <h3 className="font-medium text-blue-600">
                {workoutExercise.exercise?.name || "Exercise"}
              </h3>
              <p className="text-sm text-neutral-500">Guessing weights</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Rest Timer */}
        <div className="flex items-center space-x-2 mb-4 text-sm text-blue-600">
          <Timer className="h-4 w-4" />
          <span>Rest Timer: 4min 30s</span>
          <span className="text-yellow-500">⚠️</span>
        </div>

        {/* Sets Table Header */}
        <div className="grid grid-cols-6 gap-2 text-xs text-neutral-500 font-medium mb-2">
          <div>SET</div>
          <div>PREVIOUS</div>
          <div>KG</div>
          <div>REPS</div>
          <div>RPE</div>
          <div></div>
        </div>

        {/* Sets List */}
        {(workoutExercise.sets || []).map((set: any, setIndex: number) => (
          <div key={setIndex} className="grid grid-cols-6 gap-2 items-center py-2 border-b border-neutral-100">
            <div className="font-medium">{set.setNumber}</div>
            <div className="text-sm text-neutral-500">
              {set.weight}kg x {set.reps}
            </div>
            <div className="font-medium">{set.weight}</div>
            <div className="font-medium">{set.reps}</div>
            <div className="font-medium">{set.rpe || '-'}</div>
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        ))}

        {/* Add Set Input - show when adding a new set */}
        {showAddSet && (
          <SetInput
            setNumber={(workoutExercise.sets?.length || 0) + 1}
            onComplete={(setData) => {
              onCompleteSet(exerciseIndex, setData);
              setShowAddSet(false);
            }}
            onCancel={() => setShowAddSet(false)}
          />
        )}
        
        {/* Always visible Add Set Button */}
        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={() => setShowAddSet(true)}
          disabled={showAddSet}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Set
        </Button>
      </CardContent>
    </Card>
  );
}

interface SetInputProps {
  setNumber: number;
  onComplete: (setData: any) => void;
  onCancel: () => void;
}

function SetInput({ setNumber, onComplete, onCancel }: SetInputProps) {
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
    <div className="grid grid-cols-6 gap-2 items-center py-3 border-b border-neutral-100 bg-neutral-50 rounded">
      <div className="font-medium">{setNumber}</div>
      <div className="text-sm text-neutral-500">-</div>
      <Input
        type="number"
        placeholder="75"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="h-8 text-center"
      />
      <Input
        type="number"
        placeholder="10"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="h-8 text-center"
      />
      <Input
        type="number"
        placeholder="8"
        min="1"
        max="10"
        value={rpe}
        onChange={(e) => setRpe(e.target.value)}
        className="h-8 text-center"
      />
      <div className="flex space-x-1">
        <Button size="sm" onClick={handleComplete} disabled={!weight || !reps}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}