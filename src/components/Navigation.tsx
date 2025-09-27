import { Home, Upload, Shirt, User, Heart, WashingMachine, Sparkles, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/wardrobe", icon: Shirt, label: "Wardrobe" },
  { to: "/avatar", icon: User, label: "Avatar" },
  { to: "/picks", icon: Heart, label: "Your Picks" },
  { to: "/wash", icon: WashingMachine, label: "In Wash" },
  { to: "/matches", icon: Sparkles, label: "Smart Matches" },
];

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  // Don't show navigation on auth page
  if (!user) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 md:top-0 md:bottom-auto md:bg-gradient-to-r md:from-primary/10 md:to-accent/10">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center py-2 md:py-4 md:justify-between">
          <div className="flex justify-around items-center md:justify-center md:gap-8 flex-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all duration-300 md:flex-row md:gap-2 md:px-4 md:py-2",
                    isActive
                      ? "text-primary bg-primary/10 shadow-soft"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )
                }
              >
                <Icon className="h-5 w-5 md:h-4 md:w-4" />
                <span className="text-xs font-medium md:text-sm">{label}</span>
              </NavLink>
            ))}
          </div>
          <div className="hidden md:block">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-primary"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};