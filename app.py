"""Track stock by SKU and prevent withdrawals that exceed available units."""

import argparse
import sqlite3
from contextlib import closing


def positive(text):
    value = int(text)
    if value < 1:
        raise argparse.ArgumentTypeError("Expected an integer of at least 1")
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default="shelf-stock.sqlite3", help="SQLite database path")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("list", help="List records")
    command = commands.add_parser("receive", help="Add units to stock.")
    command.add_argument("sku")
    command.add_argument("units", type=positive)
    command = commands.add_parser("issue", help="Remove available units.")
    command.add_argument("sku")
    command.add_argument("units", type=positive)
    args = parser.parse_args()
    try:
        with closing(sqlite3.connect(args.db)) as db, db:
            db.execute("CREATE TABLE IF NOT EXISTS items (sku TEXT PRIMARY KEY, units INTEGER NOT NULL CHECK(units >= 0))")
            if args.command == "list":
                for row in db.execute("SELECT sku, units FROM items ORDER BY 1, 2"):
                    print(" | ".join(map(str, row)))
            elif args.command == "receive":
                db.execute("INSERT INTO items VALUES (?, ?) ON CONFLICT(sku) DO UPDATE SET units=units+excluded.units", (args.sku, args.units))
            elif args.command == "issue":
                if not db.execute("UPDATE items SET units=units-? WHERE sku=? AND units>=?", (args.units, args.sku, args.units)).rowcount:
                    raise ValueError("Unknown SKU or insufficient stock")
    except (ValueError, sqlite3.Error) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
