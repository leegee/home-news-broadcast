import { createEffect, createSignal, Show } from "solid-js";
import { MEDIA_TYPES } from '../stores/ui';
import { changeMedia } from "../lib/inter-tab-comms";

export default function ShowLocalCamera() {
    const [canAccessCamera, setCanAccessCamera] = createSignal(false);
    const [canAccessMic, setCanAccessMic] = createSignal(false);

    const handleClick = () => {
        changeMedia({
            url: '',
            type: MEDIA_TYPES.LIVE_LOCAL_CAMERA
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