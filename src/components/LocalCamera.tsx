import { createEffect, createSignal, Show } from "solid-js";
import { STREAM_TYPES } from '../lib/stores/ui.ts';
import { changeMedia } from "../lib/inter-tab-comms.ts";

export default function ShowLocalCamera() {
    const [canAccessCamera, setCanAccessCamera] = createSignal(false);
    const [canAccessMic, setCanAccessMic] = createSignal(false);

    const handleClick = () => {
        changeMedia({
            url: '',
            type: STREAM_TYPES.LIVE_LOCAL
        });
    };

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
            <button onClick={() => handleClick()}>
                Show Local Camera
            </button>
        </Show>
    );
}