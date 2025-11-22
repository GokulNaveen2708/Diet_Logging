"use client";

// Chat area for a user to talk with their assigned trainer.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserId, getUserTrainerId } from "@/lib/storage";
import ChatWindow from "@/components/ChatWindow";

export default function UserChatPage() {
    const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // runs only on client
    setUserId(getUserId());
    setTrainerId("4dbed823-35dd-4ce5-b79c-98ec08800c29");
    setReady(true);
  }, []);

  // First render (server + client) – keep it simple and consistent
  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading chat...</p>
      </div>
    );
  }

  if (!userId || !trainerId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-center text-red-400 p-10">
          Trainer not assigned. Please assign a trainer from your dashboard first.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/user")}
          className="text-sm text-slate-300 hover:text-white"
        >
          ← Back to dashboard
        </button>
        <h1 className="text-lg text-white font-semibold">Chat with trainer</h1>
        <div /> {/* spacer */}
      </div>

      <ChatWindow userId={userId} trainerId={trainerId} senderType="user" />
    </div>
  );
}
