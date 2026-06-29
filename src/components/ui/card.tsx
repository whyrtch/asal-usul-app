/**
 * Card — shadcn-style card primitive for React Native.
 *
 * Composition:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle />
 *       <CardDescription />
 *     </CardHeader>
 *     <CardContent />
 *     <CardFooter />
 *   </Card>
 *
 * Variants: default (elevated), outline (border-only)
 */

import React from 'react';
import { StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { AsalUsulColors, FontSize, FontWeight, Radii, Shadows } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardVariant = 'default' | 'outline';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, variant = 'default', style }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'outline' ? styles.cardOutline : styles.cardDefault,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────

export interface CardHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return <View style={[styles.cardHeader, style]}>{children}</View>;
}

// ─── CardTitle ────────────────────────────────────────────────────────────────

export interface CardTitleProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CardTitle({ children, style }: CardTitleProps) {
  return <Text style={[styles.cardTitle, style]}>{children}</Text>;
}

// ─── CardDescription ──────────────────────────────────────────────────────────

export interface CardDescriptionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CardDescription({ children, style }: CardDescriptionProps) {
  return <Text style={[styles.cardDescription, style]}>{children}</Text>;
}

// ─── CardContent ──────────────────────────────────────────────────────────────

export interface CardContentProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={[styles.cardContent, style]}>{children}</View>;
}

// ─── CardFooter ───────────────────────────────────────────────────────────────

export interface CardFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return <View style={[styles.cardFooter, style]}>{children}</View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    backgroundColor: AsalUsulColors.backgroundCard,
  },
  cardDefault: {
    ...Shadows.card,
  },
  cardOutline: {
    borderWidth: 1,
    borderColor: AsalUsulColors.borderSubtle,
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 0,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: AsalUsulColors.textHeading,
    lineHeight: FontSize.lg * 1.3,
  },
  cardDescription: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: AsalUsulColors.textMuted,
    lineHeight: FontSize.sm * 1.5,
    marginTop: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardFooter: {
    padding: 20,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
