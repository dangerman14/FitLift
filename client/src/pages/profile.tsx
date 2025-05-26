import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();

  const { data: fitnessGoals } = useQuery({
    queryKey: ["/api/fitness-goals"],
  });

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
                <span>84 workouts completed</span>
              </div>
            </div>
            <Button className="bg-primary-500 hover:bg-primary-600">
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="shadow-material-1 border border-neutral-200">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-neutral-700">Height</Label>
              <Input 
                value={user?.height ? `${user.height} cm` : "Not set"} 
                readOnly 
                className="bg-neutral-50 mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-neutral-700">Current Weight</Label>
              <Input 
                value={user?.weight ? `${user.weight} kg` : "Not set"} 
                readOnly 
                className="bg-neutral-50 mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-neutral-700">Age</Label>
              <Input 
                value={user?.dateOfBirth 
                  ? `${new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()} years old`
                  : "Not set"
                } 
                readOnly 
                className="bg-neutral-50 mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-neutral-700">Experience Level</Label>
              <Input 
                value={user?.experienceLevel || "Beginner"} 
                readOnly 
                className="bg-neutral-50 mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fitness Goals */}
      <Card className="shadow-material-1 border border-neutral-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Fitness Goals</CardTitle>
            <Button variant="outline" size="sm">
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
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    goal.status === "In Progress" 
                      ? "bg-secondary-100 text-secondary-700"
                      : "bg-warning/20 text-warning"
                  }`}>
                    {goal.status}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-neutral-600">
                    <span>Progress</span>
                    <span>{goal.current} / {goal.target} {goal.title.includes("Body Fat") ? "%" : "lbs"}</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card className="shadow-material-1 border border-neutral-200">
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-neutral-900">Units</div>
                <div className="text-sm text-neutral-600">Weight and measurement units</div>
              </div>
              <Select defaultValue={user?.preferredUnits || "metric"}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imperial">Imperial (lbs, ft)</SelectItem>
                  <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-neutral-900">Rest Timer Sound</div>
                <div className="text-sm text-neutral-600">Audio notification when rest period ends</div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-neutral-900">Workout Reminders</div>
                <div className="text-sm text-neutral-600">Daily workout notifications</div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
              <div>
                <div className="font-medium text-destructive">Logout</div>
                <div className="text-sm text-neutral-600">Sign out of your account</div>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => window.location.href = "/api/logout"}
              >
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
