let db: IDBDatabase;

// Singleton promise to ensure the database is ready before use
const ready = new Promise<IDBDatabase>((resolve, reject) => {
    const dbRequest = indexedDB.open("fileStore", 2);

    dbRequest.onupgradeneeded = () => {
        const db = dbRequest.result;
        if (!db.objectStoreNames.contains("files")) {
            db.createObjectStore("files");
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

export async function saveFile(key: string, file: File): Promise<void> {
    const db = await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        const store = tx.objectStore("files");
        store.put(file, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

export async function loadFile(key: string): Promise<Blob | undefined> {
    const db = await ready;
    return new Promise((resolve) => {
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(undefined);
    });
}

export async function deleteFile(key: string): Promise<void> {
    const db = await ready;
    return new Promise((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        const store = tx.objectStore("files");
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
