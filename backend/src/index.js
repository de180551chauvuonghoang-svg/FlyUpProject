import dns from 'node:dns';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Force IPv4 for DNS resolution to avoid ENOTFOUND with Gmail API on some networks
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (error) {
  // Ignore if not supported (older node versions)
  console.log('Note: dns.setDefaultResultOrder not supported or failed');
}

// Import routers
import authRouter from './routers/auth.js';
import usersRouter from './routers/users.js';
import checkoutRouter from './routers/checkout.js';
import coursesRouter from './routers/courses.js';
import commentRouter from './routers/comments.js';
import wishlistRouter from './routers/wishlist.js';
import transactionRouter from './routers/transactions.js';
import chatbotRouter from './routers/chatbot.js';
import { getCourses, getCategories } from './services/courseService.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = dotenv.config({ path: join(__dirname, '../.env') });

if (result.error) {
  if (result.error.code !== 'ENOENT') {
    console.error('DOTENV LOAD ERROR:', result.error);
  }
} else {
  console.log('DOTENV LOADED VARS:', Object.keys(result.parsed));
  
  // Dynamic import worker after env vars are loaded to ensure Redis connection works
  import('./workers/emailWorker.js').catch(err => console.error('Failed to start email worker:', err));
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/public', express.static(join(__dirname, '../public')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FlyUp Backend is running!' });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/comments', commentRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/chatbot', chatbotRouter);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Error handling middleware

app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON format. Please check your request body.'
    });
  }

  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FlyUp Backend running on http://localhost:${PORT}`);
  console.log(`� Swagger Docs available at http://localhost:${PORT}/api-docs`);
  console.log(`�📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Warm up cache
  (async () => {
    try {
      console.log('🔥 Warming up cache...');
      console.log('🔥 Warming up cache...');
      // Run sequentially to avoid DB connection timeout
      await getCategories();
      await getCourses({ page: 1, limit: 12 });
      console.log('✅ Cache warmed up successfully!');
    } catch (error) {
      console.warn('⚠️ Cache warmup partial failure (non-critical):', error.message);
    }
  })();
});

export default app;

