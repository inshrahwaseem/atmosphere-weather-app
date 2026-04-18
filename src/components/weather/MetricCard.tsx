import { memo, type ReactNode } from "react";
import { motion } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  delay?: number;
}

export const MetricCard = memo(function MetricCard({ label, value, unit, icon, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card p-4 flex flex-col gap-2.5 group"
    >
      <div className="flex items-center justify-between">
        <span className="label-caps">{label}</span>
        <span className="text-muted-foreground/50 group-hover:text-primary/60 transition-colors duration-300">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-mono font-medium text-foreground">{value}</span>
        {unit && <span className="text-[11px] text-muted-foreground/70 font-medium">{unit}</span>}
      </div>
    </motion.div>
  );
});
