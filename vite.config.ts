import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// MVP cíl: jeden self-contained HTML soubor pro itch.io.
// viteSingleFile inlinuje JS i CSS do dist/index.html.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
});
