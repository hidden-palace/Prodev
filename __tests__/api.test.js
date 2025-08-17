process.env.NODE_ENV = "development";
const request = require('supertest');
const { app, server } = require('../server');

afterAll(done => {
  server.close(done);
});

describe('POST /api/ask', () => {
  test('returns 400 when message is missing', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({ employee: 'brenden' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/message/i);
  });

  test('returns 503 when OpenAI service is unavailable', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({ message: 'Hello', employee: 'brenden' });
    expect(res.status).toBe(503);
  });
});

describe('POST /api/webhook-response', () => {
  test('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/webhook-response')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required fields/i);
  });
});

describe('GET /api/leads', () => {
  test('returns 503 when lead processor is unavailable', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/Service unavailable/i);
  });
});
