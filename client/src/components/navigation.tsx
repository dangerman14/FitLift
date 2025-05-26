import { 
  BarChart3, 
  Dumbbell, 
  List, 
  Trophy, 
  User,
  Bell
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/", icon: BarChart3, label: "Dashboard" },
    { path: "/workouts", icon: Dumbbell, label: "Workouts" },
    { path: "/exercises", icon: List, label: "Exercises" },
    { path: "/progress", icon: Trophy, label: "Progress" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-large relative z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <Dumbbell className="h-6 w-6" />
          <h1 className="text-xl font-medium">FitTrack Pro</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="p-2 hover:bg-primary-600 rounded-full text-white">
            <Bell className="h-5 w-5" />
          </Button>
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/20">
              <span className="text-sm font-medium">
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <nav className="flex bg-primary-600">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex-1 py-3 px-4 text-center transition-colors ${
                isActive 
                  ? "bg-primary-700 border-b-2 border-white" 
                  : "hover:bg-primary-700"
              }`}
            >
              <Icon className="h-5 w-5 mx-auto mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
