# Manual Fix Steps for React Error #301

If the automatic fix doesn't work, follow these steps manually:

## Root Cause
React Error #301 occurs when hooks are called in different orders between renders. This happens when:
1. Components are conditionally rendered (mounted/unmounted)
2. Hooks are called conditionally
3. Early returns before all hooks are called

## Solution 1: Always Mount the Component (RECOMMENDED)

### Step 1: Update `src/app/vblog/page.tsx`

**Find this code (around line 145-155):**
```tsx
{/* Publish Article Wizard - Only render when needed to avoid hooks on page load */}
{showWizard && (
  <PublishArticleWizard
    isOpen={showWizard}
    onClose={() => setShowWizard(false)}
    onComplete={() => {
      loadArticles();
      setShowWizard(false);
    }}
  />
)}
```

**Replace with:**
```tsx
{/* Publish Article Wizard - Always render to maintain hook order, controlled by isOpen prop */}
<PublishArticleWizard
  isOpen={showWizard}
  onClose={() => setShowWizard(false)}
  onComplete={() => {
    loadArticles();
    setShowWizard(false);
  }}
/>
```

### Step 2: Update `src/components/vblog/PublishArticleWizard.tsx`

**Add mounted state after the hooks (around line 51):**
```tsx
const pricing = useVBlogPricing();

// Track mounted state for portal rendering
const [mounted, setMounted] = useState(false);
```

**Add useEffect to set mounted (after the categories useEffect, around line 111):**
```tsx
// Set mounted state on client side
useEffect(() => {
  setMounted(true);
}, []);
```

**Update the return statement (around line 360-370):**
```tsx
// CRITICAL: Component is ALWAYS mounted - never return null
// Always return the same structure to maintain hook order
// Hide with CSS when closed, use portal when open
if (typeof window === 'undefined' || !mounted) {
  return null; // SSR guard - component won't render on server anyway
}

// Don't render anything when closed - but component stays mounted
if (!isOpen) {
  return null;
}
```

## Solution 2: Use React.lazy with Suspense (ALTERNATIVE)

If Solution 1 doesn't work, try lazy loading:

### Step 1: Update `src/app/vblog/page.tsx`

**Add imports at the top:**
```tsx
import { Suspense, lazy } from 'react';
```

**Replace the import:**
```tsx
// Remove: import { PublishArticleWizard } from '@/components/vblog/PublishArticleWizard';

// Add:
const PublishArticleWizard = lazy(() => 
  import('@/components/vblog/PublishArticleWizard').then(mod => ({ 
    default: mod.PublishArticleWizard 
  }))
);
```

**Update the render:**
```tsx
{showWizard && (
  <Suspense fallback={null}>
    <PublishArticleWizard
      isOpen={showWizard}
      onClose={() => setShowWizard(false)}
      onComplete={() => {
        loadArticles();
        setShowWizard(false);
      }}
    />
  </Suspense>
)}
```

## Solution 3: Stabilize useVBlogPricing Hook

If hooks inside `useVBlogPricing` are causing issues:

### Update `src/hooks/useVBlogPricing.ts`

**Wrap async operations in setTimeout (around line 113):**
```tsx
useEffect(() => {
  if (typeof window === 'undefined') {
    return;
  }

  let isMounted = true;
  let timeoutId: NodeJS.Timeout | null = null;

  const loadPricing = async () => {
    try {
      if (!walletAddress) {
        if (isMounted) {
          setPricingInfo({
            createFee: 20,
            editFee: 5,
            isPremium: false,
            tier: {
              hasKREXDiscount: false,
              hasNFTPerks: false,
              nftCollections: [],
            },
          });
        }
        return;
      }

      // Use setTimeout to defer async operations
      timeoutId = setTimeout(async () => {
        try {
          const [krexBalance, nftHoldings] = await Promise.all([
            getKREXBalance(walletAddress).catch(() => 0),
            checkNFTHoldings(walletAddress).catch(() => [] as string[]),
          ]);

          if (!isMounted) return;
          
          const hasKREXDiscount = krexBalance >= KREX_DISCOUNT_THRESHOLD;
          const hasKREXPRIME = nftHoldings.includes(KREXPRIME_NFT_COLLECTION);
          const hasPIXELKREX = nftHoldings.includes(PIXELKREX_NFT_COLLECTION);
          const hasNFTPerks = hasKREXPRIME || hasPIXELKREX;

          if (isMounted) {
            setPricingInfo({
              createFee: hasKREXDiscount ? 5 : 20,
              editFee: hasKREXDiscount ? 1 : 5,
              isPremium: hasNFTPerks,
              tier: {
                hasKREXDiscount,
                hasNFTPerks,
                nftCollections: nftHoldings,
              },
            });
          }
        } catch (error) {
          if (isMounted) {
            console.error('Error loading pricing info:', error);
            setPricingInfo({
              createFee: 20,
              editFee: 5,
              isPremium: false,
              tier: {
                hasKREXDiscount: false,
                hasNFTPerks: false,
                nftCollections: [],
              },
            });
          }
        }
      }, 0);
    } catch (error) {
      if (isMounted) {
        setPricingInfo({
          createFee: 20,
          editFee: 5,
          isPremium: false,
          tier: {
            hasKREXDiscount: false,
            hasNFTPerks: false,
            nftCollections: [],
          },
        });
      }
    }
  };

  loadPricing();

  return () => {
    isMounted = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}, [walletAddress, isWalletConnected]);
```

## Solution 4: Add Error Boundary (SAFETY NET)

Create `src/components/vblog/ErrorBoundary.tsx`:

```tsx
'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-red-700 dark:text-red-300">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap the wizard in `src/app/vblog/page.tsx`:**
```tsx
import { ErrorBoundary } from '@/components/vblog/ErrorBoundary';

// In render:
<ErrorBoundary>
  <PublishArticleWizard
    isOpen={showWizard}
    onClose={() => setShowWizard(false)}
    onComplete={() => {
      loadArticles();
      setShowWizard(false);
    }}
  />
</ErrorBoundary>
```

## Testing

After applying fixes:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Open browser console (F12)
4. Try opening the modal
5. Check for React error #301 - it should be gone

## If Still Not Working

1. Check browser console for exact error message
2. Verify all hooks are called unconditionally (no early returns before hooks)
3. Ensure component structure is consistent between renders
4. Check if `useVBlog` or `useVBlogPricing` hooks have conditional logic
5. Try removing `createPortal` temporarily to see if that's the issue


