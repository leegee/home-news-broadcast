// videoDropHandler.js
const MAX_HISTORY = 10;
const STORAGE_KEY = "droppedVideoUrls";

function isValidUrl(str) {
    try {
        const url = new URL(str);
        return ["youtube.com", "youtu.be", "rumble.com"].some(host =>
            url.hostname.includes(host)
        );
    } catch (e) {
        return false;
    }
}

function getEmbedUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
            const videoId = parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
            return `https://www.youtube.com/embed/${videoId}`;
        } else if (parsed.hostname.includes("rumble.com")) {
            const parts = parsed.pathname.split("/");
            const id = parts.find(p => p && p.includes("--"))?.split("--")[0];
            return id ? `https://rumble.com/embed/${id}` : null;
        }
    } catch {
        return null;
    }
    return null;
}

function getHistory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveUrlToHistory(url) {
    let history = getHistory();
    history.unshift(url);
    history = history.filter((v, i, a) => a.indexOf(v) === i).slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function createThumbnail(url, onClick) {
    const thumb = document.createElement("div");
    thumb.style.width = "120px";
    thumb.style.margin = "0.5em";
    thumb.style.cursor = "pointer";

    const img = document.createElement("img");
    const embedUrl = getEmbedUrl(url);

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = embedUrl.split("/").pop();
        img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    } else if (url.includes("rumble.com")) {
        img.src = "https://via.placeholder.com/120x90.png?text=Rumble"; // Rumble doesn't expose thumb URLs easily
    }

    img.alt = url;
    img.style.width = "100%";
    thumb.appendChild(img);

    thumb.addEventListener("click", () => onClick(url));

    return thumb;
}

export function setupVideoDropArea(dropSelector = 'body', embedAreaSelector = '#videoThumbs', largeVideoSelector = '#largeVideo') {
    const dropArea = document.querySelector(dropSelector);
    const embedArea = document.querySelector(embedAreaSelector);
    const largeVideo = document.querySelector(largeVideoSelector);

    const thumbsContainer = document.createElement("div");
    thumbsContainer.style.display = "flex";
    thumbsContainer.style.flexWrap = "wrap";

    embedArea.appendChild(thumbsContainer);

    function showVideo(url) {
        const embedUrl = getEmbedUrl(url);
        if (!embedUrl) return;

        largeVideo.innerHTML = "";
        const iframe = document.createElement("iframe");
        iframe.src = embedUrl;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        largeVideo.appendChild(iframe);
    }

    function renderThumbnails() {
        thumbsContainer.innerHTML = "";
        const history = getHistory();
        history.forEach(url => {
            const thumb = createThumbnail(url, showVideo);
            thumbsContainer.appendChild(thumb);
        });
        if (history.length) showVideo(history[0]);
    }

    dropArea.addEventListener("dragover", e => {
        e.preventDefault();
        dropArea.style.outline = "2px dashed yellow";
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.style.outline = "";
    });

    dropArea.addEventListener("drop", e => {
        e.preventDefault();
        dropArea.style.outline = "";
        const text = e.dataTransfer.getData("text/plain");
        if (isValidUrl(text)) {
            saveUrlToHistory(text);
            renderThumbnails();
        }
    });

    dropArea.addEventListener("paste", e => {
        const text = (e.clipboardData || window.clipboardData).getData("text");
        if (isValidUrl(text)) {
            saveUrlToHistory(text);
            renderThumbnails();
        }
    });

    renderThumbnails();
}
