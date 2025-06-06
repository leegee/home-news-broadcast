import { onCleanup, onMount } from "solid-js";
import { Html5Qrcode } from "html5-qrcode";

export default function QRScanner({ onResult }: { onResult: (text: string) => void }) {
    const id = "qr-reader";

    onMount(() => {
        const qr = new Html5Qrcode(id);
        qr.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            (decoded) => {
                qr.stop();
                onResult(decoded);
            },
            console.warn
        );

        onCleanup(() => qr.stop().catch(console.error));
    });

    return <div id={id} style={{ width: "100%" }} />;
}
