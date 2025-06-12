import { test, expect, describe, vi, it } from "vitest";
import { render, screen } from "@solidjs/testing-library";

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


describe("BroadcastScreen", () => {
    test("renders content", async () => {
        render(() => <BroadcastScreen />);
        // screen.debug();

        const el = screen.getByTestId('broadcast-pane');
        expect(el.classList.contains('without-media')).toBe(true);
    });
});
