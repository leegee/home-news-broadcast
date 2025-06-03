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

    // Use refs here to assign item divs and avoid querying
    const createItem = (text: string, assignRef: (el: HTMLDivElement) => void, extraClass = '') => (
        <div
            ref={assignRef}
            class={`${styles['ticker-item']} ${extraClass}`}
            contentEditable
            tabIndex={0}
            spellcheck={true}
            onClick={startEdit}
            onBlur={saveText}
            onKeyDown={onKeyDown}
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

        if (!width && item1) {
            width = item1.offsetWidth;
            x1 = 0;
            x2 = width + padding;
        }

        x1 -= speed * deltaT;
        x2 -= speed * deltaT;

        const viewportRight = containerRef?.offsetWidth ?? 0;

        if (x1 <= -width) {
            x1 = Math.max(x2 + padding + width, viewportRight);
        }
        if (x2 <= -width) {
            x2 = Math.max(x1 + padding + width, viewportRight);
        }

        if (item1) item1.style.transform = `translateX(${x1}px)`;
        if (item2) item2.style.transform = `translateX(${x2}px)`;

        animationFrameId = requestAnimationFrame(step);
    };

    onMount(() => {
        lastTime = performance.now();
        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(step);
        }
    });

    createEffect(() => {
        ticker(); // track ticker reactive

        width = 0;
        x1 = 0;
        x2 = 0;

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
            {createItem(ticker(), (el) => (item1 = el))}
            {createItem(ticker(), (el) => (item2 = el), styles['ticker-item2'])}
        </div>
    );
};

export default Ticker;
