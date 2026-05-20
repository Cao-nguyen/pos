import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import dbConnect from './src/lib/mongodb.js';
import productRoutes from './src/routes/productRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import statsRoutes from './src/routes/statsRoutes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to MongoDB
  try {
    await dbConnect();
    console.log('Connected to MongoDB');
  } catch (error: any) {
    console.error('Failed to connect to MongoDB. Is MONGODB_URI set in your environment variables?');
    console.error(error.message);
  }

  app.use(express.json());

  // API Routes
  app.use('/api/products', productRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/stats', statsRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static('dist'));
    
    // SPA fallback for production
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
