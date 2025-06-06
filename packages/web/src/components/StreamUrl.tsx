import { createSignal } from 'solid-js';
import { updateStreamUrl } from '../lib/electron-api';
import styles from './StreamUrl.module.scss';

export default function StreamUrl() {
    const [isOpen, setIsOpen] = createSignal(false);
    const [url, setUrl] = createSignal('');

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        updateStreamUrl(url());
        closeModal();
    };

    return (
        <>
            <button onClick={openModal}>Update Stream URL</button>

            {isOpen() && (
                <div class={styles.modalOverlay} onClick={closeModal}>
                    <form
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        class={styles.modalContent}
                    >
                        <label for="stream-url">Stream URL:</label>
                        <input
                            id="stream-url"
                            type="text"
                            value={url()}
                            onInput={(e) => setUrl(e.currentTarget.value)}
                            placeholder="Enter stream URL"
                            required
                        />
                        <div class={styles.buttonRow}>
                            <button type="button" onClick={closeModal}>Cancel</button>
                            <button type="submit">Update</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
