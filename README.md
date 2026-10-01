# Admin Portal - Wallet Management UI

Modern, clean, and pixel-perfect Admin Dashboard interface focused on **Wallet Management** and the **Add Dp/Wd Wallet Channel** form for developer handover.

## 📁 Project Directory Structure
```
admin-portal/
├── index.html        # Main HTML structure with Header, Sidebar, and Tab Panes
├── style.css         # Complete vanilla CSS design system & responsive styling
├── app.js            # Submenu switching logic, dynamic tables, and form submission
└── README.md         # Documentation & Developer Handover Guide
```

## 🚀 How to Run
- **Directly**: Double-click `index.html` to open in any web browser (Chrome, Edge, Firefox, etc.).
- **Local Server**:
  ```bash
  python -m http.server 5173
  ```
  Then visit `http://localhost:5173/` in your browser.

## 🌟 Sidebar Structure (Wallet Management):
Under the single active menu **Wallet Management**, all 5 submenus are present and switch smoothly:
1. `Add Dp/Wd wallet Channel` (Active by default - Full custom form)
2. `Dp/Wd Wallet Number List` (Dynamic channel records table with delete action)
3. `Currency & Crypto Rates` (Exchange rates table)
4. `Deposit History` (Deposit logs table with Approve/Reject actions)
5. `Withdrawal History` (Withdrawal payout table with Disburse/Decline actions)

## 📝 Form Fields (Add Dp/Wd Wallet Channel):
1. **Channel Name** (`placeholder="e.g. bKash, Nagad, USDT (TRC20)"`)
2. **Payment Method Group** (optional hint: `leave blank unless this is one of several channels under one method`)
3. **Type** (Dropdown: `Manual (mobile wallet / bank)`, `Automated API Gateway`, `Crypto Web3 Deposit`)
4. **Wallet ID / Account Number / Address** (`placeholder="e.g. 01712345678 or TRC20 address"`)
5. **Account Holder Name** (`placeholder="Holder name"`)
6. **Icon Image URL** (optional hint: `shows initials badge if blank`)
7. **Currency** (Default value: `BDT`)
8. **QR Image URL** (`placeholder="https://..."`)
9. **Sort Order** (Default value: `0`)
10. **Min Amount** (Default value: `100`)
11. **Max Amount (Daily Limit)** (Default value: `50000`)
12. **Instructions shown to player** (Full-width optional textarea/input: `e.g. Send Money to this number, then enter the Transaction ID`)
13. Button: **`+ Add Channel`**
