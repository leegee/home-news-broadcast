export default function OpenBroadcastScreen() {
    function open() {
        // window.open('/#output', '_blank');
        if (window.electronAPI?.openWindow) {
            console.log('electron');
            window.electronAPI.openWindow('#output');
        } else {
            console.log('not electron');
            window.open(`${window.location.origin}/#output`, '_blank');
        }
    }

    return (
        <button onClick={open} title="Opens the broadcast window that will be streamed">Broadcast Display</button>
    );
}
