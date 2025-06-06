export function getYoutubeThumbnail(url: string): string {
    const embedUrl = getYoutubeEmbedUrl(url);
    if (!embedUrl) return "https://via.placeholder.com/120x90.png?text=Invalid";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = embedUrl.split("/").pop();
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return "https://via.placeholder.com/120x90.png?text=Unknown";
}

export function getYoutubeEmbedUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
            const videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
            return `https://www.youtube.com/embed/${videoId}`;
        }
    } catch {
        return null;
    }
    return null;
}

export function isYoutubeUrl(str: string): boolean {
    try {
        const url = new URL(str);
        return ["youtube.com", "youtu.be"].some(host => url.hostname.includes(host));
    } catch {
        return false;
    }
}


