import { createEffect, onCleanup } from 'solid-js';
import type { JSX } from 'solid-js';
import './ScrollingText.css';

interface ITickerProps {
    children: JSX.Element;
    options?: { speed?: number };
}

const Ticker = (props: ITickerProps) => {
    let containerRef: HTMLDivElement | undefined;
    let wrapper: HTMLDivElement;
    let item1: HTMLDivElement;
    let item2: HTMLDivElement;

    const speed = props.options?.speed ?? 100;
    const padding = 20;

    let stopAnimation = false;
    let preEditTextContent = '';
    let width = 0;
    let x1 = 0;
    let x2 = 0;
    let lastTime = performance.now();

    const startEdit = (e: Event) => {
        const target = e.target as HTMLElement;
        preEditTextContent = target.textContent || '';
        stopAnimation = true;
    };

    const saveText = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target === item1) {
            item2.textContent = item1.textContent;
        } else {
            item1.textContent = item2.textContent;
        }
        stopAnimation = false;
        requestAnimationFrame(step);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
        } else if (e.key === 'Escape') {
            (e.target as HTMLElement).textContent = preEditTextContent;
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
        }
    };

    const createItem = (text: string) => {
        const div = document.createElement('div');
        div.className = 'scrolling-text-item';
        div.textContent = text;
        div.setAttribute('contentEditable', 'true');
        div.addEventListener('click', startEdit);
        div.addEventListener('blur', saveText);
        div.addEventListener('keydown', onKeyDown);
        return div;
    };

    const step = (now: number) => {
        if (stopAnimation) return;

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

        item1.style.transform = `translateX(${x1}px)`;
        item2.style.transform = `translateX(${x2}px)`;

        requestAnimationFrame(step);
    };

    createEffect(() => {
        if (!containerRef) return;

        const text = containerRef.textContent?.trim() || '';
        containerRef.textContent = ''; // Clear original
        containerRef.classList.add('scrolling-text-container');

        wrapper = document.createElement('div');
        wrapper.className = 'scrolling-text-wrapper';

        item1 = createItem(text);
        item2 = createItem(text);

        wrapper.appendChild(item1);
        wrapper.appendChild(item2);
        containerRef.appendChild(wrapper);

        requestAnimationFrame(step);
    });

    onCleanup(() => {
        stopAnimation = true;
    });

    return <div ref={containerRef}>{props.children}</div>;
};

export default Ticker;
