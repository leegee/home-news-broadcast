import { bannerImage, setBannerImage } from '../lib/stores/ui';
import styles from './BannerImage.module.scss';
import { onMount, Show } from 'solid-js';

export default function BannerImage() {
    const processInput = (items: DataTransferItemList) => {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf("image") !== -1) {
                const file = item.getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const imageData = event.target?.result as string;
                        setBannerImage(imageData);
                    };
                    reader.readAsDataURL(file); // base64 string
                }
            }
        }
    };

    onMount(() => {
        const dropHandler = (e: DragEvent) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).style.outline = '';

            const items = e.dataTransfer?.items;
            if (!items) return;
            processInput(items);
        };

        const dragOverHandler = (e: DragEvent) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).style.outline = "2px dashed yellow";
        };

        const dragLeaveHandler = (e: DragEvent) => {
            (e.currentTarget as HTMLElement).style.outline = "";
        };

        const pasteHandler = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            processInput(items);
        }

        document.body.addEventListener("drop", dropHandler);
        document.body.addEventListener("dragover", dragOverHandler);
        document.body.addEventListener("dragleave", dragLeaveHandler);
        document.body.addEventListener("paste", pasteHandler);

        return () => {
            document.body.removeEventListener("drop", dropHandler);
            document.body.removeEventListener("dragover", dragOverHandler);
            document.body.removeEventListener("dragleave", dragLeaveHandler);
            document.body.removeEventListener("paste", pasteHandler);
        };
    });

    return (
        <Show when={bannerImage() !== ''}>
            <img class={styles['banner-image-component']} src={bannerImage()} />
        </Show>
    );
}
