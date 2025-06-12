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
        render(() => <BroadcastScreen />);
        changeMedia({ url: 'http://foobar', type: MEDIA_TYPES.IMAGE });

        await waitFor(() => {
            const div = document.querySelector('.broadcast-image-background') as HTMLElement;
            expect(div).toHaveClass('broadcast-image-background');
            expect(div.style.backgroundImage).toBe('url("http://foobar")');

            screen.debug();
        });
    });
});
