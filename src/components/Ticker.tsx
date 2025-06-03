import styles from './Ticker.module.css';
import { createEffect, onCleanup, onMount } from 'solid-js';
import { ticker, setTicker } from '../lib/stores/ui';

const speed = 100;
const padding = 20;

const Ticker = () => {
    let containerRef: HTMLDivElement | null = null;
    let runAnimation = true;
    let animationFrameId: number | null = null;
    let preEditTextContent = '';

    let item1: HTMLDivElement | null = null;
    let item2: HTMLDivElement | null = null;

    let width = 0;
    let x1 = 0;
    let x2 = 0;

    let lastTime = performance.now();

    const startEdit = (e: Event) => {
        runAnimation = false;
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        width = 0;
        x1 = 0;
        x2 = 0;

        const target = e.target as HTMLElement;
        preEditTextContent = target.textContent || '';
    };

    const saveText = (e: Event) => {
        const target = e.target as HTMLElement;
        const newText = target.textContent || preEditTextContent;
        if (newText !== ticker()) {
            setTicker(newText);
        }

        runAnimation = true;
        lastTime = performance.now();
        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(step);
        }
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur(); // onBlur calls saveText
        } else if (e.key === 'Escape') {
            if (e.target) {
                (e.target as HTMLElement).textContent = preEditTextContent;
            }
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
        } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.stopPropagation();
        }
    };

    const createItem = (text: string) => (
        <div
            class={styles['ticker-item']}
            contentEditable
            tabIndex={0}
            onClick={startEdit}
            onBlur={saveText}
            onKeyDown={onKeyDown}
            style={{ border: '1px solid transparent' }} // Remove or customize borders as needed
        >
            {text || 'Click to edit'}
        </div>
    );

    const step = (now: number) => {
        if (!runAnimation) {
            animationFrameId = null;
            return;
        }

        const deltaT = (now - lastTime) / 1000;
        lastTime = now;

        if (!width && item1 && item2) {
            width = item1.offsetWidth;
            x1 = 0;
            x2 = width + padding;
            item1.style.transform = `translateX(${x1}px)`;
            item2.style.transform = `translateX(${x2}px)`;
        }

        x1 -= speed * deltaT;
        x2 -= speed * deltaT;

        const epsilon = 1; // 1px margin to avoid overlap

        if (x1 <= -width) {
            x1 = x2 + width + padding - epsilon;
        }
        if (x2 <= -width) {
            x2 = x1 + width + padding - epsilon;
        }

        if (item1) item1.style.transform = `translateX(${x1}px)`;
        if (item2) item2.style.transform = `translateX(${x2}px)`;

        animationFrameId = requestAnimationFrame(step);
    };

    onMount(() => {
        if (!containerRef) return;

        item1 = containerRef.querySelector('.' + styles['ticker-item']) as HTMLDivElement;
        item2 = containerRef.querySelector('.' + styles['ticker-item'] + ':nth-child(2)') as HTMLDivElement;

        lastTime = performance.now();
        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(step);
        }
    });

    createEffect(() => {
        ticker(); // track ticker reactive
        if (!containerRef) return;

        item1 = containerRef.querySelector('.' + styles['ticker-item']) as HTMLDivElement;
        item2 = containerRef.querySelector('.' + styles['ticker-item'] + ':nth-child(2)') as HTMLDivElement;

        if (item1) {
            width = 0; // triggers recalculation in `step`
        }
        runAnimation = true;
        lastTime = performance.now();
        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(step);
        }
    });

    onCleanup(() => {
        runAnimation = false;
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });

    return (
        <div ref={(el) => (containerRef = el)} class={styles.ticker}>
            {createItem(ticker())}
            {createItem(ticker())}
        </div>
    );
};

export default Ticker;
