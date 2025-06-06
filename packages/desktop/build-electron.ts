import { build } from 'vite'
import { fileURLToPath } from 'url';
import path from 'path'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildElectron() {
    // Main process
    await build({
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            lib: {
                entry: path.resolve(__dirname, 'main.ts'),
                formats: ['cjs'],
            },
            rollupOptions: {
                external: ['electron'],
            },
        },
    })

    // Preload script
    await build({
        build: {
            outDir: 'dist',
            lib: {
                entry: path.resolve(__dirname, 'preload.ts'),
                formats: ['es'],
            },
            rollupOptions: {
                external: ['electron'],
            },
        },
    })

    console.log('Electron main/preload built')
}

buildElectron().catch((e) => {
    console.error(e)
    process.exit(1)
})
