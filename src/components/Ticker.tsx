import './Ticker.css';
import { createSignal, createEffect, onCleanup } from 'solid-js';
import { selectContent } from '../lib/select-content';

const STORE_KEY = 'cap-ticker';
const speed = 100;
const padding = 20;

const Ticker = () => {
    let containerRef: HTMLDivElement | null = null;

    const [text, setText] = createSignal<string>(
        localStorage.getItem(STORE_KEY) || 'Click to edit'
    );
    let runAnimation = true;
    let preEditTextContent = '';
    let width = 0;
    let x1 = 0;
    let x2 = 0;
    let lastTime = performance.now();

    const startEdit = (e: Event) => {
        const target = e.target as HTMLElement;
        selectContent(e.target as HTMLElement);
        preEditTextContent = target.textContent || '';
        runAnimation = false;
    };

    const saveText = (e: Event) => {
        const target = e.target as HTMLElement;
        const newText = target.textContent || preEditTextContent;
        setText(newText);
        localStorage.setItem(STORE_KEY, newText);
        runAnimation = true;
        requestAnimationFrame(step);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
        } else if (e.key === 'Escape') {
            if (e.target) {
                (e.target as HTMLElement).textContent = preEditTextContent;
            }
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
        }
    };

    const createItem = (text: string) => (
        <div
            class="ticker-item"
            contentEditable
            tabIndex={0}
            onClick={startEdit}
            onBlur={saveText}
            onKeyDown={onKeyDown}
        >
            {text || 'Click to edit'}
        </div>
    );

    const step = (now: number) => {
        if (!runAnimation) return;

        const deltaT = (now - lastTime) / 1000;
        lastTime = now;

        if (!width) {
            const item1 = containerRef?.querySelector('.ticker-item') as HTMLDivElement;
            if (item1) {
                width = item1.offsetWidth;
                x1 = 0;
                x2 = width + padding;
            }
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

        const item1 = containerRef?.querySelector('.ticker-item:nth-child(1)') as HTMLDivElement;
        const item2 = containerRef?.querySelector('.ticker-item:nth-child(2)') as HTMLDivElement;

        if (item1) item1.style.transform = `translateX(${x1}px)`;
        if (item2) item2.style.transform = `translateX(${x2}px)`;

        requestAnimationFrame(step);
    };

    createEffect(() => {
        if (!containerRef) return;

        const textContent = containerRef.textContent?.trim() || '';
        setText(textContent);
        containerRef.classList.add('ticker');

        requestAnimationFrame(step);
    });

    onCleanup(() => {
        runAnimation = false;
    });

    return (
        <div ref={(el) => (containerRef = el)}>
            {createItem(text())}
            {createItem(text())}
        </div>
    );
};

export default Ticker;
