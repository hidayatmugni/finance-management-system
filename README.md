# Finance Management System

Mobile-first family finance app with React, Tailwind CSS v3, Firebase-ready architecture, offline-first flow, and spreadsheet sync via Firebase Cloud Functions.

## Workspace Overview

Project ini memakai satu repo dengan dua deployment target:

- `src/` dan `public/` untuk frontend React yang di-host di Vercel
- `functions/` untuk backend Firebase Cloud Functions

Lihat ringkasan arsitektur deploy di [../docs/deployment-architecture.md](../docs/deployment-architecture.md).

## Frontend Stack

- React + Vite
- Tailwind CSS v3
- React Router
- Zustand
- React Hook Form + Zod
- Recharts
- Dexie

## Backend Stack

- Firebase Authentication
- Firestore
- Firebase Cloud Functions
- Google Sheets API

## Quick Start

### Frontend

```bash
npm install
npm run dev
```

Copy `.env.example` menjadi `.env` saat mulai menghubungkan frontend ke Firebase.

### Functions

Masuk ke folder `../functions/` lalu jalankan:

```bash
npm install
```

Copy `../functions/.env.example` menjadi `../functions/.env` untuk spreadsheet sync.

## Deploy Target

### Vercel

Yang dideploy ke Vercel adalah folder `vercel-app/`.

### Firebase

Yang dideploy ke Firebase adalah folder `../functions/`.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Documentation

- [Product blueprint](../docs/blueprint.md)
- [Deployment architecture](../docs/deployment-architecture.md)
- [Firebase spreadsheet sync setup](../docs/firebase-spreadsheet-sync.md)

## Included in This Scaffold

- Clean mobile-first app shell
- Dashboard, transactions, reports, savings, debt, members, settings
- Offline queue baseline with Dexie
- PWA manifest and service worker baseline
- Firebase Functions scaffold for Google Sheets sync
