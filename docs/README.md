# Pocket — Developer Guide

Pocket is a local-first personal finance application. The primary feature set is:

- Transactions (income and expenses)
- Recurring bills and subscriptions
- Debts and debt payments
- Categories and people
- Reports and settings, including backup, sync, and device integration

## Architecture

- `app/js/data` — IndexedDB repositories, stores, and migrations.
- `app/js/domain` — pure finance calculations and validation.
- `app/js/services` — finance, report, sync, backup, and device services.
- `app/js/ui` — pages, components, and rendering.
- `api/` — PHP sync backend.

## Data flow

Records are stored in IndexedDB via `data/stores.js`. The registry drives migrations metadata,
sync allow-lists, backup normalization, and quota checks. Finance records use last-write-wins sync
through `services/sync-service.js`.

## Development

```bash
npm ci
npm run build
npm run dev
```

Open `http://127.0.0.1:8080`.

## Quality checks

```bash
npm run build
npm run check:i18n
```
