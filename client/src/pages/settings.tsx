import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Save, MapPin, Ruler, History, MoreHorizontal } from "lucide-react";

const settingsSchema = z.object({
  weightUnit: z.enum(["kg", "lbs"]),
  distanceUnit: z.enum(["km", "miles"]),
  bodyMeasurementUnit: z.enum(["cm", "inches"]),
  previousWorkoutMode: z.enum(["any_workout", "same_routine"]),
  partialRepsEnabled: z.boolean(),
  partialRepsVolumeWeight: z.string().default("none"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      weightUnit: "kg",
      distanceUnit: "km", 
      bodyMeasurementUnit: "cm",
      previousWorkoutMode: "any_workout",
      partialRepsEnabled: false,
      partialRepsVolumeWeight: "none",
    },
  });



  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        weightUnit: (user as any)?.weightUnit || "kg",
        distanceUnit: (user as any)?.distanceUnit || "km",
        bodyMeasurementUnit: (user as any)?.bodyMeasurementUnit || "cm",
        previousWorkoutMode: (user as any)?.previousWorkoutMode || "any_workout",
        partialRepsEnabled: (user as any)?.partialRepsEnabled || false,
        partialRepsVolumeWeight: (user as any)?.partialRepsVolumeWeight || "none",
      });
    }
  }, [user, form]);



  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update settings: ${response.status} - ${errorText}`);
      }
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        return {}; // Return empty object if no JSON content
      }
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated!",
        description: "Your preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      console.error("Settings update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsForm) => {
    console.log("Form submitted with data:", data);
    updateSettingsMutation.mutate(data);
  };



  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center mb-2">
          <SettingsIcon className="h-8 w-8 mr-3 text-blue-600" />
          Settings
        </h1>
        <p className="text-neutral-600">
          Customize your workout experience and unit preferences.
        </p>
      </div>

      {/* Settings Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Unit Preferences */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ruler className="h-5 w-5 mr-2 text-purple-600" />
                Unit Preferences
              </CardTitle>
              <CardDescription>
                Choose your preferred units for weight, distance, and body measurements.
                These settings will be applied when creating new exercises and tracking progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weight Unit */}
                <FormField
                  control={form.control}
                  name="weightUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Ruler className="h-4 w-4 mr-2" />
                        Weight Unit
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2">
                            <SelectValue placeholder="Select weight unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Distance Unit */}
                <FormField
                  control={form.control}
                  name="distanceUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Distance Unit
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2">
                            <SelectValue placeholder="Select distance unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="km">Kilometers (km)</SelectItem>
                          <SelectItem value="miles">Miles</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Body Measurement Unit */}
                <FormField
                  control={form.control}
                  name="bodyMeasurementUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Ruler className="h-4 w-4 mr-2" />
                        Body Measurements
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2">
                            <SelectValue placeholder="Select measurement unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cm">Centimeters (cm)</SelectItem>
                          <SelectItem value="inches">Inches (in)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>



          {/* Workout Settings */}
          <Card className="border-2 border-gradient rounded-3xl shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <History className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Workout Settings</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Configure how your workouts display previous exercise data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                {/* Previous Workout Mode */}
                <FormField
                  control={form.control}
                  name="previousWorkoutMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base font-medium">
                        <History className="h-4 w-4 mr-2" />
                        Previous Workout Visualization
                      </FormLabel>
                      <div className="text-sm text-muted-foreground mb-3">
                        Choose how to display previous exercise data during workouts
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2">
                            <SelectValue placeholder="Select previous workout mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="any_workout">Any Workout - Last time you did this exercise</SelectItem>
                          <SelectItem value="same_routine">Same Routine - Last time you did this specific routine</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Partial Reps Settings */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MoreHorizontal className="h-5 w-5 mr-2 text-orange-600" />
                    Partial Reps Logging
                  </h3>
                  
                  {/* Enable Partial Reps */}
                  <FormField
                    control={form.control}
                    name="partialRepsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">
                            Enable Partial Reps
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Allow tracking partial reps during workout sessions. Display format: "10 (3)" for 10 full reps + 3 partial reps.
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Volume Calculation for Partial Reps */}
                  <FormField
                    control={form.control}
                    name="partialRepsVolumeWeight"
                    render={({ field }) => (
                      <FormItem className={form.watch('partialRepsEnabled') ? '' : 'opacity-50'}>
                        <FormLabel className="flex items-center text-base font-medium">
                          <MoreHorizontal className="h-4 w-4 mr-2" />
                          Partial Reps Volume Calculation
                        </FormLabel>
                        <div className="text-sm text-muted-foreground mb-3">
                          Choose how partial reps contribute to total volume calculations
                        </div>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!form.watch('partialRepsEnabled')}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-xl border-2">
                              <SelectValue placeholder="Select volume calculation method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Don't Count - Partial reps don't contribute to volume</SelectItem>
                            <SelectItem value="half">Half Weight - Partial reps count as 50% of full rep weight</SelectItem>
                            <SelectItem value="full">Full Weight - Partial reps count same as full reps</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Unit Conversion Info */}
      <Card className="shadow-material-1 border border-neutral-200 mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Unit Conversion Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
            <div>
              <h4 className="font-medium text-neutral-800 mb-2">Weight</h4>
              <p>1 kg = 2.205 lbs</p>
              <p>1 lb = 0.453 kg</p>
            </div>
            <div>
              <h4 className="font-medium text-neutral-800 mb-2">Distance</h4>
              <p>1 km = 0.621 miles</p>
              <p>1 mile = 1.609 km</p>
            </div>
            <div>
              <h4 className="font-medium text-neutral-800 mb-2">Body Measurements</h4>
              <p>1 cm = 0.394 inches</p>
              <p>1 inch = 2.54 cm</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}