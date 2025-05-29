import { createSignal, onCleanup, onMount } from 'solid-js';
import styles from './BannerClock.module.scss';

export default function BannerClock() {
    const [time, setTime] = createSignal(getFormattedTime());
    const [date, setDate] = createSignal(getFormattedDate());

    onMount(() => {
        const interval = setInterval(() => {
            setTime(getFormattedTime());
            setDate(getFormattedDate());
        }, 60_000);

        setTime(getFormattedTime());
        setDate(getFormattedDate());

        onCleanup(() => clearInterval(interval));
    });

    return (
        <section class={styles['banner-clock-component']}>
            <h2>{time()}</h2>
            <h3>{date()}</h3>
        </section>
    );
}

function getFormattedTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getFormattedDate(): string {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}
