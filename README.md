# Shelf Stock

A MERN inventory workspace for registering products, receiving deliveries and issuing stock. Each product has a reorder level and a searchable record of its last 100 movements. MongoDB updates the quantity and history together and checks stock availability before each withdrawal.

## Run locally

Use Node.js 22.12+ and a running local MongoDB server. From the repository root:

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:4101. The server binds to the loopback interface for single-user local use. To configure MongoDB, copy `.env.example` to `.env` and set `MONGODB_URI`. The web app uses the `shelf_stock` database.

For frontend development, start the API with `npm run server`, then run `npm run dev` in another terminal. Vite proxies API requests to the default API port.

## Try it

Register SKU PEN with a reorder level of 5. Receive 10 units, then issue 7. The product shows 3 units and a low-stock indicator. Expand its history to see both movements.

## Verification

Run `npm test` for the HTTP integration test. The first test run downloads MongoDB 7.0.14 and starts a temporary database. Run `npm run build` to compile the React interface.

## Standalone Python CLI

The original CLI uses its own SQLite database.
Use Python 3.10 or newer. All dependencies are in the standard library.

```sh
python app.py receive PEN 10
python app.py issue PEN 3
python app.py list
```

The example output includes `PEN | 7`.

Records are saved in `shelf-stock.sqlite3` in the working directory. Use `--db PATH` before the command to choose another database. Run `python app.py --help` for the available options.
