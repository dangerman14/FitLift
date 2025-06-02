import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scale,
  Save,
  Camera,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Ruler
} from "lucide-react";
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
import { useLocation } from "wouter";

const bodyWeightSchema = z.object({
  weight: z.number().min(0.1, "Weight must be greater than 0"),
});

type BodyWeightForm = z.infer<typeof bodyWeightSchema>;

export default function BodyTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [weightInput, setWeightInput] = useState("");

  // Get current body weight
  const { data: currentBodyweight, isLoading: isLoadingBodyweight } = useQuery({
    queryKey: ["/api/user/bodyweight/current"],
  });

  // Get body weight history for chart
  const { data: bodyWeightHistory } = useQuery({
    queryKey: ["/api/user/bodyweight"],
    queryFn: () => fetch("/api/user/bodyweight", { credentials: "include" }).then(res => res.json()),
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
        title: "Body Weight Added!",
        description: "Your body weight entry has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bodyweight/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bodyweight"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setWeightInput("");
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

  // Transform bodyweight history for chart
  const chartData = bodyWeightHistory?.map((entry: any) => ({
    date: new Date(entry.measurementDate).toLocaleDateString(),
    weight: parseFloat(entry.weight),
  })) || [];

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
                {/* Add Weight Entry */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
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
                        Last recorded: {currentBodyweight} {(user as any)?.weightUnit || "kg"}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleBodyWeightSubmit}
                    disabled={updateBodyweightMutation.isPending || !weightInput}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateBodyweightMutation.isPending ? "Saving..." : "Add Entry"}
                  </Button>
                </div>
                
                {/* Enhanced Weight Progress Chart */}
                <div className="h-96">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Weight Progress Trend
                  </h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          domain={['dataMin - 2', 'dataMax + 2']}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value, name) => [
                            `${value} ${(user as any)?.weightUnit || "kg"}`,
                            "Weight"
                          ]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        />
                        <Area
                          type="monotone"
                          dataKey="weight"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          fill="url(#weightGradient)"
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                      <div className="text-center">
                        <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No weight data yet. Add your first entry to see your progress!</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="measurements" className="space-y-6">
                {/* Interactive Measurement Charts */}
                {bodyMeasurements && bodyMeasurements.length > 0 ? (
                  <div className="space-y-8">
                    {/* Upper Body Measurements Chart */}
                    <Card className="border border-neutral-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Ruler className="h-5 w-5 mr-2 text-green-600" />
                          Upper Body Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bodyMeasurements.slice().reverse()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
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
                              <Legend />
                              <Line type="monotone" dataKey="chest" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Chest" />
                              <Line type="monotone" dataKey="shoulders" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Shoulders" />
                              <Line type="monotone" dataKey="bicepsLeft" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} name="Left Bicep" />
                              <Line type="monotone" dataKey="bicepsRight" stroke="#facc15" strokeWidth={2} dot={{ r: 3 }} name="Right Bicep" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Core & Lower Body Chart */}
                    <Card className="border border-neutral-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                          Core & Lower Body Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bodyMeasurements.slice().reverse()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
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
                              <Legend />
                              <Line type="monotone" dataKey="waist" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Waist" />
                              <Line type="monotone" dataKey="abdomen" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="Abdomen" />
                              <Line type="monotone" dataKey="hips" stroke="#c084fc" strokeWidth={2} dot={{ r: 3 }} name="Hips" />
                              <Line type="monotone" dataKey="thighLeft" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name="Left Thigh" />
                              <Line type="monotone" dataKey="thighRight" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} name="Right Thigh" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Body Fat Percentage Chart */}
                    <Card className="border border-neutral-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Scale className="h-5 w-5 mr-2 text-red-600" />
                          Body Fat Percentage
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={bodyMeasurements.slice().reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                              <YAxis tick={{ fontSize: 12 }} />
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
                                {measurement.notes && (
                                  <div className="text-xs text-neutral-500 max-w-xs italic">
                                    "{measurement.notes}"
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                {measurement.chest && <div><span className="text-neutral-600">Chest:</span> <span className="font-medium">{measurement.chest}cm</span></div>}
                                {measurement.shoulders && <div><span className="text-neutral-600">Shoulders:</span> <span className="font-medium">{measurement.shoulders}cm</span></div>}
                                {measurement.waist && <div><span className="text-neutral-600">Waist:</span> <span className="font-medium">{measurement.waist}cm</span></div>}
                                {measurement.abdomen && <div><span className="text-neutral-600">Abdomen:</span> <span className="font-medium">{measurement.abdomen}cm</span></div>}
                                {measurement.bodyFatPercentage && <div><span className="text-neutral-600">Body Fat:</span> <span className="font-medium">{measurement.bodyFatPercentage}%</span></div>}
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
      </div>
    </div>
  );
}