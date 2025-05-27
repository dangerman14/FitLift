import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: number | null;
  exercise: {
    id: number;
    name: string;
  };
  sets: WorkoutSet[];
}

export default function WorkoutSessionSimple() {
  const [, setLocation] = useLocation();
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const createWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      return await apiRequest("POST", "/api/workouts", workoutData);
    },
    onSuccess: (workout) => {
      setActiveWorkout(workout);
    },
  });

  // Load template from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    
    if (templateId && !activeWorkout && workoutExercises.length === 0) {
      const loadTemplate = async () => {
        try {
          const response = await fetch(`/api/workout-templates/${templateId}`, {
            credentials: 'include'
          });
          const template = await response.json();
          
          if (template && template.exercises) {
            // Create workout
            createWorkoutMutation.mutate({
              name: template.name,
              description: template.description,
              templateId: parseInt(templateId),
              startTime: new Date().toISOString(),
            });
            
            // Load exercises
            const templateExercises = template.exercises.map((templateEx: any) => ({
              id: null,
              exercise: templateEx.exercise,
              sets: Array.from({ length: 3 }, (_, setIndex) => ({
                setNumber: setIndex + 1,
                weight: 0,
                reps: 0,
                completed: false
              }))
            }));
            
            setWorkoutExercises(templateExercises);
          }
        } catch (error) {
          console.error('Failed to load template:', error);
        }
      };
      
      loadTemplate();
    }
  }, []);

  const updateSetValue = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: number) => {
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

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    setWorkoutExercises(prev => 
      prev.map((ex, exIndex) => 
        exIndex === exerciseIndex 
          ? {
              ...ex,
              sets: ex.sets.map((s, sIndex) => 
                sIndex === setIndex ? { ...s, completed: !s.completed } : s
              )
            }
          : ex
      )
    );
  };

  const addSet = (exerciseIndex: number) => {
    setWorkoutExercises(prev => 
      prev.map((ex, exIndex) => 
        exIndex === exerciseIndex 
          ? {
              ...ex,
              sets: [...ex.sets, {
                setNumber: ex.sets.length + 1,
                weight: 0,
                reps: 0,
                completed: false
              }]
            }
          : ex
      )
    );
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    
    try {
      await apiRequest("PATCH", `/api/workouts/${activeWorkout.id}`, {
        endTime: new Date().toISOString()
      });
      
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
      <div className="bg-gradient-to-r from-green-500 via-teal-500 to-cyan-600 text-white px-6 py-6 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="hover:bg-white hover:bg-opacity-20 rounded-xl text-white">
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Workout Session</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm opacity-90">Duration</div>
              <div className="text-xl font-bold">{formatTime(elapsedTime)}</div>
            </div>
            <Button 
              onClick={finishWorkout}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              Finish
            </Button>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="p-4 space-y-4 pb-24">
        {workoutExercises.map((workoutExercise, exerciseIndex) => (
          <Card key={`exercise-${exerciseIndex}`} className="shadow-sm">
            <CardContent className="p-4">
              {/* Exercise Header */}
              <div className="mb-4">
                <h3 className="font-medium text-blue-600 text-lg">
                  {workoutExercise.exercise?.name}
                </h3>
              </div>

              {/* Sets Table Header */}
              <div className="grid grid-cols-5 gap-2 text-xs text-neutral-500 font-medium mb-2 px-1">
                <div>SET</div>
                <div>WEIGHT (KG)</div>
                <div>REPS</div>
                <div className="text-center">✓</div>
                <div></div>
              </div>

              {/* Sets List */}
              {workoutExercise.sets.map((set, setIndex) => (
                <div key={`set-${exerciseIndex}-${setIndex}`} className="grid grid-cols-5 gap-2 items-center py-2 px-1">
                  <div className="font-medium text-lg">{set.setNumber}</div>
                  
                  <Input
                    type="number"
                    value={set.weight || ""}
                    onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                    className="h-10 text-center font-medium text-lg"
                    placeholder="75"
                    disabled={set.completed}
                  />
                  
                  <Input
                    type="number"
                    value={set.reps || ""}
                    onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                    className="h-10 text-center font-medium text-lg"
                    placeholder="10"
                    disabled={set.completed}
                  />
                  
                  <div className="flex justify-center">
                    <Checkbox
                      checked={set.completed}
                      onCheckedChange={() => completeSet(exerciseIndex, setIndex)}
                      className="w-6 h-6 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                  </div>
                  
                  <div></div>
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
    </div>
  );
}