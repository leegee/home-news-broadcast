import { qrCode, setQrCode, STREAM_TYPES } from "../lib/stores/ui";
import { changeMedia } from "../lib/inter-tab-comms";

export default function ShowRemoteCamera() {
    const toggleCamera = () => {
        if (!qrCode()) {
            changeMedia({
                url: '',
                type: STREAM_TYPES.LIVE_EXTERNAL
            });
        } else {
            changeMedia({
                url: '',
                type: STREAM_TYPES.NONE
            });
        }
    };

    return (
        <button onClick={toggleCamera}>
            {qrCode() ? 'Disconnect Phone Camera' : 'Live Phone Camera'}
        </button>
    );
}
