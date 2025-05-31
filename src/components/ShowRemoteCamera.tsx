import { Show } from "solid-js";
import { qrCode, setVideoOrImageSource, STREAM_TYPES } from "../lib/store";

export default function ShowRemoteCamera() {
    return (
        <Show when={!qrCode()}>
            <button onClick={
                () => setVideoOrImageSource({ url: '', type: STREAM_TYPES.LIVE_EXTERNAL })
            }>Show Phone Camera</button>
        </Show>
    );
}
