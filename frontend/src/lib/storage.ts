const USER_ID_KEY = "diet_app_user_id";

/** Persist the currently active userId in localStorage. */
export function saveUserId(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_ID_KEY, userId);
}

/** Retrieve the stored userId for the current browser. */
export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ID_KEY);
}

const TRAINER_ID_KEY = "diet_app_trainer_id";

/** Persist the signed-in trainer's id. */
export function saveTrainerId(trainerId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRAINER_ID_KEY, trainerId);
}

/** Retrieve an existing trainer id from storage. */
export function getTrainerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TRAINER_ID_KEY);
}

const USER_TRAINER_ID_KEY = "diet_app_user_trainer_id";

/** Cache the trainer id that a user is assigned to. */
export function saveUserTrainerId(trainerId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_TRAINER_ID_KEY, trainerId);
}

/** Read the currently assigned trainer id (if any). */
export function getUserTrainerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_TRAINER_ID_KEY);
}
