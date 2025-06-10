export default function OpenBroadcastScreen() {
    function open() {
        // window.open('/#output', '_blank');
        if (window.electronAPI?.openBroadcastWindow) {
            console.log('electron');
            window.electronAPI.openBroadcastWindow('#output');
        } else {
            console.log('not electron');
            window.open(`${window.location.origin}/#output`, '_blank');
        }
    }


    return window.electronAPI?.openBroadcastWindow ? null : (
        <button onClick={open} title="Opens the broadcast window that will be streamed">Broadcast Display</button>
    );
}
