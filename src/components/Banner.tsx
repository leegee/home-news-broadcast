import styles from './Banner.module.scss';
import { createMemo, createSignal } from 'solid-js';
import { selectContent } from '../lib/select-content';
import { currentPlaylistItem, updateCurrentPlaylistItem } from '../lib/stores/playlist';
import { banner, setBanner } from '../lib/stores/ui';
import BannerImage from './BannerImage';
import BannerClock from './BannerClock';

export default function Banner() {
    const [editingHeadline, setEditingHeadline] = createSignal('');
    const [editingStandfirst, setEditingStandfirst] = createSignal('');
    const [isEditingHeadline, setIsEditingHeadline] = createSignal(false);
    const [isEditingStandfirst, setIsEditingStandfirst] = createSignal(false);

    let preEditTextContent = '';

    const hasCurrentItem = createMemo(() => !!currentPlaylistItem());

    const displayHeadline = createMemo(() => {
        if (isEditingHeadline()) return editingHeadline();
        const item = currentPlaylistItem();
        return item?.headline?.trim() || banner();
    });

    const displayStandfirst = createMemo(() => {
        if (isEditingStandfirst()) return editingStandfirst();
        return currentPlaylistItem()?.standfirst?.trim() || '';
    });

    const startEdit = (e: Event, field: 'headline' | 'standfirst') => {
        const target = e.target as HTMLElement;
        if (!hasCurrentItem()) return;
        preEditTextContent = target.textContent || '';
        selectContent(target);

        if (field === 'headline') {
            setEditingHeadline(preEditTextContent);
            setIsEditingHeadline(true);
        } else {
            setEditingStandfirst(preEditTextContent);
            setIsEditingStandfirst(true);
        }
    };

    const saveField = (e: Event, field: 'headline' | 'standfirst') => {
        const target = e.target as HTMLElement;
        const newText = target.textContent?.trim() || preEditTextContent;

        const current = currentPlaylistItem();
        if (field === 'headline') {
            setIsEditingHeadline(false);
            if (current) {
                if (current.headline !== newText) {
                    updateCurrentPlaylistItem({ headline: newText });
                }
            } else {
                setBanner(newText);
            }
        } else {
            setIsEditingStandfirst(false);
            if (current && current.standfirst !== newText) {
                updateCurrentPlaylistItem({ standfirst: newText });
            }
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

    return (
        <header class={styles['banner-text-component']}>
            <BannerImage />
            <hgroup>
                <h1
                    contentEditable={hasCurrentItem()}
                    tabIndex={0}
                    onClick={(e) => startEdit(e, 'headline')}
                    onFocus={(e) => startEdit(e, 'headline')}
                    onBlur={(e) => saveField(e, 'headline')}
                    onKeyDown={onKeyDown}
                >
                    {displayHeadline()}
                </h1>
                <h2
                    contentEditable={hasCurrentItem()}
                    tabIndex={0}
                    onClick={(e) => startEdit(e, 'standfirst')}
                    onFocus={(e) => startEdit(e, 'standfirst')}
                    onBlur={(e) => saveField(e, 'standfirst')}
                    onKeyDown={onKeyDown}
                >
                    {displayStandfirst()}
                </h2>
            </hgroup>
            <BannerClock />
        </header>
    );
}
