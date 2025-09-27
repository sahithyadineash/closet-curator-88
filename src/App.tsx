import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Wardrobe from "./pages/Wardrobe";
import Wash from "./pages/Wash";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen">
            <Navigation />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/wardrobe" element={<ProtectedRoute><Wardrobe /></ProtectedRoute>} />
              <Route path="/avatar" element={<ProtectedRoute><div className="pt-20 pb-20 text-center">Avatar page coming soon!</div></ProtectedRoute>} />
              <Route path="/picks" element={<ProtectedRoute><div className="pt-20 pb-20 text-center">Your Picks page coming soon!</div></ProtectedRoute>} />
              <Route path="/wash" element={<ProtectedRoute><Wash /></ProtectedRoute>} />
              <Route path="/matches" element={<ProtectedRoute><div className="pt-20 pb-20 text-center">Smart Matches page coming soon!</div></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
