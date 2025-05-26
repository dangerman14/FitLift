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

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    onToggleFavorite?.(exercise);
  };

  const handleAddToWorkout = () => {
    onAddToWorkout?.(exercise);
  };

  const handleViewDetails = () => {
    onViewDetails?.(exercise);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-secondary-500';
      case 'intermediate':
        return 'bg-warning';
      case 'advanced':
        return 'bg-accent-500';
      default:
        return 'bg-neutral-500';
    }
  };

  return (
    <Card className="shadow-material-1 border border-neutral-200 overflow-hidden hover:shadow-material-2 transition-shadow">
      {/* Exercise demonstration placeholder */}
      <div className="relative h-48 bg-neutral-200">
        {(exercise.thumbnailUrl || exercise.imageUrl) ? (
          <img 
            src={exercise.thumbnailUrl || exercise.imageUrl} 
            alt={`${exercise.name} demonstration`}
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
            <Dumbbell className="h-12 w-12 text-neutral-400" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {(exercise.videoUrl || exercise.youtubeUrl) ? (
            <Button 
              size="lg"
              className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all text-primary-600 hover:text-primary-700" 
              onClick={handleViewDetails}
            >
              <Play className="h-5 w-5 ml-1" />
            </Button>
          ) : (
            <div className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              No video available
            </div>
          )}
        </div>
        
        <div className="absolute top-3 right-3">
          <Badge className={`${getDifficultyColor(exercise.difficultyLevel || 'beginner')} text-white text-xs`}>
            {exercise.difficultyLevel || 'Beginner'}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-neutral-900 truncate">
            {exercise.name}
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
            className={`p-1 hover:bg-transparent ${
              isFavorited 
                ? "text-accent-500 hover:text-accent-600" 
                : "text-neutral-400 hover:text-accent-500"
            }`}
            onClick={handleToggleFavorite}
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
                  className="bg-secondary-100 text-secondary-700 text-xs capitalize"
                >
                  {group}
                </Badge>
              ))}
              {allMuscleGroups.length > 3 && (
                <Badge variant="secondary" className="bg-secondary-100 text-secondary-700 text-xs">
                  +{allMuscleGroups.length - 3}
                </Badge>
              )}
            </div>
          );
        })()}
        
        {/* Equipment */}
        <div className="flex items-center text-sm text-neutral-600 mb-3">
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
          <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
            {exercise.description}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={handleAddToWorkout}
            className="flex-1 bg-primary-500 text-white hover:bg-primary-600 text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add to Workout
          </Button>
          <Button 
            variant="outline" 
            onClick={handleViewDetails}
            className="flex-1 border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-sm font-medium"
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
