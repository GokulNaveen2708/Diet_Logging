"use client";

import { useRouter } from "next/navigation";
import { getUserId, getTrainerId } from "@/lib/storage";

export default function LandingPage() {
  const router = useRouter();

  function handleUserClick() {
    const userId = getUserId();
    if (userId) {
      router.push("/user");
    } else {
      router.push("/user/onboarding");
    }
  }

  function handleTrainerClick() {
    const trainerId = getTrainerId();
    if (trainerId) {
      router.push("/trainer");
    } else {
      router.push("/trainer/onboarding");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        {/* Logo / title */}
        <div className="mb-8">
          {/* replace with your logo image if you have one */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xl mb-3">
            DL
          </div>
          <h1 className="text-3xl font-semibold text-white">
            Diet Logging
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Log your meals, track your macros, and collaborate with your coach.
          </p>
        </div>

        {/* Role selection */}
        <div className="space-y-4">
          <button
            onClick={handleUserClick}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium py-3 text-sm transition"
          >
            I&apos;m a user
          </button>

          <button
            onClick={handleTrainerClick}
            className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-3 text-sm border border-slate-600 transition"
          >
            I&apos;m a trainer
          </button>
        </div>
      </div>
    </div>
  );
}
