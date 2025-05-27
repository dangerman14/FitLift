import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Heart,
  Play,
  Dumbbell
} from "lucide-react";
import { useState } from "react";
import ExerciseCard from "@/components/exercise-card";
import AddCustomExerciseModal from "@/components/add-custom-exercise-modal";
import ExerciseDetailsModal from "@/components/exercise-details-modal";

export default function Exercises() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["/api/exercises"],
  });

  const muscleGroups = [
    "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"
  ];

  const equipmentTypes = [
    "Barbell", "Dumbbell", "Machine", "Bodyweight", "Cable"
  ];

  const filteredExercises = exercises?.filter((exercise: any) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const handleViewDetails = (exercise: any) => {
    setSelectedExercise(exercise);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedExercise(null);
    setShowDetailsModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Exercise Library
          </h1>
          <p className="text-muted-foreground">
            Discover and master new movements
          </p>
        </div>
        <Button 
          onClick={() => setShowCustomExerciseModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Exercise
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-2">
          <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Muscle Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscle Groups</SelectItem>
              {muscleGroups.map((group) => (
                <SelectItem key={group} value={group.toLowerCase()}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              {equipmentTypes.map((equipment) => (
                <SelectItem key={equipment} value={equipment.toLowerCase()}>
                  {equipment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          

        </div>
      </div>

      {/* Exercise Grid */}
      {filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((exercise: any) => (
            <ExerciseCard 
              key={exercise.createdBy ? `custom-${exercise.id}` : `system-${exercise.id}`} 
              exercise={exercise} 
              onViewDetails={handleViewDetails}
              onAddToWorkout={() => {
                // Navigate to workout session and add exercise
                window.location.href = `/workout-session?addExercise=${exercise.id}`;
              }}
            />
          ))}
        </div>
      ) : exercises?.length === 0 ? (
        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Exercises Found</h3>
            <p className="text-neutral-600 mb-4">
              No exercises match your current filters. Try adjusting your search criteria.
            </p>
            <Button onClick={() => {
              setSearchQuery("");
              setSelectedMuscleGroup("");
              setSelectedEquipment("");
              setSelectedDifficulty("");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-material-1 border border-neutral-200">
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Exercise Library Empty</h3>
            <p className="text-neutral-600 mb-4">
              Add exercises to build your personalized exercise library.
            </p>
            <Button className="bg-secondary-500 hover:bg-secondary-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Exercise
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom Exercise Modal */}
      <AddCustomExerciseModal 
        isOpen={showCustomExerciseModal}
        onClose={() => setShowCustomExerciseModal(false)}
      />

      {/* Exercise Details Modal */}
      <ExerciseDetailsModal 
        exercise={selectedExercise}
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
}
