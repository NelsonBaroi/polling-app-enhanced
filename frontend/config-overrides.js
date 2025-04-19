const { override, addWebpackModuleRule } = require('customize-cra');

module.exports = override(
  // Add a rule to transpile `chart.js`
  addWebpackModuleRule({
    test: /\.js$/,
    include: /node_modules\/chart\.js/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
      },
    },
  })
);