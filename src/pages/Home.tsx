import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, Shirt, User, Heart, WashingMachine, Sparkles, Camera, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const quickActions = [
  { to: "/upload", icon: Camera, label: "Add Item", description: "Upload new clothing" },
  { to: "/wardrobe", icon: Shirt, label: "My Wardrobe", description: "Browse collection" },
  { to: "/avatar", icon: User, label: "Dress Up", description: "Try outfits" },
  { to: "/matches", icon: Sparkles, label: "Get Matches", description: "AI suggestions" },
];

const stats = [
  { label: "Total Items", value: "42", icon: Shirt },
  { label: "Outfits Created", value: "18", icon: Heart },
  { label: "Items in Wash", value: "5", icon: WashingMachine },
  { label: "This Week", value: "+3", icon: TrendingUp },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20 md:pb-8 pt-8 md:pt-24">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Digital Wardrobe
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your personal fashion assistant. Upload, organize, and get AI-powered outfit suggestions.
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