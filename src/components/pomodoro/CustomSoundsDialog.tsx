
import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
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
import { Music, Trash2, Play, Check } from "lucide-react";

export function CustomSoundsDialog() {
  const { 
    customSounds, 
    addCustomSound, 
    removeCustomSound, 
    currentCustomSound, 
    setCurrentCustomSound 
  } = useApp();
  const [newSoundUrl, setNewSoundUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleAddSound = () => {
    if (newSoundUrl.trim() && !customSounds.includes(newSoundUrl)) {
      addCustomSound(newSoundUrl);
      setNewSoundUrl("");
    }
  };

  const playSound = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    if (isPlaying === url) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset audio position
      setIsPlaying(null);
      return;
    }
    
    // Stop any currently playing sound
    if (audioRef.current.src) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  
    // Remove any existing ended event listeners
    audioRef.current.removeEventListener("ended", () => setIsPlaying(null));
    
    audioRef.current.src = url;
    audioRef.current.load(); // Ensure the audio is loaded before playing
    
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(url);
          audioRef.current?.addEventListener("ended", () => setIsPlaying(null));
        })
        .catch(e => {
          console.error("Error playing sound:", e);
          setIsPlaying(null);
        });
    }
  };

  const handleSelectSound = (url: string) => {
    setCurrentCustomSound(url === currentCustomSound ? null : url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Music className="h-4 w-4" />
          <span>Custom Sounds</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom Timer Sounds</DialogTitle>
          <DialogDescription>
            Add custom sound URLs to play when your timer starts or completes
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              value={newSoundUrl}
              onChange={(e) => setNewSoundUrl(e.target.value)}
              placeholder="Enter sound URL (.mp3, .wav, etc.)"
              className="flex-1"
            />
            <Button onClick={handleAddSound} size="sm">Add</Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {customSounds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No custom sounds added yet
              </p>
            ) : (
              customSounds.map((sound) => (
                <div 
                  key={sound} 
                  className="flex items-center justify-between p-2 rounded-md border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="truncate max-w-[180px] text-sm">{sound.split('/').pop()}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => playSound(sound)}
                    >
                      <Play className={`h-4 w-4 ${isPlaying === sound ? 'text-primary animate-pulse' : ''}`} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${currentCustomSound === sound ? 'bg-primary/20' : ''}`}
                      onClick={() => handleSelectSound(sound)}
                    >
                      <Check className={`h-4 w-4 ${currentCustomSound === sound ? 'text-primary' : ''}`} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeCustomSound(sound)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
