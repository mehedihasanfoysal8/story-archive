"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
}

export function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
