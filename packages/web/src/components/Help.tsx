import styles from './Help.module.scss';
import { createSignal, JSX, Show, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';

interface HelpProps {
    children: JSX.Element;
}

export default function Help(props: HelpProps) {
    const [showHelp, setShowHelp] = createSignal(false);
    const [coords, setCoords] = createSignal({ x: 0, y: 0 });

    function handleDocumentClick() {
        setShowHelp(false);
    }

    function toggleHelp(e: MouseEvent) {
        if (showHelp()) {
            setShowHelp(false);
        } else {
            setCoords({ x: e.clientX + 10, y: e.clientY + 10 });
            setShowHelp(true);
            setTimeout(() => document.addEventListener('click', handleDocumentClick, { once: true }));
        }
    }

    onCleanup(() => {
        document.removeEventListener('click', handleDocumentClick);
    });

    return (
        <>
            <span
                class={styles['help-component-icon']}
                role="button"
                tabindex="0"
                aria-label="Show help"
                onClick={toggleHelp}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                        e.preventDefault();
                        setShowHelp(prev => !prev);
                    }
                }}
            >
                ?
            </span>

            <Show when={showHelp()}>
                <Portal>
                    <div
                        class={styles['help-content']}
                        style={{
                            position: 'fixed',
                            top: `${coords().y}px`,
                            left: `${coords().x}px`,
                        }}
                    >
                        {props.children}
                    </div>
                </Portal>
            </Show>
        </>
    );
}
