import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Timer } from "lucide-react";

interface ExerciseSetInputProps {
  exerciseType: string;
  set: {
    weight?: number;
    reps?: number;
    duration?: number;
    distance?: number;
    assistanceWeight?: number;
    completed: boolean;
  };
  onChange: (updates: any) => void;
  previousData?: {
    weight?: number;
    reps?: number;
    duration?: number;
    distance?: number;
  };
  userBodyweight?: number;
  isCompleted?: boolean;
}

export default function ExerciseSetInput({
  exerciseType,
  set,
  onChange,
  previousData,
  userBodyweight,
  isCompleted = false
}: ExerciseSetInputProps) {
  const [durationDisplay, setDurationDisplay] = useState("");

  // Convert seconds to MM:SS format for display
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Parse MM:SS format to seconds
  const parseDuration = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length !== 2) return 0;
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  };

  // Initialize duration display
  useEffect(() => {
    if (set.duration) {
      setDurationDisplay(formatDuration(set.duration));
    }
  }, [set.duration]);

  const handleDurationChange = (value: string) => {
    setDurationDisplay(value);
    const seconds = parseDuration(value);
    onChange({ duration: seconds });
  };

  const renderInputFields = () => {
    switch (exerciseType) {
      case 'weight_reps':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Weight</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
                  placeholder={previousData?.weight ? previousData.weight.toString() : "0"}
                  className="pr-8"
                  disabled={isCompleted}
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">lbs</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input
                type="number"
                value={set.reps || ''}
                onChange={(e) => onChange({ reps: parseInt(e.target.value) || 0 })}
                placeholder={previousData?.reps ? previousData.reps.toString() : "0"}
                disabled={isCompleted}
              />
            </div>
          </div>
        );

      case 'duration':
        return (
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Timer size={12} />
              Duration (MM:SS)
            </Label>
            <Input
              type="text"
              value={durationDisplay}
              onChange={(e) => handleDurationChange(e.target.value)}
              placeholder={previousData?.duration ? formatDuration(previousData.duration) : "0:00"}
              pattern="[0-9]*:[0-5][0-9]"
              disabled={isCompleted}
            />
          </div>
        );

      case 'duration_weight':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Timer size={12} />
                Duration (MM:SS)
              </Label>
              <Input
                type="text"
                value={durationDisplay}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder={previousData?.duration ? formatDuration(previousData.duration) : "0:00"}
                pattern="[0-9]*:[0-5][0-9]"
                disabled={isCompleted}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Weight</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
                  placeholder={previousData?.weight ? previousData.weight.toString() : "0"}
                  className="pr-8"
                  disabled={isCompleted}
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">lbs</span>
              </div>
            </div>
          </div>
        );

      case 'distance_duration':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Distance</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  value={set.distance || ''}
                  onChange={(e) => onChange({ distance: parseFloat(e.target.value) || 0 })}
                  placeholder={previousData?.distance ? previousData.distance.toString() : "0"}
                  className="pr-8"
                  disabled={isCompleted}
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">mi</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Timer size={12} />
                Duration (MM:SS)
              </Label>
              <Input
                type="text"
                value={durationDisplay}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder={previousData?.duration ? formatDuration(previousData.duration) : "0:00"}
                pattern="[0-9]*:[0-5][0-9]"
                disabled={isCompleted}
              />
            </div>
          </div>
        );

      case 'weight_distance':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Weight</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
                  placeholder={previousData?.weight ? previousData.weight.toString() : "0"}
                  className="pr-8"
                  disabled={isCompleted}
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">lbs</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Distance</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  value={set.distance || ''}
                  onChange={(e) => onChange({ distance: parseFloat(e.target.value) || 0 })}
                  placeholder={previousData?.distance ? previousData.distance.toString() : "0"}
                  className="pr-8"
                  disabled={isCompleted}
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">ft</span>
              </div>
            </div>
          </div>
        );

      case 'bodyweight':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Body Weight</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={userBodyweight || ''}
                  disabled
                  className="bg-muted"
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">lbs</span>
              </div>
              {!userBodyweight && (
                <p className="text-xs text-amber-600 mt-1">Set your body weight in settings</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input
                type="number"
                value={set.reps || ''}
                onChange={(e) => onChange({ reps: parseInt(e.target.value) || 0 })}
                placeholder={previousData?.reps ? previousData.reps.toString() : "0"}
                disabled={isCompleted}
              />
            </div>
          </div>
        );

      case 'assisted_bodyweight':
        return (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Body Weight</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={userBodyweight || ''}
                  disabled
                  className="bg-muted"
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">lbs</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Assistance</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={set.assistanceWeight || ''}
                  onChange={(e) => onChange({ assistanceWeight: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="pr-8"
                  disabled={isCompleted}
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">lbs</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input
                type="number"
                value={set.reps || ''}
                onChange={(e) => onChange({ reps: parseInt(e.target.value) || 0 })}
                placeholder={previousData?.reps ? previousData.reps.toString() : "0"}
                disabled={isCompleted}
              />
            </div>
          </div>
        );

      case 'weighted_bodyweight':
        return (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Body Weight</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={userBodyweight || ''}
                  disabled
                  className="bg-muted"
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">lbs</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Added Weight</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
                  placeholder={previousData?.weight ? previousData.weight.toString() : "0"}
                  className="pr-8"
                  disabled={isCompleted}
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">lbs</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input
                type="number"
                value={set.reps || ''}
                onChange={(e) => onChange({ reps: parseInt(e.target.value) || 0 })}
                placeholder={previousData?.reps ? previousData.reps.toString() : "0"}
                disabled={isCompleted}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Weight</Label>
              <Input
                type="number"
                value={set.weight || ''}
                onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                disabled={isCompleted}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reps</Label>
              <Input
                type="number"
                value={set.reps || ''}
                onChange={(e) => onChange({ reps: parseInt(e.target.value) || 0 })}
                placeholder="0"
                disabled={isCompleted}
              />
            </div>
          </div>
        );
    }
  };

  // Calculate effective weight for bodyweight exercises
  const getEffectiveWeight = () => {
    if (!userBodyweight) return null;
    
    switch (exerciseType) {
      case 'bodyweight':
        return userBodyweight;
      case 'assisted_bodyweight':
        return userBodyweight - (set.assistanceWeight || 0);
      case 'weighted_bodyweight':
        return userBodyweight + (set.weight || 0);
      default:
        return null;
    }
  };

  const effectiveWeight = getEffectiveWeight();

  return (
    <div className="space-y-2">
      {renderInputFields()}
      
      {effectiveWeight && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs">
            Effective Weight: {effectiveWeight.toFixed(1)} lbs
          </Badge>
        </div>
      )}
      
      {previousData && (
        <div className="text-xs text-muted-foreground text-center">
          Previous: {previousData.weight && `${previousData.weight}lbs`}
          {previousData.reps && ` × ${previousData.reps}`}
          {previousData.duration && ` ${formatDuration(previousData.duration)}`}
          {previousData.distance && ` ${previousData.distance}mi`}
        </div>
      )}
    </div>
  );
}