import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { authRouter } from './routes/auth.js';
// import { warehousesRouter } from './routes/warehouses.js';
// import { locationsRouter } from './routes/locations.js';
// import { contactsRouter } from './routes/contacts.js';
import { categoryRouter } from './routes/categories.js';
import { productRouter } from './routes/products.js';
import { stockRouter } from './routes/stock.js';
import { operationsRouter } from './routes/operations.js';
// import { movesRouter } from './routes/moves.js';
// import { dashboardRouter } from './routes/dashboard.js';
// import { notificationsRouter } from './routes/notifications.js';
// import { meRouter } from './routes/me.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const httpServer = createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

export const io = new SocketServer(httpServer, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ─── Public routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Protected routes ─────────────────────────────────────────────────────────
app.use('/api', requireAuth);
// app.use('/api/warehouses', warehousesRouter);
// app.use('/api/locations', locationsRouter);
// app.use('/api/contacts', contactsRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/stock', stockRouter);
app.use('/api/operations', operationsRouter);
// app.use('/api/moves', movesRouter);
// app.use('/api/dashboard', dashboardRouter);
// app.use('/api/notifications', notificationsRouter);
// app.use('/api/me', meRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

if (!process.env.VITEST) {
  const PORT = parseInt(process.env.PORT || '3001', 10);
  httpServer.listen(PORT, () => {
    console.log(`🚀 Stocksense server running on http://localhost:${PORT}`);
  });
}

export default app;
