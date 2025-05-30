import { Show } from "solid-js";
import { qrCode, setVideoUrl } from "../lib/store";
import { EXT_LIVE_VIDEO_FLAG } from "./BroadcastScreen";

export default function ShowRemoteCamera() {
    return (
        <Show when={!qrCode()}>
            <button onClick={
                () => setVideoUrl(EXT_LIVE_VIDEO_FLAG)
            }>Show Phone Camera</button>
        </Show>
    );
}
