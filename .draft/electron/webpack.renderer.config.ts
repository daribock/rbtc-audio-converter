import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

const rendererRules = rules.filter((rule) => {
  if (typeof rule !== 'object' || !rule) {
    return true;
  }

  if (rule.use === 'node-loader') {
    return false;
  }

  if (
    typeof rule.use === 'object' &&
    rule.use !== null &&
    'loader' in rule.use &&
    rule.use.loader === '@vercel/webpack-asset-relocator-loader'
  ) {
    return false;
  }

  return true;
});

rendererRules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

export const rendererConfig: Configuration = {
  module: {
    rules: rendererRules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
