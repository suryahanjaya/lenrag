# Quick Reference: Refactored Code Usage

## Utility Functions

### Formatting Utilities (`@/lib/utils/formatting`)

#### 1. formatAIResponse
Formats AI responses with better paragraph structure.

```typescript
import { formatAIResponse } from '@/lib/utils/formatting';

const formattedText = formatAIResponse(rawAIResponse);
```

#### 2. detectIncompleteResponse
Checks if an AI response appears incomplete.

```typescript
import { detectIncompleteResponse } from '@/lib/utils/formatting';

if (detectIncompleteResponse(response)) {
  // Show suggestions
}
```

#### 3. getQuestionSuggestions
Gets question suggestions for incomplete responses.

```typescript
import { getQuestionSuggestions } from '@/lib/utils/formatting';

const suggestions = getQuestionSuggestions(response);
// Returns: string[]
```

#### 4. formatDate
Formats dates in mobile-optimized Indonesian format.

```typescript
import { formatDate } from '@/lib/utils/formatting';

const formatted = formatDate('2025-12-09T15:48:52+07:00');
// Returns: "09/12/25, 15:48"
```

---

### File Helper Utilities (`@/lib/utils/fileHelpers`)

#### 1. getFileIcon
Maps MIME types to emoji icons.

```typescript
import { getFileIcon } from '@/lib/utils/fileHelpers';

const icon = getFileIcon('application/vnd.google-apps.document');
// Returns: "📄"
```

#### 2. getFileTypeName
Maps MIME types to human-readable names.

```typescript
import { getFileTypeName } from '@/lib/utils/fileHelpers';

const typeName = getFileTypeName('application/pdf');
// Returns: "PDF"
```

#### 3. formatFileSize
Formats file sizes to human-readable format.

```typescript
import { formatFileSize } from '@/lib/utils/fileHelpers';

const size = formatFileSize('1048576');
// Returns: "1.0 MB"
```

---

### Loading States Hook (`@/lib/hooks/useLoadingStates`)

#### Usage Example

```typescript
import { useLoadingStates } from '@/lib/hooks/useLoadingStates';

function MyComponent() {
  const {
    loadingStates,
    setLoading,
    setMultipleLoading,
    isDocumentsLoading,
    isChatLoading,
    isFolderLoading,
    isBulkUploading
  } = useLoadingStates();

  // Set single loading state
  const handleFetch = async () => {
    setLoading('documents', true);
    try {
      await fetchData();
    } finally {
      setLoading('documents', false);
    }
  };

  // Set multiple loading states
  const handleReset = () => {
    setMultipleLoading({
      documents: false,
      chat: false,
      folder: false,
      bulkUpload: false
    });
  };

  return (
    <div>
      {isDocumentsLoading && <Spinner />}
      {isChatLoading && <ChatSpinner />}
    </div>
  );
}
```

---

## Import Patterns

### All Formatting Utilities
```typescript
import {
  formatAIResponse,
  detectIncompleteResponse,
  getQuestionSuggestions,
  formatDate
} from '@/lib/utils/formatting';
```

### All File Helpers
```typescript
import {
  getFileIcon,
  getFileTypeName,
  formatFileSize
} from '@/lib/utils/fileHelpers';
```

### Loading States Hook
```typescript
import { useLoadingStates } from '@/lib/hooks/useLoadingStates';
```

---

## Type Definitions

### LoadingStates Interface
```typescript
interface LoadingStates {
  documents: boolean;
  chat: boolean;
  folder: boolean;
  bulkUpload: boolean;
}
```

---

## Common Use Cases

### 1. Formatting Chat Messages
```typescript
import { formatAIResponse, detectIncompleteResponse, getQuestionSuggestions } from '@/lib/utils/formatting';

const handleChatResponse = (response: string) => {
  const formatted = formatAIResponse(response);
  const isIncomplete = detectIncompleteResponse(formatted);
  
  if (isIncomplete) {
    const suggestions = getQuestionSuggestions(formatted);
    showSuggestions(suggestions);
  }
  
  return formatted;
};
```

### 2. Displaying File Information
```typescript
import { getFileIcon, getFileTypeName, formatFileSize } from '@/lib/utils/fileHelpers';

const FileCard = ({ file }) => (
  <div>
    <span>{getFileIcon(file.mimeType)}</span>
    <span>{file.name}</span>
    <span>{getFileTypeName(file.mimeType)}</span>
    <span>{formatFileSize(file.size)}</span>
  </div>
);
```

### 3. Managing Loading States
```typescript
import { useLoadingStates } from '@/lib/hooks/useLoadingStates';

const Dashboard = () => {
  const { isDocumentsLoading, isChatLoading, setLoading } = useLoadingStates();

  const fetchDocuments = async () => {
    setLoading('documents', true);
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } finally {
      setLoading('documents', false);
    }
  };

  return (
    <div>
      {isDocumentsLoading ? <Spinner /> : <DocumentList />}
      {isChatLoading ? <ChatSpinner /> : <ChatWindow />}
    </div>
  );
};
```

---

## Migration Guide

### From Old Code to New Code

#### Before (Old Way)
```typescript
// dashboard.tsx - duplicate functions in component
const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }) + ', ' + date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const [isLoading, setIsLoading] = useState(true);
const [isChatLoading, setIsChatLoading] = useState(false);
```

#### After (New Way)
```typescript
// dashboard.tsx - import utilities
import { formatDate } from '@/lib/utils/formatting';
import { useLoadingStates } from '@/lib/hooks/useLoadingStates';

const { isDocumentsLoading, isChatLoading, setLoading } = useLoadingStates();
```

---

## Testing Examples

### Unit Tests for Utilities

```typescript
import { formatFileSize, getFileTypeName } from '@/lib/utils/fileHelpers';

describe('fileHelpers', () => {
  test('formatFileSize formats bytes correctly', () => {
    expect(formatFileSize('1024')).toBe('1.0 KB');
    expect(formatFileSize('1048576')).toBe('1.0 MB');
  });

  test('getFileTypeName returns correct type', () => {
    expect(getFileTypeName('application/pdf')).toBe('PDF');
    expect(getFileTypeName('application/vnd.google-apps.document')).toBe('Google Doc');
  });
});
```

---

## Best Practices

### ✅ DO:
- Import only what you need
- Use TypeScript types for better IDE support
- Handle edge cases (null, undefined)
- Use the consolidated loading states hook

### ❌ DON'T:
- Copy utility functions to other files
- Create duplicate implementations
- Ignore TypeScript errors
- Use individual useState for loading states

---

## Troubleshooting

### Import Errors
If you see import errors:
1. Check the file path is correct
2. Ensure the file exists in `lib/utils/` or `lib/hooks/`
3. Restart TypeScript server in your IDE

### Type Errors
If you see type errors:
1. Check you're passing the correct parameter types
2. Import the type definitions if needed
3. Run `npx tsc --noEmit` to check for errors

### Runtime Errors
If functions don't work as expected:
1. Check the input values are valid
2. Handle null/undefined cases
3. Check browser console for errors

---

## Additional Resources

- **Full Documentation**: See `docs/REFACTORING_SUMMARY.md`
- **Next Steps**: See `docs/REFACTORING_NEXT_STEPS.md`
- **Progress**: See `docs/REFACTORING_PROGRESS.md`

---

**Last Updated**: 2025-12-09  
**Version**: 1.0.0
