import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeTreeData } from './src/utils/treeData';
import type { TreeData } from './src/types/tree';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = process.env.TEST_DB || path.join(__dirname, 'db.json');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
let writeQueue: Promise<void> = Promise.resolve();

// Restrict CORS to known origin
app.use(cors({ origin: ALLOWED_ORIGIN }));

// Limit payload size to 2MB to prevent abuse
app.use(express.json({ limit: '2mb' }));

// Initialize db.json if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ nodes: {}, edges: {} }, null, 2));
}

app.get('/api/tree', async (req, res) => {
  try {
    const data = await fs.promises.readFile(DB_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    const readError = error as NodeJS.ErrnoException;
    if (readError.code === 'ENOENT') {
      res.json({ nodes: {}, edges: {} });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Failed to read data' });
    }
  }
});

const writeTreeData = async (data: TreeData): Promise<void> => {
  const tmpFile = `${DB_FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.promises.writeFile(tmpFile, JSON.stringify(data, null, 2));
  await fs.promises.rename(tmpFile, DB_FILE);
};

const queueTreeWrite = (data: TreeData): Promise<void> => {
  writeQueue = writeQueue
    .catch(() => {})
    .then(() => writeTreeData(data));

  return writeQueue;
};

app.post('/api/tree', async (req, res) => {
  try {
    const data = normalizeTreeData(req.body);

    if (!data) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }

    // Atomic write: write to temp file, then rename to avoid corruption on crash
    await queueTreeWrite(data);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});


if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

export default app;
