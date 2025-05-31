let db: IDBDatabase;

// Singleton promise to ensure the database is ready before use
const ready = new Promise<IDBDatabase>((resolve, reject) => {
    const dbRequest = indexedDB.open("fileStore", 2);

    dbRequest.onupgradeneeded = () => {
        const db = dbRequest.result;
        if (!db.objectStoreNames.contains("files")) {
            db.createObjectStore("files");
        }
        if (!db.objectStoreNames.contains("meta")) {
            db.createObjectStore("meta");
        }
    };

    dbRequest.onsuccess = () => {
        db = dbRequest.result;
        resolve(db);
    };

    dbRequest.onerror = () => {
        reject(dbRequest.error);
    };
});

export async function listKeys(): Promise<string[]> {
    const db = await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
    });
}

export async function getMimeType(key: string): Promise<string | undefined> {
    const db = await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction("meta", "readonly");
        const store = tx.objectStore("meta");
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as string | undefined);
        request.onerror = () => reject(request.error);
    });
}

export async function saveFile(key: string, file: File): Promise<void> {
    const db = await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction(["files", "meta"], "readwrite");

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);

        tx.objectStore("files").put(file, key);
        tx.objectStore("meta").put(file.type, key);
    });
}

export async function loadFile(key: string): Promise<Blob | undefined> {
    const db = await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as Blob);
        request.onerror = () => reject(request.error);
    });
}

export async function deleteFile(key: string): Promise<void> {
    const db = await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction(["files", "meta"], "readwrite");

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);

        tx.objectStore("files").delete(key);
        tx.objectStore("meta").delete(key);
    });
}
