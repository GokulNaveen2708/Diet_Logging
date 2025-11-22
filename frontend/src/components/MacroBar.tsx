// Displays a macro donut chart and cards for a user's daily intake.

type Summary = {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

// simple hard-coded goal for now
const CALORIE_GOAL = 2200;

export default function MacroBar({ summary }: { summary: Summary | null }) {
  if (!summary) {
    return (
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <h2 className="text-xl text-white mb-2">Today&apos;s Macros</h2>
        <p className="text-slate-400 text-sm">
          No summary for today yet. Log your first food to see your dashboard.
        </p>
      </div>
    );
  }

  const { totalCalories, totalProtein, totalCarbs, totalFat } = summary;

  const pctCalories = Math.min(
    100,
    Math.round((totalCalories / CALORIE_GOAL) * 100)
  );

  const totalMacros = totalProtein + totalCarbs + totalFat || 1;
  const proteinPct = (totalProtein / totalMacros) * 100;
  const carbsPct = (totalCarbs / totalMacros) * 100;
  const fatPct = (totalFat / totalMacros) * 100;

  // conic-gradient for donut breakdown
  const donutBg = `conic-gradient(
    rgb(16 185 129) 0 ${proteinPct}%,
    rgb(56 189 248) ${proteinPct}% ${proteinPct + carbsPct}%,
    rgb(251 191 36) ${proteinPct + carbsPct}% 100%
  )`;

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
      {/* Donut */}
      <div className="flex items-center justify-center flex-1">
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 180,
            height: 180,
            backgroundImage: donutBg,
          }}
        >
          <div className="absolute inset-6 bg-slate-950 rounded-full flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Calories
            </span>
            <span className="text-3xl font-semibold text-white">
              {Math.round(totalCalories)}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              of {CALORIE_GOAL} kcal
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {pctCalories}% of goal
            </span>
          </div>
        </div>
      </div>

      {/* Macro cards */}
      <div className="flex-1 space-y-3">
        <h2 className="text-lg text-white font-medium">
          Today&apos;s Macro Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MacroPill
            label="Protein"
            grams={totalProtein}
            pct={proteinPct}
            color="bg-emerald-500"
          />
          <MacroPill
            label="Carbs"
            grams={totalCarbs}
            pct={carbsPct}
            color="bg-sky-500"
          />
          <MacroPill
            label="Fat"
            grams={totalFat}
            pct={fatPct}
            color="bg-amber-400"
          />
        </div>
      </div>
    </div>
  );
}

function MacroPill({
  label,
  grams,
  pct,
  color,
}: {
  label: string;
  grams: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-100">{label}</span>
        <span
          className={`inline-flex items-center justify-center w-1.5 h-1.5 rounded-full ${color}`}
        />
      </div>
      <span className="text-lg font-semibold text-white">
        {grams.toFixed(1)} g
      </span>
      <div className="mt-1 w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`${color} h-full transition-all`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="text-[11px] text-slate-400 mt-1">
        {pct.toFixed(1)}% of macros
      </span>
    </div>
  );
}
