import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Middleware for parsing JSON (except for Stripe webhooks which need raw body)
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe-webhook') {
      next();
    } else {
      express.json()(req, res, next);
    }
  });

  // API Routes
  app.all('/api/:handler', async (req, res) => {
    const { handler } = req.params;
    try {
      const modulePath = path.join(process.cwd(), 'api', `${handler}.ts`);
      const module = await import(`file://${modulePath}`);
      if (module.default) {
        return module.default(req, res);
      }
      res.status(404).json({ error: 'API handler not found' });
    } catch (error) {
      console.error(`Error loading API handler ${handler}:`, error);
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA Fallback for development
    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      
      const url = req.originalUrl;
      console.log(`[Dev] Serving SPA fallback for: ${url}`);
      try {
        const templatePath = path.resolve(process.cwd(), 'index.html');
        if (!fs.existsSync(templatePath)) {
          console.error(`[Dev] index.html not found at ${templatePath}`);
          return next();
        }
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error(`[Dev] SPA Fallback Error:`, e);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log('[Prod] Running in production mode');
    // Production: Serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA Fallback: Serve index.html for all other routes
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API not found' });
      }
      console.log(`[Prod] Serving SPA fallback for: ${req.originalUrl}`);
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error(`[Prod] index.html not found at ${indexPath}`);
        res.status(404).send('Application not built. Please run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
