import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  TrendingUp,
  Trophy,
  BarChart3,
  PieChart
} from "lucide-react";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts";

export default function Progress() {
  const { data: workoutStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: workouts } = useQuery({
    queryKey: ["/api/workouts"],
  });

  // Mock data for charts (in a real app, this would come from API)
  const strengthProgressData = [
    { date: "Jan", benchPress: 185, squat: 225, deadlift: 275 },
    { date: "Feb", benchPress: 195, squat: 235, deadlift: 285 },
    { date: "Mar", benchPress: 205, squat: 245, deadlift: 295 },
    { date: "Apr", benchPress: 215, squat: 255, deadlift: 305 },
    { date: "May", benchPress: 225, squat: 265, deadlift: 315 },
    { date: "Jun", benchPress: 235, squat: 275, deadlift: 325 },
  ];

  const volumeData = [
    { name: "Chest", value: 30, color: "#1976D2" },
    { name: "Back", value: 25, color: "#388E3C" },
    { name: "Legs", value: 20, color: "#FF5722" },
    { name: "Shoulders", value: 15, color: "#FF9800" },
    { name: "Arms", value: 10, color: "#9C27B0" },
  ];

  const recentPRs = [
    {
      exercise: "Bench Press",
      improvement: "225 lbs → 235 lbs",
      gain: "+10 lbs",
      date: "3 days ago"
    },
    {
      exercise: "Deadlift",
      improvement: "315 lbs → 325 lbs",
      gain: "+10 lbs",
      date: "1 week ago"
    },
    {
      exercise: "Squat",
      improvement: "255 lbs → 265 lbs",
      gain: "+10 lbs",
      date: "2 weeks ago"
    }
  ];

  const timePeriods = ["Last 30 Days", "Last 3 Months", "Last Year", "All Time"];

  if (statsLoading) {
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
        <h2 className="text-2xl font-bold text-neutral-900">Progress Tracking</h2>
        <Button variant="outline" className="shadow-material-1">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Time Period Selector */}
      <div className="flex space-x-2">
        {timePeriods.map((period, index) => (
          <Button
            key={period}
            variant={index === 0 ? "default" : "outline"}
            size="sm"
            className={index === 0 ? "bg-primary-500 hover:bg-primary-600" : ""}
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Progress Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {workoutStats?.totalWorkouts || 0}
            </div>
            <div className="text-sm text-neutral-600 mb-1">Total Workouts</div>
            <div className="text-xs text-secondary-600">+12% vs last month</div>
          </CardContent>
        </Card>

        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              {Math.round((workoutStats?.totalVolume || 0) / 1000)}k
            </div>
            <div className="text-sm text-neutral-600 mb-1">Total Volume (lbs)</div>
            <div className="text-xs text-secondary-600">+23% vs last month</div>
          </CardContent>
        </Card>

        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-accent-500 mb-2">
              {workoutStats?.personalRecords || 18}
            </div>
            <div className="text-sm text-neutral-600 mb-1">Personal Records</div>
            <div className="text-xs text-accent-500">+5 this month</div>
          </CardContent>
        </Card>

        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-warning mb-2">
              {workoutStats?.avgDuration || 62}
            </div>
            <div className="text-sm text-neutral-600 mb-1">Avg Duration (min)</div>
            <div className="text-xs text-neutral-500">-3 min vs last month</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strength Progress Chart */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Strength Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="benchPress" 
                    stroke="#1976D2" 
                    strokeWidth={2}
                    name="Bench Press"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="squat" 
                    stroke="#388E3C" 
                    strokeWidth={2}
                    name="Squat"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="deadlift" 
                    stroke="#FF5722" 
                    strokeWidth={2}
                    name="Deadlift"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Volume Distribution Chart */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Volume by Muscle Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip />
                  <RechartsPieChart data={volumeData} cx="50%" cy="50%" outerRadius={80}>
                    {volumeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RechartsPieChart>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {volumeData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-neutral-600">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Records List */}
      <Card className="shadow-material-1 border border-neutral-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Recent Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPRs.map((pr, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-accent-500" />
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">{pr.exercise}</div>
                    <div className="text-sm text-neutral-600">{pr.improvement}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-accent-500">{pr.gain}</div>
                  <div className="text-xs text-neutral-500">{pr.date}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
