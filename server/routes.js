import { Router } from 'express';

export function routes(db) {
  const router = Router();
  const items = db.collection('items');
  router.get('/items', async (_req, res) => {
    res.json(await items.find().sort({ _id: 1 }).toArray());
  });
  router.post('/items', async (req, res) => {
    const { sku, name, threshold } = req.body ?? {};
    if (typeof sku !== 'string' || !/^[A-Z0-9_-]{1,32}$/.test(sku) ||
        typeof name !== 'string' || !name.trim() || name.length > 100 ||
        !Number.isSafeInteger(threshold) || threshold < 0 || threshold > 1000000) {
      return res.status(400).json({ error: 'Enter a SKU, product name and valid reorder level' });
    }
    const item = { _id: sku, name: name.trim(), threshold, units: 0, history: [] };
    try { await items.insertOne(item); }
    catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: 'SKU already exists' });
      throw error;
    }
    res.status(201).json(item);
  });
  router.post('/items/:sku/movements', async (req, res) => {
    const { direction, quantity } = req.body ?? {};
    if (!['receive', 'issue'].includes(direction) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000) {
      return res.status(400).json({ error: 'Choose a movement and 1–1,000,000 units' });
    }
    const delta = direction === 'receive' ? quantity : -quantity;
    const units = delta < 0 ? { $gte: quantity } : { $lte: Number.MAX_SAFE_INTEGER - quantity };
    const item = await items.findOneAndUpdate({ _id: req.params.sku, units }, {
      $inc: { units: delta },
      $push: { history: { $each: [{ delta, at: new Date() }], $slice: -100 } },
    }, { returnDocument: 'after' });
    if (!item) return res.status(409).json({ error: 'Unknown SKU or movement exceeds available stock limits' });
    res.json(item);
  });
  return router;
}
