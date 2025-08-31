interface YouTubeAudio {
  url: string;
  title: string;
  duration: number;
  isYouTube: boolean;
}

export const processYouTubeUrl = async (url: string): Promise<YouTubeAudio> => {
  try {
    // Extract video ID
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube URL");
    
    // For YouTube URLs, we'll use a different approach
    // Since we can't extract audio directly, we'll provide an iframe embed
    // but mark it as YouTube so the sound system can handle it differently
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&start=0&end=10`;
    
    return {
      url: embedUrl,
      title: "YouTube Audio",
      duration: 10, // Short duration for notification sound
      isYouTube: true
    };
  } catch (error) {
    console.error("YouTube processing error:", error);
    throw error;
  }
};

// Alternative function to handle YouTube as background audio
export const createYouTubeAudioElement = (videoId: string): HTMLIFrameElement => {
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&enablejsapi=1&origin=${window.location.origin}`;
  iframe.style.display = 'none';
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.allow = 'autoplay';
  return iframe;
};

// Function to check if URL is YouTube (including YouTube Music)
export const isYouTubeUrl = (url: string): boolean => {
  return /(?:youtube\.com|youtu\.be|music\.youtube\.com)/.test(url);
};

const extractYouTubeVideoId = (url: string): string | null => {
  // Handle YouTube Music URLs
  if (url.includes('music.youtube.com')) {
    const musicMatch = url.match(/[?&]v=([^&]+)/);
    if (musicMatch) return musicMatch[1];
  }
  
  // Handle regular YouTube URLs
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};