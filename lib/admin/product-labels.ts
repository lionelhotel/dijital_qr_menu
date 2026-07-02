type LocalizedText = Record<"tr" | "en" | "es", string>;

export type ProductLabelInput = {
  name: LocalizedText;
  shortDescription: LocalizedText;
  ingredients: LocalizedText;
  spicyLevel?: number | null;
};

const allergenRules: Record<string, string[]> = {
  gluten: [
    "gluten",
    "buğday",
    "bugday",
    "un",
    "ekmek",
    "kruton",
    "pasta",
    "makarna",
    "penne",
    "spaghetti",
    "burger ekmeği",
    "brioche",
    "wheat",
    "flour",
    "bread",
    "crouton"
  ],
  milk: [
    "süt",
    "sütlü",
    "sut",
    "peynir",
    "cheddar",
    "parmesan",
    "tereyağı",
    "tereyagi",
    "krema",
    "yoğurt",
    "yogurt",
    "milk",
    "cheese",
    "butter",
    "cream",
    "queso",
    "leche",
    "mantequilla"
  ],
  egg: ["yumurta", "mayonez", "egg", "mayonnaise", "huevo"],
  peanut: ["yer fıstığı", "yer fistigi", "peanut", "cacahuete"],
  nuts: ["fındık", "findik", "badem", "ceviz", "antep fıstığı", "almond", "walnut", "hazelnut", "pistachio", "frutos secos"],
  soy: ["soya", "soy sauce", "soybean", "soja"],
  fish: ["balık", "balik", "somon", "fish", "salmon", "salmón", "pescado"],
  shellfish: ["karides", "midye", "istiridye", "shellfish", "shrimp", "mussel", "oyster", "mariscos"],
  sesame: ["susam", "sesame", "sésamo"],
  mustard: ["hardal", "mustard", "mostaza"],
  celery: ["kereviz", "celery", "apio"],
  sulfite: ["sülfit", "sulfit", "sulfite", "sulphite", "şarap", "sarap", "wine", "vino"]
};

const animalTerms = [
  "tavuk",
  "chicken",
  "pollo",
  "dana",
  "beef",
  "ternera",
  "burger",
  "somon",
  "salmon",
  "salmón",
  "balık",
  "fish",
  "pescado",
  "karides",
  "shrimp",
  "kabuklu",
  "shellfish",
  "yumurta",
  "egg",
  "huevo",
  "süt",
  "milk",
  "leche",
  "peynir",
  "cheese",
  "queso",
  "tereyağı",
  "butter",
  "mantequilla",
  "yoğurt",
  "yogurt",
  "bal ",
  " honey"
];

const meatOrFishTerms = [
  "tavuk",
  "chicken",
  "pollo",
  "dana",
  "beef",
  "ternera",
  "burger",
  "somon",
  "salmon",
  "salmón",
  "balık",
  "fish",
  "pescado",
  "karides",
  "shrimp",
  "shellfish",
  "mariscos"
];

const spicyTerms = ["acı", "aci", "acılı", "chili", "biber", "picante", "arrabbiata"];
const nonAlcoholicTerms = ["alkolsüz", "non-alcoholic", "sin alcohol", "virgin", "mocktail", "soda", "juice", "meyve suyu", "kahve", "coffee"];

export const contentManagedDietaryKeys = new Set(["vegan", "vegetarian", "gluten-free", "lactose-free", "spicy", "non-alcoholic"]);

export function inferAllergenKeys(input: ProductLabelInput) {
  const text = searchableText(input);
  return Object.entries(allergenRules)
    .filter(([, keywords]) => keywords.some((keyword) => hasTerm(text, keyword)))
    .map(([key]) => key);
}

export function inferDietaryTagKeys(input: ProductLabelInput, allergenKeys: string[]) {
  const text = searchableText(input);
  const allergens = new Set(allergenKeys);
  const keys = new Set<string>();

  const hasAnimal = animalTerms.some((term) => hasTerm(text, term)) || allergens.has("milk") || allergens.has("egg") || allergens.has("fish") || allergens.has("shellfish");
  const hasMeatOrFish = meatOrFishTerms.some((term) => hasTerm(text, term)) || allergens.has("fish") || allergens.has("shellfish");

  if (!hasAnimal) keys.add("vegan");
  if (!hasMeatOrFish) keys.add("vegetarian");
  if (!allergens.has("gluten")) keys.add("gluten-free");
  if (!allergens.has("milk")) keys.add("lactose-free");
  if ((input.spicyLevel ?? 0) > 0 || spicyTerms.some((term) => hasTerm(text, term))) keys.add("spicy");
  if (nonAlcoholicTerms.some((term) => hasTerm(text, term))) keys.add("non-alcoholic");

  return [...keys];
}

function searchableText(input: ProductLabelInput) {
  return normalize(
    [
      input.name.tr,
      input.name.en,
      input.name.es,
      input.shortDescription.tr,
      input.shortDescription.en,
      input.shortDescription.es,
      input.ingredients.tr,
      input.ingredients.en,
      input.ingredients.es
    ].join(" ")
  );
}

function normalize(value: string) {
  return ` ${value.toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim()} `;
}

function hasTerm(text: string, term: string) {
  return text.includes(normalize(term));
}
