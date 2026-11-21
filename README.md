# Shelf Stock

Track stock by SKU and prevent withdrawals that exceed available units.

## Quick start

Use Python 3.10 or newer. All dependencies are in the standard library.

```sh
python app.py receive PEN 10
python app.py issue PEN 3
python app.py list
```

The example output includes `PEN | 7`.

Records are saved in `shelf-stock.sqlite3` in the working directory. Use `--db PATH` before the command to choose another database. Run `python app.py --help` for the available options.
