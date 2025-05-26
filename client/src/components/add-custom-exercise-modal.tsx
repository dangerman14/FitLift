import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, Youtube, Dumbbell } from "lucide-react";

const customExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  equipmentType: z.string().min(1, "Equipment type is required"),
  exerciseType: z.string().min(1, "Exercise type is required"),
  primaryMuscleGroups: z.array(z.string()).min(1, "At least one primary muscle group is required"),
  secondaryMuscleGroups: z.array(z.string()).optional(),
  difficultyLevel: z.string().optional(),
});

type CustomExerciseForm = z.infer<typeof customExerciseSchema>;

interface AddCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const exerciseTypes = [
  { value: "weight_reps", label: "Weight & Reps" },
  { value: "bodyweight_reps", label: "Bodyweight Reps" },
  { value: "weighted_bodyweight", label: "Weighted Bodyweight" },
  { value: "assisted_bodyweight", label: "Assisted Bodyweight" },
  { value: "duration", label: "Duration" },
  { value: "duration_weight", label: "Duration & Weight" },
  { value: "distance_duration", label: "Distance & Duration" },
  { value: "weight_distance", label: "Weight & Distance" },
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
  "Traps",
  "Lats",
  "Delts"
];

export default function AddCustomExerciseModal({ isOpen, onClose }: AddCustomExerciseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CustomExerciseForm>({
    resolver: zodResolver(customExerciseSchema),
    defaultValues: {
      name: "",
      description: "",
      instructions: "",
      imageUrl: "",
      youtubeUrl: "",
      equipmentType: "",
      exerciseType: "weight_reps",
      primaryMuscleGroups: [],
      secondaryMuscleGroups: [],
      difficultyLevel: "beginner",
    },
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (data: CustomExerciseForm) => {
      const response = await apiRequest("POST", "/api/exercises/custom", {
        ...data,
        isCustom: true,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Exercise Created!",
        description: "Your custom exercise has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create exercise. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomExerciseForm) => {
    createExerciseMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Dumbbell className="h-6 w-6 mr-2 text-purple-600" />
            Create Custom Exercise
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Exercise Image - Top Priority */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-purple-600" />
                Exercise Image
              </h3>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload or Paste Image URL</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Drag and Drop Zone */}
                        <div 
                          className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors cursor-pointer bg-purple-50/50"
                          onDrop={(e) => {
                            e.preventDefault();
                            const files = Array.from(e.dataTransfer.files);
                            if (files.length > 0) {
                              // For now, show instructions since we'd need image hosting
                              alert("Drag & drop detected! For now, please use an image URL. Image hosting will be added soon.");
                            }
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnter={(e) => e.preventDefault()}
                        >
                          <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                          <div className="text-lg font-medium text-neutral-700 mb-2">
                            Drop exercise image here
                          </div>
                          <div className="text-sm text-neutral-500 mb-4">
                            or paste an image URL below
                          </div>
                          <div className="text-xs text-neutral-400">
                            PNG, JPG, GIF up to 10MB
                          </div>
                        </div>
                        
                        {/* URL Input */}
                        <Input 
                          placeholder="https://example.com/exercise-image.jpg" 
                          {...field} 
                          className="rounded-xl border-2"
                        />
                        
                        {/* Preview */}
                        {field.value && (
                          <div className="mt-4">
                            <img 
                              src={field.value} 
                              alt="Exercise preview" 
                              className="w-full max-w-md mx-auto rounded-xl shadow-medium"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dragon Flag" {...field} className="rounded-xl border-2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the exercise..."
                        {...field} 
                        className="rounded-xl border-2 min-h-[80px]"
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
                        {...field} 
                        className="rounded-xl border-2 min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Media */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Video Tutorial</h3>
              
              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Youtube className="h-4 w-4 mr-2 text-red-500" />
                      YouTube Video URL
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://youtube.com/watch?v=..." 
                        {...field} 
                        className="rounded-xl border-2"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Exercise Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">Exercise Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {exerciseTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
              <h3 className="text-lg font-semibold text-neutral-900">Muscle Groups</h3>
              
              <FormField
                control={form.control}
                name="primaryMuscleGroups"
                render={() => (
                  <FormItem>
                    <FormLabel>Primary Muscle Groups *</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {muscleGroups.map((muscle) => (
                        <FormField
                          key={muscle}
                          control={form.control}
                          name="primaryMuscleGroups"
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
                                        ? field.onChange([...field.value, muscle.toLowerCase()])
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

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-3 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExerciseMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-large transform hover:scale-105 transition-all duration-200"
              >
                {createExerciseMutation.isPending ? "Creating..." : "Create Exercise"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}