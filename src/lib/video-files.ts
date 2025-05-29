// src/lib/video-files.ts

let db: IDBDatabase;

// Singleton promise to ensure the database is ready before use
const ready = new Promise<IDBDatabase>((resolve, reject) => {
    const dbRequest = indexedDB.open("videoStore", 1);

    dbRequest.onupgradeneeded = () => {
        db = dbRequest.result;
        db.createObjectStore("videos");
    };

    dbRequest.onsuccess = () => {
        db = dbRequest.result;
        resolve(db);
    };

    dbRequest.onerror = () => {
        reject(dbRequest.error);
    };
});

export async function listVideoKeys(): Promise<string[]> {
    const db = await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction("videos", "readonly");
        const store = tx.objectStore("videos");

        const request = store.getAllKeys();

        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
    });
}

export async function saveVideo(key: string, file: File): Promise<void> {
    const db = await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction("videos", "readwrite");
        const store = tx.objectStore("videos");
        store.put(file, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

export async function loadVideo(key: string): Promise<Blob | undefined> {
    const db = await ready;
    return new Promise((resolve) => {
        const tx = db.transaction("videos", "readonly");
        const store = tx.objectStore("videos");
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(undefined);
    });
}
