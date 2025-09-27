import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Wardrobe from "./pages/Wardrobe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/avatar" element={<div className="pt-20 pb-20 text-center">Avatar page coming soon!</div>} />
            <Route path="/picks" element={<div className="pt-20 pb-20 text-center">Your Picks page coming soon!</div>} />
            <Route path="/wash" element={<div className="pt-20 pb-20 text-center">In Wash page coming soon!</div>} />
            <Route path="/matches" element={<div className="pt-20 pb-20 text-center">Smart Matches page coming soon!</div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
