import { createSignal } from 'solid-js';
import { qrCode, setQrCode, STREAM_TYPES, streamSource } from '../lib/stores/ui';
import { changeMedia } from '../lib/inter-tab-comms';

export default function ShowRemoteCamera() {
    const [source, setSource] = createSignal(streamSource());

    const toggleCamera = () => {
        const currentSource = source();
        const currentQr = qrCode();

        if (currentSource !== 'peer' && !currentQr) {
            changeMedia({ url: '', type: STREAM_TYPES.LIVE_EXTERNAL });
            setSource(STREAM_TYPES.LIVE_EXTERNAL);
        } else {
            changeMedia({ url: '', type: STREAM_TYPES.NONE });
            setSource(STREAM_TYPES.NONE);
            setQrCode('')
        }
    };

    return (
        <button onClick={toggleCamera} title="Stream a camera from a mobile phone">
            {source() !== 'peer' ? 'Phone Camera' : 'Disconnect Phone'}
        </button>
    );
}
