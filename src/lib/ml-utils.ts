// Machine Learning utilities for background removal and smart styling
import { supabase } from "@/integrations/supabase/client";

// Background removal using a simple canvas-based approach
// In production, you'd integrate with services like Remove.bg API or use TensorFlow.js
export const removeBackground = async (imageFile: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Simple background removal simulation
      // In production, this would use actual ML models
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple edge detection and background removal
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Simple background detection (adjust thresholds as needed)
        const isBackground = (r > 240 && g > 240 && b > 240) || 
                           (r < 50 && g < 50 && b < 50);
        
        if (isBackground) {
          data[i + 3] = 0; // Make transparent
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], imageFile.name, {
            type: 'image/png',
            lastModified: Date.now()
          });
          resolve(processedFile);
        } else {
          reject(new Error('Failed to process image'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

// Color analysis for smart matching
export const analyzeColors = (imageFile: File): Promise<string[]> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 100; // Reduce size for faster processing
      canvas.height = 100;
      
      if (!ctx) {
        resolve([]);
        return;
      }
      
      ctx.drawImage(img, 0, 0, 100, 100);
      const imageData = ctx.getImageData(0, 0, 100, 100);
      const data = imageData.data;
      
      const colorCounts: { [key: string]: number } = {};
      
      // Sample colors from the image
      for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];
        
        if (alpha > 128) { // Only count non-transparent pixels
          const color = rgbToColorName(r, g, b);
          colorCounts[color] = (colorCounts[color] || 0) + 1;
        }
      }
      
      // Return top 3 colors
      const sortedColors = Object.entries(colorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([color]) => color);
      
      resolve(sortedColors);
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
};

// Convert RGB to color name (simplified)
const rgbToColorName = (r: number, g: number, b: number): string => {
  const colors = [
    { name: 'black', r: 0, g: 0, b: 0 },
    { name: 'white', r: 255, g: 255, b: 255 },
    { name: 'red', r: 255, g: 0, b: 0 },
    { name: 'green', r: 0, g: 255, b: 0 },
    { name: 'blue', r: 0, g: 0, b: 255 },
    { name: 'yellow', r: 255, g: 255, b: 0 },
    { name: 'purple', r: 128, g: 0, b: 128 },
    { name: 'orange', r: 255, g: 165, b: 0 },
    { name: 'pink', r: 255, g: 192, b: 203 },
    { name: 'brown', r: 165, g: 42, b: 42 },
    { name: 'grey', r: 128, g: 128, b: 128 },
    { name: 'navy', r: 0, g: 0, b: 128 },
    { name: 'beige', r: 245, g: 245, b: 220 },
  ];
  
  let closestColor = 'black';
  let minDistance = Infinity;
  
  colors.forEach(color => {
    const distance = Math.sqrt(
      Math.pow(r - color.r, 2) + 
      Math.pow(g - color.g, 2) + 
      Math.pow(b - color.b, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color.name;
    }
  });
  
  return closestColor;
};

// Smart matching algorithm
export const getSmartMatches = async (userId: string, targetItem: any): Promise<any[]> => {
  try {
    const { data: allItems, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId)
      .neq('id', targetItem.id)
      .neq('in_wash', true); // Exclude items in wash
    
    if (error) throw error;
    
    const matches = allItems?.filter(item => {
      // Color matching
      const colorMatch = item.color === targetItem.color || 
                        complementaryColors(item.color, targetItem.color);
      
      // Category matching (avoid same category)
      const categoryMatch = item.category !== targetItem.category;
      
      // Occasion matching
      const occasionMatch = !item.occasion || !targetItem.occasion || 
                           item.occasion === targetItem.occasion;
      
      // Season matching
      const seasonMatch = !item.season || !targetItem.season || 
                         item.season === targetItem.season || 
                         item.season === 'all season' || 
                         targetItem.season === 'all season';
      
      return categoryMatch && (colorMatch || occasionMatch) && seasonMatch;
    }) || [];
    
    // Score and sort matches
    return matches
      .map(item => ({
        ...item,
        matchScore: calculateMatchScore(targetItem, item)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6); // Return top 6 matches
  } catch (error) {
    console.error('Error getting smart matches:', error);
    return [];
  }
};

// Check if colors are complementary
const complementaryColors = (color1: string, color2: string): boolean => {
  const complementaryPairs = [
    ['black', 'white'],
    ['navy', 'beige'],
    ['blue', 'orange'],
    ['red', 'green'],
    ['purple', 'yellow'],
    ['pink', 'grey']
  ];
  
  return complementaryPairs.some(pair => 
    (pair.includes(color1) && pair.includes(color2))
  );
};

// Calculate match score between two items
const calculateMatchScore = (item1: any, item2: any): number => {
  let score = 0;
  
  // Color compatibility
  if (item1.color === item2.color) score += 30;
  else if (complementaryColors(item1.color, item2.color)) score += 25;
  
  // Occasion compatibility
  if (item1.occasion === item2.occasion) score += 20;
  
  // Season compatibility
  if (item1.season === item2.season || 
      item1.season === 'all season' || 
      item2.season === 'all season') score += 15;
  
  // Category diversity (different categories match better)
  if (item1.category !== item2.category) score += 10;
  
  return score;
};