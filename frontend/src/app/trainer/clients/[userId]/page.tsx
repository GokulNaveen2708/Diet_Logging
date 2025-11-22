"use client"
// Trainer view showing a single client's metrics and chat.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTrainerId } from "@/lib/storage";
import Link from "next/link";
import { getTodaySummary, getTodayLogs } from "@/lib/apiClient";
import MacroBar from "@/components/MacroBar";
import MealTimeline from "@/components/MealTimeline";
import ChatWindow from "@/components/ChatWindow";

export default function TrainerClientDetailPage() {
  const params = useParams();
  const userId = params?.userId as string;

  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const tid = getTrainerId();
    setTrainerId(tid);

    if (!tid || !userId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const summaryRes = await getTodaySummary(userId);
        const logsRes = await getTodayLogs(userId);

        setSummary(summaryRes.summary || null);
        setLogs(logsRes.items || []);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message ?? "Failed to load client data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

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
        <div>
          <h1 className="text-2xl text-white font-semibold">
            Client Overview
          </h1>
          <p className="text-slate-400 text-sm">
            User ID: <span className="text-slate-200">{userId}</span>
          </p>
        </div>
      </header>

      {loading && (
        <p className="text-slate-400 text-sm">Loading client data...</p>
      )}
      {errorMsg && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}

      {!loading && !errorMsg && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: metrics + meals */}
          <div className="space-y-6">
            <Link
        href="/trainer"
        className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
      >
        ← Back to dashboard
      </Link>
            <MacroBar summary={summary} />
            <MealTimeline logs={logs} />
          </div>
          
          {/* Right: Chat */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col">
            <h2 className="text-lg text-white font-medium mb-3">
              Chat with client
            </h2>
            <div className="flex-1">
              <ChatWindow
                userId={userId}
                trainerId={trainerId}
                senderType="trainer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
