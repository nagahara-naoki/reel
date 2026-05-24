import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: true,
  minify: 'terser',
  terserOptions: {
    module: true,
    compress: {
      module: true,
      passes: 2
    },
    mangle: {
      toplevel: true
    }
  },
  treeshake: true,
  splitting: false,
  target: 'es2020',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js'
    };
  }
});
