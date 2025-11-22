// Renders meals chronologically with macros for each entry.

type LogItem = {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  mealType: string;
};

const MEALS = ["breakfast", "lunch", "dinner", "snack"];

export default function MealTimeline({ logs }: { logs: LogItem[] }) {
  // group logs by meal
  const grouped = MEALS.map((meal) => ({
    meal,
    items: logs.filter((l) => l.mealType === meal),
  }));

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg space-y-6">
      <h2 className="text-xl text-white mb-2">Today&apos;s Meals</h2>

      <div className="space-y-8">
        {grouped.map(({ meal, items }) => (
          <div key={meal} className="space-y-2">
            {/* Meal title */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <h3 className="text-lg font-medium text-white capitalize">{meal}</h3>
            </div>

            {/* List of foods */}
            {items.length === 0 ? (
              <p className="text-slate-500 text-sm ml-5">No foods logged</p>
            ) : (
              <div className="space-y-2 ml-5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800 p-3 rounded-lg border border-slate-700"
                  >
                    <p className="text-white font-medium">{item.foodName}</p>

                    <p className="text-slate-400 text-sm">
                      {item.quantity}
                      {item.unit} • {item.calories.toFixed(1)} kcal
                    </p>

                    <p className="text-slate-500 text-xs mt-1">
                      P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
