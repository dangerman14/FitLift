import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Clock, 
  Dumbbell, 
  MoreVertical,
  Play,
  Eye
} from "lucide-react";
import { useState } from "react";
import WorkoutModal from "@/components/workout-modal";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Workouts() {
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workoutTemplates, isLoading } = useQuery({
    queryKey: ["/api/workout-templates"],
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/workout-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      toast({
        title: "Success",
        description: "Workout template deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete workout template",
        variant: "destructive",
      });
    },
  });

  const categories = ["All", "Push", "Pull", "Legs", "Full Body"];

  const filteredTemplates = workoutTemplates?.filter((template: any) => {
    if (selectedCategory === "All") return true;
    return template.targetMuscleGroups?.includes(selectedCategory.toLowerCase());
  }) || [];

  const handleStartWorkout = (template: any) => {
    setSelectedTemplate(template);
    setIsWorkoutModalOpen(true);
  };

  const handleCreateWorkout = () => {
    setSelectedTemplate(null);
    setIsWorkoutModalOpen(true);
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this workout template?")) {
      deleteTemplateMutation.mutate(id);
    }
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
        <h2 className="text-2xl font-bold text-neutral-900">My Workouts</h2>
        <Button 
          onClick={handleCreateWorkout}
          className="bg-primary-500 hover:bg-primary-600 shadow-material-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Workout
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={`whitespace-nowrap ${
              selectedCategory === category
                ? "bg-primary-500 hover:bg-primary-600"
                : "hover:bg-neutral-100"
            }`}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Workout Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template: any) => (
            <Card 
              key={template.id} 
              className="shadow-material-1 border border-neutral-200 hover:shadow-material-2 transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {template.description || "No description"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-4">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {template.estimatedDuration || 60} min
                  </span>
                  <span className="flex items-center">
                    <Dumbbell className="h-4 w-4 mr-1" />
                    {template.exerciseCount || 0} exercises
                  </span>
                </div>

                {/* Target Muscle Groups */}
                {template.targetMuscleGroups && template.targetMuscleGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.targetMuscleGroups.slice(0, 3).map((group: string) => (
                      <Badge key={group} variant="secondary" className="text-xs">
                        {group}
                      </Badge>
                    ))}
                    {template.targetMuscleGroups.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.targetMuscleGroups.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleStartWorkout(template)}
                    className="flex-1 bg-primary-500 hover:bg-primary-600"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {selectedCategory === "All" ? "No Workout Templates" : `No ${selectedCategory} Workouts`}
            </h3>
            <p className="text-neutral-600 mb-4">
              {selectedCategory === "All" 
                ? "Create your first workout template to get started." 
                : `Create a ${selectedCategory.toLowerCase()} workout template.`
              }
            </p>
            <Button onClick={handleCreateWorkout} className="bg-primary-500 hover:bg-primary-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workout Modal */}
      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        template={selectedTemplate}
      />
    </div>
  );
}
