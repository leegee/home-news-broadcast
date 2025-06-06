import { createEffect, createSignal, Show } from "solid-js";
import { STREAM_TYPES } from '../lib/stores/ui';
import { changeMedia } from "../lib/inter-tab-comms";

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
            <button onClick={() => handleClick()} title="Stream a camera from this computer">
                Local Camera
            </button>
        </Show>
    );
}