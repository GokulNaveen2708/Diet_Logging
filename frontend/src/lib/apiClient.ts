/**
 * REST API helper utilities for the Diet Logging frontend.
 * Every exported helper wraps a single backend endpoint.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

if (!API_BASE) {
  console.error("API base URL is NOT defined");
  // optional: throw new Error("API base URL not configured");
} else {
  console.log("API base URL =", API_BASE);
}

export type BaseUserBody = {
  name: string;
  email: string;
  gender?: string;
  weightLbs?: number;
  heightFeet?: number;
  heightInches?: number;
  age?: number;
  maxClients?: number;
};

export type CreateUserResponse = {
  userId: string;  // backend: create_user returns this
  user: any;
};

export type CreateTrainerResponse = {
  trainerId: string;  // backend: create_trainer returns this
  trainer: any;
};

/**
 * POST helper for /users that creates both regular users and trainers.
 */
async function postUsers<T>(body: any): Promise<T> {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create user/trainer: ${res.status} - ${text}`);
  }

  return res.json();
}

// --------- PUBLIC HELPERS ---------

/**
 * Create an end-user profile via the API.
 */
export function createAppUser(body: BaseUserBody): Promise<CreateUserResponse> {
  return postUsers<CreateUserResponse>({
    ...body,
    role: "user",
  });
}

/**
 * Create a trainer profile via the API.
 */
export function createTrainer(body: BaseUserBody): Promise<CreateTrainerResponse> {
  return postUsers<CreateTrainerResponse>({
    ...body,
    role: "trainer",
  });
}

// SUMMARY -----------------------------------------

/** Fetch the aggregated macro summary for the current day. */
export async function getTodaySummary(userId: string) {
  const res = await fetch(`${API_BASE}/summary/today?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to get today's summary");
  return res.json();
}

// TODAY LOGS --------------------------------------

/** Retrieve today's logged meals for a user. */
export async function getTodayLogs(userId: string) {
  const res = await fetch(`${API_BASE}/diet-logs/today?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to get today's logs");
  return res.json();
}

// FOOD SEARCH -------------------------------------

/** Perform a basic foods table search via backend proxy. */
export async function searchFoods(query: string) {
  const res = await fetch(`${API_BASE}/foods/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search foods");
  return res.json();
}

// LOG FOOD ----------------------------------------

/** Log a meal along with macros. */
export async function logFood(body: {
  userId: string;
  foodId: string;
  quantity: number;
  unit: string;
  mealType: string;
}) {
  const res = await fetch(`${API_BASE}/diet-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Failed to log food");

  return res.json();
}


// ---- Get Trainer assigned Clients -----

/** List clients currently assigned to a trainer. */
export async function getTrainerClients(trainerId: string) {
  const res = await fetch(
    `${API_BASE}/trainer/clients?trainerId=${encodeURIComponent(trainerId)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get trainer clients: ${res.status} - ${text}`);
  }
  return res.json(); // expected: { clients: [...] }
}


// ------- Assign trainer: either auto-match or specific trainer ---------
/** Assign the provided trainer, or let the backend pick the best fit. */
export async function assignTrainer(body: {
  userId: string;
  trainerId?: string; // optional for auto-match
}) {
  const res = await fetch(`${API_BASE}/trainer/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to assign trainer: ${res.status} - ${text}`);
  }

  // expected backend shape: { userId, trainerId, status: "active", ... }
  return res.json();
}

/** Return chat messages exchanged between a user and trainer. */
export async function getMessages(userId: string, trainerId: string) {
  const res = await fetch(
    `${API_BASE}/messages?userId=${userId}&trainerId=${trainerId}`
  );

  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

/** Persist a new chat message in the conversation thread. */
export async function sendMessage(body: {
  userId: string;
  trainerId: string;
  senderRole: "user" | "trainer" | "system";
  message: string;
}) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("sendMessage error:", res.status, text);
    throw new Error(`Failed to send message: ${res.status} - ${text}`);
  }

  return res.json();
}

