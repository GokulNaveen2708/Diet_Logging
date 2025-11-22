"use client";

// Dedicated trainer chat route scoped to a single client.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTrainerId } from "@/lib/storage";
import { useRouter } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";

export default function TrainerClientChatPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // client-side only
    setTrainerId(getTrainerId());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading chat...</p>
      </div>
    );
  }

  if (!trainerId || !userId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-center text-red-400 p-10">
          Missing trainer or user information.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-4">
      <Link
        href="/trainer"
        className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
      >
        ← Back to dashboard
      </Link>
      <h1 className="text-xl text-white font-semibold mb-4">
        Chat with user {userId}
      </h1>
      <ChatWindow userId={userId} trainerId={trainerId} senderType="trainer" />
    </div>
  );
}
