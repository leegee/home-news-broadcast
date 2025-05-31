import { createEffect, createSignal, Show } from "solid-js";
import { STREAM_TYPES } from '../lib/store.ts';

type LocalCameraProps = {
    onSelect: (keyOrUrl: string) => void;
};

export default function LocalCamera(props: LocalCameraProps) {
    const [canAccessCamera, setCanAccessCamera] = createSignal(false);
    const [canAccessMic, setCanAccessMic] = createSignal(false);

    createEffect(() => {
        navigator.permissions?.query({ name: 'camera' as PermissionName }).then((status) => {
            setCanAccessCamera(status.state === 'granted' || status.state === 'prompt');
        }).catch(() => setCanAccessCamera(false));

        navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((status) => {
            setCanAccessMic(status.state === 'granted' || status.state === 'prompt');
        }).catch(() => setCanAccessMic(false));
    });

    return (
        <Show when={canAccessCamera() && canAccessMic()}>
            <button onClick={() => props.onSelect(STREAM_TYPES.LIVE_LOCAL)}>
                Local Camera
            </button>
        </Show>
    );
}