import type { StreamType } from './stores/ui';

export type MediaChangeParams = {
    url: string;
    type: StreamType;
}

export type MediaChangeMessage = {
    class: 'media-change';
} & MediaChangeParams;

const CHANNEL_NAME = 'cap-channel';

export const channel = new BroadcastChannel(CHANNEL_NAME);

export const changeMedia = (params: { url: string; type: StreamType }) => {
    const message: MediaChangeMessage = { class: 'media-change', ...params };
    channel.postMessage(message);
};

/**
 * 
 * onMediaChange(({ url, type }) => {
 *   console.log('Media changed to:', url, 'with type:', type);
 * });
 *
 * @param callback message handler
 * @returns cleanup function
 */
export const onMediaChange = (
    callback: (params: MediaChangeParams) => void
) => {
    const handler = (event: MessageEvent<MediaChangeMessage>) => {
        if (event.data.class === 'media-change') {
            callback({ url: event.data.url, type: event.data.type });
        }
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
};
