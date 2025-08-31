
import React, { useState, useRef, useCallback } from "react";
import { useApp } from "@/hooks/useApp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Check, Youtube, Volume2, VolumeX } from "lucide-react";

interface CustomSoundsDialogProps {
  onYoutubeUrl?: (url: string) => void;
}

export function CustomSoundsDialog({ onYoutubeUrl }: CustomSoundsDialogProps) {
  const { 
    customSounds, 
    addCustomSound, 
    removeCustomSound, 
    currentCustomSound, 
    setCurrentCustomSound 
  } = useApp();
  const [open, setOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isYoutubeMuted, setIsYoutubeMuted] = useState(false);
  const youtubePlayerRef = useRef<HTMLIFrameElement | null>(null);

  const extractVideoId = useCallback((url: string): string | null => {
    try {
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
      return videoIdMatch ? videoIdMatch[1] : null;
    } catch {
      return null;
    }
  }, []);

  const handleYoutubeUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      // If onYoutubeUrl prop is provided, use it instead of local state
      if (onYoutubeUrl) {
        onYoutubeUrl(youtubeUrl);
        setOpen(false); // Close dialog when URL is sent to parent
      } else {
        setYoutubeVideoId(videoId);
      }
      setYoutubeUrl("");
    } else {
      alert("Please enter a valid YouTube URL");
    }
  }, [youtubeUrl, extractVideoId, onYoutubeUrl]);

  const toggleYoutubeSound = useCallback(() => {
    // For iframe YouTube players, we'll handle mute state in the URL parameters
    setIsYoutubeMuted(!isYoutubeMuted);
  }, [isYoutubeMuted]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Youtube className="h-4 w-4 text-red-500" />
          <span>YouTube Music</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube Music Player
          </DialogTitle>
          <DialogDescription>
            Play YouTube music during your focus sessions - continues in background
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleYoutubeUrlSubmit} className="flex items-center gap-2">
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="flex-1"
              />
              <Button type="submit" size="sm" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                Load
              </Button>
            </form>
            
            {youtubeVideoId && !onYoutubeUrl && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Now Playing</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleYoutubeSound}
                      className="flex items-center gap-2"
                    >
                      {isYoutubeMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      {isYoutubeMuted ? 'Unmute' : 'Mute'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setYoutubeVideoId(null)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden bg-black border">
                  <iframe
                    ref={youtubePlayerRef}
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&loop=1&playlist=${youtubeVideoId}&controls=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1${isYoutubeMuted ? '&mute=1' : ''}`}
                    title="YouTube Music Player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700 text-center font-medium">
                    🎵 Music will continue playing in the background while you focus
                  </p>
                </div>
              </div>
            )}
            
            {!youtubeVideoId && !onYoutubeUrl && (
              <div className="text-center py-8 text-muted-foreground">
                <Youtube className="h-16 w-16 mx-auto mb-3 opacity-30 text-red-500" />
                <p className="text-lg font-medium mb-1">No Music Playing</p>
                <p className="text-sm">Paste a YouTube URL above to start your focus music</p>
              </div>
            )}
            
            {onYoutubeUrl && (
              <div className="text-center py-6 text-muted-foreground">
                <Youtube className="h-12 w-12 mx-auto mb-3 opacity-50 text-red-500" />
                <p className="text-base font-medium mb-1">Add Focus Music</p>
                <p className="text-sm">Paste a YouTube URL above to play music in your main timer</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)} className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
