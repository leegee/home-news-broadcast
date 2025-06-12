import 'fake-indexeddb/auto';
import { ResizeObserver } from '@juggle/resize-observer';
import { vi } from 'vitest';

global.ResizeObserver = ResizeObserver;



class MockBroadcastChannel {
    listeners = new Map<string, Function[]>();

    addEventListener(type: string, listener: Function) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(listener);
    }

    removeEventListener(type: string, listener: Function) {
        if (!this.listeners.has(type)) return;
        const listeners = this.listeners.get(type)!;
        const index = listeners.indexOf(listener);
        if (index !== -1) listeners.splice(index, 1);
    }

    postMessage(msg: any) {
        setTimeout(() => {
            const event = new MessageEvent('message', { data: msg });
            const listeners = this.listeners.get('message') || [];
            for (const listener of listeners) {
                listener(event);
            }
            if (typeof (this as any).onmessage === 'function') {
                (this as any).onmessage(event);
            }
        }, 0);
    }

    close() {
        this.listeners.clear();
    }
}

(global as any).BroadcastChannel = MockBroadcastChannel;
