import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
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
import { Settings as SettingsIcon, Save, Scale, MapPin, Ruler } from "lucide-react";

const settingsSchema = z.object({
  weightUnit: z.enum(["kg", "lbs"]),
  distanceUnit: z.enum(["km", "miles"]),
  bodyMeasurementUnit: z.enum(["cm", "inches"]),
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
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        weightUnit: (user as any)?.weightUnit || "kg",
        distanceUnit: (user as any)?.distanceUnit || "km",
        bodyMeasurementUnit: (user as any)?.bodyMeasurementUnit || "cm",
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
        throw new Error(`Failed to update settings: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated!",
        description: "Your unit preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsForm) => {
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

      {/* Unit Preferences */}
      <Card className="shadow-material-1 border border-neutral-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Scale className="h-5 w-5 mr-2 text-purple-600" />
            Unit Preferences
          </CardTitle>
          <CardDescription>
            Choose your preferred units for weight, distance, and body measurements.
            These settings will be applied when creating new exercises and tracking progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weight Unit */}
                <FormField
                  control={form.control}
                  name="weightUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Scale className="h-4 w-4 mr-2" />
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
        </CardContent>
      </Card>

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
              <h4 className="font-medium text-neutral-800 mb-2">Length</h4>
              <p>1 cm = 0.394 inches</p>
              <p>1 inch = 2.54 cm</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}