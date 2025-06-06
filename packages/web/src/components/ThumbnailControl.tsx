import styles from './ThumbnailControl.module.scss';

type ThumbnailControlProps = {
    onSelect: () => void;
    onDelete: () => void;
    onEdit: () => void;
    onLeft: () => void;
    onRight: () => void;
}

export default function ThumbnailControl(props: ThumbnailControlProps) {
    return (
        <>
            <nav class={styles['thumbnail-control-component']}>
                <button onClick={() => props.onLeft()} title='Move left' class={styles['move-left']}> &lt; </button>
                <div class={styles['actions']}>
                    <button onClick={() => props.onSelect()} title='Play'>▶</button>
                    <button onClick={() => props.onEdit()} title='Play'>🖉</button>
                    <button onClick={() => props.onDelete()} title='Remove'>🗑</button>
                </div>
                <button onClick={() => props.onRight()} title='Move right' class={styles['move-right']}> &gt; </button>
            </nav>
        </>
    );
}