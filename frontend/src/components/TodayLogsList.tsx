// Simple list view of today's logged foods.
export default function TodayLogsList({ logs }: { logs: any[] }) {
  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
      <h2 className="text-xl text-white mb-3">Today's Logs</h2>

      {logs.length === 0 && (
        <p className="text-slate-400">No food logged yet.</p>
      )}

      <div className="space-y-2">
        {logs.map((item, index) => (
          <div key={index} className="p-3 bg-slate-800 rounded-lg">
            <p className="text-white font-medium">{item.foodName}</p>
            <p className="text-slate-400 text-sm">
              {item.quantity}{item.unit} • {item.mealType}
            </p>
            <p className="text-slate-400 text-sm">
              {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
