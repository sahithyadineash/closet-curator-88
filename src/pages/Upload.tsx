import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, Camera, Image as ImageIcon, Tag, Palette, Scissors, WashingMachine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { removeBackground, analyzeColors } from "@/lib/ml-utils";
import { Checkbox } from "@/components/ui/checkbox";

const categories = [
  "Shirts", "T-Shirts", "Pants", "Jeans", "Dresses", "Skirts", 
  "Jackets", "Coats", "Sweaters", "Hoodies", "Shoes", "Accessories"
];

const colors = [
  "Black", "White", "Grey", "Navy", "Blue", "Red", "Pink", 
  "Purple", "Green", "Yellow", "Orange", "Brown", "Beige"
];

const seasons = ["Spring", "Summer", "Fall", "Winter", "All Season"];

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [season, setSeason] = useState("");
  const [occasion, setOccasion] = useState("");
  const [maxUses, setMaxUses] = useState("10");
  const [removeBackgroundEnabled, setRemoveBackgroundEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Auto-analyze colors when file is selected
      analyzeImageColors(e.target.files[0]);
    }
  };

  const analyzeImageColors = async (file: File) => {
    try {
      const detectedColors = await analyzeColors(file);
      if (detectedColors.length > 0 && !color) {
        setColor(detectedColors[0]);
        toast({
          title: "Color detected!",
          description: `We detected ${detectedColors[0]} as the primary color.`,
        });
      }
    } catch (error) {
      console.error('Color analysis failed:', error);
    }
  };

  const handleBackgroundRemoval = async () => {
    if (!selectedFile) return;
    
    setProcessing(true);
    try {
      const processedFile = await removeBackground(selectedFile);
      setSelectedFile(processedFile);
      toast({
        title: "Background removed!",
        description: "The background has been removed from your image.",
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Failed to remove background. Using original image.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !itemName || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload an image.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('clothing-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('clothing-images')
        .getPublicUrl(fileName);

      // Save item to database
      const { error: insertError } = await supabase
        .from('clothing_items')
        .insert({
          user_id: user.id,
          name: itemName,
          category,
          color,
          season,
          occasion,
          max_uses: parseInt(maxUses),
          current_uses: 0,
          in_wash: false,
          image_url: data.publicUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: "Item Added!",
        description: `${itemName} has been added to your wardrobe.`,
      });

      // Reset form
      setSelectedFile(null);
      setItemName("");
      setCategory("");
      setColor("");
      setSeason("");
      setOccasion("");
      setMaxUses("10");
      setRemoveBackgroundEnabled(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to wardrobe.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20 md:pb-8 pt-8 md:pt-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Add New Item
          </h1>
          <p className="text-muted-foreground">Upload and categorize your clothing items</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Upload Photo
              </CardTitle>
              <CardDescription>Take a photo or upload from your device</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <ImageIcon className="h-12 w-12 mx-auto text-primary" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBackgroundRemoval}
                        disabled={processing}
                      >
                        <Scissors className="h-4 w-4 mr-1" />
                        {processing ? "Processing..." : "Remove BG"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Drop your image here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button type="button" variant="outline" asChild>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Choose File
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., Blue Denim Jacket"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((clr) => (
                        <SelectItem key={clr} value={clr.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            {clr}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season">Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => (
                      <SelectItem key={s} value={s.toLowerCase()}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Input
                  id="occasion"
                  placeholder="casual, work, formal, party"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses Before Wash</Label>
                  <Select value={maxUses} onValueChange={setMaxUses}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select max uses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 use</SelectItem>
                      <SelectItem value="3">3 uses</SelectItem>
                      <SelectItem value="5">5 uses</SelectItem>
                      <SelectItem value="10">10 uses</SelectItem>
                      <SelectItem value="15">15 uses</SelectItem>
                      <SelectItem value="20">20 uses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <WashingMachine className="h-4 w-4" />
                    Wash Settings
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Item will automatically go to wash after {maxUses} uses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-fashion">
            <UploadIcon className="h-4 w-4 mr-2" />
            Add to Wardrobe
          </Button>
        </form>
      </div>
    </div>
  );
}