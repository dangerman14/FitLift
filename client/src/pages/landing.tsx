import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, BarChart3, Target, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Dumbbell className="h-12 w-12 text-primary-500 mr-3" />
            <h1 className="text-4xl font-bold text-neutral-900">FitTrack Pro</h1>
          </div>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            The ultimate workout tracking application designed to help you achieve your fitness goals with precision and insight.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-material-2 border-0 hover:shadow-material-3 transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Smart Workout Tracking</h3>
              <p className="text-neutral-600">
                Log your workouts with precision. Track sets, reps, weight, and RPE with an intuitive interface.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material-2 border-0 hover:shadow-material-3 transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Progress Analytics</h3>
              <p className="text-neutral-600">
                Visualize your strength progress with detailed charts and comprehensive performance metrics.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material-2 border-0 hover:shadow-material-3 transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Goal Setting</h3>
              <p className="text-neutral-600">
                Set and track fitness goals with personalized recommendations and milestone celebrations.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material-2 border-0 hover:shadow-material-3 transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Exercise Library</h3>
              <p className="text-neutral-600">
                Access a comprehensive database of exercises with proper form instructions and muscle group targeting.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material-2 border-0 hover:shadow-material-3 transition-shadow md:col-span-2">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Personal Records</h3>
              <p className="text-neutral-600">
                Automatically track and celebrate your personal records with detailed progression analysis and achievement notifications.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Ready to Transform Your Fitness Journey?
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            Join thousands of users who have already improved their training with FitTrack Pro.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg border-0"
            style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
          >
            Start Tracking Now
          </Button>
        </div>
      </div>
    </div>
  );
}
