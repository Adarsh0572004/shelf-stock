import { MongoClient } from 'mongodb';
import { createApp } from './app.js';

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 5000 });
await client.connect();
const app = createApp(client.db('shelf_stock'));
const server = app.listen(Number(process.env.PORT || 4101), '127.0.0.1', () => console.log('Listening on', server.address()));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => client.close()));
}
