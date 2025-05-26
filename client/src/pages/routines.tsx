import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Play,
  MoreVertical,
  Trash2,
  Edit,
  X
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RoutineExercise {
  exerciseId: number;
  exerciseName: string;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
}

export default function Routines() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch routines using workout templates since that's where we're storing them
  const { data: routines = [], isLoading } = useQuery({
    queryKey: ["/api/workout-templates"],
  });

  // Fetch exercises for the dropdown
  const { data: exercises = [] } = useQuery({
    queryKey: ["/api/exercises"],
  });

  // Create routine mutation
  const createRoutineMutation = useMutation({
    mutationFn: async (routineData: any) => {
      return await apiRequest({
        method: "POST",
        url: "/api/workout-templates",
        body: JSON.stringify(routineData),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success!",
        description: "Your workout routine has been created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create routine. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete routine mutation
  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        method: "DELETE",
        url: `/api/workout-templates/${id}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      toast({
        title: "Success!",
        description: "Routine deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete routine",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setRoutineName("");
    setRoutineDescription("");
    setSelectedExercises([]);
    setSelectedExerciseId("");
    setSets("3");
    setReps("10");
    setWeight("");
    setNotes("");
  };

  const addExerciseToRoutine = () => {
    if (!selectedExerciseId) {
      toast({
        title: "Select Exercise",
        description: "Please select an exercise to add to your routine.",
        variant: "destructive",
      });
      return;
    }

    const exercise = exercises.find((ex: any) => ex.id === parseInt(selectedExerciseId));
    if (!exercise) return;

    const routineExercise: RoutineExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: parseInt(sets),
      reps,
      weight: weight || undefined,
      notes: notes || undefined,
    };

    setSelectedExercises([...selectedExercises, routineExercise]);
    setSelectedExerciseId("");
    setSets("3");
    setReps("10");
    setWeight("");
    setNotes("");
  };

  const removeExerciseFromRoutine = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleCreateRoutine = () => {
    if (!routineName.trim()) {
      toast({
        title: "Routine Name Required",
        description: "Please enter a name for your routine.",
        variant: "destructive",
      });
      return;
    }

    if (selectedExercises.length === 0) {
      toast({
        title: "Add Exercises",
        description: "Please add at least one exercise to your routine.",
        variant: "destructive",
      });
      return;
    }

    const routineData = {
      name: routineName,
      description: routineDescription,
      exercises: selectedExercises,
    };

    createRoutineMutation.mutate(routineData);
  };

  const handleDeleteRoutine = (id: number) => {
    if (confirm("Are you sure you want to delete this routine?")) {
      deleteRoutineMutation.mutate(id);
    }
  };

  const handleStartRoutine = (routine: any) => {
    // Navigate to workout session with this routine
    window.location.href = `/workout-session?template=${routine.id}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">My Workout Routines</h2>
          <p className="text-neutral-600 mt-1">Create and manage your custom workout routines</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-material-1">
              <Plus className="h-4 w-4 mr-2" />
              Create Routine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <Plus className="h-5 w-5 mr-2 text-primary-500" />
                Create New Workout Routine
              </DialogTitle>
              <DialogDescription>
                Build your custom workout routine by adding exercises with specific sets and reps.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Routine Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="routineName">Routine Name *</Label>
                  <Input
                    id="routineName"
                    placeholder="e.g., Push Day, Upper Body, Morning Workout"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="routineDescription">Description (Optional)</Label>
                  <Textarea
                    id="routineDescription"
                    placeholder="Describe your routine..."
                    value={routineDescription}
                    onChange={(e) => setRoutineDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Add Exercise Section */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-4">Add Exercise</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exercise</Label>
                    <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {exercises.map((exercise: any) => (
                          <SelectItem key={exercise.id} value={exercise.id.toString()}>
                            {exercise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Sets</Label>
                      <Input
                        type="number"
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        placeholder="3"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reps</Label>
                      <Input
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder="10 or 30s"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Weight (Optional)</Label>
                    <Input
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g., 135 lbs, bodyweight"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., slow tempo, pause at bottom"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={addExerciseToRoutine}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Routine
                </Button>
              </div>

              {/* Selected Exercises */}
              {selectedExercises.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Routine Exercises ({selectedExercises.length})</h3>
                  <div className="space-y-2">
                    {selectedExercises.map((exercise, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex-1">
                          <div className="font-medium">{exercise.exerciseName}</div>
                          <div className="text-sm text-gray-600">
                            {exercise.sets} sets × {exercise.reps} reps
                            {exercise.weight && ` @ ${exercise.weight}`}
                            {exercise.notes && ` • ${exercise.notes}`}
                          </div>
                        </div>
                        <Button
                          onClick={() => removeExerciseFromRoutine(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Button */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateRoutine}
                  disabled={createRoutineMutation.isPending}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                >
                  {createRoutineMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Routine
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routines Grid */}
      {routines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine: any) => (
            <Card 
              key={routine.id} 
              className="shadow-material-1 border border-neutral-200 hover:shadow-material-2 transition-all duration-200"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium text-neutral-900 mb-2">
                      {routine.name}
                    </CardTitle>
                    {routine.description && (
                      <p className="text-sm text-neutral-600 line-clamp-2">
                        {routine.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDeleteRoutine(routine.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-sm text-neutral-600">
                    {routine.totalExercises || 0} exercises
                  </div>
                  
                  <Button 
                    onClick={() => handleStartRoutine(routine)}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Workout
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No routines yet</h3>
            <p className="text-neutral-600 mb-6">
              Create your first workout routine to get started with organized training.
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Routine
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}