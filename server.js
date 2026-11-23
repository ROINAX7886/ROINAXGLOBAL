import dotenv from 'dotenv';
import app from './src/app.js';
import { connectDB, prisma } from './src/config/database.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`[ROINAX] Server live on http://localhost:${PORT}`);
  } catch (err) {
    console.error('[ROINAX] Database connection error:', err.message);
  }
});

process.on('SIGTERM', async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});