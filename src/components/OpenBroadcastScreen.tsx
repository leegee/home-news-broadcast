export default function OpenBroadcastScreen() {
    function open() {
        window.open('/#output', '_blank');
    }

    return (
        <button onClick={open} title="Opens the broadcast window that will be streamed">Open Broadcast Display</button>
    );
}
