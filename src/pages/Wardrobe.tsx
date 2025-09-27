import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid3X3, List, Heart } from "lucide-react";

// Mock data - replace with Supabase data
const mockItems = [
  {
    id: 1,
    name: "Blue Denim Jacket",
    category: "jackets",
    color: "blue",
    season: "fall",
    image: "/placeholder.svg",
    tags: ["casual", "outdoor"]
  },
  {
    id: 2,
    name: "White Cotton T-Shirt",
    category: "t-shirts",
    color: "white",
    season: "summer",
    image: "/placeholder.svg",
    tags: ["casual", "basic"]
  },
  {
    id: 3,
    name: "Black Dress Pants",
    category: "pants",
    color: "black",
    season: "all-season",
    image: "/placeholder.svg",
    tags: ["formal", "work"]
  },
  {
    id: 4,
    name: "Red Summer Dress",
    category: "dresses",
    color: "red",
    season: "summer",
    image: "/placeholder.svg",
    tags: ["party", "date"]
  },
  {
    id: 5,
    name: "Grey Wool Sweater",
    category: "sweaters",
    color: "grey",
    season: "winter",
    image: "/placeholder.svg",
    tags: ["warm", "cozy"]
  },
  {
    id: 6,
    name: "Brown Leather Boots",
    category: "shoes",
    color: "brown",
    season: "fall",
    image: "/placeholder.svg",
    tags: ["boots", "leather"]
  }
];

const categories = ["all", "shirts", "t-shirts", "pants", "jeans", "dresses", "jackets", "shoes"];

export default function Wardrobe() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favorites, setFavorites] = useState<number[]>([]);

  const filteredItems = mockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (itemId: number) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20 md:pb-8 pt-8 md:pt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            My Wardrobe
          </h1>
          <p className="text-muted-foreground">Browse and manage your clothing collection</p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search items or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
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
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Display */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            Showing {filteredItems.length} of {mockItems.length} items
          </p>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-fashion transition-all duration-300 hover:scale-105">
                <CardContent className="p-3">
                  <div className="relative aspect-square mb-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg bg-muted"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleFavorite(item.id)}
                    >
                      <Heart className={`h-4 w-4 ${favorites.includes(item.id) ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </div>
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{item.name}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.category} • {item.color}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-soft transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg bg-muted"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize mb-2">
                        {item.category} • {item.color} • {item.season}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(item.id)}
                    >
                      <Heart className={`h-4 w-4 ${favorites.includes(item.id) ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No items found matching your criteria</p>
            <Button variant="outline">Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}