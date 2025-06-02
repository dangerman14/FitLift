import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Scale,
  Save,
  Camera,
  ArrowLeft,
  Ruler
} from "lucide-react";
import { useLocation } from "wouter";

const bodyEntrySchema = z.object({
  weight: z.number().min(0.1, "Weight must be greater than 0").optional(),
  chest: z.number().min(0, "Measurement must be positive").optional(),
  shoulders: z.number().min(0, "Measurement must be positive").optional(),
  waist: z.number().min(0, "Measurement must be positive").optional(),
  abdomen: z.number().min(0, "Measurement must be positive").optional(),
  hips: z.number().min(0, "Measurement must be positive").optional(),
  bicepsLeft: z.number().min(0, "Measurement must be positive").optional(),
  bicepsRight: z.number().min(0, "Measurement must be positive").optional(),
  thighLeft: z.number().min(0, "Measurement must be positive").optional(),
  thighRight: z.number().min(0, "Measurement must be positive").optional(),
  bodyFatPercentage: z.number().min(0).max(100, "Body fat must be between 0-100%").optional(),
  notes: z.string().optional(),
});

type BodyEntryForm = z.infer<typeof bodyEntrySchema>;

export default function AddBodyEntry() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<BodyEntryForm>({
    resolver: zodResolver(bodyEntrySchema),
    defaultValues: {
      weight: undefined,
      chest: undefined,
      shoulders: undefined,
      waist: undefined,
      abdomen: undefined,
      hips: undefined,
      bicepsLeft: undefined,
      bicepsRight: undefined,
      thighLeft: undefined,
      thighRight: undefined,
      bodyFatPercentage: undefined,
      notes: "",
    },
  });

  // Body entry submission mutation
  const addEntryMutation = useMutation({
    mutationFn: async (data: BodyEntryForm) => {
      // Prepare JSON data instead of FormData for now
      const jsonData: any = {};
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          jsonData[key] = value;
        }
      });
      
      console.log('Sending data to API:', jsonData);

      const response = await fetch("/api/body-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(jsonData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save body entry: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Body Entry Saved!",
        description: "Your body tracking data has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bodyweight/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bodyweight"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress-photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/body-measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation('/body-tracking');
    },
    onError: (error: any) => {
      console.error("Body entry error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save body entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const onSubmit = (data: BodyEntryForm) => {
    // Check if at least one field is filled
    const hasData = Object.values(data).some(value => 
      value !== undefined && value !== null && value !== ""
    ) || selectedPhoto;

    if (!hasData) {
      toast({
        title: "No Data Entered",
        description: "Please enter at least one measurement, weight, or photo.",
        variant: "destructive",
      });
      return;
    }

    addEntryMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/body-tracking')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Body Tracking
          </Button>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center mb-2">
          <Scale className="h-8 w-8 mr-3 text-blue-600" />
          Add Body Entry
        </h1>
        <p className="text-neutral-600">
          Record your weight, body measurements, and progress photos all in one entry.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Weight Section */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Scale className="h-5 w-5 mr-2 text-blue-600" />
                Body Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight ({(user as any)?.weightUnit || "kg"})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Enter your current weight"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Body Measurements Section */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Ruler className="h-5 w-5 mr-2 text-green-600" />
                Body Measurements
              </CardTitle>
              <p className="text-sm text-muted-foreground">All measurements in cm</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="chest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chest</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Chest measurement"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shoulders"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shoulders</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Shoulder measurement"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waist</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Waist measurement"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="abdomen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abdomen</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Abdomen measurement"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hips"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hips</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Hip measurement"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bodyFatPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Fat %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Body fat percentage"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bicepsLeft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Left Bicep</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Left bicep measurement"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bicepsRight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Right Bicep</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Right bicep measurement"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thighLeft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Left Thigh</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Left thigh measurement"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thighRight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Right Thigh</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Right thigh measurement"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Progress Photo Section */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Camera className="h-5 w-5 mr-2 text-purple-600" />
                Progress Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!photoPreview ? (
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                    onChange={handlePhotoSelect}
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-neutral-900">Upload Progress Photo</p>
                        <p className="text-sm text-neutral-500">PNG, JPG up to 10MB (optional)</p>
                      </div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Progress photo preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removePhoto}
                      className="absolute top-2 right-2"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about your progress, how you're feeling, workout routine changes, etc."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={addEntryMutation.isPending}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
            size="lg"
          >
            <Save className="h-5 w-5 mr-2" />
            {addEntryMutation.isPending ? "Saving Entry..." : "Save Body Entry"}
          </Button>
        </form>
      </Form>
    </div>
  );
}