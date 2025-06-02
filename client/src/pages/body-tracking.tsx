import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { 
  Scale,
  Save,
  Camera,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Edit
} from "lucide-react";
import { 
  ChestIcon, 
  ShoulderIcon, 
  WaistIcon, 
  AbdomenIcon, 
  HipIcon, 
  BicepIcon, 
  ThighIcon, 
  BodyFatIcon 
} from "@/components/measurement-icons";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  Legend
} from "recharts";



export default function BodyTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weightDateFilter, setWeightDateFilter] = useState("3m");
  const [measurementDateFilter, setMeasurementDateFilter] = useState("3m");
  
  // State for hiding/showing chart lines
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  // Handler for toggling legend visibility
  const handleLegendClick = (data: any, index: number, event: any) => {
    const dataKey = data.dataKey;
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  // Get current body weight
  const { data: currentBodyweight, isLoading: isLoadingBodyweight } = useQuery({
    queryKey: ["/api/user/bodyweight/current"],
  });

  // Get body weight history for chart
  const { data: bodyWeightHistory, isLoading: isLoadingWeightHistory, error: weightHistoryError } = useQuery({
    queryKey: ["/api/user/bodyweight"],
    queryFn: async () => {
      const res = await fetch("/api/user/bodyweight", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch weight history: ${res.status}`);
      }
      const data = await res.json();
      console.log('Weight history API response:', data);
      return data;
    },
  });

  // Get progress photos
  const { data: progressPhotos } = useQuery({
    queryKey: ["/api/progress-photos"],
    queryFn: () => fetch("/api/progress-photos", { credentials: "include" }).then(res => res.json()),
  });

  // Get body measurements
  const { data: bodyMeasurements } = useQuery({
    queryKey: ["/api/body-measurements"],
    queryFn: () => fetch("/api/body-measurements", { credentials: "include" }).then(res => res.json()),
  });



  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/progress-photos", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload photo: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo Uploaded!",
        description: "Your progress photo has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress-photos"] });
    },
    onError: (error: any) => {
      console.error("Photo upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });



  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);
    if (currentBodyweight) {
      formData.append("weight", currentBodyweight.toString());
    }

    uploadPhotoMutation.mutate(formData);
  };

  // Helper function to filter data by date range
  const filterDataByDateRange = (data: any[], dateFilter: string, dateField: string) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (dateFilter) {
      case "30d":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3m":
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        return data;
    }
    
    return data.filter((item: any) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= cutoffDate;
    });
  };

  // Transform and filter bodyweight history for chart
  const allChartData = bodyWeightHistory?.map((entry: any) => ({
    date: entry.measurementDate, // Keep as YYYY-MM-DD format for proper chart sorting
    weight: parseFloat(entry.weight),
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  
  const chartData = filterDataByDateRange(allChartData, weightDateFilter, 'date');

  // Filter body measurements data
  const filteredBodyMeasurements = filterDataByDateRange(bodyMeasurements || [], measurementDateFilter, 'date');

  // Helper functions for calendar
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Get all entries dates for easy lookup
  const entryDates = new Set([
    ...(bodyWeightHistory || []).map((entry: any) => entry.measurementDate),
    ...(bodyMeasurements || []).map((entry: any) => entry.date)
  ]);

  const handleDateClick = (dateStr: string) => {
    setLocation(`/body-tracking/entry/${dateStr}`);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };



  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/profile')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center mb-2">
          <Scale className="h-8 w-8 mr-3 text-blue-600" />
          Body Tracking
        </h1>
        <p className="text-neutral-600">
          Track your body weight progress and upload transformation photos to visualize your fitness journey.
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentBodyweight || "—"}
              </div>
              <div className="text-sm text-neutral-600">
                Current Weight ({(user as any)?.weightUnit || "kg"})
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {bodyWeightHistory?.length || 0}
              </div>
              <div className="text-sm text-neutral-600">Weight Entries</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {bodyMeasurements?.length || 0}
              </div>
              <div className="text-sm text-neutral-600">Measurements</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progressPhotos?.length || 0}
              </div>
              <div className="text-sm text-neutral-600">Progress Photos</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Entry Button */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-6">
            <div className="text-center">
              <Button
                onClick={() => setLocation('/add-body-entry')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 text-lg"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Add New Body Entry
              </Button>
              <p className="text-sm text-neutral-600 mt-2">
                Record weight, measurements, and progress photos all in one place
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Tracking Interface */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Your Progress History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weight" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="weight">Weight Progress</TabsTrigger>
                <TabsTrigger value="measurements">Body Measurements</TabsTrigger>
                <TabsTrigger value="photos">Progress Photos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weight" className="space-y-6">
                {/* Enhanced Weight Progress Chart */}
                <Card className="border border-neutral-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center">
                          <TrendingUp className="h-6 w-6 mr-3 text-blue-600" />
                          Weight Progress Journey
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Track your weight changes over time
                        </p>
                      </div>
                      <Select value={weightDateFilter} onValueChange={setWeightDateFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30d">30 Days</SelectItem>
                          <SelectItem value="3m">3 Months</SelectItem>
                          <SelectItem value="1y">1 Year</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <defs>
                              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              domain={['dataMin - 1', 'dataMax + 1']}
                              label={{ value: `Weight (${(user as any)?.weightUnit || "kg"})`, angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                              }}
                              formatter={(value, name) => [
                                `${value} ${(user as any)?.weightUnit || "kg"}`,
                                "Weight"
                              ]}
                              labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            />
                            <Area
                              type="monotone"
                              dataKey="weight"
                              stroke="#3b82f6"
                              strokeWidth={3}
                              fill="url(#weightGradient)"
                              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                              activeDot={{ r: 8, stroke: "#3b82f6", strokeWidth: 3, fill: "white" }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-neutral-500">
                          <div className="text-center">
                            <Scale className="h-16 w-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">No weight data yet</p>
                            <p className="text-sm">Add your first entry to start tracking your progress!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Weight Statistics Cards */}
                {chartData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">Current Weight</p>
                            <p className="text-2xl font-bold text-green-900">
                              {chartData[chartData.length - 1]?.weight} {(user as any)?.weightUnit || "kg"}
                            </p>
                          </div>
                          <Scale className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">Weight Change</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {chartData.length > 1 ? (
                                (chartData[chartData.length - 1]?.weight - chartData[0]?.weight > 0 ? '+' : '') +
                                (chartData[chartData.length - 1]?.weight - chartData[0]?.weight).toFixed(1)
                              ) : '0.0'} {(user as any)?.weightUnit || "kg"}
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-800">Total Entries</p>
                            <p className="text-2xl font-bold text-purple-900">{chartData.length}</p>
                          </div>
                          <Calendar className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="measurements" className="space-y-6">
                {/* Interactive Measurement Charts */}
                {bodyMeasurements && bodyMeasurements.length > 0 ? (
                  <div className="space-y-8">
                    {/* Upper Body Measurements Chart */}
                    <Card className="border border-neutral-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center">
                            <Ruler className="h-5 w-5 mr-2 text-green-600" />
                            Body Measurements Progress
                          </CardTitle>
                          <Select value={measurementDateFilter} onValueChange={setMeasurementDateFilter}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30d">30 Days</SelectItem>
                              <SelectItem value="3m">3 Months</SelectItem>
                              <SelectItem value="1y">1 Year</SelectItem>
                              <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredBodyMeasurements.slice().reverse()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              />
                              <YAxis 
                                tick={{ fontSize: 12 }} 
                                domain={['dataMin - 8', 'dataMax + 2']}
                                tickFormatter={(value) => Math.round(value).toString()}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value, name) => [`${value} cm`, name]}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              />
                              <Legend onClick={handleLegendClick} />
                              <Line 
                                type="monotone" 
                                dataKey="chest" 
                                stroke="#ef4444" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                name="Chest"
                                hide={hiddenLines.has("chest")}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="shoulders" 
                                stroke="#f97316" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                name="Shoulders"
                                hide={hiddenLines.has("shoulders")}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="bicepsLeft" 
                                stroke="#eab308" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                name="Left Bicep"
                                hide={hiddenLines.has("bicepsLeft")}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="bicepsRight" 
                                stroke="#facc15" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                name="Right Bicep"
                                hide={hiddenLines.has("bicepsRight")}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Core & Lower Body Chart */}
                    <Card className="border border-neutral-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                            Core & Lower Body Progress
                          </CardTitle>
                          <Select value={measurementDateFilter} onValueChange={setMeasurementDateFilter}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30d">30 Days</SelectItem>
                              <SelectItem value="3m">3 Months</SelectItem>
                              <SelectItem value="1y">1 Year</SelectItem>
                              <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredBodyMeasurements.slice().reverse()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              />
                              <YAxis 
                                tick={{ fontSize: 12 }} 
                                domain={['dataMin - 8', 'dataMax + 2']}
                                tickFormatter={(value) => Math.round(value).toString()}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value, name) => [`${value} cm`, name]}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              />
                              <Legend onClick={handleLegendClick} />
                              <Line 
                                type="monotone" 
                                dataKey="waist" 
                                stroke="#8b5cf6" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                name="Waist"
                                hide={hiddenLines.has("waist")}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="abdomen" 
                                stroke="#a855f7" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                name="Abdomen"
                                hide={hiddenLines.has("abdomen")}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="hips" 
                                stroke="#c084fc" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                name="Hips"
                                hide={hiddenLines.has("hips")}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="thighLeft" 
                                stroke="#06b6d4" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                name="Left Thigh"
                                hide={hiddenLines.has("thighLeft")}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="thighRight" 
                                stroke="#0891b2" 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                name="Right Thigh"
                                hide={hiddenLines.has("thighRight")}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Body Fat Percentage Chart */}
                    <Card className="border border-neutral-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center">
                            <Scale className="h-5 w-5 mr-2 text-red-600" />
                            Body Fat Percentage
                          </CardTitle>
                          <Select value={measurementDateFilter} onValueChange={setMeasurementDateFilter}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30d">30 Days</SelectItem>
                              <SelectItem value="3m">3 Months</SelectItem>
                              <SelectItem value="1y">1 Year</SelectItem>
                              <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredBodyMeasurements.slice().reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="bodyFatGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              />
                              <YAxis 
                                tick={{ fontSize: 12 }} 
                                domain={['dataMin - 3', 'dataMax + 1']}
                                tickFormatter={(value) => Math.round(value).toString()}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value) => [`${value}%`, "Body Fat"]}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              />
                              <Area
                                type="monotone"
                                dataKey="bodyFatPercentage"
                                stroke="#dc2626"
                                strokeWidth={3}
                                fill="url(#bodyFatGradient)"
                                dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: "#dc2626", strokeWidth: 2 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Measurements List */}
                    <Card className="border border-neutral-200">
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Measurements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {bodyMeasurements.slice(0, 5).map((measurement: any, index: number) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div className="text-sm font-medium text-neutral-900">
                                  {new Date(measurement.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  {measurement.notes && (
                                    <div className="text-xs text-neutral-500 max-w-xs italic">
                                      "{measurement.notes}"
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setLocation(`/body-tracking/edit/${new Date(measurement.date).toISOString().split('T')[0]}`)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                {measurement.chest && (
                                  <div className="flex items-center gap-1">
                                    <ChestIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">Chest:</span> 
                                    <span className="font-medium">{measurement.chest}cm</span>
                                  </div>
                                )}
                                {measurement.shoulders && (
                                  <div className="flex items-center gap-1">
                                    <ShoulderIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">Shoulders:</span> 
                                    <span className="font-medium">{measurement.shoulders}cm</span>
                                  </div>
                                )}
                                {measurement.waist && (
                                  <div className="flex items-center gap-1">
                                    <WaistIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">Waist:</span> 
                                    <span className="font-medium">{measurement.waist}cm</span>
                                  </div>
                                )}
                                {measurement.abdomen && (
                                  <div className="flex items-center gap-1">
                                    <AbdomenIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">Abdomen:</span> 
                                    <span className="font-medium">{measurement.abdomen}cm</span>
                                  </div>
                                )}
                                {measurement.hips && (
                                  <div className="flex items-center gap-1">
                                    <HipIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">Hips:</span> 
                                    <span className="font-medium">{measurement.hips}cm</span>
                                  </div>
                                )}
                                {measurement.bicepsLeft && (
                                  <div className="flex items-center gap-1">
                                    <BicepIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">L. Bicep:</span> 
                                    <span className="font-medium">{measurement.bicepsLeft}cm</span>
                                  </div>
                                )}
                                {measurement.bicepsRight && (
                                  <div className="flex items-center gap-1">
                                    <BicepIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">R. Bicep:</span> 
                                    <span className="font-medium">{measurement.bicepsRight}cm</span>
                                  </div>
                                )}
                                {measurement.thighLeft && (
                                  <div className="flex items-center gap-1">
                                    <ThighIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">L. Thigh:</span> 
                                    <span className="font-medium">{measurement.thighLeft}cm</span>
                                  </div>
                                )}
                                {measurement.thighRight && (
                                  <div className="flex items-center gap-1">
                                    <ThighIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">R. Thigh:</span> 
                                    <span className="font-medium">{measurement.thighRight}cm</span>
                                  </div>
                                )}
                                {measurement.bodyFatPercentage && (
                                  <div className="flex items-center gap-1">
                                    <BodyFatIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-neutral-600">Body Fat:</span> 
                                    <span className="font-medium">{measurement.bodyFatPercentage}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Ruler className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                    <p className="text-lg text-neutral-500 mb-2">No body measurements yet</p>
                    <p className="text-sm text-neutral-400">Add your first measurement using the "Add New Body Entry" button!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="photos" className="space-y-6">
                {/* Upload New Photo */}
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                    onChange={handlePhotoUpload}
                    disabled={uploadPhotoMutation.isPending}
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-neutral-900">
                          {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Progress Photo"}
                        </p>
                        <p className="text-sm text-neutral-500">PNG, JPG up to 10MB</p>
                        {currentBodyweight && (
                          <p className="text-xs text-neutral-400 mt-1">
                            Current weight ({currentBodyweight} {(user as any)?.weightUnit || "kg"}) will be recorded with this photo
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Progress Photos Grid */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Camera className="h-5 w-5 mr-2 text-neutral-600" />
                    Your Transformation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {progressPhotos && progressPhotos.length > 0 ? (
                      progressPhotos.map((photo: any, index: number) => (
                        <div key={index} className="relative group">
                          <img 
                            src={photo.imageUrl} 
                            alt={`Progress ${new Date(photo.dateTaken).toLocaleDateString()}`}
                            className="w-full h-48 object-cover rounded-lg shadow-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <div className="text-white text-center">
                              <p className="text-sm font-medium">{new Date(photo.dateTaken).toLocaleDateString()}</p>
                              {photo.weight && (
                                <p className="text-xs">{photo.weight} {(user as any)?.weightUnit || "kg"}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <Camera className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                        <p className="text-lg text-neutral-500 mb-2">No progress photos yet</p>
                        <p className="text-sm text-neutral-400">Upload your first photo to start tracking your transformation!</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>


            </Tabs>
          </CardContent>
        </Card>

        {/* Progress Calendar Section */}
        <Card className="shadow-material-1 border border-neutral-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Progress Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-32 text-center">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-neutral-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {(() => {
                  const daysInMonth = getDaysInMonth(currentMonth);
                  const firstDay = getFirstDayOfMonth(currentMonth);
                  const days = [];
                  
                  // Empty cells for days before the first day of the month
                  for (let i = 0; i < firstDay; i++) {
                    days.push(
                      <div key={`empty-${i}`} className="p-2 h-12"></div>
                    );
                  }
                  
                  // Days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const dateStr = formatDateForComparison(date);
                    const hasEntry = entryDates.has(dateStr);
                    const isToday = dateStr === formatDateForComparison(new Date());
                    
                    days.push(
                      <div
                        key={day}
                        className={`
                          p-2 h-12 flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all
                          ${hasEntry 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 shadow-md' 
                            : 'hover:bg-neutral-100 text-neutral-700'
                          }
                          ${isToday ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                        `}
                        onClick={() => hasEntry ? handleDateClick(dateStr) : null}
                      >
                        {day}
                      </div>
                    );
                  }
                  
                  return days;
                })()}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 text-sm text-neutral-600 pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
                  <span>Has progress entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 rounded"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}