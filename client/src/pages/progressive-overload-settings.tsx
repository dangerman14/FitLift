import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  barbellIncrement: number;
  dumbbellIncrement: number;
  machineIncrement: number;
  cableIncrement: number;
  kettlebellIncrement: number;
  plateLoadedIncrement: number;
  defaultIncrement: number;
  weightUnit: string;
}

export default function ProgressiveOverloadSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<UserSettings>({
    barbellIncrement: 2.5,
    dumbbellIncrement: 2.5,
    machineIncrement: 2.5,
    cableIncrement: 2.5,
    kettlebellIncrement: 4.0,
    plateLoadedIncrement: 2.5,
    defaultIncrement: 2.5,
    weightUnit: 'kg'
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Settings Updated",
        description: "Progressive overload increments have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update progressive overload settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user) {
      setSettings({
        barbellIncrement: parseFloat(user.barbellIncrement) || 2.5,
        dumbbellIncrement: parseFloat(user.dumbbellIncrement) || 2.5,
        machineIncrement: parseFloat(user.machineIncrement) || 2.5,
        cableIncrement: parseFloat(user.cableIncrement) || 2.5,
        kettlebellIncrement: parseFloat(user.kettlebellIncrement) || 4.0,
        plateLoadedIncrement: parseFloat(user.plateLoadedIncrement) || 2.5,
        defaultIncrement: parseFloat(user.defaultIncrement) || 2.5,
        weightUnit: user.weightUnit || 'kg'
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setSettings(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const resetToDefaults = () => {
    const defaults = {
      barbellIncrement: 2.5,
      dumbbellIncrement: 2.5,
      machineIncrement: 2.5,
      cableIncrement: 2.5,
      kettlebellIncrement: 4.0,
      plateLoadedIncrement: 2.5,
      defaultIncrement: 2.5,
    };
    setSettings(prev => ({ ...prev, ...defaults }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const weightUnit = settings.weightUnit || 'kg';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Progressive Overload Settings</h1>
        </div>
        <p className="text-gray-600">
          Customize the minimum weight increments for different equipment types to match your gym's available weights.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment-Specific Increments</CardTitle>
          <CardDescription>
            Set the smallest weight increments available for each equipment type in your gym. 
            These will be used for progressive overload calculations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="barbell">Barbell Increment ({weightUnit})</Label>
              <Input
                id="barbell"
                type="number"
                step="0.25"
                min="0.25"
                value={settings.barbellIncrement}
                onChange={(e) => handleInputChange('barbellIncrement', e.target.value)}
                placeholder="2.5"
              />
              <p className="text-sm text-gray-500">
                Standard barbell plates (typically 2.5{weightUnit} or 1.25{weightUnit})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dumbbell">Dumbbell Increment ({weightUnit})</Label>
              <Input
                id="dumbbell"
                type="number"
                step="0.25"
                min="0.25"
                value={settings.dumbbellIncrement}
                onChange={(e) => handleInputChange('dumbbellIncrement', e.target.value)}
                placeholder="2.5"
              />
              <p className="text-sm text-gray-500">
                Fixed dumbbells or adjustable dumbbell increments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine">Machine Increment ({weightUnit})</Label>
              <Input
                id="machine"
                type="number"
                step="0.25"
                min="0.25"
                value={settings.machineIncrement}
                onChange={(e) => handleInputChange('machineIncrement', e.target.value)}
                placeholder="2.5"
              />
              <p className="text-sm text-gray-500">
                Weight stack machines (often 2.5{weightUnit} or 5{weightUnit})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cable">Cable Machine Increment ({weightUnit})</Label>
              <Input
                id="cable"
                type="number"
                step="0.25"
                min="0.25"
                value={settings.cableIncrement}
                onChange={(e) => handleInputChange('cableIncrement', e.target.value)}
                placeholder="2.5"
              />
              <p className="text-sm text-gray-500">
                Cable pulley systems and functional trainers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kettlebell">Kettlebell Increment ({weightUnit})</Label>
              <Input
                id="kettlebell"
                type="number"
                step="0.25"
                min="0.25"
                value={settings.kettlebellIncrement}
                onChange={(e) => handleInputChange('kettlebellIncrement', e.target.value)}
                placeholder="4.0"
              />
              <p className="text-sm text-gray-500">
                Kettlebell weight jumps (typically 4{weightUnit} or 8{weightUnit})
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plateLoaded">Plate-Loaded Increment ({weightUnit})</Label>
              <Input
                id="plateLoaded"
                type="number"
                step="0.25"
                min="0.25"
                value={settings.plateLoadedIncrement}
                onChange={(e) => handleInputChange('plateLoadedIncrement', e.target.value)}
                placeholder="2.5"
              />
              <p className="text-sm text-gray-500">
                Plate-loaded machines and equipment
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="default">Default Increment ({weightUnit})</Label>
              <Input
                id="default"
                type="number"
                step="0.25"
                min="0.25"
                value={settings.defaultIncrement}
                onChange={(e) => handleInputChange('defaultIncrement', e.target.value)}
                placeholder="2.5"
              />
              <p className="text-sm text-gray-500">
                Fallback increment for exercises without specified equipment
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>

            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          How Progressive Overload Works
        </h3>
        <p className="text-blue-700 dark:text-blue-200 text-sm">
          The app will suggest weight increases based on your equipment-specific increments. 
          For example, if you're using a barbell with 2.5{weightUnit} increments and complete 
          all reps in your target range, it will suggest adding 2.5{weightUnit} and dropping 
          back to the minimum reps in your template's range.
        </p>
      </div>
    </div>
  );
}