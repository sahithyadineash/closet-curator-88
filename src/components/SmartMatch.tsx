import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Heart, ShoppingBag, Shirt, Zap, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAIMatches, getCompleteOutfitSuggestions, ClothingItem, AIMatchResult } from '@/lib/ai-matching';
import { supabase } from '@/integrations/supabase/client';

interface SmartMatchProps {
  targetItem: ClothingItem;
  userId: string;
}

interface OutfitSuggestion {
  outfit: ClothingItem[];
  accessories: ClothingItem[];
  aiStylingTips: string;
}

export const SmartMatch: React.FC<SmartMatchProps> = ({ targetItem, userId }) => {
  const [matches, setMatches] = useState<AIMatchResult[]>([]);
  const [outfitSuggestions, setOutfitSuggestions] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState<string>('');
  const [weather, setWeather] = useState<string>('');
  const [likedMatches, setLikedMatches] = useState<Set<string>>(new Set());
  const [dislikedMatches, setDislikedMatches] = useState<Set<string>>(new Set());
  const [likedOutfits, setLikedOutfits] = useState<Set<number>>(new Set());
  const [dislikedOutfits, setDislikedOutfits] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const occasions = [
    'casual', 'work', 'formal', 'party', 'date', 'workout', 'travel', 'beach', 'wedding'
  ];

  const weatherOptions = [
    'sunny', 'rainy', 'cold', 'hot', 'mild', 'windy', 'snowy'
  ];

  useEffect(() => {
    loadMatches();
  }, [targetItem, occasion, weather]);

  const loadMatches = async () => {
    if (!targetItem) return;
    
    setLoading(true);
    try {
      // Prepare user preferences for AI
      const preferences = {
        liked: likedMatches,
        disliked: dislikedMatches
      };

      // Convert "any" values to empty strings for the API calls
      const occasionParam = occasion === 'any' ? '' : occasion;
      const weatherParam = weather === 'any' ? '' : weather;
      
      // Get AI-powered individual matches with user preferences
      const aiMatches = await getAIMatches(userId, targetItem, occasionParam, weatherParam, preferences);
      setMatches(aiMatches);

      // Get complete outfit suggestions
      const outfits = await getCompleteOutfitSuggestions(
        userId, 
        [targetItem], 
        occasionParam, 
        weatherParam
      );
      setOutfitSuggestions(outfits);

      // Show success message if we have results
      if (aiMatches.length > 0 || outfits.length > 0) {
        toast({
          title: "Smart Matches Found!",
          description: `Found ${aiMatches.length} individual matches and ${outfits.length} complete outfit suggestions.`,
        });
      } else {
        toast({
          title: "No Matches Found",
          description: "Try adding more items to your wardrobe or adjusting your preferences.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error loading matches:', error);
      
      // Check if it's an OpenAI API error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('RateLimitError') || errorMessage.includes('429')) {
        toast({
          title: "AI Service Temporarily Unavailable",
          description: "Using basic matching algorithm. Upgrade your OpenAI plan for enhanced AI features.",
          variant: "default"
        });
      } else {
        toast({
          title: "Error Loading Matches",
          description: "Please check your internet connection and try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveUserPreference = async (type: 'match' | 'outfit', itemId: string | number, preference: 'like' | 'dislike') => {
    try {
      // For now, just store preferences locally since we need to set up the database table
      // TODO: Implement database storage once user_preferences table is created
      
      // Update local state
      if (type === 'match') {
        if (preference === 'like') {
          setLikedMatches(prev => new Set(prev).add(itemId.toString()));
          setDislikedMatches(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId.toString());
            return newSet;
          });
        } else {
          setDislikedMatches(prev => new Set(prev).add(itemId.toString()));
          setLikedMatches(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId.toString());
            return newSet;
          });
        }
      } else {
        if (preference === 'like') {
          setLikedOutfits(prev => new Set(prev).add(itemId as number));
          setDislikedOutfits(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId as number);
            return newSet;
          });
        } else {
          setDislikedOutfits(prev => new Set(prev).add(itemId as number));
          setLikedOutfits(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId as number);
            return newSet;
          });
        }
      }

      toast({
        title: "Preference Saved!",
        description: `Your ${preference} has been recorded and will improve future recommendations.`,
      });

    } catch (error) {
      console.error('Error saving preference:', error);
      toast({
        title: "Error",
        description: "Failed to save preference",
        variant: "destructive"
      });
    }
  };

  const saveOutfit = async (outfit: ClothingItem[], accessories: ClothingItem[], tips: string) => {
    try {
      const allItems = [...outfit, ...accessories];
      
      // Create outfit
      const { data: outfitData, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: userId,
          name: `AI Suggested Outfit - ${new Date().toLocaleDateString()}`,
          description: tips,
          occasion: occasion || null
        })
        .select()
        .single();

      if (outfitError) throw outfitError;

      // Add items to outfit
      const outfitItems = allItems.map(item => ({
        outfit_id: outfitData.id,
        clothing_item_id: item.id
      }));

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success!",
        description: "Outfit saved to your collection",
      });

    } catch (error) {
      console.error('Error saving outfit:', error);
      toast({
        title: "Error",
        description: "Failed to save outfit",
        variant: "destructive"
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCategoryIcon = (category: string) => {
    const accessories = ['bags', 'jewelry', 'watches', 'belts', 'scarves', 'hats', 'sunglasses'];
    return accessories.includes(category) ? <ShoppingBag className="w-4 h-4" /> : <Shirt className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Smart Matching for {targetItem.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select occasion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any occasion</SelectItem>
                {occasions.map(occ => (
                  <SelectItem key={occ} value={occ}>
                    {occ.charAt(0).toUpperCase() + occ.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={weather} onValueChange={setWeather}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select weather" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any weather</SelectItem>
                {weatherOptions.map(w => (
                  <SelectItem key={w} value={w}>
                    {w.charAt(0).toUpperCase() + w.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={loadMatches} disabled={loading}>
              <Zap className="w-4 h-4 mr-2" />
              {loading ? 'Analyzing...' : 'Get AI Matches'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual Matches</TabsTrigger>
          <TabsTrigger value="complete">Complete Outfits</TabsTrigger>
        </TabsList>

        {/* Individual Matches Tab */}
        <TabsContent value="individual" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
              <p>AI is analyzing your wardrobe...</p>
            </div>
          ) : matches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No matches found. Try adjusting the occasion or weather settings.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match, index) => (
                <Card key={match.item.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(match.item.category)}
                        <h3 className="font-semibold text-sm">{match.item.name}</h3>
                      </div>
                      <Badge 
                        className={`${getScoreColor(match.matchScore)} text-white text-xs`}
                      >
                        {match.matchScore}%
                      </Badge>
                    </div>

                    {match.item.image_url && (
                      <img 
                        src={match.item.image_url} 
                        alt={match.item.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {match.item.category}
                        </Badge>
                        {match.item.color && (
                          <Badge variant="outline" className="text-xs">
                            {match.item.color}
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-gray-600">
                        <p className="font-medium mb-1">Why it matches:</p>
                        <p>{match.aiReasoning}</p>
                      </div>

                      <div className="text-xs text-blue-600">
                        <p className="font-medium mb-1">Style advice:</p>
                        <p>{match.styleAdvice}</p>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={likedMatches.has(match.item.id) ? "default" : "outline"}
                            onClick={() => saveUserPreference('match', match.item.id, 'like')}
                            className="h-8 px-2"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={dislikedMatches.has(match.item.id) ? "destructive" : "outline"}
                            onClick={() => saveUserPreference('match', match.item.id, 'dislike')}
                            className="h-8 px-2"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Complete Outfits Tab */}
        <TabsContent value="complete" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
              <p>Creating complete outfit suggestions...</p>
            </div>
          ) : outfitSuggestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Shirt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No complete outfits found. Try adding more items to your wardrobe.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {outfitSuggestions.map((suggestion, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Outfit Suggestion {index + 1}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={likedOutfits.has(index) ? "default" : "outline"}
                          onClick={() => saveUserPreference('outfit', index, 'like')}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={dislikedOutfits.has(index) ? "destructive" : "outline"}
                          onClick={() => saveUserPreference('outfit', index, 'dislike')}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => saveOutfit(suggestion.outfit, suggestion.accessories, suggestion.aiStylingTips)}
                          size="sm"
                          variant="outline"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Save Outfit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Main Clothing */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Shirt className="w-4 h-4" />
                          Main Clothing
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {suggestion.outfit.map(item => (
                            <div key={item.id} className="border rounded-lg p-3">
                              {item.image_url && (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="w-full h-20 object-cover rounded mb-2"
                                />
                              )}
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.category}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Accessories */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4" />
                          Accessories
                        </h4>
                        {suggestion.accessories.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {suggestion.accessories.map(item => (
                              <div key={item.id} className="border rounded-lg p-3">
                                {item.image_url && (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name}
                                    className="w-full h-20 object-cover rounded mb-2"
                                  />
                                )}
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No accessories suggested for this outfit</p>
                        )}
                      </div>
                    </div>

                    {/* AI Styling Tips */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
                        <Sparkles className="w-4 h-4" />
                        AI Styling Tips
                      </h4>
                      <p className="text-sm text-blue-700">{suggestion.aiStylingTips}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};