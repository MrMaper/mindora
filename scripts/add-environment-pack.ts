import { writeFileSync } from "node:fs";
import { VOCAB_DECK_KEYS } from "../src/features/language/decks/catalog-meta";
import { loadVocabDeck } from "../src/features/language/decks/mega-decks";

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

const CANDIDATES: Array<{ front: string; back: string }> = [
  { front: "acid rain", back: "باران اسیدی" },
  { front: "afforestation", back: "جنگل‌کاری؛ درخت‌کاری" },
  { front: "air quality", back: "کیفیت هوا" },
  { front: "albedo", back: "آلبدو؛ بازتابش سطح" },
  { front: "biodiversity", back: "تنوع زیستی" },
  { front: "biofuel", back: "سوخت زیستی" },
  { front: "biomass", back: "زیست‌توده" },
  { front: "biosphere", back: "زیست‌کره" },
  { front: "carbon footprint", back: "ردپای کربن" },
  { front: "carbon offset", back: "جبران کربن" },
  { front: "carbon sink", back: "مخزن جذب کربن" },
  { front: "circular economy", back: "اقتصاد چرخشی" },
  { front: "climate crisis", back: "بحران اقلیمی" },
  { front: "compost", back: "کمپوست؛ کود آلی" },
  { front: "conservation", back: "حفاظت از طبیعت" },
  { front: "contaminant", back: "آلاینده" },
  { front: "coral reef", back: "صخرهٔ مرجانی" },
  { front: "deforestation", back: "جنگل‌زدایی" },
  { front: "desertification", back: "بیابان‌زایی" },
  { front: "drought", back: "خشکسالی" },
  { front: "eco-friendly", back: "دوستدار محیط زیست" },
  { front: "ecosystem", back: "بوم‌سامانه؛ اکوسیستم" },
  { front: "effluent", back: "پساب" },
  { front: "emission", back: "انتشار گاز/آلاینده" },
  { front: "endangered", back: "در معرض انقراض" },
  { front: "energy efficiency", back: "بهره‌وری انرژی" },
  { front: "erosion", back: "فرسایش" },
  { front: "eutrophication", back: "غنی‌شدن بیش از حد آب" },
  { front: "extinction", back: "انقراض" },
  { front: "fossil fuel", back: "سوخت فسیلی" },
  { front: "geothermal", back: "زمین‌گرمایی" },
  { front: "glacier", back: "یخچال طبیعی" },
  { front: "global warming", back: "گرمایش جهانی" },
  { front: "greenhouse gas", back: "گاز گلخانه‌ای" },
  { front: "groundwater", back: "آب زیرزمینی" },
  { front: "habitat", back: "زیستگاه" },
  { front: "hazardous waste", back: "پسماند خطرناک" },
  { front: "heatwave", back: "موج گرما" },
  { front: "hydropower", back: "نیروی برق‌آبی" },
  { front: "invasive species", back: "گونهٔ مهاجم" },
  { front: "landfill", back: "محل دفن زباله" },
  { front: "methane", back: "متان" },
  { front: "microplastic", back: "میکروپلاستیک" },
  { front: "mitigation", back: "کاهش اثرات (اقلیمی)" },
  { front: "monoculture", back: "کشت تک‌محصولی" },
  { front: "net zero", back: "خالص صفر انتشار" },
  { front: "nitrogen cycle", back: "چرخهٔ نیتروژن" },
  { front: "ozone layer", back: "لایهٔ اوزون" },
  { front: "particulate matter", back: "ذرات معلق" },
  { front: "peatland", back: "تالاب پیت" },
  { front: "permafrost", back: "یخ‌بندان دائمی" },
  { front: "photovoltaic", back: "فوتوولتائیک؛ سلول خورشیدی" },
  { front: "pollutant", back: "آلاینده" },
  { front: "recycling", back: "بازیافت" },
  { front: "reforestation", back: "جنگل‌کاری مجدد" },
  { front: "renewable energy", back: "انرژی تجدیدپذیر" },
  { front: "runoff", back: "رواناب" },
  { front: "salinization", back: "شور شدن خاک" },
  { front: "sea level rise", back: "بالا آمدن سطح دریا" },
  { front: "smog", back: "مه دود" },
  { front: "soil degradation", back: "تخریب خاک" },
  { front: "solar panel", back: "پنل خورشیدی" },
  { front: "stewardship", back: "سرپرستی مسئولانهٔ منابع" },
  { front: "sustainability", back: "پایداری" },
  { front: "toxic waste", back: "پسماند سمی" },
  { front: "water scarcity", back: "کمبود آب" },
  { front: "watershed", back: "حوضهٔ آبریز" },
  { front: "wetland", back: "تالاب" },
  { front: "wildlife corridor", back: "کریدور حیات‌وحش" },
  { front: "wind turbine", back: "توربین بادی" },
  { front: "zero waste", back: "پسماند صفر" },
  { front: "adaptation", back: "سازگاری اقلیمی" },
  { front: "aerosol", back: "هواویز؛ آئروسل" },
  { front: "agroforestry", back: "کشاورزی جنگلی" },
  { front: "aquifer", back: "سفرهٔ آب زیرزمینی" },
  { front: "biodegradable", back: "زیست‌تخریب‌پذیر" },
  { front: "biomagnification", back: "تجمع زیستی در زنجیرهٔ غذایی" },
  { front: "carbon capture", back: "جذب کربن" },
  { front: "carbon credit", back: "اعتبار کربن" },
  { front: "carrying capacity", back: "ظرفیت تحمل زیست‌محیطی" },
  { front: "climate model", back: "مدل اقلیمی" },
  { front: "coastal erosion", back: "فرسایش ساحلی" },
  { front: "composting", back: "کمپوست‌سازی" },
  { front: "decarbonize", back: "کربن‌زدایی کردن" },
  { front: "desalination", back: "شیرین‌سازی آب" },
  { front: "ecological footprint", back: "ردپای اکولوژیک" },
  { front: "ecotourism", back: "اکوتوریسم" },
  { front: "electric vehicle", back: "خودروی برقی" },
  { front: "environmental impact", back: "تأثیر زیست‌محیطی" },
  { front: "floodplain", back: "دشت سیلابی" },
  { front: "food web", back: "شبکهٔ غذایی" },
  { front: "green hydrogen", back: "هیدروژن سبز" },
  { front: "heat island", back: "جزیرهٔ گرمایی شهری" },
  { front: "industrial waste", back: "پسماند صنعتی" },
  { front: "keystone species", back: "گونهٔ کلیدی اکوسیستم" },
  { front: "leachate", back: "شیرابهٔ زباله" },
  { front: "low-carbon", back: "کم‌کربن" },
  { front: "marine pollution", back: "آلودگی دریایی" },
  { front: "nature reserve", back: "ذخیره‌گاه طبیعی" },
  { front: "overfishing", back: "صید بیش از حد" },
  { front: "overgrazing", back: "چرای بیش از حد" },
  { front: "plastic waste", back: "پسماند پلاستیکی" },
  { front: "protected area", back: "منطقهٔ حفاظت‌شده" },
  { front: "rainforest", back: "جنگل بارانی" },
  { front: "resource depletion", back: "تهی‌سازی منابع" },
  { front: "rewilding", back: "بازوحشی‌سازی طبیعت" },
  { front: "soil fertility", back: "حاصلخیزی خاک" },
  { front: "species richness", back: "غنای گونه‌ای" },
  { front: "stormwater", back: "آب ناشی از باران شدید" },
  { front: "tidal energy", back: "انرژی جزر و مد" },
  { front: "urban sprawl", back: "گسترش بی‌رویهٔ شهری" },
  { front: "waste management", back: "مدیریت پسماند" },
  { front: "water treatment", back: "تصفیهٔ آب" },
  { front: "wildfire", back: "آتش‌سوزی جنگلی" },
  { front: "wind farm", back: "مزرعهٔ بادی" },
  { front: "ash cloud", back: "ابر خاکستر آتشفشانی" },
  { front: "blue carbon", back: "کربن آبی (اقیانوس/تالاب)" },
  { front: "cap and trade", back: "سقف و مبادلهٔ انتشار" },
  { front: "climate refugee", back: "پناهجوی اقلیمی" },
  { front: "ecological niche", back: "کنام اکولوژیک" },
  { front: "green building", back: "ساختمان سبز" },
  { front: "organic farming", back: "کشاورزی ارگانیک" },
  { front: "pollinator", back: "گرده‌افشان" },
  { front: "tipping point", back: "نقطهٔ برگشت‌ناپذیر اقلیمی" },
  { front: "upcycling", back: "ارتقای بازیافتی" },
];

async function main() {
  const existing = new Set<string>();
  for (const key of VOCAB_DECK_KEYS) {
    const deck = await loadVocabDeck(key);
    if (!deck) continue;
    for (const c of deck.starter) existing.add(norm(c.front));
  }

  const kept: typeof CANDIDATES = [];
  let dropped = 0;
  for (const w of CANDIDATES) {
    const n = norm(w.front);
    if (existing.has(n)) {
      dropped++;
      continue;
    }
    existing.add(n);
    kept.push(w);
  }

  const body = kept
    .map(
      w => `  {
    "front": ${JSON.stringify(w.front)},
    "back": ${JSON.stringify(w.back)}
  }`,
    )
    .join(",\n");
  writeFileSync(
    "src/features/language/decks/banks/parts/environment.ts",
    `export default [\n${body},\n];\n`,
    "utf8",
  );
  console.log(`kept=${kept.length} dropped=${dropped} lessons=${Math.ceil(kept.length / 12)}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
