"use client";

// Food search UI that allows logging a selected item.

import { useState } from "react";
import { searchFoods, logFood } from "@/lib/apiClient";

export default function FoodSearch({ userId, onFoodLogged }: any) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [mealType, setMealType] = useState("lunch");

  async function handleSearch() {
    if (!query) return;
    const data = await searchFoods(query);
    setResults(data.items);
  }

  async function handleLog() {
  if (!selectedFood) {
    alert("No food selected");
    return;
  }

  await logFood({
    userId,
    foodId: selectedFood.foodId,
    quantity: Number(quantity),
    unit: "g",
    mealType,
  });

  setShowModal(false);
  setQuantity("");
  onFoodLogged();
}


  return (
    <>
      {/* Search box */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <input
          className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg"
          placeholder="Search for food... (e.g. rice)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button
          onClick={handleSearch}
          className="mt-3 bg-emerald-500 px-4 py-2 rounded-lg text-black"
        >
          Search
        </button>

        {/* Results */}
        <div className="mt-4 space-y-2">
          {results.map((food: any) => (
            <div
              key={food.foodId}
              className="bg-slate-800 p-3 rounded-lg cursor-pointer"
              onClick={() => {
                setSelectedFood(food);
                setShowModal(true);
              }}
            >
              <p className="text-white font-medium">{food.name}</p>
              <p className="text-slate-400 text-sm">
                {food.caloriesPerUnit} kcal / 100g
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-slate-900 p-6 rounded-xl w-80">
            <h3 className="text-white text-xl mb-4">{selectedFood.name}</h3>

            <input
              type="number"
              placeholder="Quantity (g)"
              className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg mb-3"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <select
              className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg mb-3"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-700 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleLog}
                className="flex-1 bg-emerald-500 text-black py-2 rounded-lg"
              >
                Log
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
