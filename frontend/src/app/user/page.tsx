"use client";


// Main dashboard shown after onboarding for end users.
      import { PieChart } from '@mui/x-charts/PieChart';
import { useEffect, useState } from "react";
import { getUserId, getUserTrainerId } from "@/lib/storage";
import { getTodaySummary, getTodayLogs } from "@/lib/apiClient";
import MacroBar from "@/components/MacroBar";
import FoodSearch from "@/components/FoodSearch";
import MealTimeline from "@/components/MealTimeline";
import UserTrainerSection from "@/components/userTrainerSection";
import { Button } from "@mui/material";

export default function UserDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const [assignedTrainerId, setAssignedTrainerId] = useState<string | null>(
    null
  );

  useEffect(() => {

    const id = getUserId();
    setUserId(id);

    const storedTrainerId = getUserTrainerId();
    setAssignedTrainerId(storedTrainerId);

    if (!id) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const summaryRes = await getTodaySummary(id);
        const logsRes = await getTodayLogs(id);

        setSummary(summaryRes.summary || null);
        setLogs(logsRes.items || []);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (!userId) {
    return (
      <div className="text-center text-red-400 p-10">
        No user found. Please complete onboarding.
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      <h1 className="text-3xl text-white font-semibold">
         Your Daily Dashboard
         <Button loading ={loading} variant="outlined"> i am loaded </Button>
        </h1>

      <MacroBar summary={summary} />

      {/* Trainer assignment section */}
      <UserTrainerSection
        userId={userId}
        assignedTrainerId={assignedTrainerId}
        onAssigned={(trainerId) => setAssignedTrainerId(trainerId)}
      />

      <FoodSearch
        userId={userId}
        onFoodLogged={() => {
          // simple refresh for now
          window.location.reload();
        }}
      />


      <MealTimeline logs={logs} />



    <PieChart
      series={[
        {
          data: [
            { id: 0, value: 10, label: 'series A' },
            { id: 1, value: 15, label: 'series B' },
            { id: 2, value: 20, label: 'series C' },
          ],
        },
      ]}
      width={200}
      height={200}
    />

    </div>
  );
}
