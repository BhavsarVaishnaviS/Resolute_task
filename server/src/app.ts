import express, { Application } from 'express';
import cors from 'cors';
import studentRoutes from './routes/studentRoutes';
import authRoutes from './routes/authRoutes';

const app: Application = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

export default app;
