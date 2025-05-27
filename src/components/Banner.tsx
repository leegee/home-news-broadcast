import { createSignal, createEffect } from 'solid-js';
import './Banner.css';

const Banner = () => {
    let containerRef: HTMLDivElement | null = null;
    const [text, setText] = createSignal<string>('Click to edit');

    let preEditTextContent = '';

    const startEdit = (e: Event) => {
        console.log('edit', e);
        const target = e.target as HTMLElement;
        preEditTextContent = target.textContent || '';
    };

    const saveText = (e: Event) => {
        const target = e.target as HTMLElement;
        const newText = target.textContent || preEditTextContent;
        setText(newText);
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

    createEffect(() => {
        if (!containerRef) return;
        const textContent = containerRef!.textContent?.trim() || '';
        setText(textContent);
        containerRef!.classList.add('banner');
    });

    return (
        <h1 ref={(el) => (containerRef = el)}
            contentEditable
            tabIndex={0}
            onClick={startEdit}
            onBlur={saveText}
            onKeyDown={onKeyDown}
        >
            {text() || 'Click to edit'}
        </h1>
    );
}

export default Banner;
