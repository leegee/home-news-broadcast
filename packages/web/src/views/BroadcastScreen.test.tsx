import { expect, describe, vi, it, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@solidjs/testing-library";

// Mock to prevent hashing of class names:
vi.mock("./BroadcastScreen.module.scss", () => {
    return {
        default: new Proxy({}, {
            get: (_, prop) => prop
        })
    };
});

vi.mock('../components/Banner', () => ({
    default: () => <div data-testid="mock-banner" />,
}));

vi.mock('../components/Ticker', () => ({
    default: () => <div data-testid="mock-ticker" />,
}));

import BroadcastScreen from "./BroadcastScreen";
import { changeMedia } from "../lib/inter-tab-comms";
import { MEDIA_TYPES } from "../stores/ui";

afterEach(cleanup);

describe("BroadcastScreen", () => {
    it("shows no media by deafult", async () => {
        render(() => <BroadcastScreen />);

        const el = screen.getByTestId('broadcast-pane');
        expect(el.classList.contains('without-media')).toBe(true);
    });

    it("shows an image", async () => {
        const mockUrl = 'http://foobar/';
        render(() => <BroadcastScreen />);
        changeMedia({ url: mockUrl, type: MEDIA_TYPES.IMAGE });

        await waitFor(() => {
            const bgDiv = document.querySelector('.broadcast-image-background') as HTMLElement;
            expect(bgDiv).toHaveClass('broadcast-image-background');
            expect(bgDiv.style.backgroundImage).toBe(`url("${mockUrl}")`);

            const fgDiv = document.querySelector('.broadcast-image-foreground') as HTMLElement;
            expect(fgDiv).toHaveClass('broadcast-image-foreground');

            const img = fgDiv.querySelector('img') as HTMLImageElement;
            expect(img.src).toBe(mockUrl);

            screen.debug();
        });
    });


    it("shows a video", async () => {
        const mockSrc = 'http://foobar/';
        render(() => <BroadcastScreen />);
        changeMedia({ url: mockSrc, type: MEDIA_TYPES.VIDEO });

        await waitFor(() => {
            const div = document.querySelector('video.broadcast-video') as HTMLVideoElement;
            expect(div).toHaveClass('broadcast-video');
            expect(div.src).toBe(mockSrc);
        });
    });

    it("shows a live video", async () => {
        const mockSrc = 'http://foobar/';
        render(() => <BroadcastScreen />);
        changeMedia({ url: mockSrc, type: MEDIA_TYPES.LIVE_REMOTE_CAMERA });

        await waitFor(() => {
            const div = document.querySelector('video.broadcast-video') as HTMLVideoElement;
            expect(div).toHaveClass('broadcast-video');
            expect(div.src).toBe(mockSrc);
        });
    });

    it("shows a YT video", async () => {
        const mockSrc = 'https://www.youtube.com/watch?v=NuftLQTA974';
        render(() => <BroadcastScreen />);
        changeMedia({ url: mockSrc, type: MEDIA_TYPES.YOUTUBE });

        await waitFor(() => {
            const div = document.querySelector('iframe.broadcast-iframe') as HTMLVideoElement;
            expect(div).toHaveClass('broadcast-iframe');
            expect(div.src).toBe(mockSrc);
        });
    });
});
