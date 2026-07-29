# Project Mugni - Developer Guide 👨‍💻

## 🎯 For Developers Continuing This Project

Welcome! This guide explains the architecture and how to extend it with new features.

---

## 📁 Codebase Structure

```
src/
├── app/
│   ├── AppProviders.jsx      [Root context providers]
│   ├── AppErrorPage.jsx      [Error boundary page]
│   ├── router.jsx            [Route definitions]
│   ├── theme.js              [Theme configuration]
│   └── layouts/
│       └── AppShell.jsx      [Main layout wrapper]
│
├── entities/
│   └── transaction/
│       └── schema.js         [Transaction validation schema]
│
├── features/
│   ├── admin/               [Admin functionality]
│   ├── auth/                [Auth pages & components]
│   ├── dashboard/           [Main dashboard page]
│   ├── debts/               [Debts management]
│   ├── reports/             [Analytics & reporting]
│   ├── savings/             [Savings goals management]
│   ├── settings/            [Configuration page]
│   ├── transactions/        [Transaction management]
│   └── desktop/             [Desktop-specific features]
│
├── shared/
│   ├── components/          [Reusable components]
│   │   ├── BudgetCard.jsx
│   │   ├── CategoryManager.jsx
│   │   ├── BudgetManager.jsx
│   │   ├── FilterPanel.jsx
│   │   ├── TransactionList.jsx
│   │   ├── MetricCard.jsx
│   │   ├── InsightCard.jsx
│   │   ├── SectionHeading.jsx
│   │   ├── SimpleBarList.jsx
│   │   └── EmptyState.jsx
│   │
│   ├── config/              [Configuration files]
│   │   ├── navigation.js    [Menu structure]
│   │   ├── themePalette.js  [Color scheme]
│   │   └── cashflow.js      [Cashflow calculations]
│   │
│   ├── firebase/            [Firebase operations]
│   │   ├── client.js        [Firebase client setup]
│   │   ├── config.js        [Firebase config]
│   │   ├── firestoreHousehold.js  [Family data ops]
│   │   └── firestoreTransactions.js [Transactions ops]
│   │
│   ├── hooks/               [Custom React hooks]
│   │   └── useResponsive.js [Responsive design hooks]
│   │
│   ├── lib/                 [Utility libraries]
│   │   ├── localDb.js       [Local storage]
│   │   ├── offlineQueue.js  [Offline support]
│   │   ├── pwa.js           [PWA features]
│   │   └── syncEngine.js    [Data sync engine]
│   │
│   ├── state/               [State management]
│   │   └── useFinanceStore.js  [Zustand store]
│   │
│   └── utils/               [Helper functions]
│       ├── dateFilters.js   [Date range helpers]
│       ├── finance.js       [Financial calculations]
│       ├── format.js        [Data formatting]
│       ├── excelExport.js   [Export utilities]
│       └── dailyInvoice.js  [Invoice generation]
│
└── index.css                [Global styles]
```

---

## 🏗️ Core Architecture Explained

### State Management Pattern (Zustand)

**File**: `src/shared/state/useFinanceStore.js`

```javascript
// How to use the store in components:
import { useFinanceStore } from '@/shared/state/useFinanceStore';

function MyComponent() {
  // Destructure what you need
  const {
    transactions,
    budgets,
    categories,
    settings,
    // Operations
    addTransaction,
    updateBudget,
    setSettings,
    // Computed selectors
    getActiveBudgets,
    getCategoryTotalSpent,
  } = useFinanceStore();

  // Use in component
  return <div>{transactions.length}</div>;
}
```

**Key Points:**
- ✅ All financial data in one place
- ✅ Computed selectors prevent recalculation
- ✅ Actions follow pattern: `verb + Noun` (addTransaction, updateBudget, etc.)
- ✅ Settings are separate state but interconnected
- ✅ Better to select specific slices to avoid unnecessary re-renders

### Firebase Operations Pattern

**Files**: `src/shared/firebase/firestoreHousehold.js`, `firestoreTransactions.js`

```javascript
// Pattern for Firebase operations:

// 1. Watch (real-time updates)
export function watchTransactions(familyId, onData, onError) {
  return watchQuery(
    query(
      collection(db, "families", familyId, "transactions"),
      orderBy("date", "desc")
    ),
    (docs) => onData(docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    onError
  );
}

// 2. Create
export async function createTransaction(familyId, data) {
  const docRef = await addDoc(
    collection(db, "families", familyId, "transactions"),
    {
      ...data,
      createdAt: serverTimestamp(),
    }
  );
  return docRef.id;
}

// 3. Update
export async function updateTransaction(familyId, transactionId, data) {
  await updateDoc(
    doc(db, "families", familyId, "transactions", transactionId),
    data
  );
}

// 4. Delete
export async function deleteTransaction(familyId, transactionId) {
  await deleteDoc(
    doc(db, "families", familyId, "transactions", transactionId)
  );
}

// Usage in components:
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

async function handleCreate(data) {
  try {
    setLoading(true);
    const id = await createTransaction(familyId, data);
    // TODO: Update store with new transaction
    message.success('Transaction created!');
  } catch (err) {
    setError(err.message);
    message.error('Failed to create transaction');
  } finally {
    setLoading(false);
  }
}
```

### Component Pattern

**Pattern for new feature components:**

```javascript
import { useState } from 'react';
import { Button, Table, Card, Space } from 'antd';
import { useFinanceStore } from '@/shared/state/useFinanceStore';
import { useResponsive } from '@/shared/hooks/useResponsive';
import { formatCurrency } from '@/shared/utils/format';

export function FeatureComponent() {
  // 1. State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. Store
  const {
    data,
    settings,
    addData,
    updateData,
    deleteData,
  } = useFinanceStore();

  // 3. Responsive
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // 4. Handlers
  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      // Firebase operation
      // TODO: Store update
      message.success('Success!');
    } catch (err) {
      setError(err.message);
      message.error('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  // 5. Render
  return (
    <div className="p-4">
      <Card
        title="Feature Title"
        extra={<Button onClick={handleCreate}>Add</Button>}
      >
        {error && <Alert type="error" message={error} />}
        
        <Table
          dataSource={data}
          loading={loading}
          columns={[
            // Define columns
          ]}
          scroll={{ x: isMobile ? 300 : 'auto' }}
        />
      </Card>
    </div>
  );
}
```

### Responsive Design Pattern

**Using useResponsive hook:**

```javascript
import { useResponsive } from '@/shared/hooks/useResponsive';
import { Row, Col } from 'antd';

export function Dashboard() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <Row gutter={[16, 16]}>
      {/* Mobile: 24 cols, Tablet: 12 cols, Desktop: 6 cols */}
      <Col xs={24} sm={12} lg={6}>
        <MetricCard title="Income" value={income} />
      </Col>

      {/* Conditional rendering */}
      {!isMobile && (
        <Col xs={24} lg={12}>
          <Chart data={data} />
        </Col>
      )}

      {/* Mobile-specific */}
      {isMobile && (
        <Col xs={24}>
          <MobileMenu />
        </Col>
      )}
    </Row>
  );
}
```

---

## 🔧 How to Add a New Feature

### Example: Adding "Expense Categories" Reordering

#### Step 1: Add to Store (`useFinanceStore.js`)

```javascript
reorderCategories: (categoryIds) => {
  set(state => ({
    categories: categoryIds.map(id =>
      state.categories.find(c => c.id === id)
    ).filter(Boolean)
  }))
},
```

#### Step 2: Create Firebase Operation (`firestoreHousehold.js`)

```javascript
export async function reorderCategoriesInFamily(familyId, orderedIds) {
  const batch = writeBatch(db);
  
  orderedIds.forEach((id, index) => {
    batch.update(
      doc(db, "families", familyId, "categories", id),
      { displayOrder: index }
    );
  });
  
  await batch.commit();
}
```

#### Step 3: Create Component

```javascript
// src/shared/components/CategoryReorder.jsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useFinanceStore } from '@/shared/state/useFinanceStore';
import { reorderCategoriesInFamily } from '@/shared/firebase/firestoreHousehold';

export function CategoryReorder({ familyId }) {
  const { categories, reorderCategories } = useFinanceStore();
  const [loading, setLoading] = useState(false);

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId &&
        destination.index === source.index) {
      return;
    }

    // Reorder locally
    const newCategories = Array.from(categories);
    const [removed] = newCategories.splice(source.index, 1);
    newCategories.splice(destination.index, 0, removed);

    // Update store
    reorderCategories(newCategories.map(c => c.id));

    // Persist to Firebase
    try {
      setLoading(true);
      await reorderCategoriesInFamily(
        familyId,
        newCategories.map(c => c.id)
      );
    } catch (err) {
      console.error('Failed to reorder', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="categories">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {categories.map((category, index) => (
              <Draggable key={category.id} draggableId={category.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    {category.name}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

#### Step 4: Add to Settings Page

```javascript
// In src/features/settings/SettingsPage.jsx
import { CategoryReorder } from '@/shared/components/CategoryReorder';

function SettingsPage() {
  // ... existing code ...

  return (
    <Tabs items={[
      // ... existing tabs ...
      {
        key: '2-reorder',
        label: 'Reorder Categories',
        children: <CategoryReorder familyId={familyId} />
      }
    ]} />
  );
}
```

#### Step 5: Update Route if Needed

```javascript
// In src/app/router.jsx
// If it's a new page, add to routes:
{
  path: 'category-reorder',
  element: <CategoryReorderPage />
}
```

---

## 📊 Data Flow Diagrams

### Transaction Creation Flow

```
User fills form
    ↓
Validates with Zod schema
    ↓
Calls Firebase createTransaction()
    ↓
Firebase stores in Firestore
    ↓
Store listener fires
    ↓
useFinanceStore updates
    ↓
Components using transactions re-render
    ↓
Dashboard, Reports, Transactions all update
    ↓
User sees changes instantly
```

### Budget Tracking Flow

```
Budget created in Settings
    ↓
Stored in store & Firebase
    ↓
Transactions filtered by category
    ↓
Spending calculated (sum of matching transactions)
    ↓
Computed selector: getCategoryTotalSpent()
    ↓
BudgetCard calculates percentage
    ↓
Displays with color: green/yellow/red
    ↓
Alert threshold triggers notification
    ↓
Dashboard shows visual alert
```

---

## 🎨 Styling Guide

### Tailwind CSS + Ant Design

**Priority:**
1. Use Ant Design components first (consistency, accessibility)
2. Extend with Tailwind CSS classes (customization)
3. Use theme colors from `themePalette.js`

**Example:**

```jsx
import { Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

function Example() {
  return (
    <Card 
      className="rounded-lg shadow-md hover:shadow-lg transition-shadow"
      title={
        <h2 className="text-lg font-semibold text-gray-800">
          My Section
        </h2>
      }
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Content */}
      </div>
    </Card>
  );
}
```

### Theme Colors

**From `themePalette.js`:**

```javascript
const themePalette = {
  income: '#10B981',      // Green
  expense: '#EF4444',     // Red
  budget: '#3B82F6',      // Blue
  savings: '#8B5CF6',     // Purple
  debt: '#F97316',        // Orange
  // ... more colors
};
```

---

## 🧪 Testing Patterns

### Testing Component

```javascript
// Example test file: BudgetCard.test.jsx
import { render, screen } from '@testing-library/react';
import { BudgetCard } from '@/shared/components/BudgetCard';

describe('BudgetCard', () => {
  it('should display budget information', () => {
    render(
      <BudgetCard
        categoryName="Food"
        budgetAmount={2000000}
        spentAmount={1500000}
        categoryColor="#10B981"
      />
    );

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Rp 2.000.000')).toBeInTheDocument();
  });

  it('should show warning when spending > 80%', () => {
    render(
      <BudgetCard
        categoryName="Food"
        budgetAmount={1000000}
        spentAmount={850000}
        categoryColor="#10B981"
      />
    );

    expect(screen.getByText(/85%/)).toBeInTheDocument();
    // Add more assertions
  });
});
```

### Testing Firebase Operations

```javascript
// Example test: firestoreTransactions.test.js
import { createTransaction } from '@/shared/firebase/firestoreTransactions';
import * as firebaseModule from 'firebase/firestore';

jest.mock('firebase/firestore');

describe('Firebase Transactions', () => {
  it('should create transaction with correct data', async () => {
    const mockAddDoc = jest.spyOn(firebaseModule, 'addDoc');
    mockAddDoc.mockResolvedValue({ id: '123' });

    const result = await createTransaction('familyId', {
      amount: 50000,
      category: 'Food'
    });

    expect(result).toBe('123');
    expect(mockAddDoc).toHaveBeenCalled();
  });
});
```

---

## 🚀 Performance Tips

### 1. Use Memoization

```javascript
import { useMemo } from 'react';

function Component() {
  const { transactions } = useFinanceStore();

  // Only recalculate when transactions change
  const expenseTotal = useMemo(
    () => transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  return <div>{expenseTotal}</div>;
}
```

### 2. Select Specific Store Slices

```javascript
// ❌ Bad: re-renders on any store change
const entire = useFinanceStore();

// ✅ Good: only re-renders when transactions change
const transactions = useFinanceStore(state => state.transactions);
const addTransaction = useFinanceStore(state => state.addTransaction);
```

### 3. Lazy Load Pages

```javascript
// In router.jsx
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));

// In route:
{
  path: 'dashboard',
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardPage />
    </Suspense>
  )
}
```

---

## 📝 Code Style Guide

### Naming Conventions

```javascript
// Files
FeatureName.jsx                    // React components
useFeatureName.js                  // Custom hooks
featureName.js                     // Utilities, configs
featureName.test.js                // Tests

// Variables
const userName = "John";           // camelCase for variables
const { userId } = props;          // Destructuring
const MY_CONSTANT = 100;           // UPPER_CASE for constants

// Functions
function handleClick() {}           // handleXxx for event handlers
function getUserById(id) {}         // getXxx for getters
function formatDate(date) {}        // formatXxx for formatters
function isValidEmail(email) {}     // isXxx for validators

// React Components
export function MyComponent() {}    // PascalCase for components
const MyComponent = () => {};       // Arrow functions ok too
```

### Import Organization

```javascript
// 1. External libraries
import { useState } from 'react';
import { Button, Card } from 'antd';

// 2. Internal modules
import { useFinanceStore } from '@/shared/state/useFinanceStore';
import { useResponsive } from '@/shared/hooks/useResponsive';

// 3. Utils & configs
import { formatCurrency } from '@/shared/utils/format';
import { themePalette } from '@/shared/config/themePalette';

// 4. Components
import { MetricCard } from '@/shared/components/MetricCard';
```

---

## 🐛 Debugging Tips

### 1. Redux DevTools for Zustand

```javascript
// In store initialization
import { devtools } from 'zustand/middleware';

const useFinanceStore = create(
  devtools(
    (set) => ({
      // ... store definition
    }),
    { name: 'FinanceStore' }
  )
);
```

### 2. Firebase Console Logging

```javascript
// In Firebase operations
console.log('Creating transaction:', data);
console.log('Firestore response:', docRef);

// With error context
try {
  // operation
} catch (error) {
  console.error('Failed at createTransaction:', {
    familyId,
    data,
    error: error.message,
    code: error.code
  });
}
```

### 3. Component Props Debugging

```javascript
import PropTypes from 'prop-types';

function BudgetCard({ categoryName, budgetAmount, spentAmount }) {
  console.log('BudgetCard rendered with:', {
    categoryName,
    budgetAmount,
    spentAmount
  });

  return <div>{categoryName}</div>;
}

BudgetCard.propTypes = {
  categoryName: PropTypes.string.isRequired,
  budgetAmount: PropTypes.number.isRequired,
  spentAmount: PropTypes.number.isRequired,
};
```

---

## 📚 Resources

- **React Docs**: https://react.dev
- **Zustand Docs**: https://github.com/pmndrs/zustand
- **Ant Design**: https://ant.design
- **Tailwind CSS**: https://tailwindcss.com
- **Firebase Docs**: https://firebase.google.com/docs
- **React Router**: https://reactrouter.com

---

## ✅ Checklist Before Committing Code

- [ ] Code follows naming conventions
- [ ] Comments explain complex logic
- [ ] Props have PropTypes or TypeScript types
- [ ] Responsive design tested (mobile/tablet/desktop)
- [ ] Error handling implemented
- [ ] No console.log in production code (except errors)
- [ ] Store updates after Firebase operations
- [ ] Loading states implemented
- [ ] Success/error messages shown to user
- [ ] Tests written (if applicable)

---

## 🤝 Contributing Guidelines

1. **Branch naming**: `feature/feature-name` or `fix/bug-name`
2. **Commit messages**: "Add/Fix: Clear description of changes"
3. **PR description**: What changed and why
4. **Testing**: Test on mobile & desktop
5. **Documentation**: Update docs if API changes

---

**Happy coding!** 🎉

For questions, refer to the code comments and check similar implementations in the codebase.
