export default function OpenOutputScreen() {
    function open() {
        window.open('/#output', '_blank');
    }

    return (
        <button onClick={open}>Open Output Display</button>
    );
}
