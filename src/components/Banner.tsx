import styles from './Banner.module.scss';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { selectContent } from '../lib/select-content';
import { currentPlaylistItem, updateCurrentPlaylistItem } from '../lib/stores/playlist';
import { banner, bannerResetCount, setBanner } from '../lib/stores/ui';
import BannerImage from './BannerImage';
import BannerClock from './BannerClock';

export default function Banner() {
    const [localHeadline, setLocalHeadline] = createSignal('');
    const [localStandfirst, setLocalStandfirst] = createSignal('');

    let headlineRef: HTMLHeadingElement | null = null;
    let preEditTextContent = '';

    const hasCurrentItem = createMemo(() => !!currentPlaylistItem());

    const displayHeadline = createMemo(() => {
        const item = currentPlaylistItem();
        return item?.headline || banner() || 'Click to edit';
    });

    const displayStandfirst = createMemo(() => {
        return currentPlaylistItem()?.standfirst || '';
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

        setLocalHeadline(newText);

        const current = currentPlaylistItem();
        if (current) {
            if (current.headline !== newText) {
                updateCurrentPlaylistItem({ headline: newText });
            }
        } else {
            setBanner(newText);
        }
    };

    const saveStandfirst = (e: Event) => {
        const target = e.target as HTMLElement;
        const newText = target.textContent?.trim() || preEditTextContent;

        setLocalStandfirst(newText);

        const current = currentPlaylistItem();
        if (current && current.standfirst !== newText) {
            updateCurrentPlaylistItem({ standfirst: newText });
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

    createEffect(() => {
        const item = currentPlaylistItem();
        if (item) {
            setLocalHeadline(item.headline || banner());
            setLocalStandfirst(item.standfirst || '');
        } else {
            setLocalHeadline(banner());
            setLocalStandfirst('');
        }
    });


    // Keeps global banner in sync when no current item
    createEffect(() => {
        if (!hasCurrentItem() && headlineRef) {
            const textContent = headlineRef.textContent?.trim() || '';
            setBanner(textContent);
        }
    });

    // Respond to reset signal, triggerBannerReset
    createEffect(() => {
        const _ = bannerResetCount(); // depend on reset count signal
        setLocalHeadline(banner());
        setLocalStandfirst('');
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
                    {localHeadline()}
                </h1>
                <h2
                    contentEditable={hasCurrentItem()}
                    tabIndex={0}
                    onClick={startEdit}
                    onFocus={startEdit}
                    onBlur={saveStandfirst}
                    onKeyDown={onKeyDown}
                >
                    {localStandfirst()}
                </h2>
            </hgroup>
            <BannerClock />
        </header>
    );
}
