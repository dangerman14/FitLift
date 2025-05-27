import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart,
  Play,
  Dumbbell,
  Plus
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Exercise } from "@shared/schema";

interface ExerciseCardProps {
  exercise: Exercise;
  onAddToWorkout?: (exercise: Exercise) => void;
  onViewDetails?: (exercise: Exercise) => void;
  onToggleFavorite?: (exercise: Exercise) => void;
}

export default function ExerciseCard({ 
  exercise, 
  onAddToWorkout, 
  onViewDetails,
  onToggleFavorite 
}: ExerciseCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [, setLocation] = useLocation();

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    onToggleFavorite?.(exercise);
  };

  const handleCardClick = () => {
    setLocation(`/exercise/${exercise.id}`);
  };

  const handleAddToWorkout = () => {
    onAddToWorkout?.(exercise);
  };

  const handleViewDetails = () => {
    onViewDetails?.(exercise);
  };

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'default';
      case 'intermediate':
        return 'secondary';
      case 'advanced':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
      {/* Exercise demonstration placeholder */}
      <div className="relative h-48 bg-muted">
        {(exercise.thumbnailUrl || exercise.imageUrl) ? (
          <img 
            src={exercise.thumbnailUrl || exercise.imageUrl} 
            alt={`${exercise.name} demonstration`}
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Dumbbell className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {(exercise.videoUrl || exercise.youtubeUrl) ? (
            <Button 
              size="icon"
              variant="secondary"
              className="h-12 w-12 rounded-full" 
              onClick={handleViewDetails}
            >
              <Play className="h-5 w-5" />
            </Button>
          ) : (
            <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-md">
              No video available
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold truncate">
            {exercise.name}
          </h3>
          <Button 
            variant="ghost" 
            size="icon"
            className={`h-8 w-8 ${
              isFavorited 
                ? "text-red-500 hover:text-red-600" 
                : "text-muted-foreground hover:text-red-500"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite();
            }}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        {/* Muscle Groups */}
        {(() => {
          // Handle both system exercises (muscleGroups) and custom exercises (primaryMuscleGroups + secondaryMuscleGroups)
          const allMuscleGroups = exercise.muscleGroups || 
            [...(exercise.primaryMuscleGroups || []), ...(exercise.secondaryMuscleGroups || [])];
          
          return allMuscleGroups && Array.isArray(allMuscleGroups) && allMuscleGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {allMuscleGroups.slice(0, 3).map((group: string) => (
                <Badge 
                  key={group} 
                  variant="secondary" 
                  className="text-xs capitalize"
                >
                  {group}
                </Badge>
              ))}
              {allMuscleGroups.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{allMuscleGroups.length - 3}
                </Badge>
              )}
            </div>
          );
        })()}
        
        {/* Equipment */}
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Dumbbell className="h-4 w-4 mr-2" />
          <span className="capitalize">
            {(() => {
              // Handle both system exercises (equipmentRequired) and custom exercises (equipmentType)
              if (exercise.equipmentRequired && Array.isArray(exercise.equipmentRequired) && exercise.equipmentRequired.length > 0) {
                return exercise.equipmentRequired.join(', ');
              } else if (exercise.equipmentType) {
                return exercise.equipmentType.replace(/_/g, ' ');
              } else {
                return 'No equipment specified';
              }
            })()}
          </span>
        </div>
        
        {/* Description */}
        {exercise.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {exercise.description}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleAddToWorkout();
            }}
            className="flex-1 text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add to Workout
          </Button>
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="flex-1 text-sm"
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
