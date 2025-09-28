import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { User, Palette, Shirt, Save, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AvatarDisplay } from "@/components/AvatarDisplay";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string | null;
  image_url: string | null;
}

interface AvatarPreferences {
  skin_tone: string;
  hair_color: string;
  body_type: string;
}

export default function Avatar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<{[key: string]: string}>({});
  const [avatarPrefs, setAvatarPrefs] = useState<AvatarPreferences>({
    skin_tone: 'medium',
    hair_color: 'brown',
    body_type: 'average'
  });

  const skinTones = [
    { id: 'light', name: 'Light', color: '#FDBCB4' },
    { id: 'medium-light', name: 'Medium Light', color: '#EDB98A' },
    { id: 'medium', name: 'Medium', color: '#D08B5B' },
    { id: 'medium-dark', name: 'Medium Dark', color: '#AE5D29' },
    { id: 'dark', name: 'Dark', color: '#6B4423' },
  ];

  const hairColors = [
    { id: 'blonde', name: 'Blonde', color: '#E6B87A' },
    { id: 'brown', name: 'Brown', color: '#8B4513' },
    { id: 'black', name: 'Black', color: '#2F1B14' },
    { id: 'red', name: 'Red', color: '#A0522D' },
    { id: 'gray', name: 'Gray', color: '#808080' },
    { id: 'white', name: 'White', color: '#F5F5F5' },
  ];

  const bodyTypes = [
    { id: 'slim', name: 'Slim' },
    { id: 'average', name: 'Average' },
    { id: 'athletic', name: 'Athletic' },
    { id: 'curvy', name: 'Curvy' },
  ];

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchAvatarPreferences(),
        fetchClothingItems()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchAvatarPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('avatar_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setAvatarPrefs({
          skin_tone: data.skin_tone,
          hair_color: data.hair_color,
          body_type: data.body_type
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load avatar preferences.",
        variant: "destructive",
      });
    }
  };

  const fetchClothingItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('in_wash', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClothingItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load wardrobe items.",
        variant: "destructive",
      });
    }
  };

  const saveAvatarPreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('avatar_preferences')
        .upsert({
          user_id: user.id,
          skin_tone: avatarPrefs.skin_tone,
          hair_color: avatarPrefs.hair_color,
          body_type: avatarPrefs.body_type
        });

      if (error) throw error;

      toast({
        title: "Avatar saved!",
        description: "Your avatar preferences have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save avatar preferences.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleWearItem = (item: ClothingItem) => {
    setSelectedOutfit(prev => ({
      ...prev,
      [item.category]: item.id
    }));
  };

  const handleRemoveItem = (category: string) => {
    setSelectedOutfit(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
  };

  const resetAvatar = () => {
    setAvatarPrefs({
      skin_tone: 'medium',
      hair_color: 'brown',
      body_type: 'average'
    });
    setSelectedOutfit({});
  };

  const getItemsByCategory = (category: string) => {
    return clothingItems.filter(item => 
      item.category.toLowerCase() === category.toLowerCase()
    );
  };

  const getWornItem = (category: string) => {
    const itemId = selectedOutfit[category];
    return itemId ? clothingItems.find(item => item.id === itemId) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading avatar...</p>
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
            Avatar Studio
          </h1>
          <p className="text-muted-foreground">Customize your look and try on your wardrobe</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avatar Display */}
          <div className="space-y-4">
            <Card className="h-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Avatar
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <AvatarDisplay 
                  preferences={avatarPrefs}
                  outfit={selectedOutfit}
                  clothingItems={clothingItems}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={saveAvatarPreferences}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-fashion"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Avatar"}
              </Button>
              <Button 
                onClick={resetAvatar}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Customization Panel */}
          <div className="space-y-6">
            {/* Avatar Customization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Customize Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Skin Tone */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Skin Tone</label>
                  <div className="grid grid-cols-5 gap-2">
                    {skinTones.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => setAvatarPrefs(prev => ({ ...prev, skin_tone: tone.id }))}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${
                          avatarPrefs.skin_tone === tone.id 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{ backgroundColor: tone.color }}
                        title={tone.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Hair Color */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Hair Color</label>
                  <div className="grid grid-cols-6 gap-2">
                    {hairColors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setAvatarPrefs(prev => ({ ...prev, hair_color: color.id }))}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${
                          avatarPrefs.hair_color === color.id 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Body Type */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Body Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {bodyTypes.map((type) => (
                      <Button
                        key={type.id}
                        onClick={() => setAvatarPrefs(prev => ({ ...prev, body_type: type.id }))}
                        variant={avatarPrefs.body_type === type.id ? "default" : "outline"}
                        className="w-full"
                      >
                        {type.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wardrobe Try-On */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shirt className="h-5 w-5" />
                  Try On Clothes
                </CardTitle>
                <CardDescription>
                  Select items from your wardrobe to try on your avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessories'].map((category) => {
                  const items = getItemsByCategory(category);
                  const wornItem = getWornItem(category);
                  
                  if (items.length === 0) return null;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">{category}</h4>
                        {wornItem && (
                          <Button
                            onClick={() => handleRemoveItem(category)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      {wornItem ? (
                        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                          <img 
                            src={wornItem.image_url || "/placeholder.svg"} 
                            alt={wornItem.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{wornItem.name}</p>
                            {wornItem.color && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {wornItem.color}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {items.slice(0, 6).map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleWearItem(item)}
                              className="group relative aspect-square bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                            >
                              <img 
                                src={item.image_url || "/placeholder.svg"} 
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-medium text-center px-1">
                                  {item.name}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {clothingItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shirt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No clothing items in your wardrobe yet.</p>
                    <p className="text-sm">Upload some items to try them on!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}