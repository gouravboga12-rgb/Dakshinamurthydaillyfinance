# Dakshinamurthy Daily Finance Lending Platform

A secure, scalable, and modern daily finance lending platform consisting of a backend server, an admin management dashboard, and a customer mobile application.

---

## 🏗️ System Architecture & Monorepo Structure

The workspace is organized as a clean, modular monorepo:

*   **`backend/`**: Node.js & Express API with a dual-mode database repository. Automatically utilizes **Supabase (PostgreSQL)** when credentials are provided, and falls back to a self-contained local **SQLite** database for instant local development/testing.
*   **`admin-panel/`**: React.js SPA built with Vite, TypeScript, and Tailwind CSS. Provides administrators with a dashboard for customer approvals, loan disbursal sheets, payment collection entries, and analytical reports (including responsive SVG charts).
*   **`customer-mobile/`**: React Native mobile client powered by Expo, TypeScript, React Navigation, and Redux Toolkit. Provides customers with active loan summaries, repayment tracking progress, and push-style alert feeds.

---

## 🎨 Brand Identity

*   **Logo Emblem**: Navy & Gold Tree Emblem (integrated at login, sidebar, and landing screens).
*   **Color Palette**:
    *   Primary (Slate/Navy): `#0F172A`
    *   Secondary (Royal Blue): `#1E40AF`
    *   Accent (Emerald Green): `#10B981`

---

## 🚀 Quick Start Guide

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [npm](https://www.npmjs.com/) or yarn
*   For running the mobile app locally: [Expo Go](https://expo.dev/client) app on a physical device, or configured Android Emulator/iOS Simulator (alternatively, run in-browser using Expo Web).

---

### Step 1: Backend Setup (`/backend`)

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables. Copy `.env` if not already present, or use the pre-configured one. If no Supabase URL/Key is present, it will run in **SQLite Dual-Mode Fallback** automatically:
    ```env
    PORT=5000
    JWT_SECRET=finance_secret_token_key_123!
    SUPABASE_URL=
    SUPABASE_KEY=
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    *   *Note: The server will auto-generate the database schema (SQLite `finance.db`) and seed it with a default admin account:*
        *   **Mobile Number**: `9999999999`
        *   **Password**: `admin123`

---

### Step 2: React Admin Dashboard Setup (`/admin-panel`)

1.  Navigate to the admin-panel directory:
    ```bash
    cd ../admin-panel
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) (as configured in the Vite dev options). Log in using the admin credentials:
    *   **Mobile Number**: `9999999999`
    *   **Password**: `admin123`

---

### Step 3: Expo Customer Mobile App Setup (`/customer-mobile`)

1.  Navigate to the customer-mobile directory:
    ```bash
    cd ../customer-mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Expo Bundler:
    ```bash
    npm run web
    ```
    *   This will launch the bundler and serve the mobile app in your web browser for testing, simulating mobile interactions with zero emulator dependency.
    *   *To run on an actual phone:* Scan the QR code shown in the terminal using the **Expo Go** app. Ensure your phone and PC are connected to the same Wi-Fi network.

---

## ⚡ Core Business & Repayment Logic

1.  **Platform Fee upfront deduction**:
    *   Approved Amount: `₹10,000`
    *   Platform Fee (Charges): `₹1,000`
    *   Amount Disbursed: `₹9,000`
    *   Repayment Basis: **`₹10,000`** (Daily installments are calculated based on the approved amount, not the disbursed net).
2.  **Lifecycle of a Loan**:
    *   A customer registers on the Mobile App (Status is set to `Pending Approval`).
    *   The Admin approves the customer, and creates a Loan Proposal (e.g. ₹10,000 for 50 days = ₹200 daily installment).
    *   Once the loan is approved and marked active by the admin, the customer sees the active progress tracking bar.
    *   The admin records daily payments manually as the collection agent collects cash.
    *   When the remaining balance becomes `0`, the loan automatically updates to `Completed` status, opening up slot for next loan request (strictly max **one active loan** per customer).
