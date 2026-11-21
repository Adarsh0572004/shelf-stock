import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import request from 'supertest';
import { createApp } from '../server/app.js';

let memory, client, api;
before(async () => {
  memory = await MongoMemoryServer.create({binary:{version:'7.0.14'}});
  client = await new MongoClient(memory.getUri()).connect();
  api = request(createApp(client.db('test')));
});
after(async () => { await client?.close(); await memory?.stop(); });

test('concurrent withdrawals cannot oversell or create extra history', async () => {
  const product = { sku:'PEN', name:'Blue pen', threshold:3 };
  await api.post('/api/items').send(product).expect(201);
  await api.post('/api/items').send(product).expect(409);
  const move = (direction, quantity) => api.post('/api/items/PEN/movements').send({ direction, quantity });
  await move('receive', 5).expect(200);
  await move('issue', -1).expect(400);
  const results = await Promise.all([move('issue', 4), move('issue', 4)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200,409]);
  const { body:[item] } = await api.get('/api/items').expect(200);
  assert.equal(item.units, 1);
  assert.deepEqual(item.history.map(h => h.delta), [5,-4]);
});
