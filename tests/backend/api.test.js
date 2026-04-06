import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ustaw testową bazę przed zaimportowaniem aplikacji
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.join(__dirname, 'test-db.json');
process.env.TEST_DB = testDbPath;
process.env.NODE_ENV = 'test';

const { default: app } = await import('../../server.js');

describe('Backend API Tests', () => {
  beforeAll(() => {
    fs.writeFileSync(testDbPath, JSON.stringify({ nodes: [], edges: [] }, null, 2));
  });

  afterAll(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('GET /api/tree should return empty tree initially', async () => {
    const res = await request(app).get('/api/tree');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('nodes');
    expect(res.body.nodes).toHaveLength(0);
  });

  it('POST /api/tree should save data', async () => {
    const mockData = {
      nodes: [{ id: '1', type: 'PersonNode', position: { x: 0, y: 0 }, data: { firstName: 'John' } }],
      edges: []
    };
    
    const res = await request(app)
      .post('/api/tree')
      .send(mockData);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ success: true });
    
    const dbContent = JSON.parse(fs.readFileSync(testDbPath, 'utf8'));
    expect(dbContent.nodes).toHaveLength(1);
    expect(dbContent.nodes[0].data.firstName).toBe('John');
  });
});
