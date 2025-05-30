import { Show } from "solid-js";
import { qrCode, setVideoOrImageUrl } from "../lib/store";
import { DISPLAY_FLAGS } from "./BroadcastScreen";

export default function ShowRemoteCamera() {
    return (
        <Show when={!qrCode()}>
            <button onClick={
                () => setVideoOrImageUrl(DISPLAY_FLAGS.external_live_video)
            }>Show Phone Camera</button>
        </Show>
    );
}
