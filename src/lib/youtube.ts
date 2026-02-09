export function getYouTubeID(url: string) {
    if (!url) return null;
    
    // أنماط مختلفة لروابط يوتيوب
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
  
    return (match && match[2].length === 11) ? match[2] : null;
}
  
export function getYouTubeThumbnail(url: string) {
    const id = getYouTubeID(url);
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}