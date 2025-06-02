import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { 
  User,
  Settings,
  Trophy,
  TrendingUp,
  Scale,
  Save,
  Edit,
  Calendar,
  Target
} from "lucide-react";

const bodyWeightSchema = z.object({
  weight: z.number().min(0.1, "Weight must be greater than 0"),
});

type BodyWeightForm = z.infer<typeof bodyWeightSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [weightInput, setWeightInput] = useState("");
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  const { data: workoutStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: workouts } = useQuery({
    queryKey: ["/api/workouts"],
  });

  // Get current body weight
  const { data: currentBodyweight, isLoading: isLoadingBodyweight } = useQuery({
    queryKey: ["/api/user/bodyweight/current"],
  });

  // Update weight input when current bodyweight is loaded
  useEffect(() => {
    if (currentBodyweight && typeof currentBodyweight === 'number') {
      setWeightInput(currentBodyweight.toString());
    }
  }, [currentBodyweight]);

  // Body weight update mutation
  const updateBodyweightMutation = useMutation({
    mutationFn: async (weight: number) => {
      const response = await fetch("/api/user/bodyweight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ weight }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update body weight: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Body Weight Updated!",
        description: "Your current body weight has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bodyweight/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      console.error("Body weight update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update body weight. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBodyWeightSubmit = () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Invalid Weight",
        description: "Please enter a valid weight greater than 0.",
        variant: "destructive",
      });
      return;
    }
    updateBodyweightMutation.mutate(weight);
  };

  const goals = [
    {
      title: "Increase Bench Press 1RM",
      description: "Target: 250 lbs by March 2024",
      current: 235,
      target: 250,
      status: "In Progress",
      progress: 94
    },
    {
      title: "Lose Body Fat",
      description: "Target: 12% body fat by June 2024",
      current: 15,
      target: 12,
      status: "On Track",
      progress: 60
    }
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center mb-2">
          <User className="h-8 w-8 mr-3 text-blue-600" />
          Profile
        </h1>
        <p className="text-neutral-600">
          Manage your personal information and fitness goals.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center ring-4 ring-primary-200">
                  <span className="text-2xl font-bold text-primary-600">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-neutral-900">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email?.split('@')[0] || "User"
                  }
                </h2>
                <p className="text-neutral-600">Fitness Enthusiast</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-neutral-600">
                  <span>Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>{workoutStats?.totalWorkouts || 0} workouts completed</span>
                </div>
              </div>
              <Button 
                className="bg-primary-500 hover:bg-primary-600"
                onClick={() => window.location.href = '/settings'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Body Weight Section */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="h-5 w-5 mr-2 text-blue-600" />
              Body Weight
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Track your current body weight for accurate bodyweight exercise calculations.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="Enter your current weight"
                    step="0.1"
                    min="0"
                    className="rounded-xl border-2"
                    disabled={isLoadingBodyweight}
                  />
                  <span className="text-sm text-muted-foreground min-w-[30px]">
                    {(user as any)?.weightUnit || "kg"}
                  </span>
                </div>
                {currentBodyweight && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {currentBodyweight} {(user as any)?.weightUnit || "kg"}
                  </p>
                )}
              </div>
              <Button
                onClick={handleBodyWeightSubmit}
                disabled={updateBodyweightMutation.isPending || !weightInput}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateBodyweightMutation.isPending ? "Saving..." : "Update"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workout Stats */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Workout Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {workoutStats?.totalWorkouts || 0}
                </div>
                <div className="text-sm text-neutral-600">Total Workouts</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((workoutStats?.totalVolume || 0) / 1000)}k
                </div>
                <div className="text-sm text-neutral-600">Total Volume (lbs)</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {workoutStats?.personalRecords || 0}
                </div>
                <div className="text-sm text-neutral-600">Personal Records</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fitness Goals */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-orange-600" />
                Fitness Goals
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditingGoals(!isEditingGoals)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Goals
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <div key={index} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-neutral-900">{goal.title}</h4>
                      <p className="text-sm text-neutral-600">{goal.description}</p>
                    </div>
                    <Badge 
                      className={goal.status === "In Progress" 
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                      }
                    >
                      {goal.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-neutral-600">
                      <span>Progress</span>
                      <span>{goal.current} / {goal.target} {goal.title.includes("Body Fat") ? "%" : "lbs"}</span>
                    </div>
                    <ProgressBar value={goal.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workouts && workouts.slice(0, 5).map((workout: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">{workout.name || "Workout"}</div>
                      <div className="text-sm text-neutral-600">
                        {new Date(workout.startTime).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {workout.duration ? `${Math.round(workout.duration / 60)}min` : ""}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}