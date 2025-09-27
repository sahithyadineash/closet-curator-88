import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WashingMachine, RotateCcw, Droplets, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Wash() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [washItems, setWashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWashItems();
    }
  }, [user]);

  const fetchWashItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('in_wash', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setWashItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load wash items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkClean = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('clothing_items')
        .update({ 
          in_wash: false,
          current_uses: 0
        })
        .eq('id', itemId);

      if (error) throw error;

      setWashItems(washItems.filter(item => item.id !== itemId));
      toast({
        title: "Item cleaned!",
        description: "The item has been returned to your wardrobe.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark item as clean.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllClean = async () => {
    try {
      const itemIds = washItems.map(item => item.id);
      
      const { error } = await supabase
        .from('clothing_items')
        .update({ 
          in_wash: false,
          current_uses: 0
        })
        .in('id', itemIds);

      if (error) throw error;

      setWashItems([]);
      toast({
        title: "All items cleaned!",
        description: "All items have been returned to your wardrobe.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark all items as clean.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wash items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20 md:pb-8 pt-8 md:pt-24">
      <div className="container mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            In Wash
          </h1>
          <p className="text-muted-foreground">Items currently being washed or need washing</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <WashingMachine className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">{washItems.length}</div>
              <p className="text-sm text-muted-foreground">Items in Wash</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-blue-500">
                {washItems.filter(item => (item.current_uses || 0) >= (item.max_uses || 10)).length}
              </div>
              <p className="text-sm text-muted-foreground">Auto-washed</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold text-orange-500">
                {washItems.filter(item => (item.current_uses || 0) < (item.max_uses || 10)).length}
              </div>
              <p className="text-sm text-muted-foreground">Manual wash</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        {washItems.length > 0 && (
          <div className="flex justify-center">
            <Button 
              onClick={handleMarkAllClean}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-fashion"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Mark All Clean
            </Button>
          </div>
        )}

        {/* Wash Items */}
        {washItems.length === 0 ? (
          <div className="text-center py-12">
            <WashingMachine className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No items in wash</h3>
            <p className="text-muted-foreground mb-4">
              All your clothes are clean and ready to wear!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {washItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-fashion transition-all duration-300">
                <div className="aspect-square bg-muted/30 relative overflow-hidden">
                  <img 
                    src={item.image_url || "/placeholder.svg"} 
                    alt={item.name}
                    className="w-full h-full object-cover opacity-75"
                  />
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <WashingMachine className="h-12 w-12 text-white animate-pulse" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-blue-500 text-white">
                      In Wash
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                    {item.color && (
                      <Badge variant="outline" className="text-xs">
                        {item.color}
                      </Badge>
                    )}
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground">
                      Uses: {item.current_uses || 0}/{item.max_uses || 10}
                    </p>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(((item.current_uses || 0) / (item.max_uses || 10)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleMarkClean(item.id)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:shadow-soft"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Mark Clean
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}