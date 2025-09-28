// AI-powered clothing and accessory matching service using OpenAI
import OpenAI from 'openai';
import { supabase } from "@/integrations/supabase/client";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend service
});

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string | null;
  season: string | null;
  occasion: string | null;
  image_url: string | null;
  current_uses: number | null;
  max_uses: number | null;
  in_wash: boolean | null;
}

export interface AIMatchResult {
  item: ClothingItem;
  matchScore: number;
  aiReasoning: string;
  styleAdvice: string;
}

// Enhanced categories that include accessories
const CLOTHING_CATEGORIES = [
  // Main clothing
  'tops', 'bottoms', 'dresses', 'outerwear', 'shoes',
  // Accessories
  'bags', 'jewelry', 'watches', 'belts', 'scarves', 'hats', 'sunglasses',
  'ties', 'hair accessories', 'gloves', 'socks', 'underwear'
];

// Get AI-powered clothing matches including accessories with user preferences
export const getAIMatches = async (
  userId: string, 
  targetItem: ClothingItem,
  occasion?: string,
  weather?: string,
  userPreferences?: { liked: Set<string>, disliked: Set<string> }
): Promise<AIMatchResult[]> => {
  try {
    // Fetch all user's clothing items including accessories
    const { data: allItems, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId)
      .neq('id', targetItem.id)
      .neq('in_wash', true);

    if (error) throw error;
    if (!allItems || allItems.length === 0) return [];

    // Filter out disliked items and prioritize liked items
    let filteredItems = allItems;
    if (userPreferences) {
      // Remove disliked items
      filteredItems = allItems.filter(item => !userPreferences.disliked.has(item.id));
      
      // Sort to prioritize liked items
      filteredItems.sort((a, b) => {
        const aLiked = userPreferences.liked.has(a.id);
        const bLiked = userPreferences.liked.has(b.id);
        if (aLiked && !bLiked) return -1;
        if (!aLiked && bLiked) return 1;
        return 0;
      });
    }

    // Create a detailed prompt for OpenAI
    const prompt = createMatchingPrompt(targetItem, filteredItems, occasion, weather, userPreferences);

    // Get AI recommendations
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional fashion stylist and personal shopper with expertise in color theory, style coordination, and accessory pairing. You help people create cohesive, stylish outfits by analyzing clothing items and accessories."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) return [];

    // Parse AI response and match with actual items
    return parseAIResponse(aiResponse, filteredItems);

  } catch (error) {
    console.error('Error getting AI matches:', error);
    // Fallback to basic matching if AI fails
    return getBasicMatches(userId, targetItem);
  }
};

// Create a comprehensive prompt for AI matching
const createMatchingPrompt = (
  targetItem: ClothingItem,
  availableItems: ClothingItem[],
  occasion?: string,
  weather?: string,
  userPreferences?: { liked: Set<string>, disliked: Set<string> }
): string => {
  const itemDescriptions = availableItems.map((item, index) => {
    const isLiked = userPreferences?.liked.has(item.id) ? ' [LIKED BY USER]' : '';
    return `${index + 1}. ${item.name} (${item.category}, ${item.color || 'color not specified'}, ${item.season || 'any season'}, ${item.occasion || 'any occasion'})${isLiked}`;
  }).join('\n');

  return `
I have a ${targetItem.category} called "${targetItem.name}" that is ${targetItem.color || 'color not specified'} and suitable for ${targetItem.season || 'any season'} and ${targetItem.occasion || 'any occasion'}.

${occasion ? `The occasion is: ${occasion}` : ''}
${weather ? `The weather is: ${weather}` : ''}

Here are my available clothing items and accessories:
${itemDescriptions}

${userPreferences?.liked.size ? 'Note: Items marked with [LIKED BY USER] are preferred by the user and should be prioritized when suitable.' : ''}

Please recommend the best 6 items that would go well with my ${targetItem.category}, considering:
1. Color coordination and complementary colors
2. Style compatibility and fashion rules
3. Occasion appropriateness
4. Seasonal suitability
5. Accessory pairing (bags, jewelry, shoes, etc.)
6. Overall outfit cohesion
7. User preferences (prioritize liked items when appropriate)

For each recommendation, provide:
- Item number (from the list above)
- Match score (1-100)
- Brief reasoning for why it matches
- Style advice for wearing them together

Format your response as:
ITEM_NUMBER|SCORE|REASONING|ADVICE

Example:
1|95|The black leather jacket complements the blue jeans perfectly, creating a classic casual look|Pair with white sneakers for a relaxed vibe or boots for an edgier style
`;
};

// Parse AI response and create match results
const parseAIResponse = (aiResponse: string, availableItems: ClothingItem[]): AIMatchResult[] => {
  const lines = aiResponse.split('\n').filter(line => line.includes('|'));
  const matches: AIMatchResult[] = [];

  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length >= 4) {
      const itemIndex = parseInt(parts[0]) - 1;
      const score = parseInt(parts[1]);
      const reasoning = parts[2];
      const advice = parts[3];

      if (itemIndex >= 0 && itemIndex < availableItems.length && !isNaN(score)) {
        matches.push({
          item: availableItems[itemIndex],
          matchScore: Math.min(100, Math.max(0, score)),
          aiReasoning: reasoning,
          styleAdvice: advice
        });
      }
    }
  }

  // Sort by match score and return top 6
  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);
};

// Fallback basic matching function
const getBasicMatches = async (userId: string, targetItem: ClothingItem): Promise<AIMatchResult[]> => {
  try {
    const { data: allItems, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId)
      .neq('id', targetItem.id)
      .neq('in_wash', true);

    if (error) throw error;

    const matches = allItems?.filter(item => {
      // Basic matching logic
      const colorMatch = item.color === targetItem.color || 
                        isComplementaryColor(item.color, targetItem.color);
      const categoryMatch = item.category !== targetItem.category;
      const occasionMatch = !item.occasion || !targetItem.occasion || 
                           item.occasion === targetItem.occasion;

      return categoryMatch && (colorMatch || occasionMatch);
    }) || [];

    return matches.map(item => ({
      item,
      matchScore: Math.floor(Math.random() * 30) + 70, // Simple scoring
      aiReasoning: `Matches well with ${targetItem.name} based on color and style compatibility.`,
      styleAdvice: `This ${item.category} complements your ${targetItem.category} nicely.`
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);
  } catch (error) {
    console.error('Error in basic matching:', error);
    return [];
  }
};



// Get complete outfit suggestions with accessories
export const getCompleteOutfitSuggestions = async (
  userId: string,
  baseItems: ClothingItem[],
  occasion?: string,
  weather?: string
): Promise<{
  outfit: ClothingItem[];
  accessories: ClothingItem[];
  aiStylingTips: string;
}[]> => {
  try {
    const { data: allItems, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId)
      .neq('in_wash', true);

    if (error) throw error;
    if (!allItems) return [];

    // Separate accessories from main clothing
    const accessories = allItems.filter(item => 
      ['bags', 'jewelry', 'watches', 'belts', 'scarves', 'hats', 'sunglasses'].includes(item.category)
    );

    const mainClothing = allItems.filter(item => 
      !['bags', 'jewelry', 'watches', 'belts', 'scarves', 'hats', 'sunglasses'].includes(item.category)
    );

    // Create outfit suggestions using AI
    const prompt = `
Create 3 complete outfit suggestions using these base items: ${baseItems.map(item => `${item.name} (${item.category}, ${item.color})`).join(', ')}

Available clothing: ${mainClothing.map((item, i) => `${i+1}. ${item.name} (${item.category}, ${item.color})`).join(', ')}

Available accessories: ${accessories.map((item, i) => `A${i+1}. ${item.name} (${item.category}, ${item.color})`).join(', ')}

${occasion ? `Occasion: ${occasion}` : ''}
${weather ? `Weather: ${weather}` : ''}

For each outfit, suggest:
1. Main clothing items that work together as a complete outfit (use numbers from the list)
2. Accessories that complement the ENTIRE outfit, not individual pieces (use A numbers from the list)
3. Styling tips explaining how the accessories work with the complete outfit

Consider color harmony across all pieces - accessories should complement the overall color scheme of the outfit.

Format: OUTFIT_1|CLOTHING:1,2,3|ACCESSORIES:A1,A2|TIPS:styling advice here
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional stylist creating complete outfit suggestions with accessories."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1500
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return [];

    return parseOutfitSuggestions(response, mainClothing, accessories);

  } catch (error) {
    console.error('Error getting complete outfit suggestions:', error);
    // Fallback to basic outfit suggestions
    return getBasicOutfitSuggestions(userId, baseItems, occasion, weather);
  }
};

const parseOutfitSuggestions = (
  response: string, 
  mainClothing: ClothingItem[], 
  accessories: ClothingItem[]
) => {
  const outfits = [];
  const lines = response.split('\n').filter(line => line.includes('|'));

  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length >= 3) {
      const clothingPart = parts.find(p => p.startsWith('CLOTHING:'));
      const accessoryPart = parts.find(p => p.startsWith('ACCESSORIES:'));
      const tipsPart = parts.find(p => p.startsWith('TIPS:'));

      if (clothingPart && accessoryPart && tipsPart) {
        const clothingIndices = clothingPart.replace('CLOTHING:', '').split(',').map(n => parseInt(n.trim()) - 1);
        const accessoryIndices = accessoryPart.replace('ACCESSORIES:', '').split(',').map(n => parseInt(n.replace('A', '').trim()) - 1);
        
        const outfitItems = clothingIndices
          .filter(i => i >= 0 && i < mainClothing.length)
          .map(i => mainClothing[i]);
        
        const outfitAccessories = accessoryIndices
          .filter(i => i >= 0 && i < accessories.length)
          .map(i => accessories[i]);

        if (outfitItems.length > 0) {
          outfits.push({
            outfit: outfitItems,
            accessories: outfitAccessories,
            aiStylingTips: tipsPart.replace('TIPS:', '').trim()
          });
        }
      }
    }
  }

  return outfits.slice(0, 3); // Return top 3 suggestions
};

// Basic outfit suggestions fallback when AI is unavailable
const getBasicOutfitSuggestions = async (
  userId: string,
  baseItems: ClothingItem[],
  occasion?: string,
  weather?: string
): Promise<{
  outfit: ClothingItem[];
  accessories: ClothingItem[];
  aiStylingTips: string;
}[]> => {
  try {
    const { data: allItems, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId)
      .neq('in_wash', true);

    if (error) throw error;
    if (!allItems) return [];

    // Separate accessories from main clothing
    const accessories = allItems.filter(item => 
      ['bags', 'jewelry', 'watches', 'belts', 'scarves', 'hats', 'sunglasses'].includes(item.category)
    );

    const mainClothing = allItems.filter(item => 
      !['bags', 'jewelry', 'watches', 'belts', 'scarves', 'hats', 'sunglasses'].includes(item.category)
    );

    const baseItem = baseItems[0];
    const suggestions = [];

    // Create basic outfit suggestions
    for (let i = 0; i < Math.min(3, mainClothing.length); i++) {
      const compatibleItems = mainClothing.filter(item => {
        const colorMatch = item.color === baseItem.color || 
                          isComplementaryColor(item.color, baseItem.color);
        const categoryMatch = item.category !== baseItem.category;
        const occasionMatch = !occasion || !item.occasion || item.occasion === occasion;
        
        return categoryMatch && (colorMatch || occasionMatch);
      });

      if (compatibleItems.length > i) {
        const outfitItems = [baseItem, compatibleItems[i]];
        
        // Add matching accessories that work with the complete outfit (both items)
        const matchingAccessories = accessories.filter(acc => {
          // Check if accessory matches with both the base item and the compatible item
          const matchesBaseItem = acc.color === baseItem.color || 
                                 isComplementaryColor(acc.color, baseItem.color);
          const matchesCompatibleItem = acc.color === compatibleItems[i].color || 
                                       isComplementaryColor(acc.color, compatibleItems[i].color);
          
          // Neutral colors that work with any outfit
          const isNeutralAccessory = acc.color && ['black', 'white', 'grey', 'gray', 'brown', 'beige', 'navy'].includes(acc.color.toLowerCase());
          
          // Color harmony - accessory should complement the overall outfit
          const colorHarmony = matchesBaseItem || matchesCompatibleItem || isNeutralAccessory;
          
          const occasionMatch = !occasion || !acc.occasion || acc.occasion === occasion;
          
          return colorHarmony && occasionMatch;
        }).slice(0, 2);

        suggestions.push({
          outfit: outfitItems,
          accessories: matchingAccessories,
          aiStylingTips: `Complete outfit coordination: ${baseItem.name} (${baseItem.color}) paired with ${compatibleItems[i].name} (${compatibleItems[i].color}). Accessories chosen to complement both pieces for a cohesive look. ${occasion ? `Perfect for ${occasion} occasions.` : ''}`
        });
      }
    }

    return suggestions;

  } catch (error) {
    console.error('Error in basic outfit suggestions:', error);
    return [];
  }
};

// Helper functions
const isComplementaryColor = (color1: string | null, color2: string | null): boolean => {
  if (!color1 || !color2) return false;
  
  const complementaryPairs = [
    ['black', 'white'], ['navy', 'beige'], ['blue', 'orange'],
    ['red', 'green'], ['purple', 'yellow'], ['pink', 'grey']
  ];
  
  return complementaryPairs.some(pair => 
    (pair.includes(color1.toLowerCase()) && pair.includes(color2.toLowerCase()))
  );
};