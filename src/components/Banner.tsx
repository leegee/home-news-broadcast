import './Banner.css';
import { createSignal, createEffect } from 'solid-js';
import { selectContent } from '../lib/select-content';

const STORE_KEY = 'cap-banner';

const Banner = () => {
    let containerRef: HTMLDivElement | null = null;
    const [text, setText] = createSignal<string>(
        localStorage.getItem(STORE_KEY) || 'Click to edit'
    );

    let preEditTextContent = '';

    const startEdit = (e: Event) => {
        const target = e.target as HTMLElement;
        selectContent(e.target as HTMLElement);
        preEditTextContent = target.textContent || '';
    };

    const saveText = (e: Event) => {
        const target = e.target as HTMLElement;
        const newText = target.textContent || preEditTextContent;
        setText(newText);
        localStorage.setItem(STORE_KEY, newText);
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
