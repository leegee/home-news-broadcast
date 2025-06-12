import { qrCode, setCurrentMediaType, MEDIA_TYPES, currentMediaType } from '../stores/ui';
import { changeMedia, sendEndCallRequest } from '../lib/inter-tab-comms';

export default function ShowRemoteCamera() {

    const toggleCamera = () => {
        const currentSource = currentMediaType();
        const currentQr = qrCode();
        console.log('toggle camera', currentSource, currentQr);

        if (currentSource !== 'peer' && !currentQr) {
            console.log('not peer/qr so make it so');
            changeMedia({ url: '', type: MEDIA_TYPES.REMOTE_CAMERA });
            setCurrentMediaType(MEDIA_TYPES.REMOTE_CAMERA);
        } else {
            console.log('other');
            sendEndCallRequest();
        }
    };

    return (
        <button onClick={toggleCamera} title="Stream a camera from a mobile phone">
            {currentMediaType() !== 'peer' ? 'Phone Camera' : 'Disconnect Phone'}
        </button>
    );
}
