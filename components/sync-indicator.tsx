"use client";

import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";
import type { SyncStatus } from "@/lib/settings-utils";

interface SyncIndicatorProps {
  status: SyncStatus;
  className?: string;
}

export function SyncIndicator({ status, className = "" }: SyncIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  const config = {
    pending: {
      icon: Cloud,
      color: "text-white/40",
      title: "Changes pending...",
    },
    saving: {
      icon: Loader2,
      color: "text-purple-400",
      title: "Saving...",
      animate: true,
    },
    saved: {
      icon: Check,
      color: "text-green-400",
      title: "Saved",
    },
    error: {
      icon: CloudOff,
      color: "text-red-400",
      title: "Failed to save",
    },
  }[status];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      title={config.title}
    >
      <Icon
        size={14}
        className={`${config.color} ${config.animate ? "animate-spin" : ""}`}
      />
      <span className={`text-[10px] ${config.color}`}>{config.title}</span>
    </div>
  );
}
