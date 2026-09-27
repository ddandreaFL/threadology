/**
 * The piece vocabulary, one for one with the app
 * (threadology-native/components/piece/fields.tsx). Change both together.
 */
export const TYPE_OPTIONS: { id: string; label: string; icon: string }[] = [
  { id: "Tops", label: "tops", icon: "👕" },
  { id: "Bottoms", label: "bottoms", icon: "👖" },
  { id: "Outerwear", label: "outerwear", icon: "🧥" },
  { id: "Footwear", label: "footwear", icon: "👟" },
  { id: "Accessories", label: "accessories", icon: "👜" },
  { id: "Headwear", label: "headwear", icon: "🧢" },
  { id: "Bags", label: "bags", icon: "🎒" },
];

export const SUBCATEGORIES: Record<string, string[]> = {
  Tops: ["T-Shirt", "Polo", "Button-Down", "Hoodie", "Sweater", "Tank"],
  Bottoms: ["Jeans", "Trousers", "Shorts", "Sweatpants", "Skirt"],
  Outerwear: ["Jacket", "Coat", "Vest", "Blazer", "Parka"],
  Footwear: ["Sneakers", "Boots", "Loafers", "Dress Shoes", "Sandals"],
  Accessories: ["Belt", "Tie", "Scarf", "Gloves", "Sunglasses", "Watch", "Jewelry"],
  Headwear: ["Cap", "Hat", "Beanie", "Bucket"],
  Bags: ["Backpack", "Messenger", "Tote", "Duffel", "Crossbody"],
};

export const SEASON_OPTIONS = ["spring/summer", "fall/winter"];
export const SIZE_OPTIONS_DEFAULT = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];
export const SIZE_OPTIONS_FOOTWEAR = ["7", "8", "9", "10", "11", "12", "13"];
export const CONDITION_OPTIONS = ["deadstock", "excellent", "great", "good", "fair", "poor"];
export const COUNTRIES = [
  "USA", "Italy", "Japan", "France", "UK", "Portugal", "China", "Vietnam",
  "Indonesia", "Mexico", "Turkey", "Spain", "Germany", "Korea", "India",
  "Bangladesh", "Cambodia", "Romania", "Tunisia", "Thailand", "Canada",
  "Brazil", "Pakistan", "Morocco",
];

/**
 * Type holds category and subcategory together — "Tops — T-Shirt" — because
 * it doubles as a piece's title wherever it has no name.
 */
const SEP = " — ";
export function packType(category: string, subcategory: string | null): string {
  return subcategory ? `${category}${SEP}${subcategory}` : category;
}
export function parseType(type: string): { category: string; subcategory: string | null } {
  const at = type.indexOf(SEP);
  if (at === -1) return { category: type.trim(), subcategory: null };
  return { category: type.slice(0, at).trim(), subcategory: type.slice(at + SEP.length).trim() || null };
}
