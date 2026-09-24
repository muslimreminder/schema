import { defineConfig } from 'tsup';

// JS only: declarations are emitted by `tsc -p tsconfig.build.json`.
export default defineConfig({
    entry: ['src/index.ts', 'src/common/index.ts', 'src/content/index.ts', 'src/api/index.ts'],
    format: ['esm'],
    target: 'es2022',
    platform: 'neutral',
    splitting: true,
    sourcemap: true,
    clean: true,
    dts: false,
});
