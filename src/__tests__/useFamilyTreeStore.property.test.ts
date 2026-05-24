/**
 * Property tests for src/store/useFamilyTreeStore.ts
 *
 * Property 5: addFamilyTree name preservation invariant
 * For any non-empty string `name`, the FamilyTree stored by `addFamilyTree(name)`
 * SHALL have `name` equal to `name.trim()`.
 *
 * **Validates: Requirements 3.4, 8.3**
 */

import * as fc from 'fast-check';
import { useFamilyTreeStore } from '../store/useFamilyTreeStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

const OWNER_ID = 'local-user';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  useFamilyTreeStore.setState({ familyTrees: [], members: [] });
});

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 5: addFamilyTree name preservation invariant', () => {
  /**
   * For any non-empty string `name`, the stored FamilyTree's `name` field
   * SHALL equal `name.trim()`.
   *
   * This covers:
   *   - Names with leading/trailing whitespace (must be trimmed)
   *   - Names that are already trimmed (must be preserved as-is)
   *   - Names with internal whitespace (internal spaces must not be altered)
   *
   * **Validates: Requirements 3.4, 8.3**
   */
  it('stores name as name.trim() for any non-empty string input', () => {
    fc.assert(
      fc.property(
        // Generate strings that have at least 1 non-whitespace character
        // so the name is valid (trim().length >= 1)
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        (name) => {
          // Reset store before each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          const { addFamilyTree, familyTrees } = useFamilyTreeStore.getState();
          addFamilyTree(name, OWNER_ID);

          const stored = useFamilyTreeStore.getState().familyTrees[0];
          expect(stored).toBeDefined();
          expect(stored.name).toBe(name.trim());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Specifically verifies that leading and trailing whitespace is stripped.
   * Names like "  Keluarga Budi  " must be stored as "Keluarga Budi".
   *
   * **Validates: Requirements 3.4, 8.3**
   */
  it('strips leading and trailing whitespace from the stored name', () => {
    fc.assert(
      fc.property(
        // Core name: at least 1 non-whitespace character
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        // Padding: 0–5 spaces/tabs on each side
        fc.string({ minLength: 0, maxLength: 5 }).filter((s) => s.trim() === ''),
        fc.string({ minLength: 0, maxLength: 5 }).filter((s) => s.trim() === ''),
        (core, leading, trailing) => {
          const name = `${leading}${core}${trailing}`;

          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          const { addFamilyTree } = useFamilyTreeStore.getState();
          addFamilyTree(name, OWNER_ID);

          const stored = useFamilyTreeStore.getState().familyTrees[0];
          expect(stored).toBeDefined();
          expect(stored.name).toBe(name.trim());
          // Confirm no leading/trailing whitespace remains
          expect(stored.name).toBe(stored.name.trim());
        }
      ),
      { numRuns: 100 }
    );
  });
});
