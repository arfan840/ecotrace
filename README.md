# EcoTrace — Biomedical Waste Management Platform

EcoTrace is an enterprise-grade, compliance-first Common Bio-Medical Waste Treatment Facility (CBWTF) tracking system. Built with React, Vite, and Supabase, it ensures a strict chain of custody for hazardous biomedical waste from healthcare facility dispatch, transit manifest tracking, gate scan receiving, reconciliation, autoclave/incineration batching, and disposal certificate generation.

---

## Features Matrix
- **Clean Architecture:** Decoupled data access logic (`src/lib/api`) and client-side Zod validation schemas.
- **Multi-Tenant RLS:** Strictly isolates data between distinct waste management organizations at the PostgreSQL level.
- **Offline Scanner Support:** Caches driver check-ins and scanned barcoded pickups locally during signal drop, auto-syncing when connection is restored.
- **Web Bluetooth GATT Scales:** Collects exact weight metrics directly from BLE weighing scales.
- **Compliance Center & Certificates:** Generates Form IV regulatory reports and printable disposal certificates.

---

## 1. Quick Start Setup

### Step A: Clone and Install
```bash
# Install package dependencies
npm install
```

### Step B: Configure Environment Variables
Copy `.env.example` into a new `.env` file in the project root:
```bash
cp .env.example .env
```
Fill in your project's `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` credentials.

### Step C: Initialize Supabase Database
1. Open the Supabase console SQL Editor for your project.
2. Paste and run the entire contents of the `supabase_schema.sql` file.
3. This creates all tables, multi-tenant row level security (RLS) filters, functional triggers, and default mock organizations.

---

## 2. Scripts and Commands

### Local Development Server
Starts Vite dev server on `http://localhost:5173`.
```bash
npm run dev
```

### Run Automated Unit Tests
Runs the Vitest suite verifying bag generation, parsing, permissions scopes, and certificate HTML formats.
```bash
npm run test
```

### Test Coverage Reports
Executes test coverage checks using the `v8` provider. Enforces a 40% statement coverage build gate.
```bash
npm run test -- --coverage
```

### Code Formatting and Linting
Verifies syntax quality rules.
```bash
npm run lint
```

### Production Build Compilation
Builds minified, optimized production assets to the `dist/` directory.
```bash
npm run build
```
