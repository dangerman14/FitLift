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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
                
                {/* Weight Progress Chart */}
                <div className="h-80">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-neutral-600" />
                    Weight History
                  </h3>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} ${(user as any)?.weightUnit || "kg"}`, "Weight"]} />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                        />
                      </LineChart>
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
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Ruler className="h-5 w-5 mr-2 text-neutral-600" />
                    Body Measurements History
                  </h3>
                  {bodyMeasurements && bodyMeasurements.length > 0 ? (
                    <div className="space-y-4">
                      {bodyMeasurements.slice(0, 10).map((measurement: any, index: number) => (
                        <Card key={index} className="border border-neutral-200">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="text-sm font-medium text-neutral-900">
                                {new Date(measurement.date).toLocaleDateString()}
                              </div>
                              {measurement.notes && (
                                <div className="text-xs text-neutral-500 max-w-xs">
                                  {measurement.notes}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {measurement.chest && (
                                <div>
                                  <span className="text-neutral-600">Chest:</span>
                                  <span className="font-medium ml-1">{measurement.chest} cm</span>
                                </div>
                              )}
                              {measurement.waist && (
                                <div>
                                  <span className="text-neutral-600">Waist:</span>
                                  <span className="font-medium ml-1">{measurement.waist} cm</span>
                                </div>
                              )}
                              {measurement.hips && (
                                <div>
                                  <span className="text-neutral-600">Hips:</span>
                                  <span className="font-medium ml-1">{measurement.hips} cm</span>
                                </div>
                              )}
                              {measurement.bodyFatPercentage && (
                                <div>
                                  <span className="text-neutral-600">Body Fat:</span>
                                  <span className="font-medium ml-1">{measurement.bodyFatPercentage}%</span>
                                </div>
                              )}
                              {measurement.bicepsLeft && (
                                <div>
                                  <span className="text-neutral-600">L Bicep:</span>
                                  <span className="font-medium ml-1">{measurement.bicepsLeft} cm</span>
                                </div>
                              )}
                              {measurement.bicepsRight && (
                                <div>
                                  <span className="text-neutral-600">R Bicep:</span>
                                  <span className="font-medium ml-1">{measurement.bicepsRight} cm</span>
                                </div>
                              )}
                              {measurement.thighLeft && (
                                <div>
                                  <span className="text-neutral-600">L Thigh:</span>
                                  <span className="font-medium ml-1">{measurement.thighLeft} cm</span>
                                </div>
                              )}
                              {measurement.thighRight && (
                                <div>
                                  <span className="text-neutral-600">R Thigh:</span>
                                  <span className="font-medium ml-1">{measurement.thighRight} cm</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Ruler className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
                      <p className="text-lg text-neutral-500 mb-2">No body measurements yet</p>
                      <p className="text-sm text-neutral-400">Add your first measurement using the "Add New Body Entry" button!</p>
                    </div>
                  )}
                </div>
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