import { test, expect, describe, vi, it, afterEach } from "vitest";
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
    test("Without media selected, shows no media", async () => {
        render(() => <BroadcastScreen />);

        const el = screen.getByTestId('broadcast-pane');
        expect(el.classList.contains('without-media')).toBe(true);
    });

    test("Show an image", async () => {
        const mockUrl = 'http://foobar/';
        render(() => <BroadcastScreen />);
        changeMedia({ url: mockUrl, type: MEDIA_TYPES.IMAGE });

        await waitFor(() => {
            const div = document.querySelector('.broadcast-image-background') as HTMLElement;
            expect(div).toHaveClass('broadcast-image-background');
            expect(div.style.backgroundImage).toBe(`url("${mockUrl}")`);

            screen.debug();
        });
    });


    test("Show a video", async () => {
        const mockSrc = 'http://foobar/';
        render(() => <BroadcastScreen />);
        changeMedia({ url: mockSrc, type: MEDIA_TYPES.VIDEO });

        await waitFor(() => {
            const div = document.querySelector('video.broadcast-video') as HTMLVideoElement;
            expect(div).toHaveClass('broadcast-video');
            expect(div.src).toBe(mockSrc);

            screen.debug();
        });
    });
});
