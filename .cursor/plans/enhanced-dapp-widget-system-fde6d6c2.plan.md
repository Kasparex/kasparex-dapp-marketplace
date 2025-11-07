<!-- fde6d6c2-b406-498f-b89f-a0daa6afed7e 12ee5111-775a-44e0-8438-582462c0bd3b -->
# Unified Image Upload and Edit System

## Overview

Merge image upload functionality into unified edit modals for both dApp developers and regular users. All changes in a single session require one 10 KAS payment via Treasury. Images are uploaded via URL with real-time preview. Infrastructure prepared for future file uploads.

## Implementation Plan

### 1. Extend Profile Data Interface

**File: `src/hooks/useProfile.ts`**

- Add `profilePicture?: string` and `featuredImage?: string` to `ProfileData` interface
- Update `DEFAULT_PROFILE` to include these fields
- Update `updateProfile` to handle image URLs
- Add helper functions to load/save profile images from localStorage

### 2. Create Unified dApp Edit Modal

**File: `src/components/dapps/EditDAppModal.tsx`**

- Merge existing `EditDAppModal` with `FeaturedImageUploadModal` and `LogoUploadModal` functionality
- Add image URL input fields:
- Featured Image URL (with real-time preview)
- Logo/Avatar URL (with real-time preview)
- Add live preview sections that update as user types URL
- Integrate `useTreasuryPayment` hook for 10 KAS payment
- Update `handleSave` to:
- Validate all fields including image URLs
- Trigger Treasury payment (10 KAS)
- On payment success, save all data (images + metadata) to localStorage
- Show success message and reload page
- Add image requirements info boxes
- Add delete buttons for existing images
- Remove separate image upload modals (will be deprecated)

### 3. Create Unified Profile Edit Modal

**File: `src/components/ProfileEditModal.tsx`** (new file, replace `ProfileEdit.tsx`)

- Convert existing `ProfileEdit` component to a full modal (using portal)
- Add image URL input fields:
- Profile Picture URL (with real-time preview)
- Featured Image URL (with real-time preview)
- Add live preview sections for both images
- Integrate `useTreasuryPayment` hook for 10 KAS payment
- Update save handler to:
- Validate all fields including image URLs
- Trigger Treasury payment (10 KAS)
- On payment success, save all data (images + profile data) to localStorage
- Show success message and close modal
- Add image requirements info boxes
- Add delete buttons for existing images
- Keep existing fields: displayName, bio, hideBalance, preventScreenshots

### 4. Update Profile Sidebar

**File: `src/components/ProfileSidebar.tsx`**

- Update to display `profile.profilePicture` if available (fallback to Avatar component)
- Update to display `profile.featuredImage` if available
- Make images clickable for editing (only for own profile)
- Pass image data to ProfileEditModal

### 5. Update dApp Components

**Files: `src/components/DAppSidebar.tsx`, `src/components/dapps/DAppWidgetHeader.tsx`**

- Remove separate image upload modal triggers
- Update click handlers to open unified `EditDAppModal` instead
- Ensure `mergedDApp` includes image data from localStorage

### 6. Update Image Loading Logic

**File: `src/lib/dapps/contractData.ts`**

- Ensure `loadDAppFeaturedImage` and `loadDAppLogo` work correctly
- Verify `mergeDAppData` properly merges image URLs with highest priority

### 7. Add Real-Time Preview Component

**File: `src/components/ImagePreview.tsx`** (new reusable component)

- Create reusable component for real-time image preview
- Props: `imageUrl`, `alt`, `aspectRatio`, `className`
- Handle image load errors gracefully
- Show loading state while image loads
- Update preview as URL changes (debounced for performance)

### 8. Prepare for Future File Upload

**Files: All edit modals**

- Add commented-out file upload input fields
- Add infrastructure comments for future implementation
- Structure code to easily add file upload later without major refactoring
- Add placeholder UI elements (disabled file input buttons)

### 9. Update User Profile Page

**File: `src/app/user/[wallet-address]/page.tsx`**

- Replace `ProfileEdit` import with `ProfileEditModal`
- Update modal state management
- Ensure profile images are loaded and displayed

### 10. Clean Up Deprecated Components

**Files to remove:**

- `src/components/dapps/FeaturedImageUploadModal.tsx`
- `src/components/dapps/LogoUploadModal.tsx`
- Update all imports that reference these files

## Technical Details

### Image URL Validation

- Must be valid HTTP/HTTPS URL
- Real-time validation as user types
- Show error if image fails to load
- Allow empty URLs (to delete images)

### Payment Flow

1. User fills form (images + data)
2. Clicks "Save & Pay 10 KAS"
3. Validates all fields
4. Opens EVM wallet for transaction approval
5. On success, saves all data to localStorage
6. Shows success message
7. Reloads page to show updates

### localStorage Structure

- dApp images: `dapp_{id}_featuredImage`, `dapp_{id}_logo`
- dApp metadata: `dapp_{id}_metadata`
- Profile images: Stored in profile object: `profile_{address}` with `profilePicture` and `featuredImage` fields

### Real-Time Preview Implementation

- Use `useState` to track image URL
- Use `useEffect` to update preview when URL changes
- Debounce URL changes (300ms) to avoid excessive re-renders
- Handle image load errors with fallback UI
- Show loading spinner while image loads

## Testing Checklist

- [ ] dApp edit modal shows all fields (images + data)
- [ ] Real-time preview updates as URL is typed
- [ ] Payment flow works correctly (10 KAS)
- [ ] All data saves to localStorage after payment
- [ ] Images display correctly after save
- [ ] Profile edit modal works similarly
- [ ] Delete image functionality works
- [ ] Error handling for invalid URLs
- [ ] Error handling for payment failures
- [ ] Mobile responsiveness