# Implementation Plan - Refer & Earn Feature with Wallet System & Per-Plan Admin Settings

Implement an end-to-end **Refer and Earn** program and **Wallet Balance** system for both **Small Shop / Local Startup Businesses (Vendors)** and **Business Money Financers (Lenders)** on the website, with a dedicated **Admin Management Page** to configure referral and referee reward amounts on a **per-plan basis**.

---

## 1. User Journey & Architecture Overview

### A. Referral Generation & Sharing
1. Every registered Vendor and Lender gets a unique **Referral Code** (e.g. `JP-V89412`, `JP-L45129`) and a **Referral Link** (e.g. `https://justpaisa.in/?ref=JP-V89412`).
2. Users can copy the link with 1-click, share on WhatsApp, or share via native Web Share API.
3. Both **VendorDashboard** and **LenderDashboard** will feature a dedicated **Refer & Earn** section / modal with:
   - Unique Referral Link & Code with quick copy buttons.
   - Live **Wallet Balance Card** (Total Earned, Total Redeemed, Current Balance).
   - Referral History list (invited user name, business name, date joined, subscription status, reward earned).
   - Step-by-step "How it Works" guide.

### B. Invite & Registration Capture
1. When a new user lands on the website with `?ref=<code>` in the URL:
   - The frontend automatically detects and stores the referral code.
   - When the user registers (as Vendor or Lender), the referral code is transmitted to the backend.
   - The backend links the new user (`referee`) to the `referrer` and creates an initial `ReferralRecord` with status `REGISTERED`.

### C. Plan Purchase & Reward Distribution (Per-Plan Configurable Amounts)
1. When the referee purchases a specific subscription plan (e.g. 3-Month Plan @ ₹260, 1-Month Plan @ ₹99, etc.):
   - Backend looks up the **Plan-Specific Referral Settings** configured by the Admin for that plan:
     - **Platform / Admin Share** (e.g. ₹200 out of ₹260)
     - **Referrer Reward Amount** (e.g. ₹30 credited to referrer's wallet)
     - **Referee Reward / Discount Amount** (e.g. ₹30 credited to referee's wallet or discounted)
   - In a single atomic database transaction:
     - **Referrer's Wallet** is credited with the configured plan reward & a `WalletTransaction` is created.
     - **Referee's Wallet** is credited with the configured welcome reward & a `WalletTransaction` is created.
     - `ReferralRecord` status transitions to `COMPLETED` / `REWARD_EARNED`.
     - In-App Notifications are dispatched to both users.

### D. Wallet Deduction on Next Subscription Purchase
1. In the **Subscription Modal**:
   - The modal queries the user's live wallet balance.
   - A toggle/checkbox allows: *"Use Wallet Balance (₹XX available)"*.
   - If enabled, the wallet balance is deducted from the payable plan amount:
     - E.g. Plan is ₹99, Wallet has ₹30 $\rightarrow$ User pays ₹69, ₹30 deducted from wallet.
     - E.g. Plan is ₹99, Wallet has ₹120 $\rightarrow$ User pays ₹0, ₹99 deducted from wallet, ₹21 remaining in wallet, and plan activates immediately without external payment gateway!
   - Backend validates wallet balance securely in a database transaction and debits the wallet.

### E. Dedicated Admin Panel Page: Plan-Wise Referral & Referee Settings
1. In the **Admin Dashboard**, provide a dedicated **Referral & Plan Reward Management Page / Section**:
   - **Per-Plan Reward Table & Configuration**:
     - View all subscription plans (Weekly, Monthly, Quarterly/3-Month, Half-Yearly, Yearly) for both Vendors and Lenders.
     - For each plan, Admin can dynamically configure:
       1. **Plan Price (₹)** (Base price)
       2. **Admin / Platform Share (₹)** (Amount retained by the company)
       3. **Referrer Wallet Credit (₹)** (Reward given to the referring partner)
       4. **Referee Wallet Credit (₹)** (Reward / welcome cashback given to the new user)
       5. **Status** (Enable / Disable referral rewards for this specific plan)
   - **Automatic Validation**: Admin UI ensures `(Admin Share + Referrer Reward + Referee Reward) <= Plan Price` with live breakdown visualizers.
   - **Global Campaign Controls**: Global toggle to enable/disable the referral program, minimum wallet withdrawal/usage limits, and program terms.
   - **Referrals Live Audit & Tracking**:
     - Live KPI cards: Total Invites, Total Rewards Distributed, Platform Revenue Generated via Referrals, Active Wallets, Conversion Rate.
     - Searchable & filterable table of all referral transactions with real backend data, breakdown of rewards per plan, and CSV export.

---

## 2. Proposed Database Changes (Prisma Schema)

### [MODIFY] [schema.prisma](file:///d:/Company%20Projects/SBNI%20APP+WEB/backend/prisma/schema.prisma)
- Add `referralCode` (unique), `referredById`, and `walletBalance` to `User` model.
- Add fields to `SubscriptionPlan` model (or dedicated `PlanReferralRule` model):
  - `referrerReward Float @default(0)` // e.g. ₹30
  - `refereeReward Float @default(0)`  // e.g. ₹30
  - `adminShare Float @default(0)`     // e.g. ₹200
  - `referralEnabled Boolean @default(true)`
- Add `WalletTransaction` model:
  - `id`, `userId`, `amount`, `type` (`CREDIT` | `DEBIT`), `source` (`REFERRAL_BONUS`, `REFEREE_WELCOME_BONUS`, `SUBSCRIPTION_PAYMENT`, `ADMIN_ADJUSTMENT`), `balanceAfter`, `description`, `referenceId`, `createdAt`.
- Add `ReferralRecord` model:
  - `id`, `referrerId`, `refereeId`, `referralCode`, `referrerReward`, `refereeReward`, `adminShare`, `status` (`REGISTERED`, `COMPLETED`), `subscriptionPlanId`, `rewardedAt`, `createdAt`, `updatedAt`.
- Ensure relations with `User` (`referrals`, `referralRecordsAsReferrer`, `referralRecordsAsReferee`, `walletTransactions`).

---

## 3. Backend Architecture & Endpoints

### [NEW] [referralController.ts](file:///d:/Company%20Projects/SBNI%20APP+WEB/backend/src/controllers/referralController.ts)
- `getMyReferralInfo`: Get user's referral code, shareable link, wallet balance, summary stats, and referral history list.
- `getMyWallet`: Get user's current wallet balance and transaction logs.
- `getAdminReferrals`: Fetch all referrals with pagination, search, filter, and aggregates.
- `getPlanReferralRules`: Fetch per-plan referral reward settings for all plans.
- `updatePlanReferralRule`: Admin update for a specific plan's referrer reward, referee reward, and admin share.
- `getReferralGlobalSettings` / `updateReferralGlobalSettings`: Admin update for global referral program switches.

### [NEW] [referralRoutes.ts](file:///d:/Company%20Projects/SBNI%20APP+WEB/backend/src/routes/referralRoutes.ts)
- `GET /api/v1/referrals/my-info` (Authenticated)
- `GET /api/v1/referrals/wallet` (Authenticated)
- `GET /api/v1/referrals/admin/list` (Admin only)
- `GET /api/v1/referrals/admin/plan-rules` (Admin only)
- `PUT /api/v1/referrals/admin/plan-rules/:planId` (Admin only)
- `GET /api/v1/referrals/admin/settings` (Admin only)
- `PUT /api/v1/referrals/admin/settings` (Admin only)

### [MODIFY] [authController.ts](file:///d:/Company%20Projects/SBNI%20APP+WEB/backend/src/controllers/authController.ts)
- On registration (`registerUser`):
  - Generate unique `referralCode` for every new user.
  - Check if incoming `referralCode` is provided; if valid, link `referredById` and create `ReferralRecord` with status `REGISTERED`.

### [MODIFY] [subscriptionController.ts](file:///d:/Company%20Projects/SBNI%20APP+WEB/backend/src/controllers/subscriptionController.ts)
- In `purchaseSubscriptionPlan`:
  - Accept optional `useWallet: boolean` flag in request body.
  - Calculate wallet discount and deduct from user's `walletBalance` inside the transaction.
  - Check if this user is a referred referee with a pending referral reward:
    - Look up the specific plan's reward configuration (`referrerReward`, `refereeReward`, `adminShare`).
    - Credit referrer & referee wallets accordingly, update `ReferralRecord` to `COMPLETED`, and dispatch notifications.

---

## 4. Frontend Implementation

### [MODIFY] [api.ts](file:///d:/Company%20Projects/SBNI%20APP+WEB/frontend/src/services/api.ts)
- Add `fetchMyReferralInfoApi()`, `fetchMyWalletApi()`.
- Add `adminFetchReferralsApi()`, `adminFetchPlanReferralRulesApi()`, `adminUpdatePlanReferralRuleApi()`, `adminUpdateReferralSettingsApi()`.
- Update `purchaseSubscription()` to support `useWallet: boolean`.
- Update `registerVendor()` and `registerLender()` to include `referralCode`.

### [MODIFY] [AdminDashboard.tsx](file:///d:/Company%20Projects/SBNI%20APP+WEB/frontend/src/pages/AdminDashboard.tsx)
- Dedicated **Plan-Wise Referral & Referee Settings Interface**:
  - Interactive table listing each subscription plan (Vendor & Lender plans).
  - Editable input fields for: **Plan Price**, **Admin Share (₹)**, **Referrer Reward (₹)**, **Referee Reward (₹)**, and **Active Status**.
  - Visual summary card calculating margins and net payout percentages.
  - Save Changes button syncing directly to the backend database.
- Live Referrals Audit table with search, role filters, reward statuses, and CSV export.

### [NEW] [ReferAndEarnModal.tsx](file:///d:/Company%20Projects/SBNI%20APP+WEB/frontend/src/components/ReferAndEarnModal.tsx)
- Reusable modal for both Vendor and Lender:
  - Header with rewards highlight.
  - Live Wallet Balance Widget with "Available Balance", "Total Earned", and "Total Used".
  - Share Box with 1-click Copy Link, Copy Code, WhatsApp Direct Share button, and Native Share.
  - "How It Works" 3-step visual guide.
  - Live Referrals Table: invited friends/businesses, date, status, and reward credited.

### [MODIFY] [SubscriptionModal.tsx](file:///d:/Company%20Projects/SBNI%20APP+WEB/frontend/src/components/SubscriptionModal.tsx)
- Add Wallet Balance summary and `Use Wallet Balance (₹XX available)` checkbox.
- Live calculate adjusted total payable (e.g. ₹99 - ₹30 wallet = ₹69).
- If wallet covers 100% of the price, show *"Free with Wallet Balance 🎉"*.

### [MODIFY] [VendorDashboard.tsx](file:///d:/Company%20Projects/SBNI%20APP+WEB/frontend/src/pages/VendorDashboard.tsx) & [LenderDashboard.tsx](file:///d:/Company%20Projects/SBNI%20APP+WEB/frontend/src/pages/LenderDashboard.tsx)
- Add "Refer & Earn" button in dashboard header, quick action banners, and profile section.
- Display wallet balance badge.

### [MODIFY] [AuthModal.tsx](file:///d:/Company%20Projects/SBNI%20APP+WEB/frontend/src/pages/AuthModal.tsx)
- Auto-detect `?ref=<code>` from URL and prefill referral code field with a verified tag.

---

## 5. Verification Plan

### Automated / Backend Verification
1. Run Prisma migration / generate: `npx prisma generate` to apply schema updates.
2. Verify TypeScript compilation: backend build and frontend build.

### Functional Flow Verification
1. **Admin Plan-Wise Settings**: In Admin Panel $\rightarrow$ Open Referral & Plan Settings page $\rightarrow$ Set custom Referrer Reward, Referee Reward, and Admin Share for each plan (e.g. 3-Month Plan: ₹260 = ₹200 Admin + ₹30 Referrer + ₹30 Referee) $\rightarrow$ Save and verify persistence.
2. **Referral Link Sharing**: User A copies unique link `https://domain/?ref=<code>`.
3. **Registration & Plan Subscription**: User B registers via referral link $\rightarrow$ Subscribes to the 3-Month Plan.
4. **Reward Credit**: Verify User A's wallet gets credited with the configured ₹30, User B's wallet gets ₹30, and the Referral Record shows complete with full plan details in the Admin Panel.
5. **Wallet Redemption**: User A or B purchases another plan $\rightarrow$ Selects "Use Wallet Balance" $\rightarrow$ Balance is deducted from the payable price accurately.
