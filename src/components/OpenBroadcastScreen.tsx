export default function OpenBroadcastScreen() {
    function open() {
        window.open('/#output', '_blank');
    }

    return (
        <button onClick={open}>Open Broadcast Display</button>
    );
}
