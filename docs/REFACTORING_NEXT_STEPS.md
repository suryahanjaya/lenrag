# Next Steps: Complete Refactoring Guide

## Overview
This guide outlines the remaining refactoring tasks to complete the code optimization process.

---

## Phase 1: State Management Optimization (Recommended Next)

### Current State Issues
The dashboard currently has multiple separate useState hooks for loading states:

```typescript
const [isLoading, setIsLoading] = useState(true);
const [isChatLoading, setIsChatLoading] = useState(false);
const [isLoadingFolder, setIsLoadingFolder] = useState(false);
const [isBulkUploading, setIsBulkUploading] = useState(false);
```

### Solution: Use the New useLoadingStates Hook

#### Step 1: Import the Hook
```typescript
import { useLoadingStates } from '@/lib/hooks/useLoadingStates';
```

#### Step 2: Replace Individual States
```typescript
// Remove these lines:
// const [isLoading, setIsLoading] = useState(true);
// const [isChatLoading, setIsChatLoading] = useState(false);
// const [isLoadingFolder, setIsLoadingFolder] = useState(false);
// const [isBulkUploading, setIsBulkUploading] = useState(false);

// Add this instead:
const {
  isDocumentsLoading,
  isChatLoading,
  isFolderLoading,
  isBulkUploading,
  setLoading,
  setMultipleLoading
} = useLoadingStates();
```

#### Step 3: Update All References

Find and replace throughout the dashboard:
- `isLoading` → `isDocumentsLoading`
- `setIsLoading(true)` → `setLoading('documents', true)`
- `setIsLoading(false)` → `setLoading('documents', false)`
- `setIsChatLoading(true)` → `setLoading('chat', true)`
- `setIsChatLoading(false)` → `setLoading('chat', false)`
- `setIsLoadingFolder(true)` → `setLoading('folder', true)`
- `setIsLoadingFolder(false)` → `setLoading('folder', false)`
- `setIsBulkUploading(true)` → `setLoading('bulkUpload', true)`
- `setIsBulkUploading(false)` → `setLoading('bulkUpload', false)`

**Estimated Impact**: Reduces 4 useState hooks to 1, cleaner state management

---

## Phase 2: CSS Optimization (styles.css)

### Current Issues
- File size: 48,186 bytes (too large)
- Potential unused CSS classes
- Repeated gradient definitions
- Duplicate animation keyframes

### Recommended Actions

#### Step 1: Identify Unused CSS Classes
```bash
# Use a tool like PurgeCSS or manually scan
npx purgecss --css styles.css --content "app/**/*.tsx" "components/**/*.tsx"
```

#### Step 2: Consolidate Repeated Gradients
Look for patterns like:
```css
/* Before - Repeated */
.gradient-1 { background: linear-gradient(to right, #ff0000, #00ff00); }
.gradient-2 { background: linear-gradient(to right, #ff0000, #00ff00); }

/* After - Consolidated */
.gradient-red-green { background: linear-gradient(to right, #ff0000, #00ff00); }
```

#### Step 3: Remove Duplicate Animations
Check for duplicate `@keyframes` definitions and consolidate them.

#### Step 4: Extract Common Tailwind Patterns
Identify frequently repeated Tailwind class combinations and create CSS classes:

```css
/* Example: Repeated pattern */
/* Instead of: className="bg-gradient-to-br from-red-50/80 to-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-100/50" */

/* Create: */
.card-premium {
  @apply bg-gradient-to-br from-red-50/80 to-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-100/50;
}
```

**Estimated Impact**: Reduce file size by 20-30% (~10-15KB)

---

## Phase 3: Additional Utility Extractions

### A. API Functions
Create `/lib/api/documents.ts`:

```typescript
export const fetchDocuments = async (token: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Google-Token': token,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.status}`);
  }
  
  return response.json();
};

export const fetchKnowledgeBase = async (token: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/knowledge-base`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch knowledge base: ${response.status}`);
  }
  
  return response.json();
};

// Add more API functions...
```

**Estimated Impact**: Reduce dashboard.tsx by ~200-300 lines

### B. Constants
Create `/lib/constants/messages.ts`:

```typescript
export const ERROR_MESSAGES = {
  folder: 'DORA: Gagal memuat dokumen dari folder. Periksa URL folder dan coba lagi.',
  documents: 'DORA: Gagal memuat dokumen. Periksa koneksi internet dan coba lagi.',
  add: 'DORA: Gagal menambahkan dokumen. Periksa koneksi dan coba lagi.',
  remove: 'DORA: Gagal menghapus dokumen. Periksa koneksi dan coba lagi.',
  general: 'DORA: Terjadi kesalahan. Silakan coba lagi.'
} as const;

export const INCOMPLETE_INDICATORS = [
  'kurang lengkap',
  'tidak lengkap',
  'sebagian',
  'beberapa',
  'sebagian besar',
  'umumnya'
] as const;
```

**Estimated Impact**: Better organization, easier to maintain

---

## Phase 4: Component Extraction

### Identify Large Components to Split

#### A. Chat Window Component
Extract the chat UI into a separate component:
- `/components/dashboard/ChatWindow.tsx`
- Props: chatHistory, onSendMessage, isLoading, etc.

#### B. Document List Component
Extract document listing into:
- `/components/dashboard/DocumentList.tsx`
- Props: documents, onSelect, selectedDocs, etc.

#### C. Knowledge Base Panel
Extract knowledge base UI:
- `/components/dashboard/KnowledgeBasePanel.tsx`
- Props: knowledgeBase, onRemove, onClear, etc.

**Estimated Impact**: Reduce dashboard.tsx by ~500-800 lines

---

## Phase 5: Performance Optimizations

### A. Memoization
Add React.memo to frequently re-rendering components:

```typescript
const DocumentCard = React.memo(({ document, onSelect, isSelected }) => {
  // Component code
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.document.id === nextProps.document.id &&
         prevProps.isSelected === nextProps.isSelected;
});
```

### B. useCallback Optimization
Wrap event handlers in useCallback:

```typescript
const handleDocumentSelect = useCallback((docId: string) => {
  setSelectedDocs(prev => {
    const newSet = new Set(prev);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    return newSet;
  });
}, []);
```

### C. Lazy Loading
Implement lazy loading for heavy components:

```typescript
const ChatWindow = lazy(() => import('@/components/dashboard/ChatWindow'));

// In component:
<Suspense fallback={<LoadingSpinner />}>
  {showChatWindow && <ChatWindow {...props} />}
</Suspense>
```

---

## Implementation Priority

### High Priority (Do First)
1. ✅ Extract utility functions (COMPLETED)
2. 🔄 Implement useLoadingStates hook
3. 🔄 Extract API functions
4. 🔄 Extract constants

### Medium Priority (Do Next)
5. Extract large components (ChatWindow, DocumentList)
6. Optimize CSS (remove unused, consolidate)
7. Add memoization to frequently re-rendering components

### Low Priority (Nice to Have)
8. Implement lazy loading
9. Add more custom hooks
10. Further component splitting

---

## Testing Strategy

After each phase:
1. Run TypeScript compiler: `npm run build`
2. Check for runtime errors in dev mode
3. Test all user interactions
4. Verify no visual regressions
5. Check browser console for warnings

---

## Expected Final Results

### File Size Reductions
- `dashboard.tsx`: 2,144 lines → ~800-1,000 lines (53-62% reduction)
- `styles.css`: 48,186 bytes → ~35,000 bytes (27% reduction)

### New File Structure
```
lib/
├── api/
│   ├── documents.ts
│   └── knowledgeBase.ts
├── constants/
│   └── messages.ts
├── hooks/
│   ├── useLoadingStates.ts ✅
│   └── useDocumentSelection.ts
└── utils/
    ├── formatting.ts ✅
    └── fileHelpers.ts ✅

components/
└── dashboard/
    ├── dashboard.tsx (main component)
    ├── ChatWindow.tsx
    ├── DocumentList.tsx
    └── KnowledgeBasePanel.tsx
```

### Benefits
- ✅ Better code organization
- ✅ Easier to maintain
- ✅ Improved reusability
- ✅ Better performance
- ✅ Easier to test
- ✅ Reduced bundle size

---

## Conclusion

This refactoring will transform a monolithic 2,144-line component into a well-organized, maintainable codebase following React best practices. Each phase can be implemented incrementally without breaking existing functionality.

**Estimated Total Time**: 4-6 hours for all phases
**Risk Level**: Low (incremental changes, easy to rollback)
**Impact**: High (significantly improved code quality)
