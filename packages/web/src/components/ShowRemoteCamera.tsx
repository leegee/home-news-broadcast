import { qrCode, setStreamSource, STREAM_TYPES, streamSource } from '../stores/ui';
import { changeMedia, sendEndCallRequest } from '../lib/inter-tab-comms';

export default function ShowRemoteCamera() {

    const toggleCamera = () => {
        const currentSource = streamSource();
        const currentQr = qrCode();
        console.log('toggle camera', currentSource, currentQr);

        if (currentSource !== 'peer' && !currentQr) {
            console.log('not peer/qr so make it so');
            changeMedia({ url: '', type: STREAM_TYPES.LIVE_EXTERNAL });
            setStreamSource(STREAM_TYPES.LIVE_EXTERNAL);
        } else {
            console.log('other');
            sendEndCallRequest();
        }
    };

    return (
        <button onClick={toggleCamera} title="Stream a camera from a mobile phone">
            {streamSource() !== 'peer' ? 'Phone Camera' : 'Disconnect Phone'}
        </button>
    );
}
