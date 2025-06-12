import { test, expect, describe, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";

vi.mock('../components/Ticker', () => ({
    default: () => <div data-testid="mock-ticker" />,
}));

import Banner from "./Banner";
import { banner } from '../stores/ui'


describe("Banner", () => {
    test("renders content", async () => {
        render(() => <Banner />);

        const bannerPresent = await screen.findByText(banner());
        expect(bannerPresent).toBeTruthy();
    });
});
