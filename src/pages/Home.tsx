import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, Shirt, User, Heart, WashingMachine, Sparkles, Camera, TrendingUp, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const quickActions = [
  { to: "/upload", icon: Camera, label: "Add Item", description: "Upload new clothing" },
  { to: "/wardrobe", icon: Shirt, label: "My Wardrobe", description: "Browse collection" },
  { to: "/avatar", icon: User, label: "Dress Up", description: "Try outfits" },
  { to: "/matches", icon: Sparkles, label: "Get Matches", description: "AI suggestions" },
];

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    setProfile(data);
  };

  const fetchStats = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('clothing_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    setTotalItems(count || 0);
  };

  const handleAvatarUpdate = (url: string) => {
    setProfile((prev: any) => ({ ...prev, avatar_url: url }));
  };

  const stats = [
    { label: "Total Items", value: totalItems.toString(), icon: Shirt },
    { label: "Outfits Created", value: "0", icon: Heart },
    { label: "Items in Wash", value: "0", icon: WashingMachine },
    { label: "This Week", value: "+0", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20 md:pb-8 pt-8 md:pt-24">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <AvatarUpload 
                  currentAvatarUrl={profile?.avatar_url}
                  onAvatarUpdate={handleAvatarUpdate}
                />
              </DialogContent>
            </Dialog>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            VWardrobe
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Welcome back! {profile?.display_name || user?.email || "Fashion enthusiast"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="text-center hover:shadow-soft transition-shadow">
              <CardContent className="pt-6">
                <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-primary">{value}</div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(({ to, icon: Icon, label, description }) => (
              <Link key={to} to={to}>
                <Card className="h-full hover:shadow-fashion transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/20">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-2 p-3 rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <UploadIcon className="h-4 w-4 text-primary" />
                <span>Added "Blue Denim Jacket"</span>
              </div>
              <span className="text-sm text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4 text-accent" />
                <span>Saved outfit "Casual Friday"</span>
              </div>
              <span className="text-sm text-muted-foreground">1 day ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Got 3 new outfit suggestions</span>
              </div>
              <span className="text-sm text-muted-foreground">2 days ago</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}