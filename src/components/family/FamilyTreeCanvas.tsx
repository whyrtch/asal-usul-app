/**
 * FamilyTreeCanvas — viewport for the family tree visualization.
 *
 * Renders nodes in a generational hierarchy with View-based connector lines.
 * Supports both horizontal and vertical scrolling for large trees.
 *
 * Requirements: 6.1–6.6, 9.4
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
    FadeIn,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { Member } from '@/types/familyTree';
import {
    defaultTreeLayoutEngine,
    LayoutEdge,
    LayoutNode,
    SpouseEdge,
} from '@/utils/treeLayoutEngine';
import {
    clamp,
    computeCenterOnNode,
    computeFitToScreen,
    filterMembersByQuery,
    MAX_SCALE,
    MIN_SCALE,
} from '@/utils/treeNavigation';
import { FamilyTreeNode } from './FamilyTreeNode';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FamilyTreeCanvasProps {
  members: Member[];
  onNodePress?: (memberId: string) => void;
}

/** Scale applied when focusing a node via search (zoom to a readable level). */
const FOCUS_SCALE = 1;

// ─── Spouse connector lines ───────────────────────────────────────────────────

/**
 * Draws a horizontal line between two spouse nodes at their vertical midpoint.
 */
function SpouseLines({ spouseEdges }: { spouseEdges: SpouseEdge[] }) {
  return (
    <>
      {spouseEdges.map((edge) => (
        <View
          key={`${edge.spouseAId}-${edge.spouseBId}`}
          pointerEvents="none"
          style={[
            styles.line,
            {
              left: edge.x1,
              top: edge.y - 1,
              width: edge.x2 - edge.x1,
              height: 2,
            },
          ]}
        />
      ))}
    </>
  );
}

// ─── Connector lines ──────────────────────────────────────────────────────────

/**
 * Draws connectors between parent(s) and child nodes.
 *
 * Two modes:
 * - fromCouple=true: straight vertical line from the midpoint of the spouse
 *   connector line down to the child top-center. No elbow needed when x1===x2;
 *   if the child is offset, adds a horizontal segment at mid-height.
 * - fromCouple=false (default): classic elbow — vertical down from parent
 *   bottom, horizontal to child x, vertical down to child top.
 */
function ConnectorLines({ edges }: { edges: LayoutEdge[] }) {
  return (
    <>
      {edges.map((edge) => {
        if (edge.fromCouple) {
          // Straight drop from couple midpoint to child top-center.
          // If x1 !== x2 we add a small horizontal jog at the midpoint.
          const hDiff = Math.abs(edge.x1 - edge.x2);
          const totalHeight = edge.y2 - edge.y1;
          const midY = Math.round(edge.y1 + totalHeight / 2);
          const minX = Math.min(edge.x1, edge.x2);
          const maxX = Math.max(edge.x1, edge.x2);

          return (
            <View key={`${edge.parentId}-${edge.childId}`} pointerEvents="none">
              {/* Vertical: couple midpoint → midY (or straight to child if aligned) */}
              <View
                style={[
                  styles.line,
                  {
                    left: edge.x1 - 1,
                    top: edge.y1,
                    width: 2,
                    height: hDiff > 1 ? midY - edge.y1 : totalHeight,
                  },
                ]}
              />
              {/* Horizontal jog (only when child is not directly below midpoint) */}
              {hDiff > 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      left: minX,
                      top: midY - 1,
                      width: maxX - minX,
                      height: 2,
                    },
                  ]}
                />
              )}
              {/* Vertical: midY → child top (only when there was a horizontal jog) */}
              {hDiff > 1 && (
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
              )}
            </View>
          );
        }

        // Standard elbow connector (single parent)
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

  const { nodes, edges, spouseEdges, canvasWidth, canvasHeight } = layout;

  // ── Viewport size (measured) ────────────────────────────────────────────────
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  // ── Search state ─────────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const results = useMemo(
    () => filterMembersByQuery(members, query).slice(0, 8),
    [members, query],
  );

  // ── Transform shared values ──────────────────────────────────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Fit the whole tree into the viewport once it has been measured.
  const didFitRef = useRef(false);

  const applyFit = useCallback(() => {
    if (viewport.width <= 0 || viewport.height <= 0) return;
    const t = computeFitToScreen(
      canvasWidth,
      canvasHeight,
      viewport.width,
      viewport.height,
    );
    scale.value = withTiming(t.scale, { duration: 250 });
    savedScale.value = t.scale;
    translateX.value = withTiming(t.translateX, { duration: 250 });
    savedTranslateX.value = t.translateX;
    translateY.value = withTiming(t.translateY, { duration: 250 });
    savedTranslateY.value = t.translateY;
  }, [
    viewport.width,
    viewport.height,
    canvasWidth,
    canvasHeight,
    scale,
    savedScale,
    translateX,
    savedTranslateX,
    translateY,
    savedTranslateY,
  ]);

  useEffect(() => {
    if (!didFitRef.current && viewport.width > 0 && canvasWidth > 0) {
      didFitRef.current = true;
      applyFit();
    }
  }, [viewport.width, canvasWidth, applyFit]);

  // ── Zoom controls ─────────────────────────────────────────────────────────────
  const zoomBy = useCallback(
    (factor: number) => {
      const next = clamp(savedScale.value * factor, MIN_SCALE, MAX_SCALE);
      scale.value = withTiming(next, { duration: 150 });
      savedScale.value = next;
    },
    [scale, savedScale],
  );

  // ── Focus a node (from search) ─────────────────────────────────────────────────
  const focusNode = useCallback(
    (memberId: string) => {
      const node = nodes.find((n) => n.member.id === memberId);
      if (!node || viewport.width <= 0) return;

      const { translateX: tx, translateY: ty } = computeCenterOnNode(
        node.x,
        node.y,
        viewport.width,
        viewport.height,
        FOCUS_SCALE,
      );

      scale.value = withTiming(FOCUS_SCALE, { duration: 300 });
      savedScale.value = FOCUS_SCALE;
      translateX.value = withTiming(tx, { duration: 300 });
      savedTranslateX.value = tx;
      translateY.value = withTiming(ty, { duration: 300 });
      savedTranslateY.value = ty;

      setHighlightedId(memberId);
      setQuery('');
    },
    [
      nodes,
      viewport.width,
      viewport.height,
      scale,
      savedScale,
      translateX,
      savedTranslateX,
      translateY,
      savedTranslateY,
    ],
  );

  // ── Gestures: pan + pinch (simultaneous) ───────────────────────────────────────
  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      // Inline clamp (worklet-safe) between MIN_SCALE and MAX_SCALE.
      const next = savedScale.value * e.scale;
      scale.value = next < MIN_SCALE ? MIN_SCALE : next > MAX_SCALE ? MAX_SCALE : next;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Clear any search highlight once the user manually zooms.
      runOnJS(setHighlightedId)(null);
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedCanvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <GestureHandlerRootView style={styles.root}>
        {/* Pan/zoom viewport — clips the transformed canvas */}
        <View
          style={styles.viewport}
          onLayout={(e) =>
            setViewport({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }
        >
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.canvasLayer, animatedCanvasStyle]}>
              <View style={{ width: canvasWidth, height: canvasHeight }}>
                {/* Connector lines (rendered below nodes) */}
                <ConnectorLines edges={edges} />

                {/* Spouse connector lines */}
                <SpouseLines spouseEdges={spouseEdges} />

                {/* Member nodes */}
                {nodes.map((node: LayoutNode) => (
                  <View
                    key={node.member.id}
                    style={[styles.nodeWrapper, { left: node.x, top: node.y }]}
                  >
                    <FamilyTreeNode
                      member={node.member}
                      onPress={onNodePress}
                      highlighted={node.member.id === highlightedId}
                    />
                  </View>
                ))}
              </View>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* ── Search bar (overlay) ──────────────────────────────────────────── */}
        <View style={styles.searchContainer} pointerEvents="box-none">
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={AsalUsulColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Cari anggota..."
              placeholderTextColor={AsalUsulColors.textMuted}
              autoCapitalize="words"
              accessibilityLabel="Cari anggota keluarga"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Hapus pencarian"
              >
                <Ionicons name="close-circle" size={18} color={AsalUsulColors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Results dropdown */}
          {results.length > 0 && (
            <View style={styles.resultsList}>
              {results.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => focusNode(m.id)}
                  style={styles.resultRow}
                  accessibilityRole="button"
                  accessibilityLabel={`Fokus ke ${m.fullName}`}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color={AsalUsulColors.primaryMuted}
                  />
                  <View style={styles.resultInfo}>
                    <Animated.Text style={styles.resultName} numberOfLines={1}>
                      {m.fullName}
                    </Animated.Text>
                    <Animated.Text style={styles.resultRole} numberOfLines={1}>
                      {m.role}
                    </Animated.Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ── Zoom / fit controls (overlay) ─────────────────────────────────── */}
        <View style={styles.controls} pointerEvents="box-none">
          <Pressable
            onPress={() => zoomBy(1.25)}
            style={styles.controlButton}
            accessibilityRole="button"
            accessibilityLabel="Perbesar"
          >
            <Ionicons name="add" size={22} color={AsalUsulColors.primary} />
          </Pressable>
          <Pressable
            onPress={() => zoomBy(0.8)}
            style={styles.controlButton}
            accessibilityRole="button"
            accessibilityLabel="Perkecil"
          >
            <Ionicons name="remove" size={22} color={AsalUsulColors.primary} />
          </Pressable>
          <Pressable
            onPress={applyFit}
            style={styles.controlButton}
            accessibilityRole="button"
            accessibilityLabel="Pas ke layar"
          >
            <Ionicons name="scan-outline" size={20} color={AsalUsulColors.primary} />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  root: {
    flex: 1,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  canvasLayer: {
    flex: 1,
  },
  nodeWrapper: {
    position: 'absolute',
  },
  line: {
    position: 'absolute',
    backgroundColor: AsalUsulColors.borderSubtle,
  },

  // Search
  searchContainer: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: AsalUsulColors.textBody,
    paddingVertical: 0,
  },
  resultsList: {
    marginTop: Spacing.two,
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AsalUsulColors.borderSubtle,
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: AsalUsulColors.textHeading,
  },
  resultRole: {
    fontSize: 12,
    color: AsalUsulColors.textMuted,
  },

  // Zoom controls
  controls: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    gap: Spacing.two,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AsalUsulColors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
});
