/**
 * FamilyTreeCanvas — viewport for the family tree visualization.
 *
 * Renders nodes in a generational hierarchy with View-based connector lines.
 * Supports both horizontal and vertical scrolling for large trees.
 *
 * Requirements: 6.1–6.6, 9.4
 */

import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AsalUsulColors } from '@/constants/theme';
import { Member } from '@/types/familyTree';
import {
    defaultTreeLayoutEngine,
    LayoutEdge,
    LayoutNode,
} from '@/utils/treeLayoutEngine';
import { FamilyTreeNode } from './FamilyTreeNode';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FamilyTreeCanvasProps {
  members: Member[];
  onNodePress?: (memberId: string) => void;
}

// ─── Connector lines ──────────────────────────────────────────────────────────

/**
 * Draws elbow connectors between parent and child nodes using three View
 * segments: vertical down from parent, horizontal, vertical down to child.
 */
function ConnectorLines({ edges }: { edges: LayoutEdge[] }) {
  return (
    <>
      {edges.map((edge) => {
        const midY = Math.round((edge.y1 + edge.y2) / 2);
        const minX = Math.min(edge.x1, edge.x2);
        const maxX = Math.max(edge.x1, edge.x2);
        const hWidth = maxX - minX;

        return (
          <View key={`${edge.parentId}-${edge.childId}`} pointerEvents="none">
            {/* Vertical: parent bottom → midY */}
            <View
              style={[
                styles.line,
                {
                  left: edge.x1 - 1,
                  top: edge.y1,
                  width: 2,
                  height: midY - edge.y1,
                },
              ]}
            />
            {/* Horizontal: x1 → x2 at midY */}
            {hWidth > 0 && (
              <View
                style={[
                  styles.line,
                  {
                    left: minX,
                    top: midY - 1,
                    width: hWidth,
                    height: 2,
                  },
                ]}
              />
            )}
            {/* Vertical: midY → child top */}
            <View
              style={[
                styles.line,
                {
                  left: edge.x2 - 1,
                  top: midY,
                  width: 2,
                  height: edge.y2 - midY,
                },
              ]}
            />
          </View>
        );
      })}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FamilyTreeCanvas({ members, onNodePress }: FamilyTreeCanvasProps) {
  const layout = useMemo(
    () => defaultTreeLayoutEngine.computeLayout(members),
    [members],
  );

  const { nodes, edges, canvasWidth, canvasHeight } = layout;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      {/* Vertical scroll */}
      <ScrollView
        style={styles.outerScroll}
        contentContainerStyle={styles.outerScrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Horizontal scroll */}
        <ScrollView
          horizontal
          contentContainerStyle={{ width: canvasWidth, height: canvasHeight }}
          showsHorizontalScrollIndicator={false}
          bounces
        >
          {/* Canvas — relative container for absolute nodes + connector lines */}
          <View style={{ width: canvasWidth, height: canvasHeight }}>
            {/* Connector lines (rendered below nodes) */}
            <ConnectorLines edges={edges} />

            {/* Member nodes */}
            {nodes.map((node: LayoutNode) => (
              <View
                key={node.member.id}
                style={[styles.nodeWrapper, { left: node.x, top: node.y }]}
              >
                <FamilyTreeNode member={node.member} onPress={onNodePress} />
              </View>
            ))}
          </View>
        </ScrollView>
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
  outerScroll: {
    flex: 1,
  },
  outerScrollContent: {
    flexGrow: 1,
  },
  nodeWrapper: {
    position: 'absolute',
  },
  line: {
    position: 'absolute',
    backgroundColor: AsalUsulColors.borderSubtle,
  },
});
