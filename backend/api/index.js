// Vercel Serverless Function Handler
const app = require('../dist/index').default;

module.exports = async (req, res) => {
  return app(req, res);
};

