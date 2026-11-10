# MandiConnect — Comprehensive User Manual & Walkthrough Guide

Welcome to **MandiConnect**, India's direct B2B digital marketplace connecting **APMC Mandi Wholesale Stockists** with local **Kirana Retail Stores**.

This guide covers everything you need to know to use MandiConnect with concrete, real-world examples.

---

## Table of Contents
1. [Core Roles & Personas](#1-core-roles--personas)
2. [End-to-End Walkthrough Example (Story of Balaji Traders & Om Sai Kirana)](#2-end-to-end-walkthrough-example)
3. [Wholesaler Manual: Step-by-Step Operations](#3-wholesaler-manual-step-by-step-operations)
   - [Step 1: Registration & Profile](#step-1-wholesaler-registration)
   - [Step 2: Inwarding Godown Stock (Form & Excel)](#step-2-inwarding-godown-stock)
   - [Step 3: Setting Daily Morning Mandi Bhav](#step-3-setting-daily-morning-mandi-bhav)
   - [Step 4: Approving Kirana Stores & Setting Credit Limits](#step-4-approving-kirana-stores--setting-credit-limits)
   - [Step 5: Managing the Dispatch Pipeline](#step-5-managing-the-dispatch-pipeline)
   - [Step 6: Bahi-Khata Market Receivables](#step-6-bahi-khata-market-receivables)
4. [Kirana Retailer Manual: Step-by-Step Operations](#4-kirana-retailer-manual-step-by-step-operations)
   - [Step 1: Registration & Wholesaler Selection](#step-1-kirana-registration)
   - [Step 2: Checking Approved Credit](#step-2-checking-approved-credit)
   - [Step 3: Ordering via The Mandi Matrix](#step-3-ordering-via-the-mandi-matrix)
   - [Step 4: 1-Click Repeat Reordering](#step-4-1-click-repeat-reordering)
   - [Step 5: Live Order & Tempo Tracking](#step-5-live-order--tempo-tracking)
   - [Step 6: Settling Udhaar in Bahi-Khata](#step-6-settling-udhaar-in-bahi-khata)
5. [Frequently Asked Questions (FAQ)](#5-frequently-asked-questions)

---

## 1. Core Roles & Personas

| Role | Who It's For | Primary Goal |
| :--- | :--- | :--- |
| **🏢 Mandi Wholesaler** | Godown owners, APMC commission agents (*Aadtiyas*), and bulk grain stockists. | Digitize telephone orders, broadcast daily locked bag rates, manage tempo dispatches, and track market receivables (*Udhaar*). |
| **🛒 Kirana Retailer** | Grocery store owners, supermarket managers, and provision stores. | Buy bulk staples (Rice, Dal, Atta, Oil, Sugar) at live Mandi rates in 1 tap, replenish stock on credit, and track deliveries. |

---

## 2. End-to-End Walkthrough Example

Let's follow a real-world transaction from start to finish:

- **Wholesaler**: Ramesh Patel, running **"Shree Balaji Grain Traders"** at Gala No. 42, Dana Bazar, Vashi APMC Mandi (Phone: `9820011223`).
- **Kirana Retailer**: Suresh Gupta, running **"Om Sai Super Market"** at Station Road, Ghatkopar, Mumbai (Phone: `9876543210`).

```
[Day 1 - 07:00 AM] Ramesh registers "Shree Balaji Traders" on MandiConnect.
[Day 1 - 07:15 AM] Ramesh inwards 100 bags of Basmati Rice and 150 bags of MP Sharbati Atta.
[Day 1 - 07:30 AM] Ramesh sets the morning Mandi Bhav: Basmati ₹2,600/bag, Atta ₹1,680/bag.
[Day 1 - 08:00 AM] Suresh registers "Om Sai Super Market" and selects "Shree Balaji Traders".
[Day 1 - 08:15 AM] Ramesh sees Suresh's store request, verifies his shop, and approves with ₹50,000 Credit Limit.
[Day 1 - 08:30 AM] Suresh opens his Kirana app, adds 10 bags Basmati + 10 bags Atta (Total: ₹42,800).
[Day 1 - 08:31 AM] Suresh checks out using Mandi Credit. Godown stock decrements automatically.
[Day 1 - 09:00 AM] Ramesh packs the order, assigns driver "Raju" and Tempo "MH-04-AB-1234".
[Day 1 - 11:30 AM] Raju delivers 20 bags to Ghatkopar. Order marked "DELIVERED".
[Day 5 - 04:00 PM] Suresh settles ₹20,000 partial payment on Bahi-Khata. Available credit restores to ₹27,200!
```

---

## 3. Wholesaler Manual: Step-by-Step Operations

### Step 1: Wholesaler Registration
1. Go to **`/register`**.
2. Click the **"🏢 Mandi Wholesaler"** tab at the top.
3. Fill in:
   - **Firm / Godown Name**: `Shree Balaji Grain Traders`
   - **Proprietor Name**: `Ramesh Patel`
   - **Mobile Number**: `9820011223`
   - **Password**: `balaji123`
   - **APMC Mandi / Godown Address**: `Gala No. 42, Dana Bazar, APMC Mandi, Vashi`
4. Click **"Register Wholesale Firm & Enter Godown"**.
5. Your account is **instantly active** and opens the **Wholesaler Command Center**.

---

### Step 2: Inwarding Godown Stock

You can add inventory via **Single Item Entry** or **Bulk Excel Upload**:

#### Method A: Single Inward (Form)
1. In the Wholesaler Portal, click the **"+ Add Stock"** tab.
2. Under "Inward Mode", select **"Single Commodity Inward"**.
3. If adding a brand-new commodity for the first time, click **"+ Add New Commodity / SKU"**:
   - **Category**: `Rice (Chawal)`
   - **Variety**: `Basmati Rice`
   - **Sub-Type**: `1121 Extra Long`
   - **Brand**: `Royal Crown Marka`
   - **Packaging**: `25kg Bag`
   - **Weight**: `25` kg
   - **Initial Stock**: `100` bags
   - **Landing Cost**: `2450` (Cost to purchase from mill)
   - **Selling Bhav**: `2600` (Morning rate to Kirana stores)
   - **Supplier**: `Laxmi Agro Rice Mill, Karnal`
4. Click **"Create & Inward SKU"**. It immediately appears in your godown stock!

#### Method B: Bulk Inward (Excel / CSV)
1. Under "+ Add Stock", toggle to **"Bulk Excel Upload"**.
2. Click **"Download Template (.xlsx)"**.
3. Open the file in Excel, enter your incoming truck arrivals:
   | Category | Variety | SubType | Brand | PackagingType | WeightKg | BagsAdded | PurchaseCost | SellingPrice | Supplier |
   | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
   | Rice (Chawal) | Basmati Rice | 1121 Extra Long | Royal Crown Marka | 25kg Bag | 25 | 100 | 2450 | 2600 | Laxmi Agro |
   | Atta, Maida & Suji | Wheat Atta | MP Sharbati | Shree Chakki Fresh | 50kg Bag | 50 | 150 | 1550 | 1680 | MP Roller Mills |
   | Edible Oils & Ghee | Refined Sunflower | Triple Filtered | Fortune Sunlite | 15L Tin | 13.5 | 80 | 1620 | 1710 | Adani Wilmar |
4. Save the file and upload it in the file dropzone.
5. Click **"Confirm & Inward All Bags"**. All commodities and stock counts update in bulk!

---

### Step 3: Setting Daily Morning Mandi Bhav
APMC market rates fluctuate every morning based on crop arrivals:
1. Click the **"Mandi Bhav"** tab.
2. You will see a live ticker of all SKUs in your godown with their current bag prices.
3. To update a rate:
   - Use the **`+10`** or **`-10`** quick-adjust buttons, **OR**
   - Click directly into the price box, type the new rate (e.g., `2620`), and click away.
4. The rate locks instantly and updates on all connected Kirana screens in real time.

---

### Step 4: Approving Kirana Stores & Setting Credit Limits
When local Kirana stores sign up, they appear in your approvals queue:
1. Click the **"Store Approvals"** tab.
2. Under **"Pending Approval Requests"**, you will see:
   - **Store Name**: *Om Sai Super Market*
   - **Owner**: *Suresh Gupta* (`9876543210`)
   - **Location**: *Station Road, Ghatkopar, Mumbai*
3. In the **"Credit Limit (₹)"** box, enter the credit amount you trust them with (e.g. `50000`).
4. Click **"Approve & Set Limit"**.
5. The store is activated immediately. Suresh can now log in and place orders up to ₹50,000 on credit!

---

### Step 5: Managing the Dispatch Pipeline
When a store places an order:
1. A notification appears on your **"Orders"** tab.
2. Order card shows:
   - **Order Number**: `ORD-84920`
   - **Store**: `Om Sai Super Market`
   - **Commodities**: `10 bags Basmati (25kg)` + `10 bags Atta (50kg)` = 20 Bags Total (750 kg).
   - **Total Value**: `₹42,800` (Payment: CREDIT).
3. **Status Flow**:
   - Step A: Click **"Mark as Packed"** once godown laborers finish stacking the bags.
   - Step B: Click **"Dispatch via Tempo"**:
     - Enter Driver Name: `Raju Shinde`
     - Enter Vehicle Number: `MH-04-AB-1234`
     - Click **"Confirm Dispatch"**. Status changes to `OUT_FOR_DELIVERY`.
   - Step C: Once the driver returns after delivery, click **"Mark Delivered"**.

---

### Step 6: Bahi-Khata Market Receivables
1. Click the **"Kirana Khata"** tab.
2. The KPI bar at the top displays your **Total Market Udhaar** (e.g., `₹2,45,000` across 8 stores).
3. View the customer directory:
   - Store Name, Phone Number, Credit Limit, and Outstanding Balance.
   - Example: *Om Sai Super Market* &rarr; Limit: ₹50,000 | Outstanding: ₹42,800 | Available: ₹7,200.

---

## 4. Kirana Retailer Manual: Step-by-Step Operations

### Step 1: Kirana Registration
1. Go to **`/register`**.
2. Keep the default tab **"🛒 Kirana Retailer"** selected.
3. Fill in:
   - **Kirana Shop Name**: `Om Sai Super Market`
   - **Owner Name**: `Suresh Gupta`
   - **Mobile Number**: `9876543210`
   - **Password**: `sai123`
   - **Delivery Address**: `Shop No. 3, Station Road, Near Shivaji Chowk, Ghatkopar East`
4. Under **"Select Your Mandi Wholesaler"**, pick:
   - `Shree Balaji Grain Traders (Ramesh Patel)`
5. Click **"Submit Store Registration"**.
6. A confirmation screen appears: *"Waiting for Wholesaler Activation"*. Once Ramesh approves you from his dashboard, you can log in.

---

### Step 2: Checking Approved Credit
1. Go to **`/login`**, enter mobile `9876543210` and password `sai123`.
2. You will be redirected to the **Kirana Store Portal**.
3. At the top of your screen, your credit health is visible:
   - **Ordering From**: *Shree Balaji Grain Traders*
   - **Available Credit**: `₹50,000`
   - **Wholesaler Udhaar**: `₹0`

---

### Step 3: Ordering via The Mandi Matrix
1. Click the **"Mandi Order"** tab.
2. Browse by category chips at the top:
   - *Rice (Chawal)*, *Atta, Maida & Suji*, *Edible Oils & Ghee*, *Pulses & Dal*, *Sugar & Jaggery*.
3. Or search directly in the search bar: `"Basmati"` or `"Atta"`.
4. Click on **Basmati Rice (1121 Extra Long)**:
   - You will see the brand card: *Royal Crown Marka (25kg Bag)*.
   - Price: `₹2,600 / bag` (Equivalent to ₹104.0/kg).
   - Tap the green **`+`** button until the counter shows `10`.
5. Repeat for **Wheat Atta (MP Sharbati)**:
   - Brand: *Shree Chakki Fresh (50kg Bag)*.
   - Price: `₹1,680 / bag`.
   - Tap the green **`+`** button until the counter shows `10`.
6. Tap the green **Cart Bar** at the bottom right:
   - **Summary**: 20 Bags • 750 kg • Total: `₹42,800`.
   - **Payment Mode**: Select **"Wholesaler Credit (Udhaar)"** (Available: ₹50,000).
   - *(Note: You can also choose COD or UPI).*
7. Tap **"Confirm & Place Order"**.
8. Order placed instantly! Your available credit updates to `₹7,200` (`₹50,000 - ₹42,800`).

---

### Step 4: 1-Click Repeat Reordering
Next week, when your shop runs out of staples again:
1. Open the Kirana App &rarr; Click **"1-Click Repeat"** tab.
2. You will see your past order (`ORD-84920` - 10 bags Basmati + 10 bags Atta).
3. Click **"Reorder This Cart (20 Bags)"**.
4. The cart loads immediately with current morning Mandi prices. Confirm in 1 tap!

---

### Step 5: Live Order & Tempo Tracking
1. Click the **"Live Orders"** tab.
2. Watch real-time status updates:
   - `NEW` &rarr; Order received by godown.
   - `PACKED` &rarr; Goods packed and weighed.
   - `OUT FOR DELIVERY` &rarr; Driver details appear:
     - 🚚 **Vehicle**: `MH-04-AB-1234` (Tempo)
     - 👤 **Driver**: `Raju Shinde`
   - `DELIVERED` &rarr; Order completed!

---

### Step 6: Settling Udhaar in Bahi-Khata
1. Click the **"Bahi-Khata"** tab.
2. View your digital ledger passbook:
   - Date: `Today` | Type: `DEBIT` | Ref: `ORD-84920` | Amount: `-₹42,800` | Balance: `₹42,800`
3. When you make a bank transfer, UPI payment, or give cash to the driver:
   - Click the yellow **"Settle / Pay Udhaar Balance"** button.
   - Enter Amount: `20000`
   - Enter Reference (optional): `GPay Ref 402910`
   - Click **"Record Payment"**.
4. Passbook updates instantly:
   - Type: `CREDIT` | Amount: `+₹20,000`
   - **New Outstanding**: `₹22,800`
   - **Restored Credit Limit**: `₹27,200` available to order new bags!

---

## 5. Frequently Asked Questions (FAQ)

#### Q1: Can a Kirana store connect to more than one wholesaler?
**Yes.** Kirana stores can buy rice from one dealer, oil from another, and sugar from a third. In the Kirana portal, use the **"Ordering From Mandi Wholesaler"** dropdown to toggle between approved stockists. Each wholesaler maintains their own separate credit balance and ledger.

#### Q2: What happens if an order exceeds the Kirana's available credit?
If a retailer has ₹10,000 available credit and attempts to place an order for ₹15,000 on `CREDIT`, the server transaction blocks the order with an alert: *"Order total exceeds available credit"*. The retailer can either pay down past udhaar or select **COD (Cash on Delivery)**.

#### Q3: Does godown inventory update automatically?
**Yes.** When a Kirana order is confirmed, stock counts (`currentStock`) for those specific SKUs decrement in real time. If a product reaches 0 bags, it is marked as *"Sold Out"* on Kirana screens, preventing overselling.

#### Q4: How do wholesalers add new commodities not in the catalog?
Click **"+ Add Stock"** &rarr; click **"+ Add New Commodity / SKU"**. Enter the category name, grain variety, brand, and bag size. It will be created on the fly and immediately made available to all connected Kiranas.

#### Q5: Can the app be installed on a mobile phone?
**Yes.** MandiConnect is a full Progressive Web App (PWA). Open your deployed Vercel URL on mobile Chrome or Safari and tap **"Add to Home Screen"** to use it like a native Android or iOS app with an offline icon on your home screen.
