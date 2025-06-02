import styles from './ThumbnailControl.module.scss';

type ThumbnailControlProps = {
    toSelect: () => void;
    toDelete: () => void;
    onLeft: () => void;
    onRight: () => void;
}

export default function ThumbnailControl(props: ThumbnailControlProps) {
    return (
        <>
            <nav class={styles['thumbnail-control-component']}>
                <li>
                    <button onClick={() => props.onLeft()} title='Move left' class={styles['move-left']}> &lt; </button>
                </li>
                <li>
                    <button onClick={() => props.toSelect()} title='Play'> ▶ </button>
                </li>
                <li>
                    <button onClick={() => props.toDelete()} title='Remove'>🗑 </button>
                </li>
                <li>
                    <button onClick={() => props.onRight()} title='Move right' class={styles['move-right']}> &gt; </button>
                </li>
            </nav>
        </>
    );
}