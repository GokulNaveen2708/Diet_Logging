"use client";

// Collects information required to register a trainer.

import { useState } from "react";
import { createTrainer } from "@/lib/apiClient";
import { saveTrainerId } from "@/lib/storage";

export default function TrainerOnboardingPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [maxClients, setMaxClients] = useState("10");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await createTrainer({
        name,
        email,
        maxClients: maxClients ? Number(maxClients) : undefined,
      });

      // ⬇️ pick correct id depending on backend response
      const trainerId = (res as any).trainerId ?? (res as any).userId;

      saveTrainerId(trainerId);
      setSuccessMsg(`Trainer created! Your trainerId is ${trainerId}`);
      // later: router.push("/trainer")
    } catch (err: any) {
      console.error("Trainer creation error:", err);
      setErrorMsg(err.message ?? "Failed to create trainer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-50 mb-1">
          Trainer setup
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Create your coach profile to start working with clients.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name</label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Max Clients */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Max clients
            </label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={maxClients}
              onChange={(e) => setMaxClients(e.target.value)}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used for auto-assigning new users to trainers.
            </p>
          </div>

          {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
          {successMsg && (
            <p className="text-sm text-emerald-400">{successMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
