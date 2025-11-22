"use client";

import { useEffect, useState } from "react";
import { getTrainerId } from "@/lib/storage";
import { getTrainerClients } from "@/lib/apiClient";
import Link from "next/link";

type ClientAssignment = {
  userId: string;
  trainerId: string;
  status: string;
  assignedAt?: string;
  unreadCount?: number;   
};


export default function TrainerDashboardPage() {
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const id = getTrainerId();
    setTrainerId(id);

    if (!id) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const data = await getTrainerClients(id);
        setClients(data.clients || []);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message ?? "Failed to load clients");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [setLoading]);

  if (!trainerId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">
            No trainer profile found.
          </p>
          <p className="text-slate-400 text-sm">
            Please complete trainer onboarding first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl text-white font-semibold">Trainer Dashboard</h1>
        <span className="text-xs text-slate-400">
          Trainer ID: <span className="text-slate-200">{trainerId}</span>
        </span>
      </header>

      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
        <h2 className="text-xl text-white mb-3">Your Clients</h2>

        {loading && (
          <p className="text-slate-400 text-sm">Loading clients...</p>
        )}

        {errorMsg && (
          <p className="text-red-400 text-sm mb-2">{errorMsg}</p>
        )}

        {!loading && clients.length === 0 && !errorMsg && (
          <p className="text-slate-400 text-sm">
            No active clients yet. Once users are assigned to you, they&apos;ll appear here.
          </p>
        )}

        <div className="mt-3 space-y-3">
          {clients.map((c) => (
  <Link
    href={`/trainer/clients/${encodeURIComponent(c.userId)}`}
    key={`${c.userId}-${c.trainerId}`}
  >
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between hover:border-emerald-500/70 hover:bg-slate-800 cursor-pointer transition">
      <div>
        <p className="text-slate-50 text-sm font-medium">
          User: {c.userId}
        </p>
        <p className="text-slate-400 text-xs mt-1">
          Status:{" "}
          <span className="uppercase tracking-wide text-[11px]">
            {c.status}
          </span>
          {c.assignedAt && (
            <> • since {new Date(c.assignedAt).toLocaleDateString()}</>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* unread badge */}
        {c.unreadCount && c.unreadCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-red-500/90 text-[11px] font-semibold text-white px-2 py-0.5">
            {c.unreadCount > 9 ? "9+" : c.unreadCount} new
          </span>
        )}

        <span className="text-xs text-emerald-400">
          View details →
        </span>
      </div>
    </div>
  </Link>
))}

        </div>
      </div>
    </div>
  );
}
