// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/chat',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5001',
      changeOrigin: true,
    })
  );
};