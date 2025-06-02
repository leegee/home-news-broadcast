import { createEffect, Show } from "solid-js";
import { qrCode } from "../lib/stores/store";

export default function ShowQRCode() {

    createEffect(() => {
        const qr = qrCode();
        const canvas = document.getElementById("qr") as HTMLCanvasElement;
        if (canvas && qr) {
            const img = new Image();
            img.onload = () => {
                const ctx = canvas.getContext("2d");
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
                ctx?.drawImage(img, 0, 0);
            };
            img.src = qr;
        }
    });

    return (
        <Show when={qrCode()}>
            <img src={qrCode()} alt="QR Code" width={400} height={400} style={{ margin: '4em' }} />
        </Show>
    );
}
