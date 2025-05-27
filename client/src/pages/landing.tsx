import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dumbbell, BarChart3, Target, Zap, Star, Users, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mr-4">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              FitTrack Pro
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your fitness journey with intelligent tracking and personalized insights
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <Badge variant="secondary" className="text-sm">
              <Star className="h-4 w-4 mr-1" />
              4.9/5 Rating
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Users className="h-4 w-4 mr-1" />
              10K+ Users
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Shield className="h-4 w-4 mr-1" />
              Secure & Private
            </Badge>
          </div>
          
          <Button 
            onClick={handleLogin}
            size="lg"
            className="text-lg px-8 py-3"
          >
            Start Your Journey
          </Button>
        </div>

        <Separator className="mb-16" />

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Smart Workout Tracking</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Log your workouts with precision. Track sets, reps, weight, and RPE with an intuitive interface.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Progress Analytics</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Visualize your strength progress with detailed charts and comprehensive performance metrics.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Goal Setting</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Set and track fitness goals with personalized recommendations and milestone celebrations.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-lg">Exercise Library</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Access a comprehensive database of exercises with proper form instructions and muscle group targeting.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow md:col-span-2">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Personal Records</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Automatically track and celebrate your personal records with detailed progression analysis and achievement notifications.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="text-center p-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-3xl font-bold mb-4">
              Ready to Transform Your Fitness Journey?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users who have already improved their training with FitTrack Pro.
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="text-lg px-8 py-3"
            >
              Start Tracking Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
