import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
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
  Ruler,
  Edit
} from "lucide-react";
import { useLocation, useRoute } from "wouter";

const bodyEntrySchema = z.object({
  weight: z.coerce.number().min(0.1, "Weight must be greater than 0").optional(),
  chest: z.coerce.number().min(0, "Measurement must be positive").optional(),
  shoulders: z.coerce.number().min(0, "Measurement must be positive").optional(),
  waist: z.coerce.number().min(0, "Measurement must be positive").optional(),
  abdomen: z.coerce.number().min(0, "Measurement must be positive").optional(),
  hips: z.coerce.number().min(0, "Measurement must be positive").optional(),
  bicepsLeft: z.coerce.number().min(0, "Measurement must be positive").optional(),
  bicepsRight: z.coerce.number().min(0, "Measurement must be positive").optional(),
  thighLeft: z.coerce.number().min(0, "Measurement must be positive").optional(),
  thighRight: z.coerce.number().min(0, "Measurement must be positive").optional(),
  bodyFatPercentage: z.coerce.number().min(0).max(100, "Body fat must be between 0-100%").optional(),
  notes: z.string().optional(),
});

type BodyEntryForm = z.infer<typeof bodyEntrySchema>;

export default function EditBodyEntry() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/body-tracking/edit/:date");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const date = params?.date || new Date().toISOString().split('T')[0];

  // Get existing entries for the date
  const { data: existingEntries } = useQuery({
    queryKey: ["/api/body-measurements"],
    enabled: !!user
  });

  const { data: existingWeight } = useQuery({
    queryKey: ["/api/user/bodyweight"],
    enabled: !!user
  });

  // Find today's entries
  const todayMeasurement = Array.isArray(existingEntries) ? existingEntries.find((entry: any) => 
    new Date(entry.date).toISOString().split('T')[0] === date
  ) : null;

  const todayWeight = Array.isArray(existingWeight) ? existingWeight.find((entry: any) => 
    new Date(entry.measurementDate).toISOString().split('T')[0] === date
  ) : null;

  const form = useForm<BodyEntryForm>({
    resolver: zodResolver(bodyEntrySchema),
    defaultValues: {
      weight: todayWeight?.weight ? parseFloat(todayWeight.weight) : undefined,
      chest: todayMeasurement?.chest || undefined,
      shoulders: todayMeasurement?.shoulders || undefined,
      waist: todayMeasurement?.waist || undefined,
      abdomen: todayMeasurement?.abdomen || undefined,
      hips: todayMeasurement?.hips || undefined,
      bicepsLeft: todayMeasurement?.bicepsLeft || undefined,
      bicepsRight: todayMeasurement?.bicepsRight || undefined,
      thighLeft: todayMeasurement?.thighLeft || undefined,
      thighRight: todayMeasurement?.thighRight || undefined,
      bodyFatPercentage: todayMeasurement?.bodyFatPercentage || undefined,
      notes: todayMeasurement?.notes || "",
    },
  });

  // Update form values when data loads
  useEffect(() => {
    if (todayWeight || todayMeasurement) {
      form.reset({
        weight: todayWeight?.weight ? parseFloat(todayWeight.weight) : undefined,
        chest: todayMeasurement?.chest || undefined,
        shoulders: todayMeasurement?.shoulders || undefined,
        waist: todayMeasurement?.waist || undefined,
        abdomen: todayMeasurement?.abdomen || undefined,
        hips: todayMeasurement?.hips || undefined,
        bicepsLeft: todayMeasurement?.bicepsLeft || undefined,
        bicepsRight: todayMeasurement?.bicepsRight || undefined,
        thighLeft: todayMeasurement?.thighLeft || undefined,
        thighRight: todayMeasurement?.thighRight || undefined,
        bodyFatPercentage: todayMeasurement?.bodyFatPercentage || undefined,
        notes: todayMeasurement?.notes || "",
      });
    }
  }, [todayWeight, todayMeasurement, form]);

  const updateEntryMutation = useMutation({
    mutationFn: async (data: BodyEntryForm) => {
      const jsonData: any = {};
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          jsonData[key] = value;
        }
      });
      
      console.log('Updating entry with data:', jsonData);

      const response = await fetch("/api/body-entry", {
        method: "PUT", // Use PUT for updates
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ...jsonData, date }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update body entry: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry Updated!",
        description: "Your body tracking data has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bodyweight/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bodyweight"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress-photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/body-measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation('/body-tracking');
    },
    onError: (error: any) => {
      console.error("Body entry update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update body entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BodyEntryForm) => {
    updateEntryMutation.mutate(data);
  };

  if (!user) {
    return <div>Please log in to edit body entries.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
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
          <Edit className="h-8 w-8 mr-3 text-blue-600" />
          Edit Body Entry
        </h1>
        <p className="text-neutral-600">
          Update your body tracking data for {new Date(date).toLocaleDateString()}.
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
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "chest", label: "Chest" },
                { name: "shoulders", label: "Shoulders" },
                { name: "waist", label: "Waist" },
                { name: "abdomen", label: "Abdomen" },
                { name: "hips", label: "Hips" },
                { name: "bicepsLeft", label: "Left Bicep" },
                { name: "bicepsRight", label: "Right Bicep" },
                { name: "thighLeft", label: "Left Thigh" },
                { name: "thighRight", label: "Right Thigh" },
                { name: "bodyFatPercentage", label: "Body Fat %" },
              ].map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as keyof BodyEntryForm}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label} ({name === "bodyFatPercentage" ? "%" : (user as any)?.bodyMeasurementUnit || "cm"})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={name === "bodyFatPercentage" ? "0.1" : "0.5"}
                          placeholder={`Enter ${label.toLowerCase()}`}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
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
            disabled={updateEntryMutation.isPending}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
            size="lg"
          >
            <Save className="h-5 w-5 mr-2" />
            {updateEntryMutation.isPending ? "Updating Entry..." : "Update Body Entry"}
          </Button>
        </form>
      </Form>
    </div>
  );
}