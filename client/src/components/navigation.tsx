import { 
  BarChart3, 
  Dumbbell, 
  List, 
  Trophy, 
  User,
  Settings,
  Bell,
  Calendar
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: BarChart3, label: "Dashboard" },
    { path: "/workouts", icon: Dumbbell, label: "Workouts" },
    { path: "/exercises", icon: List, label: "Exercises" },
    { path: "/routines", icon: Calendar, label: "Routines" },
    { path: "/progress", icon: Trophy, label: "Progress" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FitTrack Pro</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge>
          </Button>
          
          <Avatar>
            <AvatarImage src={user?.profileImageUrl} alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-t">
        <nav className="flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => setLocation(item.path)}
                className={`flex-1 flex-col gap-1 h-auto py-3 px-2 rounded-none border-b-2 transition-colors ${
                  isActive 
                    ? "border-primary bg-muted text-primary" 
                    : "border-transparent hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
