import styles from './Help.module.scss';
import { createSignal, JSX, Show, onCleanup } from 'solid-js';

interface HelpProps {
    children: JSX.Element;
}

export default function Help(props: HelpProps) {
    const [showHelp, setShowHelp] = createSignal(false);
    let containerRef: HTMLElement | undefined;

    function handleDocumentClick() {
        setShowHelp(false);
    }

    function toggleHelp() {
        if (showHelp()) {
            setShowHelp(false);
        } else {
            setShowHelp(true);
            setTimeout(() => document.addEventListener('click', handleDocumentClick, { once: true }));
        }
    }

    onCleanup(() => {
        document.removeEventListener('click', handleDocumentClick);
    });

    return (
        <section
            class={styles['help-component']}
            ref={(el) => (containerRef = el)}
        >
            <aside
                class={styles['help-component-icon']}
                role="button"
                tabindex="0"
                aria-label="Show help"
                onClick={toggleHelp}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                        e.preventDefault();
                        toggleHelp();
                    }
                }}
            >
                ?
            </aside>
            <Show when={showHelp()}>
                <section class={styles['help-content']}>
                    {props.children}
                </section>
            </Show>
        </section>
    );
}
