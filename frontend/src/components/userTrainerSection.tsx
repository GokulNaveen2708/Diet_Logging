"use client";

// Renders the trainer assignment card for the user dashboard.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { assignTrainer } from "@/lib/apiClient";
import { saveUserTrainerId } from "@/lib/storage";

type Props = {
  userId: string;
  assignedTrainerId: string | null;
  onAssigned: (trainerId: string) => void;
};

export default function UserTrainerSection({
  userId,
  assignedTrainerId,
  onAssigned,
}: Props) {
    const router = useRouter();
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  async function handleAutoAssignTrainer() {
    if (!userId) return;
    setAssigning(true);
    setAssignError(null);

    try {
      const res = await assignTrainer({ userId }); // auto-match mode
      const trainerId = (res as any).trainerId;    // adjust if backend uses different key

      if (!trainerId) {
        throw new Error("No trainerId returned from backend");
      }

      // persist + bubble up
      saveUserTrainerId(trainerId);
      onAssigned(trainerId);
    } catch (err: any) {
      console.error("Assign trainer error:", err);
      setAssignError(err.message ?? "Failed to assign trainer");
    } finally {
      setAssigning(false);
    }
  }
  function handleOpenChat(){
    router.push("/user/chat");
  }

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h2 className="text-lg text-white font-medium">Your Trainer</h2>
        {assignedTrainerId ? (
          <p className="text-slate-400 text-sm mt-1">
            Assigned trainer ID:{" "}
            <span className="text-emerald-400 font-mono">
              {assignedTrainerId}
            </span>
          </p>
        ) : (
          <p className="text-slate-400 text-sm mt-1">
            You don&apos;t have a trainer yet. Get auto-matched to one.
          </p>
        )}
        {assignError && (
          <p className="text-sm text-red-400 mt-1">{assignError}</p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
        {assignedTrainerId ? (
           <button
            onClick={handleOpenChat}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition"
          >
            Open chat
          </button>
        ) : (
          <button
            onClick={handleAutoAssignTrainer}
            disabled={assigning}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {assigning ? "Assigning..." : "Auto-assign me a trainer"}
          </button>
        )}
      </div>
    </div>
  );
}
