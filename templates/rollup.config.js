// https://open-wc.org/building/building-rollup.html#configuration

import { createSpaConfig } from '@open-wc/building-rollup';
import merge from 'deepmerge';
import path from 'path';
import cpy from 'rollup-plugin-cpy';
import postcss from 'rollup-plugin-postcss';

const baseConfig = createSpaConfig({
  developmentMode: false,
  injectServiceWorker: false,
  legacyBuild: true,
  outputDir: 'dist',
  babel: {
    plugins: [
      [
        require.resolve('babel-plugin-template-html-minifier'),
        {
          modules: {
            'lit-html': ['html'],
            'lit-element': [
              'html',
              { name: 'css', encapsulation: 'style' }
            ],
          },
          strictCSS: true,
          htmlMinifier: {
            collapseWhitespace: true,
            conservativeCollapse: true,
            removeComments: true,
            caseSensitive: true,
            minifyJS: true,
            // https://github.com/cfware/babel-plugin-template-html-minifier/issues/56
            // minifyCSS: true,
            // failOnError: false,
            // logOnError: true,
          },
        },
      ],
    ],
  },
});

export default merge(baseConfig, {
  input: path.resolve(__dirname, 'index.html'),
  context: 'window',
  plugins: [
    postcss(),
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
});
