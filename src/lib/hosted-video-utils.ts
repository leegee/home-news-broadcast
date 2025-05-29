import { history, setHistory } from "./store";

const MAX_HISTORY = 30;

export function getThumbnail(url: string): string {
    const embedUrl = getEmbedUrl(url);
    if (!embedUrl) return "https://via.placeholder.com/120x90.png?text=Invalid";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = embedUrl.split("/").pop();
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return "https://via.placeholder.com/120x90.png?text=Unknown";
}

export function getEmbedUrl(url: string): string | null {
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

export function isValidUrl(str: string): boolean {
    try {
        const url = new URL(str);
        return ["youtube.com", "youtu.be"].some(host => url.hostname.includes(host));
    } catch {
        console.log("Don't know what to do with the supplied URL", str);
        return false;
    }
}

export function saveUrlToHistory(url: string) {
    let h = history();
    h = [url, ...h.filter(v => v !== url)]; // prepend new URL, remove duplicates
    if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
    setHistory(h);
}


