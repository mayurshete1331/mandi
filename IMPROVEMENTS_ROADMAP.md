# MandiConnect — Platform Guide & Zero-Cost Improvement Roadmap

## 1. Executive Summary

**MandiConnect** is a specialized B2B Agricultural & Wholesale Commodity (Mandi) Commerce Platform connecting **APMC Mandi Wholesale Stockists / Godown Merchants** with local **Kirana (Grocery) Retailers**.

Traditional Mandi purchasing relies on chaotic phone calls, paper slips (*parchi*), volatile morning market rates (*Mandi Bhav*), and informal credit ledgers (*Bahi-Khata*). MandiConnect digitizes this entire workflow with:
- **Hierarchical Commodity Catalog**: Categories &rarr; Varieties &rarr; SKUs (Rice, Pulses/Dal, Atta/Flour, Edible Oil, Sugar/Jaggery) with brand, packaging type (25kg/50kg bag, 15L tin), landing cost, and selling rates.
- **Fast Godown Inward**: Single commodity inward or bulk upload via Excel/CSV templates using SheetJS (`xlsx`).
- **Morning Mandi Bhav Ticker**: Live daily selling rates per bag/tin published by wholesalers.
- **The Mandi Matrix**: Rapid bulk ordering interface designed specifically for high-variety grain and commodity purchasing.
- **Multi-Wholesaler Network**: Kirana stores can connect to and order from multiple approved APMC stockists.
- **Bahi-Khata Credit Ledger**: Isolated credit tracking per wholesaler-retailer pair, enforcing real-time credit limits, balances, and passbook statements.
- **Tempo Dispatch Pipeline**: Status tracking from `NEW` &rarr; `PACKED` &rarr; `OUT_FOR_DELIVERY` (with assigned Driver & Vehicle) &rarr; `DELIVERED`.

---

## 2. Tech Stack & Architecture

- **Frontend**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Spreadsheet Processing**: SheetJS (`xlsx`) for Excel/CSV template download and bulk upload
- **Database & ORM**: MySQL with Prisma ORM (`@prisma/client` 5.22.0)
- **Session Layer**: Role-based routing (`WHOLESALER`, `KIRANA`) with cookie authentication

---

## 3. End-to-End Workflow

```
[Kirana Store]                                               [Mandi Wholesaler]
      │                                                              │
      ├──── 1. Registers & Selects Wholesaler ──────────────────────►│
      │                                                              ├─► Reviews & Approves Account
      │                                                              ├─► Sets Credit Limit (e.g. ₹50,000)
      │                                                              │
      │                                                              ├─► Inwards Truck Stock (Excel / Form)
      │                                                              ├─► Updates Morning Mandi Bhav
      │                                                              │
      ├──── 2. Browses Mandi Matrix & Places Bag Order ─────────────►│
      │        (Validates Available Credit & Decrements Stock)       │
      │        (Logs DEBIT Entry in Bahi-Khata)                      │
      │                                                              │
      │                                                              ├─► Packs Bags
      │                                                              ├─► Assigns Driver & Tempo Number
      │◄─── 3. Receives Live Delivery Tracking ──────────────────────┤
      │                                                              ├─► Marks DELIVERED
      │                                                              │
      ├──── 4. Settles Udhaar (Payment Recorded) ───────────────────►│
      │        (Logs CREDIT Entry & Restores Credit Limit)           │
```

---

## 4. Zero-Cost (100% Free) Improvements Roadmap

Every feature listed below can be implemented with **zero subscription costs**, **zero paid APIs**, and **zero gateway commissions**, using open-source tools, native browser capabilities, and the NPCI UPI protocol.

---

### Category A: Zero-Fee Payments & WhatsApp Bridge

#### 1. Direct Bank UPI Dynamic QR Code (0% Commission)
- **Problem**: Payment gateways charge 1.5%–2% per transaction, eroding thin wholesale margins.
- **Free Solution**: Use the official NPCI UPI URI protocol standard:
  ```
  upi://pay?pa=wholesaler@bank&pn=WholesalerShopName&am=15000&cu=INR&tn=MandiPayment-ORD102
  ```
- Render as an on-screen QR code using the free open-source `qrcode.react` package.
- Kirana owners scan using **PhonePe, Google Pay, or Paytm**. Money transfers directly bank-to-bank instantly with **0% gateway fees**.

#### 2. Free WhatsApp Alerts & Bill Sharing ("Click-to-Chat")
- **Problem**: Official WhatsApp Business APIs charge per message.
- **Free Solution**: Use standard WhatsApp deep-linking (`https://wa.me/<phone>?text=<encoded_text>`).
- Implement one-tap buttons:
  - **Share Bill**: Sends a formatted invoice breakdown to the Kirana owner's WhatsApp.
  - **Payment Reminder**: Sends a polite Udhaar reminder with the outstanding balance and a clickable UPI link.
  - **Daily Mandi Bhav**: Wholesalers can broadcast today's commodity rates to their retailer group with one click.

---

### Category B: Security & Authentication (Zero Cost)

#### 1. Salted Password Hashing (`bcryptjs` / `argon2`)
- **Current State**: Passwords are stored in plaintext in the database.
- **Free Fix**: Hash passwords on registration using `bcryptjs` (free npm library) with 10 salt rounds and compare hashes during login.

#### 2. Tamper-Proof HTTP-Only Cookies / JWT Sessions
- **Current State**: Plain `mandi_user_id` cookie can be edited via browser developer tools.
- **Free Fix**: Use signed JWTs or encrypted tokens with Next.js Server Actions / Route Handlers with flags:
  `httpOnly: true`, `secure: true`, `sameSite: 'lax'`.

#### 3. Strict Input Validation (`zod`)
- Validate all incoming payloads (phone numbers, bag counts, pricing, credit limits) using `zod` to prevent injection and malformed requests.

---

### Category C: Mandi Business Logic & Financials

#### 1. Daily Mandi Bhav History & Price Trend Charts
- Add a `PriceHistory` model in Prisma to track opening and closing rates each time a wholesaler updates prices.
- Display 7-day and 30-day interactive price trend lines (using free libraries like **Recharts** or lightweight SVG canvas).
- Enables Kirana store owners to make informed purchasing decisions based on price dips and surges.

#### 2. Browser-Printable GST Tax Invoices & Gate Passes
- Format a clean, print-optimized HTML layout for tax invoices complying with APMC Mandi norms:
  - Wholesaler & Retailer GSTIN
  - HSN Codes (e.g., HSN 1006 for Rice, HSN 0713 for Pulses, HSN 1512 for Edible Oil)
  - Tax breakdown: 0% unbranded, 5% branded staples, 5%/18% edible oils
  - Truck gate pass with vehicle number and bag counts
- Use native `window.print()` — zero third-party PDF generation services required.

#### 3. Bahi-Khata Credit Due Dates & Aging Reports
- Add credit terms (e.g., 7 days, 15 days, 30 days) to `WholesalerRetailerConnection`.
- Compute aging buckets directly in the database:
  - **Current** (0–7 days)
  - **Due Soon** (8–15 days)
  - **Overdue** (15+ days)
- Visually flag overdue balances on the wholesaler dashboard.

#### 4. Partial Delivery Adjustments & Credit Notes
- Allow retailers or drivers to record damaged, burst, or short bags upon delivery (e.g., 48 received out of 50).
- Automatically generate a negative debit entry (Credit Note) in `KhataEntry` to adjust the balance without manual math.

---

### Category D: Logistics & Godown Operations

#### 1. Consolidated Tempo Loading Sheet (Trip Sheet)
- Wholesalers often dispatch a single tempo to deliver goods across 4–8 shops along a route.
- Generate an aggregated warehouse loading summary:
  - *Total to load*: e.g., 90 bags MP Sharbati Atta, 60 bags Toor Dal, 40 tins Sunflower Oil.
  - *Delivery sequence*: Stop 1 (Store A), Stop 2 (Store B), Stop 3 (Store C).
- Godown laborers can view this on a phone or print a single loading slip.

#### 2. 4-Digit Delivery Verification OTP
- Generate a random 4-digit code displayed on the Kirana store's order tracking page.
- The delivery driver asks for and submits this code upon unloading to mark the order `DELIVERED`.
- Zero SMS cost because the code is displayed directly inside the Kirana's web portal.

#### 3. In-Browser Camera Barcode/QR Scanner
- Use the free HTML5 Camera API (`html5-qrcode`) to scan lot stickers and QR codes on bags during inward, eliminating manual typing.

---

### Category E: Usability, Localization & Mobile PWA

#### 1. Regional Language Support (Hindi, Marathi, Gujarati)
- Maintain JSON localization files for key Mandi terms (*Mandi Bhav*, *Bahi-Khata*, *Aavak/Javak*, *Udhaar*, *Bora/Bag*, *Chhota Hathi*).
- Provide a simple language selector in the navigation bar.

#### 2. In-Browser Voice Search (Free Web Speech API)
- Use the native browser `webkitSpeechRecognition` API (available for free in Chrome, Edge, and Android).
- Retailers can tap a microphone icon and speak commodity names (*"50 bag Kolam Chawal"*, *"Fortune Oil"*) to filter instantly without typing.

#### 3. Offline PWA (Progressive Web App)
- Configure service worker caching with `IndexedDB` to store the commodity catalog and recent bills.
- Allows retailers to view prices and prepare carts even in crowded Mandi basements with spotty cellular coverage.

---

### Category F: Free Cloud Hosting & Database Setup

| Service | Free Tier Provider | Specifications |
| :--- | :--- | :--- |
| **Web Hosting** | [Vercel](https://vercel.com) | Free Hobby Plan (Next.js native builds, automatic SSL, custom domain) |
| **Cloud MySQL Database** | [TiDB Cloud Serverless](https://tidb.cloud) | 5 GB free storage, 100% MySQL-compatible, zero credit card required |
| **Alternative DB** | Local MySQL80 | Run locally on host machine at zero cost |
| **Source Control & CI/CD** | [GitHub](https://github.com) | Free unlimited repositories & GitHub Actions |

---

## 5. Suggested Phased Implementation Plan

| Phase | Focus Area | High-Impact Deliverables |
| :---: | :--- | :--- |
| **1** | **Security & Auth** | Salted password hashing (`bcryptjs`), HTTP-only cookie session protection, Zod validation |
| **2** | **Zero-Fee Payments & Sharing** | Direct Bank UPI QR code generator, WhatsApp bill and payment reminder links |
| **3** | **Invoicing & Mandi Logic** | Browser-printable GST tax invoices, PriceHistory tracking & trend charts |
| **4** | **Logistics & Bahi-Khata** | Delivery verification OTP, Tempo consolidated loading trip sheet, aging reports |
| **5** | **Localization & Mobile** | Hindi/Marathi language toggle, browser voice search, offline PWA caching |
