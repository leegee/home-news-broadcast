import solid from "vite-plugin-solid"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => {
    return {
        plugins: [solid()],
        resolve: {
            conditions: ["development", "browser"],
        },
        test: {
            environment: 'jsdom',
            setupFiles: './src/vitest.setup.ts',
        },
    };
});
