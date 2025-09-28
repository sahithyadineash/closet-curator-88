import { useEffect, useRef } from "react";

interface AvatarPreferences {
  skin_tone: string;
  hair_color: string;
  body_type: string;
}

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string | null;
  image_url: string | null;
}

interface AvatarDisplayProps {
  preferences: AvatarPreferences;
  outfit: {[key: string]: string};
  clothingItems: ClothingItem[];
}

export const AvatarDisplay = ({ preferences, outfit, clothingItems }: AvatarDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Helper function to get skin tone color
    const getSkinToneColor = (tone: string) => {
      const tones = {
        'light': '#FDBCB4',
        'medium-light': '#EDB98A',
        'medium': '#D08B5B',
        'medium-dark': '#AE5D29',
        'dark': '#6B4423'
      };
      return tones[tone as keyof typeof tones] || tones.medium;
    };

    // Helper function to get hair color
    const getHairColor = (color: string) => {
      const colors = {
        'blonde': '#E6B87A',
        'brown': '#8B4513',
        'black': '#2F1B14',
        'red': '#A0522D',
        'gray': '#808080',
        'white': '#F5F5F5'
      };
      return colors[color as keyof typeof colors] || colors.brown;
    };

    // Get body type scale factors
    const getBodyScale = (type: string) => {
      const scales = {
        'slim': { width: 0.8, height: 1.0 },
        'average': { width: 1.0, height: 1.0 },
        'athletic': { width: 1.1, height: 1.0 },
        'curvy': { width: 1.15, height: 1.0 }
      };
      return scales[type as keyof typeof scales] || scales.average;
    };

    const skinColor = getSkinToneColor(preferences.skin_tone);
    const hairColor = getHairColor(preferences.hair_color);
    const bodyScale = getBodyScale(preferences.body_type);

    // Draw avatar base
    const centerX = canvas.width / 2;
    const headRadius = 45;
    const bodyWidth = 60 * bodyScale.width;
    const bodyHeight = 120 * bodyScale.height;

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(centerX, 80, headRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Hair
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(centerX, 70, headRadius - 5, Math.PI, 2 * Math.PI);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2F1B14';
    ctx.beginPath();
    ctx.arc(centerX - 15, 75, 3, 0, 2 * Math.PI);
    ctx.arc(centerX + 15, 75, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#2F1B14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, 85, 8, 0, Math.PI);
    ctx.stroke();

    // Body (torso)
    ctx.fillStyle = skinColor;
    ctx.fillRect(centerX - bodyWidth/2, 125, bodyWidth, bodyHeight);

    // Arms
    ctx.fillRect(centerX - bodyWidth/2 - 20, 140, 15, 80);
    ctx.fillRect(centerX + bodyWidth/2 + 5, 140, 15, 80);

    // Legs
    ctx.fillRect(centerX - 25, 245, 20, 100);
    ctx.fillRect(centerX + 5, 245, 20, 100);

    // Draw clothing overlay if items are worn
    const drawClothingOverlay = (category: string, color: string) => {
      ctx.globalAlpha = 0.7;
      
      switch(category) {
        case 'top':
          ctx.fillStyle = color;
          ctx.fillRect(centerX - bodyWidth/2, 125, bodyWidth, bodyHeight/2);
          ctx.fillRect(centerX - bodyWidth/2 - 20, 140, 15, 40);
          ctx.fillRect(centerX + bodyWidth/2 + 5, 140, 15, 40);
          break;
        case 'bottom':
          ctx.fillStyle = color;
          ctx.fillRect(centerX - bodyWidth/2, 185, bodyWidth, 60);
          ctx.fillRect(centerX - 25, 245, 20, 80);
          ctx.fillRect(centerX + 5, 245, 20, 80);
          break;
        case 'dress':
          ctx.fillStyle = color;
          ctx.fillRect(centerX - bodyWidth/2, 125, bodyWidth, bodyHeight);
          ctx.fillRect(centerX - bodyWidth/2 - 20, 140, 15, 40);
          ctx.fillRect(centerX + bodyWidth/2 + 5, 140, 15, 40);
          ctx.fillRect(centerX - 35, 185, 70, 80);
          break;
        case 'shoes':
          ctx.fillStyle = color;
          ctx.fillRect(centerX - 30, 340, 25, 15);
          ctx.fillRect(centerX + 5, 340, 25, 15);
          break;
      }
      
      ctx.globalAlpha = 1.0;
    };

    // Draw worn clothing items
    Object.entries(outfit).forEach(([category, itemId]) => {
      const item = clothingItems.find(c => c.id === itemId);
      if (item && item.color) {
        // Simple color mapping - in a real app, you'd have more sophisticated color handling
        const colorMap: {[key: string]: string} = {
          'red': '#DC2626',
          'blue': '#2563EB',
          'green': '#16A34A',
          'yellow': '#EAB308',
          'purple': '#9333EA',
          'pink': '#EC4899',
          'black': '#1F2937',
          'white': '#F9FAFB',
          'brown': '#A16207',
          'gray': '#6B7280',
          'grey': '#6B7280'
        };
        
        const clothingColor = colorMap[item.color.toLowerCase()] || '#6B7280';
        drawClothingOverlay(category, clothingColor);
      }
    });

    // Add a subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

  }, [preferences, outfit, clothingItems]);

  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full rounded-lg shadow-soft"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};