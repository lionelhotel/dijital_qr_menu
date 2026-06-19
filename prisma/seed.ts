import { hash } from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { slugify } from "../lib/utils";

const prisma = new PrismaClient();
const locales = ["tr", "en", "es"] as const;

async function main() {
  await prisma.language.createMany({
    data: [
      { code: "tr", name: "Türkçe" },
      { code: "en", name: "English", isDefault: true },
      { code: "es", name: "Español" }
    ],
    skipDuplicates: true
  });

  for (const role of [UserRole.SUPER_ADMIN, UserRole.MENU_MANAGER, UserRole.EDITOR]) {
    await prisma.role.upsert({
      where: { key: role },
      update: {},
      create: { key: role, name: role.replace("_", " ") }
    });
  }

  await prisma.businessSetting.upsert({
    where: { id: "default-business" },
    update: {},
    create: {
      id: "default-business",
      businessName: "Lionel Hotel Istanbul",
      venueName: "Restaurant & Bar",
      website: "https://www.lionelhotel.com.tr",
      defaultCurrency: "TRY",
      coverImageUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
      footerText: {
        tr: "Afiyet olsun.",
        en: "Enjoy your meal.",
        es: "Buen provecho."
      },
      allergenNotice: {
        tr: "Alerjen bilgileri için servis ekibimizle iletişime geçiniz.",
        en: "Please contact our service team for allergen information.",
        es: "Contacte con nuestro equipo para información sobre alérgenos."
      }
    }
  });

  await prisma.themeSetting.upsert({
    where: { id: "default-theme" },
    update: {},
    create: { id: "default-theme" }
  });

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me-before-production";
  await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com" },
    update: {},
    create: {
      name: "Sistem Yöneticisi",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
      username: process.env.SEED_ADMIN_USERNAME ?? "admin",
      passwordHash: await hash(adminPassword, 12),
      role: UserRole.SUPER_ADMIN
    }
  });

  const allergens = [
    ["gluten", "🌾", ["Gluten", "Gluten", "Gluten"]],
    ["milk", "🥛", ["Süt ve süt ürünleri", "Milk", "Leche"]],
    ["egg", "🥚", ["Yumurta", "Egg", "Huevo"]],
    ["peanut", "🥜", ["Yer fıstığı", "Peanut", "Cacahuete"]],
    ["nuts", "🌰", ["Sert kabuklu yemişler", "Tree nuts", "Frutos secos"]],
    ["soy", "🫘", ["Soya", "Soy", "Soja"]],
    ["fish", "🐟", ["Balık", "Fish", "Pescado"]],
    ["shellfish", "🦐", ["Kabuklu deniz ürünleri", "Shellfish", "Mariscos"]],
    ["sesame", "⚪", ["Susam", "Sesame", "Sésamo"]],
    ["mustard", "🟡", ["Hardal", "Mustard", "Mostaza"]],
    ["celery", "🥬", ["Kereviz", "Celery", "Apio"]],
    ["sulfite", "🍷", ["Sülfit", "Sulfite", "Sulfitos"]]
  ] as const;

  for (const [key, icon, names] of allergens) {
    const allergen = await prisma.allergen.upsert({
      where: { key },
      update: { icon },
      create: { key, icon }
    });
    await upsertTranslations("allergen", allergen.id, names);
  }

  const dietaryTags = [
    ["vegetarian", "🥗", ["Vejetaryen", "Vegetarian", "Vegetariano"]],
    ["vegan", "🌱", ["Vegan", "Vegan", "Vegano"]],
    ["gluten-free", "🌾", ["Glutensiz", "Gluten-free", "Sin gluten"]],
    ["lactose-free", "🥛", ["Laktozsuz", "Lactose-free", "Sin lactosa"]],
    ["spicy", "🌶️", ["Acılı", "Spicy", "Picante"]],
    ["chef", "⭐", ["Şefin önerisi", "Chef's pick", "Recomendación del chef"]],
    ["local", "📍", ["Yerel ürün", "Local product", "Producto local"]],
    ["new", "✨", ["Yeni ürün", "New item", "Nuevo producto"]],
    ["non-alcoholic", "🍹", ["Alkolsüz", "Non-alcoholic", "Sin alcohol"]]
  ] as const;

  for (const [key, icon, names] of dietaryTags) {
    const tag = await prisma.dietaryTag.upsert({
      where: { key },
      update: { icon },
      create: { key, icon }
    });
    await upsertTranslations("dietary", tag.id, names);
  }

  const categories = [
    ["breakfast", ["Kahvaltı", "Breakfast", "Desayuno"]],
    ["starters", ["Başlangıçlar", "Starters", "Entrantes"]],
    ["soups", ["Çorbalar", "Soups", "Sopas"]],
    ["salads", ["Salatalar", "Salads", "Ensaladas"]],
    ["main-courses", ["Ana Yemekler", "Main Courses", "Platos Principales"]],
    ["pasta", ["Makarnalar", "Pasta", "Pastas"]],
    ["desserts", ["Tatlılar", "Desserts", "Postres"]],
    ["hot-beverages", ["Sıcak İçecekler", "Hot Beverages", "Bebidas Calientes"]],
    ["cold-beverages", ["Soğuk İçecekler", "Cold Beverages", "Bebidas Frías"]],
    ["mocktails", ["Alkolsüz Kokteyller", "Mocktails", "Cócteles Sin Alcohol"]]
  ] as const;

  const categoryMap = new Map<string, string>();
  for (const [index, [slug, names]] of categories.entries()) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { sortOrder: index },
      create: { slug, sortOrder: index }
    });
    categoryMap.set(slug, category.id);
    await upsertCategoryTranslations(category.id, names);
  }

  const productSeed = [
    {
      category: "soups",
      names: ["Mercimek Çorbası", "Lentil Soup", "Sopa de Lentejas"],
      descriptions: [
        "Kırmızı mercimek, havuç, soğan ve geleneksel baharatlarla hazırlanan klasik Türk çorbası.",
        "A classic Turkish soup prepared with red lentils, carrots, onions and traditional spices.",
        "Una sopa turca clásica preparada con lentejas rojas, zanahorias, cebolla y especias tradicionales."
      ],
      price: 190,
      allergens: ["gluten"],
      tags: ["vegetarian"],
      image:
        "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80"
    },
    {
      category: "salads",
      names: ["Tavuklu Sezar Salata", "Chicken Caesar Salad", "Ensalada César con Pollo"],
      descriptions: [
        "Izgara tavuk, marul, parmesan peyniri, kruton ve Sezar sos.",
        "Grilled chicken, romaine lettuce, Parmesan cheese, croutons and Caesar dressing.",
        "Pollo a la parrilla, lechuga romana, queso parmesano, picatostes y salsa César."
      ],
      price: 420,
      allergens: ["gluten", "milk", "egg"],
      tags: [],
      image:
        "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80"
    },
    {
      category: "main-courses",
      names: ["Izgara Somon", "Grilled Salmon", "Salmón a la Parrilla"],
      descriptions: [
        "Mevsim sebzeleri, patates püresi ve limonlu tereyağı sosuyla servis edilen ızgara somon.",
        "Grilled salmon served with seasonal vegetables, mashed potatoes and lemon butter sauce.",
        "Salmón a la parrilla servido con verduras de temporada, puré de patatas y salsa de mantequilla al limón."
      ],
      price: 790,
      allergens: ["fish", "milk"],
      tags: ["chef"],
      image:
        "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=1200&q=80",
      featured: true
    },
    {
      category: "main-courses",
      names: ["Izgara Dana Bonfile", "Grilled Beef Tenderloin", "Solomillo de Ternera a la Parrilla"],
      descriptions: [
        "Izgara sebzeler, patates graten ve karabiber sosuyla servis edilen dana bonfile.",
        "Beef tenderloin served with grilled vegetables, potato gratin and peppercorn sauce.",
        "Solomillo de ternera servido con verduras a la parrilla, patatas gratinadas y salsa de pimienta."
      ],
      price: 1150,
      allergens: ["milk"],
      tags: ["chef"],
      image:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
      featured: true
    },
    {
      category: "pasta",
      names: ["Penne Arrabbiata", "Penne Arrabbiata", "Penne Arrabbiata"],
      descriptions: [
        "Domates sosu, sarımsak, fesleğen ve acı biberle hazırlanan penne makarna.",
        "Penne pasta prepared with tomato sauce, garlic, basil and chili pepper.",
        "Pasta penne preparada con salsa de tomate, ajo, albahaca y chile."
      ],
      price: 390,
      allergens: ["gluten"],
      tags: ["vegan", "spicy"],
      image:
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
      spicyLevel: 3
    },
    {
      category: "main-courses",
      names: ["Lionel Cheeseburger", "Lionel Cheeseburger", "Hamburguesa Lionel con Queso"],
      descriptions: [
        "Dana burger köftesi, cheddar peyniri, marul, domates, karamelize soğan ve özel burger sosu. Patates kızartmasıyla servis edilir.",
        "Beef burger patty, cheddar cheese, lettuce, tomato, caramelized onion and special burger sauce. Served with French fries.",
        "Hamburguesa de ternera, queso cheddar, lechuga, tomate, cebolla caramelizada y salsa especial. Servida con patatas fritas."
      ],
      price: 520,
      allergens: ["gluten", "milk", "egg"],
      tags: [],
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80"
    },
    {
      category: "desserts",
      names: ["San Sebastian Cheesecake", "San Sebastian Cheesecake", "Tarta de Queso San Sebastián"],
      descriptions: [
        "Yoğun peynir dokusuna sahip, hafif karamelize edilmiş cheesecake.",
        "A rich and creamy cheesecake with a lightly caramelized surface.",
        "Una tarta de queso rica y cremosa con una superficie ligeramente caramelizada."
      ],
      price: 290,
      allergens: ["milk", "egg"],
      tags: ["new"],
      image:
        "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1200&q=80",
      isNew: true
    },
    {
      category: "breakfast",
      names: ["Türk Kahvaltı Tabağı", "Turkish Breakfast Plate", "Plato de Desayuno Turco"],
      descriptions: [
        "Peynir çeşitleri, zeytin, domates, salatalık, bal, tereyağı, reçel, haşlanmış yumurta ve ekmek sepeti.",
        "Selection of cheeses, olives, tomatoes, cucumber, honey, butter, jam, boiled egg and bread basket.",
        "Selección de quesos, aceitunas, tomates, pepino, miel, mantequilla, mermelada, huevo cocido y cesta de pan."
      ],
      price: 590,
      allergens: ["gluten", "milk", "egg"],
      tags: ["local"],
      image:
        "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80"
    },
    {
      category: "hot-beverages",
      names: ["Türk Kahvesi", "Turkish Coffee", "Café Turco"],
      descriptions: [
        "Geleneksel yöntemle hazırlanan Türk kahvesi.",
        "Traditional Turkish coffee prepared using the classic brewing method.",
        "Café turco preparado con el método tradicional."
      ],
      price: 140,
      allergens: [],
      tags: ["local"],
      image:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80"
    },
    {
      category: "hot-beverages",
      names: ["Cappuccino", "Cappuccino", "Cappuccino"],
      descriptions: [
        "Espresso, sıcak süt ve yoğun süt köpüğü.",
        "Espresso, steamed milk and rich milk foam.",
        "Espresso, leche caliente y abundante espuma de leche."
      ],
      price: 180,
      allergens: ["milk"],
      tags: [],
      image:
        "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=1200&q=80"
    },
    {
      category: "cold-beverages",
      names: ["Taze Portakal Suyu", "Fresh Orange Juice", "Zumo de Naranja Natural"],
      descriptions: [
        "Günlük sıkılmış taze portakal suyu.",
        "Freshly squeezed orange juice.",
        "Zumo de naranja recién exprimido."
      ],
      price: 220,
      allergens: [],
      tags: ["vegan"],
      image:
        "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=1200&q=80"
    },
    {
      category: "mocktails",
      names: ["Virgin Mojito", "Virgin Mojito", "Virgin Mojito"],
      descriptions: [
        "Taze lime, nane, esmer şeker, soda ve kırılmış buz.",
        "Fresh lime, mint, brown sugar, soda water and crushed ice.",
        "Lima fresca, menta, azúcar moreno, agua con gas y hielo picado."
      ],
      price: 260,
      allergens: [],
      tags: ["non-alcoholic", "vegan"],
      image:
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80"
    }
  ];

  for (const [sortOrder, product] of productSeed.entries()) {
    const created = await prisma.product.upsert({
      where: {
        id: `seed-${slugify(product.names[1])}`
      },
      update: {
        price: product.price,
        mainImageUrl: product.image,
        isFeatured: product.featured ?? false,
        isNew: product.isNew ?? false,
        spicyLevel: product.spicyLevel ?? 0
      },
      create: {
        id: `seed-${slugify(product.names[1])}`,
        categoryId: categoryMap.get(product.category)!,
        price: product.price,
        currency: "TRY",
        mainImageUrl: product.image,
        isFeatured: product.featured ?? false,
        isNew: product.isNew ?? false,
        spicyLevel: product.spicyLevel ?? 0,
        sortOrder
      }
    });
    await upsertProductTranslations(created.id, product.names, product.descriptions);
    await connectProductRelations(created.id, product.allergens, product.tags);
  }

  await prisma.qrCode.upsert({
    where: { id: "seed-lobby-bar" },
    update: {},
    create: {
      id: "seed-lobby-bar",
      name: "Lobby Bar Genel Menü",
      targetUrl: "/tr/menu?location=lobby-bar",
      location: "Lobby Bar"
    }
  });
}

async function upsertTranslations(type: "allergen" | "dietary", id: string, names: readonly string[]) {
  for (const [index, locale] of locales.entries()) {
    if (type === "allergen") {
      await prisma.allergenTranslation.upsert({
        where: { allergenId_locale: { allergenId: id, locale } },
        update: { name: names[index] },
        create: { allergenId: id, locale, name: names[index] }
      });
    } else {
      await prisma.dietaryTagTranslation.upsert({
        where: { dietaryId_locale: { dietaryId: id, locale } },
        update: { name: names[index] },
        create: { dietaryId: id, locale, name: names[index] }
      });
    }
  }
}

async function upsertCategoryTranslations(categoryId: string, names: readonly string[]) {
  for (const [index, locale] of locales.entries()) {
    await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId, locale } },
      update: { name: names[index], slug: slugify(names[index]) },
      create: { categoryId, locale, name: names[index], slug: slugify(names[index]) }
    });
  }
}

async function upsertProductTranslations(
  productId: string,
  names: readonly string[],
  descriptions: readonly string[]
) {
  for (const [index, locale] of locales.entries()) {
    await prisma.productTranslation.upsert({
      where: { productId_locale: { productId, locale } },
      update: {
        name: names[index],
        shortDescription: descriptions[index],
        detailedDescription: descriptions[index],
        ingredients: descriptions[index]
      },
      create: {
        productId,
        locale,
        name: names[index],
        shortDescription: descriptions[index],
        detailedDescription: descriptions[index],
        ingredients: descriptions[index],
        slug: slugify(names[index])
      }
    });
  }
}

async function connectProductRelations(productId: string, allergens: string[], tags: string[]) {
  for (const key of allergens) {
    const allergen = await prisma.allergen.findUniqueOrThrow({ where: { key } });
    await prisma.productAllergen.upsert({
      where: { productId_allergenId: { productId, allergenId: allergen.id } },
      update: {},
      create: { productId, allergenId: allergen.id }
    });
  }
  for (const key of tags) {
    const dietary = await prisma.dietaryTag.findUniqueOrThrow({ where: { key } });
    await prisma.productDietaryTag.upsert({
      where: { productId_dietaryId: { productId, dietaryId: dietary.id } },
      update: {},
      create: { productId, dietaryId: dietary.id }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
