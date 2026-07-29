# Project Mugni - Quick Start Guide 🚀

## 🎯 Apa Yang Baru?

Aplikasi Anda sudah **sepenuhnya di-upgrade** dengan:
- ✅ Dynamic settings & budget management
- ✅ Professional dashboard yang interconnected
- ✅ Enhanced reports & analytics
- ✅ Better transaction management
- ✅ Improved debts & savings tracking
- ✅ Fully responsive mobile & desktop

---

## 📱 How to Use (Step-by-Step)

### STEP 1: Akses Settings (Konfigurasi Awal)

**URL**: `/dashboard/settings`

**Tab 1 - General Settings**
```
✓ Set Currency (IDR, USD, EUR, etc.)
✓ Select Language (Indonesian, English)
✓ Book Month Start Day (usually 1)
✓ Number Format Decimal Places
✓ Theme (Light/Dark/Auto)
✓ Budget Alert Threshold (%)
```

**Tab 2 - Categories** 
```
✓ Click "Add Category"
✓ Input Category Name (e.g., "Food", "Transport")
✓ Select Type (Expense or Income)
✓ Pick Color untuk visual organization
✓ Optional: Add Description
✓ Save - Categories automatically available everywhere!
```

**Tab 3 - Budgets**
```
✓ Click "Add Budget"
✓ Select Category dari dropdown
✓ Input Monthly Limit Amount
✓ Set Status (Active/Archived)
✓ Save - Budget immediately tracked on Dashboard!
```

### STEP 2: Dashboard (Daily Overview)

**URL**: `/dashboard`

Anda akan lihat:
```
┌─────────────────────────────────────┐
│  📊 FINANCIAL OVERVIEW              │
│                                     │
│  Income: Rp 10,000,000  [GREEN]    │
│  Expense: Rp 7,500,000  [RED]      │
│  Net Cashflow: Rp 2,500,000        │
│  Total Balance: Rp 50,000,000      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ CATEGORY BREAKDOWN           │  │
│  │ Food:      ████░░ 45%        │  │
│  │ Transport: ███░░░ 30%        │  │
│  │ Bills:     ██░░░░ 25%        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ⚠️ ALERTS:                         │
│  - Food budget 95% used             │
│  - 1 overdue debt                   │
│  - 2 active savings goals           │
└─────────────────────────────────────┘
```

**Quick Actions**
- Add Transaction (kanan atas)
- View All Transactions
- Open Reports
- Go to Settings

### STEP 3: Add Transactions (Daily Entry)

**URL**: `/dashboard/add`

```
Form Fields:
✓ Date: Pick day
✓ Category: Select dari categories Anda
✓ Type: Income / Expense
✓ Amount: Rp amount
✓ Description: What & why (optional)
✓ Member: Who made the transaction
✓ Save!
```

**Result**: Instantly reflected sa Dashboard, budget tracking, reports!

### STEP 4: View Transactions (Detailed Table)

**URL**: `/dashboard/transactions`

**Features Available:**
```
🔍 FILTERS:
  - Date Range selector
  - Income / Expense / All toggle
  - Category multi-select
  - Member filter
  - Search box (description, category)
  
📊 SUMMARY CARDS:
  - Total Transactions count
  - Total Income
  - Total Expense  
  - Net Cashflow
  
✏️ ACTIONS:
  - Edit individual transaction
  - Delete with confirmation
  - Bulk select & delete multiple
  - Export to CSV (coming soon)
```

### STEP 5: View Reports (Analytics)

**URL**: `/dashboard/reports`

**Available Reports:**
1. **Monthly Trend** - Area chart showing income vs expense over time
2. **Category Breakdown** - Bar chart of spending by category
3. **Budget Performance** - Table comparing actual vs budget
4. **Summary** - Key statistics at a glance

**How to Use:**
```
1. Pick Date Range (top left)
2. Select Transaction Types (All/Income/Expense)
3. Filter by Categories (optional)
4. View charts & data
5. Export to Excel (button top right)
```

### STEP 6: Manage Debts/Receivables

**URL**: `/dashboard/debts`

**For Debts (Money You Owe):**
```
1. Click "Add Debt"
2. Person Name: Who you owe
3. Amount: How much
4. Due Date: When due
5. Save!

Then: Track payments via "Record Payment" button
Alert: Overdue debts highlighted in RED
```

**For Receivables (Money Others Owe You):**
```
1. Switch to "Receivables" tab
2. Same process as Debts
3. Track received payments
```

### STEP 7: Manage Savings Goals

**URL**: `/dashboard/savings`

**Setup Goals:**
```
1. Click "Add Goal"
2. Goal Name: "Vacation", "Car", "Emergency Fund"
3. Target Amount: Rp target
4. Target Date: When you want it by
5. Save!
```

**Track Progress:**
```
- Contribution history visible
- Progress bar shows % completed
- Alerts for goals reaching deadline
- Badge when goal completed!
```

**Add Contributions:**
```
1. Click "Add" button on goal
2. Amount: How much you're saving
3. Date: When
4. Save!
```

---

## 📊 Understanding the Dashboard

### KPI Cards (Top Section)
```
INCOME          EXPENSES       NET CASHFLOW    BALANCE
✓ This month    ✓ This month   ✓ Surplus/Deficit  ✓ Running total
  Rp 10M          Rp 7.5M        Rp 2.5M            Rp 50M
  ↑ Growth vs     ↑ +5% vs       ✓ Looking good     ↑ Runway
    last month      last month                        indicator
```

### Budget Overview
```
Shows TOP 4 categories with progress bars:
- Green: On track (< 80%)
- Yellow: Warning (80-100%)
- Red: Over budget (> 100%)
```

### Category Pie Chart
```
Visual breakdown of where money goes
Click for details or go to Reports for deeper analysis
```

### Recent Transactions
```
Last 5 transactions listed for quick reference
Click to view all transactions
```

---

## ⚙️ Advanced Features

### Budget Alerts
- Green (✓ Good): Using 0-80% of budget
- Yellow (⚠️ Warning): Using 80-100% of budget
- Red (🔴 Alert): Using > 100% of budget

**Alert Threshold**: Customizable in Settings → General

### Overdue Indicators
- **Red Badge**: Overdue by N days
- **Orange Badge**: Due in N days (upcoming)

### Status Indicators
- ✓ Active: In progress
- 📋 Completed: Goal/debt/receivable done
- ⏳ Archived: Hidden from active view

---

## 🔄 Data Flow (How Everything Connects)

```
You Add Transaction
        ↓
Firebase stores it
        ↓
Zustand store updates
        ↓
Dashboard refreshes instantly
    ├─ Budget tracking updates
    ├─ Category breakdown recalculates
    ├─ Alerts generated if needed
    └─ Recent transactions list updates
        ↓
All linked pages see changes:
    ├─ Reports updated
    ├─ Transactions table refreshed
    ├─ Debts/Savings status changes
    └─ Everything SYNCHRONIZED!
```

---

## 💡 Pro Tips

### 1. Use Consistent Categories
```
✓ DO: "Food", "Transport", "Entertainment"
✗ AVOID: "Food", "Makan", "Grocery" (mixing)
```

### 2. Set Realistic Budgets
```
✓ Month 1: Observe actual spending
✓ Month 2: Set budget slightly higher than actual
✓ Month 3+: Optimize based on trends
```

### 3. Regular Money Review
```
Weekly:  Check dashboard for overbudget alerts
Monthly: Review reports for patterns
Quarterly: Adjust budgets & goals
```

### 4. Use Descriptions
```
Transaction description helps with:
- Recall later (what was it for?)
- Searching transactions
- Budget analysis
```

### 5. Different Budget Categories
```
Example Setup:
- Food: Rp 2,000,000 (groceries, eating out)
- Transport: Rp 1,500,000 (fuel, public transport)
- Bills: Rp 3,000,000 (utilities, subscriptions)
- Entertainment: Rp 500,000 (movies, hobbies)
- Emergency: Budget allowance for unexpected
```

---

## 🐛 Troubleshooting

### Problem: Budget not updating
**Solution**: Refresh page (F5) or go to another page & return

### Problem: Data not showing on dashboard
**Solution**: Check if date range includes your transactions (Settings → Book Month)

### Problem: Categories not appearing in filter
**Solution**: Go to Settings → Categories to verify categories exist

### Problem: Mobile view looks weird
**Solution**: Clear browser cache or try different mobile browser

### Problem: Can't add transaction
**Solution**: 
1. Make sure categories exist first (Settings → Categories)
2. Check internet connection
3. Check browser console for errors (F12)

---

## 📞 Common Questions

**Q: Can I edit a transaction?**
A: Yes! Go to Transactions page, click edit icon, modify, save

**Q: Can I delete a transaction?**
A: Yes! Click delete icon with confirmation

**Q: Can I export my data?**
A: Yes! Reports page → Export to Excel button

**Q: Can I import data?**
A: Coming soon! (Currently in TODOs)

**Q: Will my data sync to mobile?**
A: Yes! Any Firebase-connected device sees same data

**Q: Can I access offline?**
A: Currently: Limited (Firestore required for most features)

**Q: How do I back up my data?**
A: Export to Excel via Reports page

---

## 🚀 Getting More Advanced

### Using Filters Effectively
```
Example: "Show my fast food expenses last month"
1. Go to Transactions
2. Set Date Range: Last month
3. Select Category: Food
4. Type in Search: "fast food"
5. Analyze the list
```

### Creating Custom Reports
```
1. Go to Reports
2. Set custom date range
3. Filter by specific categories
4. View only what matters to you
5. Export for deeper analysis
```

### Setting Savings Goals
```
Smart Goal Setup:
- "Emergency Fund" - Rp 10M (3 months expenses)
- "Vacation" - Rp 5M (6 months from now)
- "New Equipment" - Rp 3M (3 months)
```

---

## 📋 Monthly Routine (Suggested)

**Start of Month:**
1. Review previous month in Reports
2. Adjust budgets if needed
3. Set savings goals if applicable
4. Review debts/receivables status

**During Month:**
1. Add transactions daily (takes 1 min)
2. Check Dashboard weekly (spot problems early)
3. Note unusual spending for later analysis

**End of Month:**
1. Export Reports data
2. Analyze spending patterns
3. Settle overdue debts
4. Add savings contributions
5. Plan next month budgets

---

## ✨ Features Available vs Coming Soon

### ✅ Available Now
- Dynamic categories & budgets
- Advanced filtering on all pages
- Professional dashboard
- Reports with charts
- Debts & receivables tracking
- Savings goals management
- Export to Excel
- Mobile-responsive design

### 🔄 Coming Soon
- Import data functionality
- Keyboard shortcuts
- More chart types
- Custom report builder

### 🚀 Phase 2 (Advanced)
- Bank account integration
- Transaction reconciliation
- Predictive trends
- Anomaly detection

---

## 🎓 Learning Resources

**Want to understand the technical side?**
Read these files in project root:
1. `REFACTORING_GUIDE.md` - Complete technical overview
2. `IMPLEMENTATION_SUMMARY.md` - What was built & why

**Want to add features?**
Check `src/` folder for code patterns and examples

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Check REFACTORING_GUIDE.md
3. Look for TODO comments in relevant component files
4. Check browser console (F12) for error messages

---

## 🎉 You're All Set!

Your application is now **professional-grade, scalable, and ready for production use**! 

Start with Settings to configure everything, then begin tracking your finances with confidence! 💪

Happy tracking! 📊✨

---

**Version**: 2.0.0
**Last Updated**: May 19, 2026
**Status**: Production Ready ✅
