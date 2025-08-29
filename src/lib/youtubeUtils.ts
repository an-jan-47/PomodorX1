interface YouTubeAudio {
  url: string;
  title: string;
  duration: number;
}

export const processYouTubeUrl = async (url: string): Promise<YouTubeAudio> => {
  try {
    // Extract video ID
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube URL");
    
    // Fetch audio stream URL using a server endpoint
    const response = await fetch(`/api/youtube-audio?videoId=${videoId}`);
    if (!response.ok) throw new Error("Failed to process YouTube URL");
    
    const data = await response.json();
    return {
      url: data.audioUrl,
      title: data.title,
      duration: data.duration
    };
  } catch (error) {
    console.error("YouTube processing error:", error);
    throw error;
  }
};

const extractYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};