import { Show } from "solid-js";
import { qrCode, STREAM_TYPES } from "../lib/stores/store";
import { changeMedia } from "../lib/inter-tab-comms";

export default function ShowRemoteCamera() {
    const handleClick = () => {
        changeMedia({
            url: '',
            type: STREAM_TYPES.LIVE_EXTERNAL
        });
    };

    return (
        <Show when={!qrCode()}>
            <button onClick={() => handleClick()}>
                Show Phone Camera
            </button>
        </Show>
    );
}
