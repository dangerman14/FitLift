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

export default function Exercises() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  const { data: exercises, isLoading } = useQuery({
    queryKey: [
      "/api/exercises",
      { 
        muscleGroup: selectedMuscleGroup, 
        equipment: selectedEquipment 
      }
    ],
  });

  const muscleGroups = [
    "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"
  ];

  const equipmentTypes = [
    "Barbell", "Dumbbell", "Machine", "Bodyweight", "Cable"
  ];

  const difficulties = [
    "Beginner", "Intermediate", "Advanced"
  ];

  const filteredExercises = exercises?.filter((exercise: any) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || exercise.difficultyLevel === selectedDifficulty.toLowerCase();
    
    return matchesSearch && matchesDifficulty;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-900">Exercise Library</h2>
        <Button className="bg-secondary-500 hover:bg-secondary-600 shadow-material-1">
          <Plus className="h-4 w-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-2">
          <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Muscle Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Muscle Groups</SelectItem>
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
              <SelectItem value="">All Equipment</SelectItem>
              {equipmentTypes.map((equipment) => (
                <SelectItem key={equipment} value={equipment.toLowerCase()}>
                  {equipment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Difficulties</SelectItem>
              {difficulties.map((difficulty) => (
                <SelectItem key={difficulty} value={difficulty}>
                  {difficulty}
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
            <ExerciseCard key={exercise.id} exercise={exercise} />
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
    </div>
  );
}
