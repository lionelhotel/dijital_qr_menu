import type { Locale } from "./config";

export const dictionary = {
  tr: {
    all: "Tümü",
    search: "Menüde ara",
    filters: "Filtreler",
    available: "Mevcut ürünler",
    noResults: "Bu arama için sonuç bulunamadı.",
    unavailable: "Geçici olarak mevcut değil",
    featured: "Şefin önerisi",
    new: "Yeni",
    details: "Detaylar",
    ingredients: "İçindekiler",
    allergens: "Alerjenler",
    dietary: "Etiketler",
    calories: "Kalori",
    portion: "Porsiyon",
    prepTime: "Hazırlanma süresi",
    minutesShort: "dk",
    nutritionAverageNote: "1 porsiyon için ortalama olarak hesaplanmıştır.",
    notice:
      "Ürün içerikleri ve alerjen bilgileri hakkında detaylı bilgi için servis ekibimizle iletişime geçebilirsiniz.",
    welcome: "Lezzet yolculuğumuza hoş geldiniz.",
    welcomeSub: "Özenle hazırlanan seçkin tatlarımızı keşfedin."
  },
  en: {
    all: "All",
    search: "Search menu",
    filters: "Filters",
    available: "Available items",
    noResults: "No results found for this search.",
    unavailable: "Temporarily unavailable",
    featured: "Chef's pick",
    new: "New",
    details: "Details",
    ingredients: "Ingredients",
    allergens: "Allergens",
    dietary: "Tags",
    calories: "Calories",
    portion: "Portion",
    prepTime: "Preparation time",
    minutesShort: "min",
    nutritionAverageNote: "Calculated as an average for one portion.",
    notice:
      "Please contact our service team for detailed information about ingredients and allergens.",
    welcome: "Welcome to our culinary journey.",
    welcomeSub: "Discover our carefully prepared selection of flavors."
  },
  es: {
    all: "Todo",
    search: "Buscar en el menú",
    filters: "Filtros",
    available: "Productos disponibles",
    noResults: "No se encontraron resultados para esta búsqueda.",
    unavailable: "Temporalmente no disponible",
    featured: "Recomendación del chef",
    new: "Nuevo",
    details: "Detalles",
    ingredients: "Ingredientes",
    allergens: "Alérgenos",
    dietary: "Etiquetas",
    calories: "Calorías",
    portion: "Porción",
    prepTime: "Tiempo de preparación",
    minutesShort: "min",
    nutritionAverageNote: "Calculado como promedio para una porción.",
    notice:
      "Para información detallada sobre ingredientes y alérgenos, contacte con nuestro equipo de servicio.",
    welcome: "Bienvenido a nuestro viaje gastronómico.",
    welcomeSub: "Descubra nuestra selección de sabores cuidadosamente preparados."
  }
} satisfies Record<Locale, Record<string, string>>;

export function t(locale: Locale, key: keyof (typeof dictionary)["en"]) {
  return dictionary[locale][key] ?? dictionary.en[key];
}
