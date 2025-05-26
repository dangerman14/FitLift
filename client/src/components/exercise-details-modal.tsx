import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dumbbell, 
  Play, 
  Edit,
  Save,
  X,
  Upload,
  Link,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Exercise, insertCustomExerciseSchema } from "@shared/schema";

const equipmentTypes = [
  "None",
  "Barbell", 
  "Dumbbell",
  "Kettlebell",
  "Machine",
  "Plate",
  "Resistance Band",
  "Cable",
  "Suspension Trainer",
  "Medicine Ball",
  "Foam Roller"
];

const muscleGroups = [
  "Chest",
  "Back", 
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Core",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Cardio"
];

interface ExerciseDetailsModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
}

type CustomExerciseForm = z.infer<typeof insertCustomExerciseSchema>;

export default function ExerciseDetailsModal({ 
  exercise, 
  isOpen, 
  onClose 
}: ExerciseDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine if this is a custom exercise (has createdBy field)
  const isCustomExercise = exercise && 'createdBy' in exercise;

  const form = useForm<CustomExerciseForm>({
    resolver: zodResolver(insertCustomExerciseSchema),
    defaultValues: {
      name: exercise?.name || "",
      description: exercise?.description || "",
      instructions: exercise?.instructions || "",
      imageUrl: exercise?.imageUrl || "",
      youtubeUrl: exercise?.youtubeUrl || "",
      equipmentType: exercise?.equipmentType || "",
      exerciseType: exercise?.exerciseType || "weight_reps",
      primaryMuscleGroups: exercise?.primaryMuscleGroups || [],
      secondaryMuscleGroups: exercise?.secondaryMuscleGroups || [],
      difficultyLevel: exercise?.difficultyLevel || "beginner",
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async (data: CustomExerciseForm) => {
      const response = await fetch(`/api/exercises/custom/${exercise?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Exercise Updated!",
        description: "Your custom exercise has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update exercise. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: CustomExerciseForm) => {
    updateExerciseMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const openYouTubeVideo = () => {
    const videoUrl = exercise?.youtubeUrl || exercise?.videoUrl;
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  if (!exercise) return null;

  // Get muscle groups for display
  const allMuscleGroups = exercise.muscleGroups || 
    [...(exercise.primaryMuscleGroups || []), ...(exercise.secondaryMuscleGroups || [])];

  // Get equipment for display
  const equipmentDisplay = exercise.equipmentRequired?.join(', ') || 
    exercise.equipmentType?.replace(/_/g, ' ') || 
    'No equipment specified';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <Info className="h-6 w-6 mr-2 text-blue-600" />
              Exercise Details
            </DialogTitle>
            {isCustomExercise && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={form.handleSubmit(handleSave)}
                      size="sm"
                      disabled={updateExerciseMutation.isPending}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {isCustomExercise && isEditing ? (
          // Edit Mode for Custom Exercises
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              {/* Exercise Image */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Exercise Image URL
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        className="rounded-xl border-2"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Custom Push-up" 
                          className="rounded-xl border-2"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Link className="h-4 w-4 mr-2" />
                        YouTube Video URL
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://youtube.com/watch?v=..." 
                          className="rounded-xl border-2"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description and Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the exercise..."
                          className="rounded-xl border-2 min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Step-by-step instructions..."
                          className="rounded-xl border-2 min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Equipment and Exercise Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="equipmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2">
                            <SelectValue placeholder="Select equipment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {equipmentTypes.map((equipment) => (
                            <SelectItem key={equipment} value={equipment.toLowerCase().replace(/ /g, "_")}>
                              {equipment}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exerciseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2">
                            <SelectValue placeholder="Select exercise type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weight_reps">Weight & Reps</SelectItem>
                          <SelectItem value="bodyweight_reps">Bodyweight Reps</SelectItem>
                          <SelectItem value="duration">Duration</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficultyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Muscle Groups */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Muscle Groups</h3>
                
                <FormField
                  control={form.control}
                  name="primaryMuscleGroups"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Muscle Group * (Select One)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange([value])} 
                        defaultValue={field.value?.[0] || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2">
                            <SelectValue placeholder="Select primary muscle group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {muscleGroups.map((muscle) => (
                            <SelectItem key={muscle} value={muscle.toLowerCase()}>
                              {muscle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryMuscleGroups"
                  render={() => (
                    <FormItem>
                      <FormLabel>Secondary Muscle Groups</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {muscleGroups.map((muscle) => (
                          <FormField
                            key={muscle}
                            control={form.control}
                            name="secondaryMuscleGroups"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={muscle}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(muscle.toLowerCase())}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), muscle.toLowerCase()])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== muscle.toLowerCase()
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {muscle}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        ) : (
          // View Mode
          <div className="space-y-6">
            {/* Exercise Image */}
            {(exercise.imageUrl || exercise.thumbnailUrl) && (
              <div className="w-full h-64 rounded-xl overflow-hidden bg-neutral-100">
                <img 
                  src={exercise.imageUrl || exercise.thumbnailUrl} 
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Exercise Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Exercise Name</h3>
                <p className="text-gray-700">{exercise.name}</p>
              </div>

              {(exercise.youtubeUrl || exercise.videoUrl) && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Video</h3>
                  <Button
                    onClick={openYouTubeVideo}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch on YouTube
                  </Button>
                </div>
              )}
            </div>

            {/* Description and Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exercise.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{exercise.description}</p>
                </div>
              )}

              {exercise.instructions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                  <p className="text-gray-700">{exercise.instructions}</p>
                </div>
              )}
            </div>

            {/* Exercise Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Equipment</h3>
                <div className="flex items-center">
                  <Dumbbell className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="capitalize">{equipmentDisplay}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Difficulty</h3>
                <Badge 
                  className={`
                    ${exercise.difficultyLevel === 'beginner' ? 'bg-green-500' : 
                      exercise.difficultyLevel === 'intermediate' ? 'bg-yellow-500' : 
                      'bg-red-500'} 
                    text-white capitalize
                  `}
                >
                  {exercise.difficultyLevel || 'Beginner'}
                </Badge>
              </div>

              {allMuscleGroups.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Muscle Groups</h3>
                  <div className="flex flex-wrap gap-2">
                    {allMuscleGroups.map((group) => (
                      <Badge key={group} variant="secondary" className="capitalize">
                        {group}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isCustomExercise && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  <Info className="h-4 w-4 inline mr-2" />
                  This is your custom exercise. Click "Edit" to modify its details.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}