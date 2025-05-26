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

export default function Exercises() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white mx-4 rounded-3xl shadow-large p-8 mb-8">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
              Exercise Library
            </h1>
            <p className="text-purple-100 text-lg">Discover and master new movements</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowCustomExerciseModal(true)}
              className="bg-white text-purple-600 hover:bg-purple-50 shadow-medium border-0 px-6 py-3 rounded-xl font-bold transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Custom Exercise
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-6 px-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-neutral-400" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-4 text-lg border-0 shadow-soft bg-white rounded-xl"
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
          
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
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

      {/* Custom Exercise Modal */}
      <AddCustomExerciseModal 
        isOpen={showCustomExerciseModal}
        onClose={() => setShowCustomExerciseModal(false)}
      />
    </div>
  );
}
