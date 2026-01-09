# Debug & Polish Plan

This document outlines the findings from Phase 1 (Audit) and the plan for Phase 3 (Execution).

## Phase 1: Audit Findings

### 🚨 Critical Bugs (Priority: Highest)
1.  **Security Vulnerability**: `src/app/page.tsx` explicitly renders `Admin password: admin123`.
2.  **Admin Access**: The `/admin` routes appear currently accessible without login in some states (Browser Agent could view Dashboard). Middleware may be misconfigured or bypassed.
3.  **Silent Failure in Step 2**: In `StepTwoRedemption.tsx`, the Digital product flow has a race condition.
    *   If a user selects "Digital", `handleConfirm` sets `selectedImageId` (async) and immediately checks `showUpsell` state.
    *   If `UpsellFunnel` relies on the derived `selectedImageUrl` (which might still be undefined pending state update), the modal may fail to appear, causing the flow to "die" silently.
4.  **Swallowed Errors**: `submitOrder` in `StepTwoRedemption.tsx` catches errors but genericizes them, and often doesn't give feedback if `fetch` fails network-wise.

### 🎨 UI/UX Inconsistencies (Priority: High)
1.  **Hydration Mismatch**: `antigravity-scroll-lock` class on `body` causes hydration warnings on every page load.
2.  **Visual Clutter**: Customer Gallery has excessive emoji/confetti effects that obscure content (Step 1 & 2).
3.  **"Div Soup"**: Landing page and internal dashboards use nested `div`s instead of semantic HTML (`<main>`, `<article>`, `<section>`).
4.  **Responsive Layout**: Overlapping elements in Customer Gallery Step 2 on smaller screens.
5.  **Bonus Step UX**: `StepThreeBonus.tsx` uses `window.confirm("Simulator...")` which is creating a debug-like experience rather than a polished production one.

### 🐢 Performance Bottlenecks (Priority: Medium)
1.  **Image Optimization**: Missing `sizes` and `priority` props on LCP images (Main portrait in Step 2, Landing Hero).
2.  **Unnecessary Re-renders**: `StepTwoRedemption` has complex `useEffect` chains for "Glossing" that may trigger double renders.

### 👃 Code Smells (Priority: Low)
1.  **Dynamic Imports**: `import(...)` used inside `useEffect` in `StepTwoRedemption.tsx`. Should be top-level or properly handled lazy load.
2.  **Hardcoded Values**: Prices and texts hardcoded in components (e.g., "$4.99" in Bonus step).

---

## Phase 2: Refactor Plan

### Agent A: Fixes (Critical & Logic)
**Objective**: Stabilize the application and secure it.

1.  **Secure Landing Page**:
    *   [MODIFY] `src/app/page.tsx`: Remove exposed credentials.
2.  **Fix Middleware**:
    *   [MODIFY] `src/middleware.ts`: Verify matcher config to strictly protect `/admin`.
3.  **Fix Digital Flow (Silent Failure)**:
    *   [MODIFY] `src/components/CustomerGallerySteps/StepTwoRedemption.tsx`:
        *   Refactor `handleConfirm` to await state updates or pass explicit values to `UpsellFunnel` control.
        *   Ensure `UpsellFunnel` can open even if `selectedImageId` is being set in the same tick (pass local variable).
4.  **Improve Error Handling**:
    *   [MODIFY] `src/components/CustomerGallerySteps/StepTwoRedemption.tsx`: Add toast notifications for specific errors in `submitOrder`.
    *   [MODIFY] `src/components/CustomerGallerySteps/StepThreeBonus.tsx`: Replace `window.confirm` with a proper UI modal (or use `UpsellFunnel` / `ReviewModal` pattern).

### Agent B: Polish (UI & Performance)
**Objective**: Make it "Production Ready" and Beautiful.

1.  **Semantic Refactor**:
    *   [MODIFY] `src/app/page.tsx` & `src/app/admin/layout.tsx`: clear out "div soup". Use Semantic HTML.
2.  **Visual Cleanup**:
    *   [MODIFY] `src/components/CustomerGallerySteps/*.tsx`: Tone down confetti. Fix z-index and spacing issues.
3.  **Hydration Fix**:
    *   [MODIFY] `src/app/layout.tsx`: Ensure body classes match server/client or use `suppressHydrationWarning` on body if strictly necessary (better to fix the library usage).
4.  **Image Optimization**:
    *   [MODIFY] `StepTwoRedemption.tsx`: Add `priority` to the main preview image.

## Verification Plan

### Automated Tests
*   **Security Check**: `curl -I http://localhost:3000/admin` (should 307 Redirect).
*   **Flow Test**: Run `test_auto_mockup_flow.ts` (existing script) to verify backend logic hasn't broken.

### Manual Verification
1.  **Digital Flow**: Select "Digital", click "Proceed". Verify Upsell Modal appears.
2.  **Bonus Unlock**: Click "Unlock". Verify nice UI appears (no `window.confirm`). Use "Simulator" UI but make it look like a Dev Mode toast, not a browser alert.
3.  **Visual Check**: Browse to Gallery on Mobile width. Ensure buttons don't overlap text.
