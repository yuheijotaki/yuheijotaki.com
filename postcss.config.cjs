module.exports = {
  plugins: [
    require('postcss-fluid-sizing-function')({
      viewportWidths: {
        DEFAULT_FROM: '640px',
        DEFAULT_TO: '1440px',
      },
    }),
  ],
};
