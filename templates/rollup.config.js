import cpy from 'rollup-plugin-cpy';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import html from '@web/rollup-plugin-html';
import polyfillsLoader from '@web/rollup-plugin-polyfills-loader';
import nodeResolve from '@rollup/plugin-node-resolve';
import path from 'path';

const htmlPlugin = html({ input: path.resolve(__dirname, 'index.html') });

export default {
  context: 'window',
  output: [
    {
      format: 'system',
      chunkFileNames: 'nomodule-[name]-[hash].js',
      entryFileNames: 'nomodule-[name]-[hash].js',
      dir: 'dist',
      // add a legacy build child plugin
      plugins: [htmlPlugin.api.addOutput('legacy')],
    },
    {
      format: 'es',
      chunkFileNames: '[name]-[hash].js',
      entryFileNames: '[name]-[hash].js',
      dir: 'dist',
      // add a modern build child plugin
      plugins: [
        htmlPlugin.api.addOutput('modern'),
        terser({
          format: {
            comments: false,
          },
        }),
      ],
    },
  ],
  plugins: [
    nodeResolve(),
    htmlPlugin,
    postcss(),
    polyfillsLoader({
      modernOutput: {
        name: 'modern',
      },
      legacyOutput: {
        name: 'legacy',
        test: '!(\'noModule\' in HTMLScriptElement.prototype)',
      },
      polyfills: {
        coreJs: true,
        fetch: true,
        webcomponents: true,
      },
    }),
    cpy({
      files: [
        path.join('vendor.js'),
        path.join('api-model.json'),
      ],
      dest: 'dist',
      options: {
        parents: false,
      },
    }),
  ],
};
