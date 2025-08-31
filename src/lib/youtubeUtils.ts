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
    
    // Instead of using a server endpoint, use direct YouTube URL
    // Note: Due to YouTube's terms of service, we should use their embedded player
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0`;
    
    return {
      url: embedUrl,
      title: "YouTube Audio", // We can't get the title without API access
      duration: 0 // We can't get the duration without API access
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