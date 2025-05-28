import styles from './BroadcastScreen.module.scss';
import { createEffect } from 'solid-js';
import { videoUrl } from '../lib/store.ts';
import Ticker from '../components/Ticker';
import Banner from '../components/Banner.tsx';
import CaptureControls from '../components/CaptureControls.tsx';

export default function ControlScreen() {
    createEffect(() => console.log('video url changed', videoUrl()))

    return (
        <main class={styles['broadcast-screen-component']}>

            <CaptureControls />

            <div class={styles["large-video"]}>
                {videoUrl() && (
                    <iframe
                        src={videoUrl()!}
                        width="100%"
                        height="100%"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                )}

                <div class={styles["large-video-overlay"]}>
                    <Banner />
                    <Ticker />
                </div>
            </div>
        </main>
    );
}
