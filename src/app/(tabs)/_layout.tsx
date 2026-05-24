/**
 * Tab layout — delegates all UI to AppTabs (glassmorphism bar).
 * Routing logic is unchanged: index → Home, setting → Setting.
 */
import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  return <AppTabs />;
}
