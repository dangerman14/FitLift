import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Play,
  MoreVertical,
  Trash2
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Routines() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch routines using workout templates since that's where we're storing them
  const { data: routines = [], isLoading } = useQuery({
    queryKey: ["/api/workout-templates"],
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

  const handleDeleteRoutine = (id: number) => {
    if (confirm("Are you sure you want to delete this routine?")) {
      deleteRoutineMutation.mutate(id);
    }
  };

  const handleStartRoutine = (routine: any) => {
    // Navigate to workout session with this routine
    window.location.href = `/workout-session?template=${routine.id}`;
  };

  const navigateToCreateRoutine = () => {
    window.location.href = "/create-routine";
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
        <Button 
          onClick={navigateToCreateRoutine}
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-material-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Routine
        </Button>
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
              onClick={navigateToCreateRoutine}
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