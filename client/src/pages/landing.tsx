import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, BarChart3, Target, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white rounded-3xl shadow-large p-12 mb-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-3xl flex items-center justify-center shadow-xl backdrop-blur-sm mr-6">
                <Dumbbell className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-6xl font-bold text-white drop-shadow-lg">FitTrack Pro</h1>
            </div>
            <p className="text-2xl text-orange-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your fitness journey with intelligent tracking and personalized insights
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50 px-12 py-4 text-xl font-bold rounded-xl shadow-large transform hover:scale-105 transition-all duration-200"
            >
              Start Your Journey
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-soft border-0 hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1">
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
