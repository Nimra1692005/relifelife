/**
 * ReliefLink Admin — UI Component Library
 * Barrel export for all design system components
 */

// ─── Primitives ─────────────────────────────────────────────
export { Button } from './Button';
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export { StatusPill, Badge, LiveIndicator } from './StatusPill';
export { Modal } from './Modal';
export { Input, Select, Tabs, Textarea } from './Input';
export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  Divider,
  EmptyState,
  Avatar,
} from './Skeleton';

// ─── Layout ─────────────────────────────────────────────────
export { Sidebar } from '../layout/Sidebar';
export { Header } from '../layout/Header';
export { CommandCenter, PageContainer } from '../layout/CommandCenter';

// ─── Dashboard ──────────────────────────────────────────────
export {
  StatsCard,
  LiveMetricsBar,
  IncidentRow,
} from '../dashboard/StatsCard';

// ─── Map ────────────────────────────────────────────────────
export {
  CommandMap,
  MapLegend,
  MapToolbar,
  MapToolbarButton,
  RiskZonePin,
  SOSPin,
  HeatmapZone,
} from '../map/CommandMap';

// ─── Alerts ─────────────────────────────────────────────────
export { AlertComposer, AlertHistoryRow } from '../alerts/AlertComposer';
