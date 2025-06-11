import { endCurrentCall } from './qr2phone2stream';
import type { StreamType } from '../stores/ui';

export type MediaChangeParams = {
    url: string;
    type: StreamType;
}

export type MediaChangeMessage = {
    class: 'media-change';
} & MediaChangeParams;

export type EndCallMessage = {
    class: 'end-call';
};

const CHANNEL_NAME = 'cap-channel';

export const channel = new BroadcastChannel(CHANNEL_NAME);

export const changeMedia = (params: { url: string; type: StreamType }) => {
    console.log('SEND changeMedia', params);
    const message: MediaChangeMessage = { class: 'media-change', ...params };
    channel.postMessage(message);
};

export const onMediaChange = (
    callback: (params: MediaChangeParams) => void
) => {
    const handler = (event: MessageEvent<MediaChangeMessage>) => {
        if (event.data.class === 'media-change') {
            console.log('ON MEDIA CHANGE', event.data, callback);
            callback({ url: event.data.url, type: event.data.type });
        }
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
};

export const sendEndCallRequest = () => {
    console.log('Sending sendEndCallRequest')
    channel.postMessage({ class: 'end-call' } as EndCallMessage);
};

export const registerOnEndCallHandler = () => {
    console.log('Enter registerOnEndCallHandler')
    const handler = (event: MessageEvent<EndCallMessage>) => {
        if (event.data.class === 'end-call') {
            console.log('registerOnEndCallHandler calling endCurrentCall')
            endCurrentCall();
        }
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
};
