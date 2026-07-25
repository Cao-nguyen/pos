import 'dotenv/config';
import express from 'express';
import dbConnect from './src/lib/mongodb.js';
import productRoutes from './src/routes/productRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import statsRoutes from './src/routes/statsRoutes.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    if (req.path.startsWith('/api')) {
      await dbConnect();
    }
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection failed. Is MONGODB_URI set correctly?' });
  }
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// For local development or non-Vercel production
if (!process.env.VERCEL) {
  import('vite').then(async ({ createServer: createViteServer }) => {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static('dist'));
      app.get('*', (req, res) => {
        res.sendFile('index.html', { root: 'dist' });
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

// Export for Vercel
export default app;
