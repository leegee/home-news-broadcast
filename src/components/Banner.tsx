import styles from './Banner.module.scss';
import { createEffect } from 'solid-js';
import { selectContent } from '../lib/select-content';
import { banner, setBanner } from '../lib/stores/store';
import BannerImage from './BannerImage';
import BannerClock from './BannerClock';

const Banner = () => {
    let containerRef: HTMLDivElement | null = null;
    let preEditTextContent = '';

    const startEdit = (e: Event) => {
        const target = e.target as HTMLElement;
        selectContent(e.target as HTMLElement);
        preEditTextContent = target.textContent || '';
    };

    const saveText = (e: Event) => {
        const target = e.target as HTMLElement;
        const newText = target.textContent || preEditTextContent;
        setBanner(newText);
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
        setBanner(textContent);
        containerRef!.classList.add('banner');
    });

    return (
        <section class={styles['banner-image-component']}>
            <BannerImage />
            <h1 ref={(el) => (containerRef = el)}
                contentEditable
                tabIndex={0}
                onClick={startEdit}
                onBlur={saveText}
                onKeyDown={onKeyDown}
            >
                {banner() || 'Click to edit'}
            </h1>
            <BannerClock />
        </section>
    );
}

export default Banner;
