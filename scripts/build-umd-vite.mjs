import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { build } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const getArgValue = key => args.find(arg => arg.startsWith(`${key}=`))?.split('=')[1];

const targetPath = getArgValue('--path');
const isWatch = args.includes('--watch');
const shouldAnalyze = args.includes('--analysis');

if (!targetPath) {
  throw new Error('Missing required argument: --path=/packages/xxx');
}

const packageRoot = path.resolve(repoRoot, `.${targetPath}`);
const packageName = targetPath.replace('/packages/', '').replace(/-/g, '_').toUpperCase();
const libraryName = packageName === 'GI_SDK' ? 'GISDK' : packageName;

const external = ['lodash', 'react', 'react-dom', '@antv/graphin', '@antv/g6', '@antv/gi-sdk', 'antd', '@antv/g2plot'];
const globals = {
  lodash: '_',
  react: 'React',
  'react-dom': 'ReactDOM',
  '@antv/graphin': 'Graphin',
  '@antv/g6': 'G6',
  '@antv/gi-sdk': 'GISDK',
  antd: 'antd',
  '@antv/g2plot': 'G2Plot',
};

const plugins = [
  react(),
  nodePolyfills({ include: ['buffer', 'process', 'stream', 'crypto', 'constants'] }),
  shouldAnalyze && visualizer({ filename: path.resolve(packageRoot, 'dist/stats.html'), open: false, gzipSize: true }),
].filter(Boolean);

await build({
  root: packageRoot,
  plugins,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  build: {
    outDir: path.resolve(packageRoot, 'dist'),
    emptyOutDir: false,
    sourcemap: true,
    watch: isWatch ? {} : null,
    lib: {
      entry: path.resolve(packageRoot, 'src/index.tsx'),
      name: libraryName,
      formats: ['umd'],
      fileName: () => 'index.min.js',
    },
    rollupOptions: {
      external,
      output: {
        globals,
      },
    },
  },
});

console.log(`[vite-umd] Built ${targetPath} => ${libraryName}`);
