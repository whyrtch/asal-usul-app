/**
 * Feature flags — simple compile/runtime switches to enable or disable
 * features that depend on external infrastructure not yet provisioned.
 *
 * These are intentionally lightweight (env-driven booleans). When the
 * monetization/Remote Config work lands (Phase 3) these can be migrated to a
 * remote flag source without changing call sites.
 *
 * @module src/constants/features
 */

/**
 * Photo upload (member photos) depends on Firebase Storage being enabled in
 * the Firebase console and `storage.rules` being deployed.
 *
 * Disabled by default so the app runs without Storage provisioned. Enable by
 * setting `EXPO_PUBLIC_ENABLE_PHOTO_UPLOAD=true` in `.env` once Storage is set
 * up, then rebuild the dev client.
 */
export const FEATURE_PHOTO_UPLOAD =
  process.env.EXPO_PUBLIC_ENABLE_PHOTO_UPLOAD === 'true';

/**
 * Family tree sharing / collaboration (Phase 2) depends on updated Firestore
 * security rules being deployed + audited, and a `collectionGroup('access')`
 * index. No Cloud Functions / Blaze plan required (rules-only accept).
 *
 * Disabled by default so the feature ships dark. Enable by setting
 * `EXPO_PUBLIC_ENABLE_SHARING=true` in `.env` once rules are deployed.
 */
export const FEATURE_SHARING =
  process.env.EXPO_PUBLIC_ENABLE_SHARING === 'true';

/**
 * Dev-only seed button (sample family trees) on the Home screen. For local
 * testing of the tree visualization. Never enable in production.
 *
 * Enable by setting `EXPO_PUBLIC_DEV_SEED=true` in `.env`.
 */
export const FEATURE_DEV_SEED =
  process.env.EXPO_PUBLIC_DEV_SEED === 'true';
