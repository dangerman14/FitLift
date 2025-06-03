import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FolderPlus, MoreVertical, Edit, Trash2, Play, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function Routines() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  // Fetch routines using workout templates since that's where we're storing them
  const { data: routines = [], isLoading } = useQuery({
    queryKey: ["/api/workout-templates"],
  });

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["/api/routine-folders"],
  });

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("/api/routine-folders", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routine-folders"] });
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: async (routineId: number) => {
      return apiRequest(`/api/workout-templates/${routineId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      toast({
        title: "Success",
        description: "Routine deleted successfully",
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

  // Helper functions
  const toggleFolderExpansion = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getRoutinesInFolder = (folderId: number) => {
    return (routines as any[]).filter((routine: any) => routine.folderId === folderId);
  };

  const uncategorizedRoutines = (routines as any[]).filter((routine: any) => !routine.folderId);

  const getRoutineCount = (folderId: number) => {
    return getRoutinesInFolder(folderId).length;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading routines...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">My Routines</h1>
          <p className="text-neutral-600 mt-2">Organize and manage your workout routines</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateFolderOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createFolderMutation.mutate(newFolderName)}
                    disabled={!newFolderName.trim() || createFolderMutation.isPending}
                  >
                    Create Folder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Link href="/create-routine">
            <Button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Routine
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {(!routines || routines.length === 0) && (!folders || folders.length === 0) && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No routines yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first workout routine to get started on your fitness journey.
          </p>
          <Link href="/create-routine">
            <Button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Routine
            </Button>
          </Link>
        </div>
      )}

      {/* Folders and routines */}
      {((folders as any[]).length > 0 || (routines as any[]).length > 0) && (
        <div className="space-y-8">
          {/* Folder sections */}
          {(folders as any[]).map((folder: any) => {
            const folderRoutines = getRoutinesInFolder(folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            
            return (
              <div key={folder.id} className="mb-8">
                <div 
                  className="flex items-center justify-between mb-6 cursor-pointer"
                  onClick={() => toggleFolderExpansion(folder.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-neutral-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-neutral-600" />
                    )}
                    <h2 className="text-2xl font-bold text-neutral-800">{folder.name}</h2>
                    <span className="text-lg text-neutral-500">({getRoutineCount(folder.id)})</span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {folderRoutines.map((routine: any) => (
                      <Card key={routine.id} className="hover:shadow-lg transition-shadow border-neutral-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
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
                          <div className="flex items-center justify-end text-sm text-neutral-600">
                            <Button 
                              size="sm" 
                              onClick={() => window.location.href = `/workout-session?template=${routine.id}`}
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

          {/* Uncategorized section */}
          {uncategorizedRoutines.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-800 mb-6">Uncategorized</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {uncategorizedRoutines.map((routine: any) => (
                  <Card key={routine.id} className="hover:shadow-lg transition-shadow border-neutral-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
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
                      <div className="flex items-center justify-end text-sm text-neutral-600">
                        <Button 
                          size="sm" 
                          onClick={() => window.location.href = `/workout-session?template=${routine.id}`}
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
        )}
      </div>
    </div>
  );
}