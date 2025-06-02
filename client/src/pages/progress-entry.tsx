import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Scale, 
  Ruler, 
  Camera
} from "lucide-react";
import { useLocation } from "wouter";
import { 
  ChestIcon, 
  ShoulderIcon, 
  WaistIcon, 
  AbdomenIcon, 
  HipIcon, 
  BicepIcon, 
  ThighIcon, 
  BodyFatIcon 
} from "@/components/measurement-icons";

export default function ProgressEntry() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/body-tracking/entry/:date");
  const date = params?.date;

  // Get bodyweight data for this date
  const { data: bodyWeightHistory } = useQuery({
    queryKey: ["/api/user/bodyweight"],
    queryFn: async () => {
      const res = await fetch("/api/user/bodyweight", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch weight history");
      return await res.json();
    },
  });

  // Get body measurements for this date
  const { data: bodyMeasurements } = useQuery({
    queryKey: ["/api/body-measurements"],
    queryFn: () => fetch("/api/body-measurements", { credentials: "include" }).then(res => res.json()),
  });

  // Get progress photos (when implemented)
  const { data: progressPhotos } = useQuery({
    queryKey: ["/api/progress-photos"],
    queryFn: () => fetch("/api/progress-photos", { credentials: "include" }).then(res => res.json()),
  });

  // Filter data for the specific date
  const dateWeightEntries = bodyWeightHistory?.filter((entry: any) => entry.measurementDate === date) || [];
  const dateMeasurements = bodyMeasurements?.filter((entry: any) => entry.date === date) || [];
  const datePhotos = progressPhotos?.filter((photo: any) => photo.dateTaken?.split('T')[0] === date) || [];

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : '';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/body-tracking")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Progress
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Progress Entry</h1>
          <p className="text-neutral-600">{formattedDate}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Weight Entries */}
        {dateWeightEntries.length > 0 && (
          <Card className="border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="h-5 w-5 mr-2 text-blue-600" />
                Weight Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dateWeightEntries.map((entry: any, index: number) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-semibold text-blue-900">{entry.weight} kg</p>
                        <p className="text-sm text-blue-600">
                          Recorded at {new Date(entry.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                        {entry.source || 'Manual'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Body Measurements */}
        {dateMeasurements.length > 0 && (
          <Card className="border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ruler className="h-5 w-5 mr-2 text-green-600" />
                Body Measurements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dateMeasurements.map((measurement: any, index: number) => (
                  <div key={index} className="p-4 bg-green-50 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {measurement.chest && (
                        <div className="flex items-center gap-2">
                          <ChestIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Chest:</span>
                          <span className="text-green-900">{measurement.chest} cm</span>
                        </div>
                      )}
                      {measurement.shoulders && (
                        <div className="flex items-center gap-2">
                          <ShoulderIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Shoulders:</span>
                          <span className="text-green-900">{measurement.shoulders} cm</span>
                        </div>
                      )}
                      {measurement.waist && (
                        <div className="flex items-center gap-2">
                          <WaistIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Waist:</span>
                          <span className="text-green-900">{measurement.waist} cm</span>
                        </div>
                      )}
                      {measurement.abdomen && (
                        <div className="flex items-center gap-2">
                          <AbdomenIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Abdomen:</span>
                          <span className="text-green-900">{measurement.abdomen} cm</span>
                        </div>
                      )}
                      {measurement.hips && (
                        <div className="flex items-center gap-2">
                          <HipIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Hips:</span>
                          <span className="text-green-900">{measurement.hips} cm</span>
                        </div>
                      )}
                      {measurement.bicepsLeft && (
                        <div className="flex items-center gap-2">
                          <BicepIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Left Bicep:</span>
                          <span className="text-green-900">{measurement.bicepsLeft} cm</span>
                        </div>
                      )}
                      {measurement.bicepsRight && (
                        <div className="flex items-center gap-2">
                          <BicepIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Right Bicep:</span>
                          <span className="text-green-900">{measurement.bicepsRight} cm</span>
                        </div>
                      )}
                      {measurement.thighLeft && (
                        <div className="flex items-center gap-2">
                          <ThighIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Left Thigh:</span>
                          <span className="text-green-900">{measurement.thighLeft} cm</span>
                        </div>
                      )}
                      {measurement.thighRight && (
                        <div className="flex items-center gap-2">
                          <ThighIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Right Thigh:</span>
                          <span className="text-green-900">{measurement.thighRight} cm</span>
                        </div>
                      )}
                      {measurement.bodyFatPercentage && (
                        <div className="flex items-center gap-2">
                          <BodyFatIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Body Fat:</span>
                          <span className="text-green-900">{measurement.bodyFatPercentage}%</span>
                        </div>
                      )}
                    </div>
                    {measurement.notes && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-sm text-green-700 italic">"{measurement.notes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Photos */}
        {datePhotos.length > 0 && (
          <Card className="border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2 text-purple-600" />
                Progress Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {datePhotos.map((photo: any, index: number) => (
                  <div key={index} className="relative group">
                    <img 
                      src={photo.imageUrl} 
                      alt={`Progress photo from ${formattedDate}`}
                      className="w-full h-48 object-cover rounded-lg shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <p className="text-sm font-medium">{new Date(photo.dateTaken).toLocaleTimeString()}</p>
                        {photo.weight && (
                          <p className="text-xs">{photo.weight} kg</p>
                        )}
                        {photo.notes && (
                          <p className="text-xs mt-1 italic">"{photo.notes}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data Message */}
        {dateWeightEntries.length === 0 && dateMeasurements.length === 0 && datePhotos.length === 0 && (
          <Card className="border border-neutral-200">
            <CardContent className="text-center py-12">
              <div className="text-neutral-400 mb-4">
                <Scale className="h-16 w-16 mx-auto mb-2" />
              </div>
              <p className="text-lg text-neutral-500 mb-2">No progress entries found</p>
              <p className="text-sm text-neutral-400">
                There are no weight measurements, body measurements, or photos recorded for this date.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}