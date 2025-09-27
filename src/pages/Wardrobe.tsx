import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid, List, Heart, Edit, Trash2, Shirt, WashingMachine, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSmartMatches } from "@/lib/ml-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const categories = [
  "all", "shirts", "t-shirts", "pants", "jeans", "dresses", 
  "skirts", "jackets", "coats", "sweaters", "hoodies", "shoes", "accessories"
];

const colors = [
  "all", "black", "white", "grey", "navy", "blue", "red", "pink", 
  "purple", "green", "yellow", "orange", "brown", "beige"
];

export default function Wardrobe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterColor, setFilterColor] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [smartMatches, setSmartMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your wardrobe items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      toast({
        title: "Item deleted",
        description: "The item has been removed from your wardrobe.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete the item.",
        variant: "destructive",
      });
    }
  };

  const handleSendToWash = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('clothing_items')
        .update({ in_wash: true })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId ? { ...item, in_wash: true } : item
      ));
      
      toast({
        title: "Sent to wash",
        description: "The item has been moved to your wash list.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send item to wash.",
        variant: "destructive",
      });
    }
  };

  const handleUseItem = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const newUses = (item.current_uses || 0) + 1;
      const shouldWash = newUses >= (item.max_uses || 10);

      const { error } = await supabase
        .from('clothing_items')
        .update({ 
          current_uses: newUses,
          in_wash: shouldWash
        })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(i => 
        i.id === itemId 
          ? { ...i, current_uses: newUses, in_wash: shouldWash }
          : i
      ));

      if (shouldWash) {
        toast({
          title: "Item needs washing",
          description: "This item has reached its maximum uses and has been sent to wash.",
        });
      } else {
        toast({
          title: "Item used",
          description: `${newUses}/${item.max_uses || 10} uses recorded.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record item usage.",
        variant: "destructive",
      });
    }
  };

  const handleGetMatches = async (item: any) => {
    if (!user) return;
    
    setSelectedItem(item);
    setLoadingMatches(true);
    
    try {
      const matches = await getSmartMatches(user.id, item);
      setSmartMatches(matches);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get smart matches.",
        variant: "destructive",
      });
    } finally {
      setLoadingMatches(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.occasion && item.occasion.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesColor = filterColor === "all" || item.color === filterColor;
    const notInWash = !item.in_wash; // Filter out items in wash
    return matchesSearch && matchesCategory && matchesColor && notInWash;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wardrobe...</p>
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
            My Wardrobe
          </h1>
          <p className="text-muted-foreground">Browse and manage your clothing collection</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <Select value={filterColor} onValueChange={setFilterColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">View</label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="flex-1"
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="flex-1"
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
          </p>
        </div>

        {/* Items Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Shirt className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              {items.length === 0 
                ? "Start building your wardrobe by uploading your first item!"
                : "Try adjusting your search or filters to find what you're looking for."
              }
            </p>
            <Button asChild>
              <a href="/upload">Add Your First Item</a>
            </Button>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-fashion transition-all duration-300 hover:scale-105">
                <div className="aspect-square bg-muted/30 relative overflow-hidden">
                  <img 
                    src={item.image_url || "/placeholder.svg"} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                      <Heart className="h-4 w-4" />
                    </Button>
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
                    {item.season && (
                      <Badge variant="outline" className="text-xs">
                        {item.season}
                      </Badge>
                    )}
                  </div>
                  {item.occasion && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {item.occasion}
                      </Badge>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleUseItem(item.id)}
                      className="flex-1"
                    >
                      Use ({item.current_uses || 0}/{item.max_uses || 10})
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleGetMatches(item)}
                          className="flex-1"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Matches
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Smart Matches for {selectedItem?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {loadingMatches ? (
                            <div className="col-span-full text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                              <p>Finding perfect matches...</p>
                            </div>
                          ) : smartMatches.length > 0 ? (
                            smartMatches.map((match) => (
                              <Card key={match.id} className="overflow-hidden">
                                <div className="aspect-square bg-muted/30 relative overflow-hidden">
                                  <img 
                                    src={match.image_url || "/placeholder.svg"} 
                                    alt={match.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {match.matchScore}% match
                                    </Badge>
                                  </div>
                                </div>
                                <CardContent className="p-3">
                                  <h4 className="font-medium text-sm mb-1">{match.name}</h4>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {match.category}
                                    </Badge>
                                    {match.color && (
                                      <Badge variant="outline" className="text-xs">
                                        {match.color}
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className="col-span-full text-center py-8">
                              <p className="text-muted-foreground">No matches found for this item.</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleSendToWash(item.id)}
                      className="flex-1"
                    >
                      <WashingMachine className="h-4 w-4 mr-1" />
                      Wash
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}