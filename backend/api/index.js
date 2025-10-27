// Vercel Serverless Function Handler
const path = require('path');
const fs = require('fs');

// Verificar se o arquivo existe
const distPath = path.join(__dirname, '../dist/index.js');
console.log('Looking for file at:', distPath);
console.log('File exists:', fs.existsSync(distPath));

// Carregar o app de forma mais simples
let app;
try {
  delete require.cache[require.resolve('../dist/index.js')];
  const indexModule = require('../dist/index.js');
  app = indexModule.default;
  console.log('App loaded successfully');
} catch (error) {
  console.error('Error loading app:', error);
  app = null;
}

module.exports = async (req, res) => {
  if (!app) {
    return res.status(500).json({ 
      error: 'App not loaded',
      path: distPath,
      exists: fs.existsSync(distPath)
    });
  }

  try {
    return app(req, res);
  } catch (error) {
    console.error('Error in handler:', error);
    return res.status(500).json({ 
      error: error.message, 
      stack: error.stack 
    });
  }
};
