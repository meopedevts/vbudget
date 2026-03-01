import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

export default defineConfig({
    plugins: [devtools(), solidPlugin(), tailwindcss()],
    server: {
        port: 3000,
        proxy: {
            '/api': 'http://localhost:8181',
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        }
    },
    build: {
        target: 'esnext',
        rollupOptions: {
            output: {
                entryFileNames: 'assets/index.js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]',
            },
        },
    },
});
