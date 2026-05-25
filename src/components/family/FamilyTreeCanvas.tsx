/**
 * FamilyTreeCanvas — viewport/container for the family tree visualization.
 *
 * Delegates layout computation to `defaultTreeLayoutEngine` and renders
 * `FamilyTreeNode` components at computed absolute positions.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.4
 */

import { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AsalUsulColors, Spacing } from '@/constants/theme';
import { Member } from '@/types/familyTree';
import {
    defaultTreeLayoutEngine,
    LayoutNode,
    NODE_HEIGHT,
} from '@/utils/treeLayoutEngine';
import { FamilyTreeNode } from './FamilyTreeNode';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Width of a single tree node card in logical pixels.
 * Matches the `maxWidth: 160` in FamilyTreeNode styles.
 * NOTE: NODE_WIDTH is not exported from treeLayoutEngine, so we define it here.
 */
const NODE_WIDTH = 160;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FamilyTreeCanvasProps {
  /** All members belonging to this family tree. */
  members: Member[];
  /** Called when a node is tapped (future: open member detail). */
  onNodePress?: (memberId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FamilyTreeCanvas({ members, onNodePress }: FamilyTreeCanvasProps) {
  const { width: canvasWidth } = useWindowDimensions();

  // Memoize layout computation — Requirement 6.3
  const layoutNodes: LayoutNode[] = useMemo(
    () => defaultTreeLayoutEngine.computeLayout(members, canvasWidth),
    [members, canvasWidth],
  );

  // Compute the total canvas height needed to contain all nodes
  const canvasHeight = layoutNodes.reduce(
    (max, node) => Math.max(max, node.y + NODE_HEIGHT / 2 + Spacing.four),
    NODE_HEIGHT + Spacing.five,
  );

  return (
    // FadeIn.duration(500) entering animation — Requirements 9.4, 5.7
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      {/* ScrollView for future pan/zoom support — Requirement 6.6 */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { width: canvasWidth, height: canvasHeight },
        ]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // Optimisation for future large trees
        removeClippedSubviews
      >
        {/* Render each LayoutNode as an absolutely positioned FamilyTreeNode — Requirement 6.4 */}
        {layoutNodes.map((node) => (
          <Animated.View
            key={node.member.id}
            style={[
              styles.nodeWrapper,
              {
                left: node.x - NODE_WIDTH / 2,
                top: node.y - NODE_HEIGHT / 2,
              },
            ]}
          >
            <FamilyTreeNode member={node.member} onPress={onNodePress} />
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  scrollContent: {
    position: 'relative',
  },
  nodeWrapper: {
    position: 'absolute',
  },
});
