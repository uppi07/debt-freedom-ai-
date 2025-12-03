"use client";

import { useCallback, useEffect, useState } from "react";

export type RepaymentMode = "Avalanche" | "Snowball";

const CHANNEL_NAME = "plan-updates";
const STORAGE_KEY = "plan:last-change";

export function emitPlanChangeSignal() {
  if (typeof window === "undefined") return;
  const stamp = Date.now().toString();
  try {
    localStorage.setItem(STORAGE_KEY, stamp);
  } catch {
    // ignore storage issues
  }

  try {
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    channel?.postMessage(stamp);
    channel?.close();
  } catch {
    // ignore broadcast issues
  }

  window.dispatchEvent(new Event("plan:updated"));
}

type Plan = Record<string, unknown>;

export function usePlan(mode: RepaymentMode) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    setError(null);

    try {
      const res = await fetch(`/api/plan?mode=${mode}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load plan");
      const data = (await res.json()) as Plan;
      if (data?.error) {
        setError(data?.message || data.error);
        setPlan(null);
      } else {
        // Force INR as default currency
        setPlan({ currency: "INR", ...data });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch plan";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  useEffect(() => {
    const handler = () => fetchPlan();

    window.addEventListener("plan:updated", handler);
    window.addEventListener("focus", handler);
    const storageHandler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) handler();
    };
    window.addEventListener("storage", storageHandler);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = handler;
    }

    return () => {
      window.removeEventListener("plan:updated", handler);
      window.removeEventListener("focus", handler);
      window.removeEventListener("storage", storageHandler);
      if (channel) channel.close();
    };
  }, [fetchPlan]);

  return {
    plan,
    loading,
    error,
    refresh: fetchPlan,
  };
}
