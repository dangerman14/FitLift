import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Clock, 
  Target, 
  Dumbbell, 
  Zap,
  Calendar,
  Sparkles,
  Play,
  Eye,
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedDaysPerWeek, setSelectedDaysPerWeek] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ["/api/routines"],
  });

  const generateRoutineMutation = useMutation({
    mutationFn: async (routineData: any) => {
      setIsGenerating(true);
      const response = await apiRequest("POST", "/api/routines/generate", routineData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success!",
        description: "Your personalized workout routine has been generated!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate routine. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/routines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
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

  const resetForm = () => {
    setSelectedGoal("");
    setSelectedExperience("");
    setSelectedDuration("");
    setSelectedDaysPerWeek("");
    setSelectedEquipment("");
    setRoutineName("");
    setRoutineDescription("");
  };

  const handleGenerateRoutine = () => {
    if (!selectedGoal || !selectedExperience || !selectedDuration || !selectedDaysPerWeek) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to generate your routine.",
        variant: "destructive",
      });
      return;
    }

    const routineData = {
      name: routineName || `${selectedGoal} Routine`,
      description: routineDescription || `A personalized ${selectedGoal.toLowerCase()} routine`,
      goal: selectedGoal,
      experience: selectedExperience,
      duration: selectedDuration,
      daysPerWeek: parseInt(selectedDaysPerWeek),
      equipment: selectedEquipment || "basic",
    };

    generateRoutineMutation.mutate(routineData);
  };

  const handleDeleteRoutine = (id: number) => {
    if (confirm("Are you sure you want to delete this routine?")) {
      deleteRoutineMutation.mutate(id);
    }
  };

  const handleStartRoutine = (routine: any) => {
    // Navigate to workout session with routine
    window.location.href = `/workout-session?routine=${routine.id}`;
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
          <h2 className="text-2xl font-bold text-neutral-900">Workout Routines</h2>
          <p className="text-neutral-600 mt-1">Generate personalized workout plans tailored to your goals</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-material-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Routine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <Sparkles className="h-5 w-5 mr-2 text-primary-500" />
                Generate Your Perfect Routine
              </DialogTitle>
              <DialogDescription>
                Answer a few questions to create a personalized workout routine that fits your goals and lifestyle.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Routine Name */}
              <div className="space-y-2">
                <Label htmlFor="routineName">Routine Name (Optional)</Label>
                <Input
                  id="routineName"
                  placeholder="e.g., My Summer Shred Plan"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="routineDescription">Description (Optional)</Label>
                <Textarea
                  id="routineDescription"
                  placeholder="Describe your routine goals or any specific notes..."
                  value={routineDescription}
                  onChange={(e) => setRoutineDescription(e.target.value)}
                />
              </div>

              {/* Primary Goal */}
              <div className="space-y-2">
                <Label>Primary Goal *</Label>
                <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                  <SelectTrigger>
                    <SelectValue placeholder="What's your main fitness goal?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="muscle_gain">Build Muscle</SelectItem>
                    <SelectItem value="fat_loss">Lose Fat</SelectItem>
                    <SelectItem value="strength">Increase Strength</SelectItem>
                    <SelectItem value="endurance">Improve Endurance</SelectItem>
                    <SelectItem value="general_fitness">General Fitness</SelectItem>
                    <SelectItem value="athletic_performance">Athletic Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                  <SelectTrigger>
                    <SelectValue placeholder="How would you describe your fitness level?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (6 months - 2 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (2+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Workout Duration */}
              <div className="space-y-2">
                <Label>Workout Duration *</Label>
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="How long can you workout?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2+ hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Days per Week */}
              <div className="space-y-2">
                <Label>Days per Week *</Label>
                <Select value={selectedDaysPerWeek} onValueChange={setSelectedDaysPerWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="How many days can you commit?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="4">4 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="6">6 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Equipment */}
              <div className="space-y-2">
                <Label>Available Equipment</Label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger>
                    <SelectValue placeholder="What equipment do you have access to?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bodyweight">Bodyweight Only</SelectItem>
                    <SelectItem value="basic">Basic (Dumbbells, Resistance Bands)</SelectItem>
                    <SelectItem value="home_gym">Home Gym (Full Setup)</SelectItem>
                    <SelectItem value="commercial_gym">Commercial Gym</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateRoutine}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Your Routine...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate My Routine
                  </>
                )}
              </Button>
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
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {routine.description}
                    </p>
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
                {/* Goal Badge */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge 
                    variant="secondary" 
                    className="bg-primary-50 text-primary-700 border-primary-200"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    {routine.goal?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {routine.experience}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-neutral-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {routine.duration} min
                  </div>
                  <div className="flex items-center text-sm text-neutral-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {routine.daysPerWeek} days/week
                  </div>
                  <div className="flex items-center text-sm text-neutral-600">
                    <Dumbbell className="h-4 w-4 mr-1" />
                    {routine.totalExercises || 0} exercises
                  </div>
                  <div className="flex items-center text-sm text-neutral-600">
                    <Zap className="h-4 w-4 mr-1" />
                    {routine.equipment?.replace('_', ' ')}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleStartRoutine(routine)}
                    className="flex-1 bg-primary-500 hover:bg-primary-600"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      // Navigate to routine details/preview
                      window.location.href = `/routines/${routine.id}`;
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <Sparkles className="h-16 w-16 text-primary-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-neutral-900 mb-3">
                Ready to Transform Your Fitness?
              </h3>
              <p className="text-neutral-600 mb-6 leading-relaxed">
                Generate your first personalized workout routine! Answer a few quick questions 
                and get a custom plan designed specifically for your goals, experience level, 
                and available time.
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Your First Routine
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}