export interface CustomPack {
  id: string;
  title: string;
  category: string;
  words: string[];
  createdAt: number;
}

const STORAGE_KEY = "bof_custom_packs";

export function fetchCustomPacks(): CustomPack[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to load custom packs:", err);
    return [];
  }
}

export function createCustomPack(title: string, category: string, words: string[]): CustomPack {
  const packs = fetchCustomPacks();
  const newPack: CustomPack = {
    id: "custom_" + Math.random().toString(36).substring(2, 9),
    title: title.trim(),
    category: category.trim() || "Custom",
    words: words.map((w) => w.trim()).filter(Boolean),
    createdAt: Date.now(),
  };
  const updated = [newPack, ...packs];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newPack;
}

export function deleteCustomPack(id: string): void {
  const packs = fetchCustomPacks();
  const updated = packs.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
