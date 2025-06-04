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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWorkout } from "@/contexts/WorkoutContext";

export default function Workouts() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showWorkoutInProgressModal, setShowWorkoutInProgressModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeWorkout, setActiveWorkout } = useWorkout();

  const { data: workoutTemplates, isLoading } = useQuery({
    queryKey: ["/api/workout-templates"],
  });

  const { data: workoutHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/workouts"],
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

  const filteredTemplates = (workoutTemplates || []).filter((template: any) => {
    if (selectedCategory === "All") return true;
    return template.targetMuscleGroups?.includes(selectedCategory.toLowerCase());
  });

  const handleStartWorkout = (template: any) => {
    console.log('Workouts page - Checking for active workout:', activeWorkout);
    if (activeWorkout) {
      console.log('Active workout found in workouts page, showing modal');
      setSelectedTemplateId(template.id);
      setShowWorkoutInProgressModal(true);
    } else {
      console.log('No active workout in workouts page, proceeding with navigation');
      window.location.href = `/workout-session?template=${template.id}`;
    }
  };

  const handleResumeWorkout = () => {
    setShowWorkoutInProgressModal(false);
    window.location.href = `/workout-session/${activeWorkout?.slug}`;
  };

  const handleDiscardAndStartNew = () => {
    setActiveWorkout(null);
    setShowWorkoutInProgressModal(false);
    if (selectedTemplateId) {
      window.location.href = `/workout-session?template=${selectedTemplateId}`;
    }
  };

  const handleCreateWorkout = () => {
    // Navigate directly to workout session for creating workouts on the fly
    window.location.href = `/workout-session`;
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this workout template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  if (isLoading || historyLoading) {
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

      {/* Recent Workouts Section */}
      {workoutHistory && workoutHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900">Recent Workouts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workoutHistory.slice(0, 6).map((workout: any) => (
              <Card 
                key={workout.id} 
                className="shadow-material-1 border border-neutral-200 hover:shadow-material-2 transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-neutral-900 mb-1">
                        {workout.name}
                      </h4>
                      <p className="text-sm text-neutral-600">
                        {new Date(workout.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {workout.templateName ? 'Template' : 'Custom'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-4">
                    {workout.duration && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.round(workout.duration / 60)} min
                      </span>
                    )}
                    <span className="flex items-center">
                      <Dumbbell className="h-4 w-4 mr-1" />
                      {workout.exerciseCount || 0} exercises
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => window.location.href = `/workout-summary/${workout.id}`}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {!workout.endTime && (
                      <Button 
                        onClick={() => window.location.href = `/workout-session/${workout.slug}`}
                        className="flex-1 bg-primary-500 hover:bg-primary-600"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Workout Templates Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Workout Templates</h3>
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
                ? "Ready to build your workout collection? Create custom workout templates with your favorite exercises." 
                : `Build a custom ${selectedCategory.toLowerCase()} workout template with your preferred exercises.`
              }
            </p>
            <Button onClick={handleCreateWorkout} className="bg-primary-500 hover:bg-primary-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Workout Template
            </Button>
          </CardContent>
        </Card>
      )}
      </div>

      {/* Workout In Progress Modal */}
      <Dialog open={showWorkoutInProgressModal} onOpenChange={setShowWorkoutInProgressModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Workout In Progress</DialogTitle>
            <DialogDescription>
              You have an active workout "{activeWorkout?.name}" in progress. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleResumeWorkout} className="w-full">
              Resume Current Workout
            </Button>
            <Button 
              onClick={handleDiscardAndStartNew} 
              variant="destructive" 
              className="w-full"
            >
              Discard & Start New Workout
            </Button>
            <Button 
              onClick={() => setShowWorkoutInProgressModal(false)} 
              variant="outline" 
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
