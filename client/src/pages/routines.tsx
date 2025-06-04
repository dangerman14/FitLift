import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useWorkout } from "@/contexts/WorkoutContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Routines() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeWorkout, setActiveWorkout } = useWorkout();
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [showWorkoutInProgressModal, setShowWorkoutInProgressModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Fetch both workout templates and custom routines
  const { data: workoutTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/workout-templates"],
  });
  
  const { data: customRoutines = [], isLoading: routinesLoading } = useQuery({
    queryKey: ["/api/routines"],
  });

  // Combine both data sources for display
  const allRoutines = [
    ...workoutTemplates.map((template: any) => ({ ...template, type: 'template' })),
    ...customRoutines.map((routine: any) => ({ ...routine, type: 'routine' }))
  ];
  
  const isLoading = templatesLoading || routinesLoading;

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["/api/routine-folders"],
  });

  // Helper functions
  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getRoutinesInFolder = (folderId: number) => {
    return allRoutines.filter((routine: any) => routine.folderId === folderId);
  };

  const getRoutinesWithoutFolder = () => {
    return allRoutines.filter((routine: any) => !routine.folderId);
  };

  const getExerciseCount = (routine: any) => {
    // Use the totalExercises from the backend API response
    return routine.totalExercises || routine.exerciseCount || 0;
  };

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/routine-folders", { name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routine-folders"] });
      toast({
        title: "Success!",
        description: "Folder created successfully.",
      });
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    },
    onError: (error: any) => {
      console.error("Folder creation mutation error:", error);
      const errorMessage = error?.message || "Unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to create folder: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  // Delete routine mutation
  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/workout-templates/${id}`);
      return response.json();
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

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName.trim());
    }
  };

  const handleEditRoutine = (id: number) => {
    // Navigate to the create-routine page with the routine ID for editing
    window.location.href = `/create-routine?edit=${id}`;
  };

  const handleDeleteRoutine = (id: number) => {
    if (confirm("Are you sure you want to delete this routine?")) {
      deleteRoutineMutation.mutate(id);
    }
  };

  const handleStartRoutine = (routine: any) => {
    console.log('Checking for active workout:', activeWorkout);
    if (activeWorkout) {
      console.log('Active workout found, showing modal');
      setSelectedTemplateId(routine.id);
      setShowWorkoutInProgressModal(true);
    } else {
      console.log('No active workout, proceeding with navigation');
      // Handle different URL structures for templates vs custom routines
      if (routine.type === 'routine') {
        // Custom routines use ID-based URLs
        window.location.href = `/workout-session?routine=${routine.id}`;
      } else {
        // Workout templates use template parameter
        window.location.href = `/workout-session?template=${routine.id}`;
      }
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
        <div className="flex gap-3">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary-200 text-primary-600 hover:bg-primary-50">
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a folder to organize your workout routines (e.g., "Strength Training", "Cardio", "Beginner Workouts")
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    placeholder="e.g., Strength Training"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFolder();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || createFolderMutation.isPending}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                  >
                    {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateFolderOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={navigateToCreateRoutine}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-material-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Routine
          </Button>
        </div>
      </div>

      {/* Folders Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Folders</h2>
        <div className="space-y-4">
          {/* Regular folders */}
          {folders.map((folder: any) => {
            const folderRoutines = getRoutinesInFolder(folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            
            return (
              <div key={folder.id}>
                <Card 
                  className="shadow-material-1 border border-neutral-200 hover:shadow-material-2 transition-all duration-200 cursor-pointer"
                  onClick={() => toggleFolder(folder.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: folder.color }}
                        >
                          <Folder className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-neutral-900 truncate">
                            {folder.name}
                          </h3>
                          <p className="text-sm text-neutral-500">
                            {folderRoutines.length} routine{folderRoutines.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-neutral-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-neutral-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Expanded folder content */}
                {isExpanded && folderRoutines.length > 0 && (
                  <div className="ml-4 mt-2 space-y-2">
                    {folderRoutines.map((routine: any) => (
                      <Card 
                        key={routine.id} 
                        className="shadow-material-1 border border-neutral-200 hover:shadow-material-2 transition-all duration-200"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Link href={`/routine/${routine.slug}`}>
                                <CardTitle className="text-lg font-medium text-neutral-900 mb-2 hover:text-blue-600 cursor-pointer transition-colors">
                                  {routine.name}
                                </CardTitle>
                              </Link>
                              {routine.description && (
                                <p className="text-sm text-neutral-600 line-clamp-2">
                                  {routine.description}
                                </p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => window.location.href = `/create-routine?edit=${routine.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Routine
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteRoutineMutation.mutate(routine.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Routine
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm text-neutral-600">
                            <span>{getExerciseCount(routine)} exercises</span>
                            <Button 
                              size="sm" 
                              onClick={() => handleStartRoutine(routine)}
                              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start Workout
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Uncategorized folder for routines without folders */}
          {(() => {
            const uncategorizedRoutines = getRoutinesWithoutFolder();
            const isUncategorizedExpanded = expandedFolders.has(-1);
            
            return uncategorizedRoutines.length > 0 ? (
              <div key="uncategorized">
                <Card 
                  className="shadow-material-1 border border-neutral-200 hover:shadow-material-2 transition-all duration-200 cursor-pointer"
                  onClick={() => toggleFolder(-1)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-400 flex items-center justify-center">
                          <Folder className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-neutral-900 truncate">
                            Uncategorized
                          </h3>
                          <p className="text-sm text-neutral-500">
                            {uncategorizedRoutines.length} routine{uncategorizedRoutines.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {isUncategorizedExpanded ? (
                          <ChevronDown className="h-5 w-5 text-neutral-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-neutral-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Expanded uncategorized content */}
                {isUncategorizedExpanded && (
                  <div className="ml-4 mt-2 space-y-2">
                    {uncategorizedRoutines.map((routine: any) => (
                      <Card 
                        key={routine.id} 
                        className="shadow-material-1 border border-neutral-200 hover:shadow-material-2 transition-all duration-200"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Link href={`/routine/${routine.slug}`}>
                                <CardTitle className="text-lg font-medium text-neutral-900 mb-2 hover:text-blue-600 cursor-pointer transition-colors">
                                  {routine.name}
                                </CardTitle>
                              </Link>
                              {routine.description && (
                                <p className="text-sm text-neutral-600 line-clamp-2">
                                  {routine.description}
                                </p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => window.location.href = `/create-routine?edit=${routine.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Routine
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteRoutineMutation.mutate(routine.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Routine
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm text-neutral-600">
                            <span>{getExerciseCount(routine)} exercises</span>
                            <Button 
                              size="sm" 
                              onClick={() => handleStartRoutine(routine)}
                              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start Workout
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Empty state when no routines and no folders exist */}
      {allRoutines.length === 0 && folders.length === 0 && (
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