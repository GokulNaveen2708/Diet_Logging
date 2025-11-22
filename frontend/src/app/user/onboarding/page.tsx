"use client";

// Collects the metrics required to create a diet user profile.

import { useState } from "react";
import { createAppUser } from "@/lib/apiClient";
import { saveUserId } from "@/lib/storage";
import { useRouter } from "next/navigation";

export default function UserOnboardingPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
   const router = useRouter();         

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const body = {
        name,
        role: "user" as const,
        email,                       // 👈 required now
        gender: gender || undefined, // send only if selected
        weightLbs: weightLbs ? Number(weightLbs) : undefined,
        heightFeet: heightFeet ? Number(heightFeet) : undefined,
        heightInches: heightInches ? Number(heightInches) : undefined,
        age: age ? Number(age) : undefined,
      };

      const res = await createAppUser(body);
      saveUserId(res.userId);
      setSuccessMsg(`User created! Your userId is ${res.userId}`);
      router.push("/user");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-50 mb-1">
          Create your profile
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          We&apos;ll use this to personalize your diet analytics.
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

          {/* Weight + Age */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Weight (lbs)
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Age</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>

          {/* Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Height (ft)
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Height (in)
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value)}
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Gender</label>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
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
