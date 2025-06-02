import styles from './Banner.module.scss';
import { createEffect, createMemo } from 'solid-js';
import { selectContent } from '../lib/select-content';
import { currentHistoryItem, updateCurrentHistoryItem } from '../lib/stores/history';
import { banner, setBanner } from '../lib/stores/ui';
import BannerImage from './BannerImage';
import BannerClock from './BannerClock';

export default function Banner() {
    let headlineRef: HTMLDivElement | null = null;
    let standfirstRef: HTMLDivElement | null = null;
    let preEditTextContent = '';

    const hasCurrentItem = createMemo(() => !!currentHistoryItem());

    const displayHeadline = createMemo(() => {
        const item = currentHistoryItem();
        return item?.headline || banner() || 'Click to edit';
    });

    const displayStandfirst = createMemo(() => {
        return currentHistoryItem()?.standfirst || '';
    });

    const startEdit = (e: Event) => {
        const target = e.target as HTMLElement;
        if (!hasCurrentItem()) return;
        preEditTextContent = target.textContent || '';
        selectContent(target);
    };

    const saveHeadline = (e: Event) => {
        const target = e.target as HTMLElement;
        const newText = target.textContent?.trim() || preEditTextContent;

        const current = currentHistoryItem();
        if (current) {
            if (current.headline !== newText) {
                updateCurrentHistoryItem({ headline: newText });
            }
        } else {
            setBanner(newText);
        }
    };

    const saveStandfirst = (e: Event) => {
        const target = e.target as HTMLElement;
        const newText = target.textContent?.trim() || preEditTextContent;

        const current = currentHistoryItem();
        if (current && current.standfirst !== newText) {
            updateCurrentHistoryItem({ standfirst: newText });
        }
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

    // Keeps global banner in sync when no current item
    createEffect(() => {
        if (!hasCurrentItem() && headlineRef) {
            const textContent = headlineRef.textContent?.trim() || '';
            setBanner(textContent);
        }
    });

    return (
        <header class={styles['banner-text-component']}>
            <BannerImage />
            <hgroup>
                <h1
                    ref={(el) => (headlineRef = el)}
                    contentEditable={hasCurrentItem()}
                    tabIndex={0}
                    onClick={startEdit}
                    onFocus={startEdit}
                    onBlur={saveHeadline}
                    onKeyDown={onKeyDown}
                >
                    {displayHeadline()}
                </h1>
                <h2
                    ref={(el) => (standfirstRef = el)}
                    contentEditable={hasCurrentItem()}
                    tabIndex={0}
                    onClick={startEdit}
                    onFocus={startEdit}
                    onBlur={saveStandfirst}
                    onKeyDown={onKeyDown}
                >
                    {displayStandfirst()}
                </h2>
            </hgroup>
            <BannerClock />
        </header>
    );
}
