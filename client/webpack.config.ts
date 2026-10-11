import path from 'node:path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { Configuration } from 'webpack';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';

interface WebpackConfig extends Configuration {
  devServer?: DevServerConfiguration;
}

const config = (_env: unknown, argv: { mode?: string }): WebpackConfig => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(process.cwd(), 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      publicPath: '/',
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'ts-loader',
          options: { transpileOnly: true }, // el tipado se verifica con `npm run typecheck`
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.(woff2?|ttf|otf)$/i,
          type: 'asset/resource',
          generator: { filename: 'fonts/[name].[contenthash][ext]' },
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          type: 'asset/resource',
          generator: { filename: 'images/[name].[contenthash][ext]' },
        },
        {
          test: /\.(mp4|webm)$/i,
          type: 'asset/resource',
          generator: { filename: 'media/[name].[contenthash][ext]' },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: './public/index.html', favicon: './public/favicon.png' }),
      ...(isProduction ? [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })] : []),
    ],
    devServer: {
      port: 3000,
      historyApiFallback: true,
      hot: true,
      proxy: [{ context: ['/api'], target: 'http://localhost:3001' }],
    },
    performance: { hints: isProduction ? 'warning' : false },
  };
};

export default config;
