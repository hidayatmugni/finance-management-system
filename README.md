# Finance Management System

Professional family finance management application with **dynamic settings, per-category budgeting, advanced analytics, and scalable architecture** built with React, Tailwind CSS, and Firebase.

## ✨ What's New (v2.0.0)

**COMPLETE REFACTORING & UPGRADE:**
- ✅ Dynamic category & budget management
- ✅ Per-category budget tracking with visual alerts
- ✅ Professional dashboard with interconnected data
- ✅ Advanced reporting & analytics
- ✅ Full responsive design (mobile/tablet/desktop)
- ✅ Reusable component library
- ✅ Production-ready code quality
- ✅ Comprehensive documentation

## 📚 Documentation

Start here for complete information:

1. **[QUICK_START.md](./QUICK_START.md)** 👈 **START HERE** - User guide for daily usage
2. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Executive summary of changes
3. **[REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md)** - Complete technical documentation
4. **[VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)** - Testing & deployment checklist

## 🎯 Key Features

### 💳 Financial Management
- **Dynamic Categories**: Create unlimited expense/income categories
- **Budget per Category**: Set monthly limits with visual tracking
- **Transaction Tracking**: Record with category, member, type
- **Real-time Sync**: All changes instantly reflected across app

### 📊 Analytics & Reporting
- **Multiple Reports**: Monthly trends, category breakdown, budget performance
- **Advanced Filtering**: By date, type, category, member, search
- **Professional Charts**: Area, bar, pie charts with Recharts
- **Export to Excel**: Download data for external analysis

### 💰 Debt & Savings Management
- **Debt Tracking**: Track money owed with due dates & overdue alerts
- **Receivables**: Track money others owe you
- **Savings Goals**: Set targets with progress tracking
- **Payment Recording**: Log payments with history

### 📱 Responsive Design
- **Mobile First**: Optimized for all screen sizes
- **Touch Friendly**: Proper spacing & interactions
- **Bottom Nav**: Mobile navigation, sidebar for desktop
- **Adaptive Layouts**: Responsive grid system

### ⚙️ Configuration
- **Settings Hub**: General, categories, budgets, notifications
- **Currency Support**: Multiple currencies
- **Theme Options**: Light, dark, auto modes
- **Customizable Alerts**: Set budget thresholds

## 🏗️ Architecture

### State Management
```
Zustand Store (Client State)
├── Core Data (transactions, budgets, categories)
├── Settings & Preferences (currency, theme, etc.)
├── UI State (filters, loading)
└── Computed Selectors (derived data)
         ↓
    Firebase Firestore (Server Source of Truth)
```

### Component Organization
```
src/
├── features/          [Feature pages]
├── shared/
│   ├── components/   [Reusable components]
│   ├── hooks/        [Custom hooks]
│   ├── state/        [Zustand store]
│   ├── firebase/     [Firebase operations]
│   └── utils/        [Utilities]
└── app/              [App configuration]
```

## 🚀 Quick Start

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Copy `.env.example` to `.env` and configure Firebase credentials.

### Configuration

**First Time Setup:**
1. Go to Settings (gear icon) → General
2. Configure currency, language, theme
3. Go to Settings → Categories
4. Create your expense/income categories
5. Go to Settings → Budgets
6. Set monthly limits per category
7. Go to Dashboard - you're ready!

## 📖 Usage Guide

### Daily Operations
1. **Add Transaction**: Dashboard → Add button
2. **Check Status**: Dashboard shows budget status, recent transactions
3. **View Reports**: Reports page with filtering & charts
4. **Manage Debts**: Debts page for tracking obligations

### Advanced Features
- **Bulk Operations**: Select multiple transactions & delete
- **Custom Filters**: Combine multiple filter criteria
- **Data Export**: Export reports to Excel
- **Multi-user**: Track by member/person

## 🔧 Technical Stack

### Frontend
- **React 18.3.1** + Vite
- **Tailwind CSS 3.4.15** + Ant Design 6.3.6
- **React Router 6.30.3** for routing
- **Zustand 5.0.1** for state management
- **Recharts 2.13.3** for visualizations
- **Dayjs 1.11.13** for date handling
- **Firebase 12.12.0** for backend

### Backend
- Firebase Authentication
- Firestore Database
- Firebase Cloud Functions (optional)

### Build & Deploy
- Vite for fast builds
- Vercel for hosting
- Service Workers for offline support

## 📱 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 Security

- Firebase Authentication for user management
- Firestore security rules enforce family-based access
- Client-side data validation
- Server-side rule enforcement

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Connect your repository to Vercel
# Environment variables are configured
# Deploy on push to main branch

npm run build
```

### Environment Variables

```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

## 📊 Project Status

**Version**: 2.0.0
**Status**: ✅ Production Ready
**Last Updated**: May 19, 2026

### Completed ✅
- [x] Dynamic settings & configuration
- [x] Per-category budget management
- [x] Professional dashboard
- [x] Advanced reporting
- [x] Responsive design (all screens)
- [x] Component library
- [x] Documentation

### Coming Soon 🔄
- [ ] Import/Export data functionality
- [ ] Keyboard shortcuts
- [ ] Advanced analytics (Phase 2)
- [ ] Bank integration (Phase 3)
- [ ] Multi-user collaboration (Phase 4)
- [ ] Mobile app (Phase 5)

## 🐛 Troubleshooting

**Data not updating?**
- Refresh page (F5)
- Check Firebase connection
- Check browser console for errors

**Categories not showing?**
- Go to Settings → Categories first
- Create categories before adding transactions

**Mobile layout looks wrong?**
- Clear browser cache
- Try different browser
- Check responsive breakpoints

## 📞 Support & Resources

- **Documentation**: See files in project root
- **QUICK_START.md**: User guide for daily usage
- **REFACTORING_GUIDE.md**: Technical deep dive
- **Code Comments**: Inline documentation in components

## 📝 Future Roadmap

### Phase 2: Advanced Analytics
- Predictive spending trends
- Anomaly detection
- Custom report builder
- Goal forecasting

### Phase 3: Bank Integration
- Bank account synchronization
- Transaction matching
- Reconciliation workflows
- Multi-account support

### Phase 4: Collaboration
- Multi-user expense splitting
- Shared budgets
- Permission management
- Activity timeline

### Phase 5: Mobile App
- React Native version
- Offline-first capabilities
- Push notifications
- Biometric authentication

## 🎓 For Developers

**Contributing:**
1. Read REFACTORING_GUIDE.md for architecture
2. Follow existing component patterns
3. Use custom hooks for responsive design
4. Check Zustand store for state management
5. Test on mobile & desktop

**Adding Features:**
1. Add to Zustand store if needed
2. Create Firebase operations if needed
3. Create component following existing patterns
4. Add route in router.jsx
5. Update navigation if needed

## 📄 License

[Your License Here]

## 👨‍💻 Credits

Built with ❤️ for personal & family finance management.

---

**Ready to get started?** 👉 Read [QUICK_START.md](./QUICK_START.md)

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
