import styles from './ThumbnailControl.module.scss';

type ThumbnailControlProps = {
    toSelect: () => void;
    toDelete: () => void;
}

export default function ThumbnailControl(props: ThumbnailControlProps) {
    return (
        <nav class={styles['thumbnail-control-component']}>
            <li>
                <button onClick={() => props.toSelect()} title='Play'> ▶ </button>
            </li>
            <li>
                <button onClick={() => props.toDelete()} title='Clear'>🗑 </button>
            </li>
        </nav >
    );
}