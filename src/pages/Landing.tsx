import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight } from "lucide-react";
// @ts-ignore
import introVideo from "@/assets/intro-video.MOV";

export default function Landing() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', () => {
        setTimeout(() => setShowButton(true), 2000);
      });
      
      video.addEventListener('ended', () => {
        setShowButton(true);
      });
    }
  }, []);

  const handleGetStarted = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      navigate("/auth");
    }, 800);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      >
        <source src={introVideo} type="video/mp4" />
        <source src={introVideo} type="video/quicktime" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent animate-fade-in">
          VWardrobe
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl animate-fade-in opacity-90">
          Your Virtual Wardrobe Assistant - Organize, Style, and Discover Your Perfect Look
        </p>
        
        {showButton && (
          <Button
            onClick={handleGetStarted}
            size="lg"
            className={`
              bg-gradient-to-r from-primary to-accent hover:shadow-fashion 
              text-white border-2 border-white/20 backdrop-blur-sm
              animate-fade-in transition-all duration-300
              ${isTransitioning ? 'scale-110 opacity-80' : 'hover:scale-105'}
            `}
            disabled={isTransitioning}
          >
            <Play className="mr-2 h-5 w-5" />
            {isTransitioning ? "Starting..." : "Get Started"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Circular Transition Overlay */}
      <div
        className={`
          fixed inset-0 bg-gradient-to-br from-primary to-accent z-50 rounded-full
          transition-all duration-700 ease-in-out
          ${
            isTransitioning
              ? "scale-[200] opacity-100"
              : "scale-0 opacity-0 pointer-events-none"
          }
        `}
        style={{
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}