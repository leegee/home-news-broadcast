import { For, Show } from 'solid-js';
import { history, videoUrl } from '../lib/store';
import styles from './ControlScreen.module.scss';

import { getEmbedUrl, getThumbnail } from '../lib/hosted-video-utils.ts';

export default function VideoThumbnails(props: { onSelect: (url: string) => void }) {
    return (
        <nav class={styles["video-thumbs"]}>
            <Show when={history().length === 0}>
                <p>Drop video page URLs into this window. Press ESCAPE to toggle the thumbnail display.</p>
            </Show>

            <For each={history()}>
                {(url) => (
                    <li
                        classList={{ [styles["active-thumb"]]: videoUrl() === getEmbedUrl(url) }}
                        onClick={() => props.onSelect(url)}
                    >
                        <img src={getThumbnail(url)} alt={url} style={{ width: "100%" }} />
                    </li>
                )}
            </For>
        </nav>
    );
}
