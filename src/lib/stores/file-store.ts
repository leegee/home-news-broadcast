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
    const tx = db.transaction("files", "readonly");
    const store = tx.objectStore("files");

    return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
    });
}

export async function loadFile(key: string): Promise<Blob | undefined> {
    const db = await ready;
    const tx = db.transaction("files", "readonly");
    const store = tx.objectStore("files");

    return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result ?? undefined);
        request.onerror = () => reject(request.error);
    });
}

export async function getMimeType(key: string): Promise<string | undefined> {
    const db = await ready;
    const tx = db.transaction("meta", "readonly");
    const store = tx.objectStore("meta");

    return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as string | undefined);
        request.onerror = () => reject(request.error);
    });
}

export async function getFileAndType(key: string): Promise<[Blob | undefined, string | undefined]> {
    const db = await ready;

    const fileTx = db.transaction("files", "readonly");
    const fileStore = fileTx.objectStore("files");
    const fileRequest = fileStore.get(key);

    const typeTx = db.transaction("meta", "readonly");
    const typeStore = typeTx.objectStore("meta");
    const typeRequest = typeStore.get(key);

    return Promise.all([
        new Promise<Blob | undefined>((resolve, reject) => {
            fileRequest.onsuccess = () => resolve(fileRequest.result ?? undefined);
            fileRequest.onerror = () => reject(fileRequest.error);
        }),
        new Promise<string | undefined>((resolve, reject) => {
            typeRequest.onsuccess = () => resolve(typeRequest.result ?? undefined);
            typeRequest.onerror = () => reject(typeRequest.error);
        })
    ]);
}


export async function saveFile(key: string, file: File): Promise<void> {
    const db = await ready;
    const tx = db.transaction(["files", "meta"], "readwrite");

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore("files").put(file, key);
        tx.objectStore("meta").put(file.type, key);
    });
}

export async function deleteFile(key: string): Promise<void> {
    console.debug('file-store.deleteFile enter', key);
    const db = await ready;
    const tx = db.transaction(["files", "meta"], "readwrite");

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            console.debug('file-store.deleteFile deleted', key);
            resolve();
        };
        tx.onerror = () => {
            console.warn('file-store.deleteFile failed to delete', key, tx.error);
            reject(tx.error)
        };

        tx.objectStore("files").delete(key);
        tx.objectStore("meta").delete(key);
    });
}
