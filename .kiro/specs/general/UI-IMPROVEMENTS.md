# UI/UX Improvements

## Summary

This review evaluates the authentication flow and navigation architecture in AsalUsul. The current implementation uses a **hard auth gate** — unauthenticated users are blocked at the login screen and cannot see any app content. The desired experience is a **soft auth gate** where users can explore the home screen and browse content, but are prompted to sign in only when they attempt a write action (create family tree, add member, etc.).

---

## Critical Issues

### Issue: Hard Auth Gate Blocks All Exploration

**Current State**: `_layout.tsx` uses `Stack.Protected` guards to show either the login screen or the tab-based app. A new user who opens the app sees only the login screen with a "Masuk dengan Google" button and no content preview.

```
Stack
  login          ← rendered when !isLoggedIn (hard gate)
  (tabs)         ← rendered when isLoggedIn (hard gate)
```

**Problem**:
- Users must commit to Google sign-in before understanding what the app offers
- No opportunity to preview features, UI quality, or value proposition
- Increases bounce rate — users who are "just browsing" leave immediately
- Violates the **progressive disclosure** principle: don't ask for commitment before showing value
- Common industry anti-pattern — most successful apps show content first, gate writes only

**Recommendation**: Replace the hard auth gate with a soft gate:
1. Always render the `(tabs)` navigator (home screen is the default landing)
2. Move the login screen to a modal route or screen that can be pushed/presented on demand
3. On the home screen, detect auth state and modify the "Buat Sekarang" CTA behavior:
   - **Unauthenticated**: "Buat Sekarang" → navigates to login screen
   - **Authenticated**: "Buat Sekarang" → opens CreateFamilyTreeModal (current behavior)

**Impact**:
- New users see the beautiful home screen, HeroIllustration, and branding immediately
- Higher conversion — users who see value are more willing to sign in
- Reduces perceived friction at first launch
- Follows the pattern used by Pinterest, Instagram, Spotify, and other top apps

**Implementation Notes** (in `_layout.tsx`):
```tsx
// Remove Stack.Protected guards; always render tabs
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />           {/* always accessible */}
  <Stack.Screen name="login" options={{ presentation: 'modal' }} />  {/* presented on demand */}
</Stack>
```

---

## High Priority Improvements

### Issue: Home Screen Create Flow Ignores Auth State

**Current State**: `(tabs)/index.tsx` always calls `handleOpenModal()` when the add button or "Buat Sekarang" is tapped, regardless of auth state. The `CreateFamilyTreeModal` calls `createFamilyTree(name, user.uid)` but silently skips creation when `user?.uid` is undefined.

**Problem**:
- Tapping "Buat Sekarang" when not logged in opens a modal that does nothing on submit
- No visual feedback or error message explaining why the creation failed
- Confusing UX — the user fills in a name, taps "Buat", and nothing happens

**Recommendation**: Auth-gate the create flow at three levels:
1. `handleOpenModal()` → if `!user`, push to login screen; if `user`, open modal
2. `handleModalSubmit()` → after successful sign-in, re-open the create modal automatically so the user doesn't have to tap "Buat Sekarang" again
3. Show a subtle inline message on the home screen for unauthenticated users: "Masuk untuk menyimpan pohon keluarga"

**Impact**:
- Clear cause-and-effect: user taps create → prompted to sign in → signed in → modal opens
- No silent failures
- Encourages sign-in with a clear value proposition

---

### Issue: No Auth Guard on Family Tree Detail Routes

**Current State**: `family/[id].tsx` and `member/[id].tsx` assume the user is authenticated. The `deleteFamilyTree` action requires `user?.uid`, but the route doesn't check auth before rendering.

**Problem**:
- With the soft gate, an unauthenticated user could navigate directly to a family tree detail URL and see an error state (redirect to tabs because tree not found in local store)
- Delete/edit actions would silently fail
- No graceful redirect or login prompt

**Recommendation**: Add a lightweight auth check at the top of detail screens:
- If `!user`, show a prompt card: "Masuk untuk melihat detail pohon keluarga" with a "Masuk" CTA button
- Keep the route accessible so logged-in users can deep-link after sign-in
- OR, more simply, redirect to home with a toast/snackbar message if not authenticated

**Impact**:
- Prevents confusing empty states
- Clear path to resolution for the user
- Maintains deep-link capability post-authentication

---

### Issue: Settings Page Shows Logout Button to Unauthenticated Users

**Current State**: `(tabs)/setting.tsx` renders a LogoutButton unconditionally. When `signOut()` is called without a logged-in user, it still runs the Firebase sign-out flow (which is a no-op but confusing).

**Problem**:
- "Logout" button visible when no user is logged in
- Misleading — implies the user is logged in when they aren't
- Wastes screen space

**Recommendation**: Conditionally show account/logout section:
- If `user` is null: show a login prompt section instead ("Masuk untuk mengelola akun")
- If `user` exists: show the current logout flow
- The rest of the settings (app info, version) should remain visible to everyone

**Impact**:
- Clearer communication of auth state
- Consistent mental model

---

## Medium Priority Enhancements

### Issue: No Post-Login Redirect to Intended Action

**Current State**: After successful login, the app navigates to the home tab unconditionally.

**Problem**: If the user was in the middle of creating a family tree when prompted to log in, they lose context and have to start over.

**Recommendation**: Implement an "intent queue" or redirect-after-login pattern:
1. When `handleOpenModal()` redirects to login, store the intended action (e.g., `{ action: 'createFamilyTree' }`)
2. After login completes, check for pending intents
3. Automatically execute the pending action (e.g., open CreateFamilyTreeModal)

**Implementation**:
```typescript
// Use a ref or a simple global state
const pendingAction = useRef<{ type: string; data?: unknown } | null>(null);

const handleOpenModal = useCallback(() => {
  if (!user) {
    pendingAction.current = { type: 'createFamilyTree' };
    router.push('/login');
    return;
  }
  setModalVisible(true);
}, [user, router]);

// In login screen, after successful sign-in:
if (pendingAction.current?.type === 'createFamilyTree') {
  pendingAction.current = null;
  setModalVisible(true);
}
```

**Impact**:
- Frictionless flow through sign-in
- Meets user expectations — "I tapped Create, I was asked to sign in, now I'm creating"

---

### Issue: EmptyState Needs Auth-Aware Variation

**Current State**: `EmptyState` always renders the same content: HeroIllustration + "Belum ada pohon keluarga" + description + "Buat Sekarang" CTA.

**Problem**: The copy doesn't guide the user based on their auth state. An unauthenticated user might not realize they need to sign in first.

**Recommendation**:
- **Unauthenticated**: Show "Buat pohon keluarga pertamamu" heading, "Masuk untuk mulai membuat silsilah keluarga digital" description, and "Masuk dengan Google" CTA
- **Authenticated**: Keep current copy

This can be done by passing an `isAuthenticated` prop to EmptyState, or by conditionally rendering in the home screen.

**Impact**:
- Context-appropriate messaging
- Clear next step for every user state

---

## Positive Observations

- **Clean Splash Screen**: The animated splash with fade-in logo, tagline, and loading indicator creates a polished first impression — worth preserving in the new flow.
- **Good Error Handling**: Auth context has thorough error mapping with Indonesian user-facing messages. This should be maintained.
- **Reusable UI Primitives**: The newly created `Button`, `Sheet`, `Dialog`, `Input`, `Chip` components provide a solid foundation for consistent interaction patterns.
- **Memoized Callbacks**: The home and detail screens properly memoize callbacks with `useCallback`, indicating awareness of React performance best practices.
- **Accessibility Awareness**: Components have `accessibilityRole`, `accessibilityLabel`, and `accessibilityState` props — this should be maintained in all new auth-gate UI.
