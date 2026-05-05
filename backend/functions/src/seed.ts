/**
 * Firestore Seed Script
 *
 * Populates Firestore with the initial demo data that was previously
 * hardcoded in the mobile app's mockData.ts and admin's mock.ts.
 *
 * Run: npx ts-node src/seed.ts
 * Or:  firebase emulators:exec "npx ts-node src/seed.ts"
 *
 * This script uses the Firebase Admin SDK and can target either
 * the emulator (default) or production Firestore.
 */

import * as admin from 'firebase-admin';

// Initialize with emulator or production
// Set FIRESTORE_EMULATOR_HOST=localhost:8080 for emulator
admin.initializeApp({
  projectId: 'estrogen-pharmacy',
});

const db = admin.firestore();

// ── Categories ──────────────────────────────────────────────

const categories = [
  { id: 'cat-1', nameAr: 'الحمل والأمومة', nameEn: 'Pregnancy & Maternity', icon: 'pregnancy', color: '#FDF2F8', iconColor: '#BE185D' },
  { id: 'cat-2', nameAr: 'فيتامينات ومكملات', nameEn: 'Vitamins & Supplements', icon: 'pill', color: '#ECFDF5', iconColor: '#059669' },
  { id: 'cat-3', nameAr: 'الصحة الهرمونية', nameEn: 'Hormonal Health', icon: 'flask', color: '#F5F3FF', iconColor: '#7C3AED' },
  { id: 'cat-4', nameAr: 'العناية بالبشرة', nameEn: 'Skincare', icon: 'skincare', color: '#FFF7ED', iconColor: '#EA580C' },
  { id: 'cat-5', nameAr: 'الصحة الحيضية', nameEn: 'Menstrual Health', icon: 'bloodDrop', color: '#FFF1F2', iconColor: '#E11D48' },
  { id: 'cat-6', nameAr: 'الأمراض المزمنة', nameEn: 'Chronic Conditions', icon: 'activity', color: '#EFF6FF', iconColor: '#2563EB' },
  { id: 'cat-7', nameAr: 'ما بعد الولادة', nameEn: 'Postpartum', icon: 'babyCarriage', color: '#F0FDF4', iconColor: '#16A34A' },
  { id: 'cat-8', nameAr: 'تخفيف الألم', nameEn: 'Pain Relief', icon: 'bandage', color: '#FFFBEB', iconColor: '#D97706' },
];

// ── Products ────────────────────────────────────────────────

const products = [
  {
    id: 'prod-1',
    nameAr: 'حمض الفوليك 400 مكجم', nameEn: 'Folic Acid 400mcg',
    brand: 'Jamieson', categoryId: 'cat-1',
    price: 45.00, salePrice: 38.00,
    requiresPrescription: false, inStock: true, stockCount: 48,
    pregnancySafe: true, breastfeedingSafe: true,
    descriptionAr: 'حمض الفوليك ضروري لصحة الأم والجنين، يُوصى بتناوله قبل الحمل وخلاله للحد من مخاطر عيوب الأنبوب العصبي.',
    descriptionEn: 'Essential for maternal and fetal health. Recommended before and during pregnancy to reduce neural tube defect risks.',
    usageAr: 'قرص واحد يومياً مع الطعام', usageEn: 'One tablet daily with food',
    storageAr: 'يحفظ في مكان بارد وجاف بعيداً عن الضوء', storageEn: 'Store in a cool, dry place away from light',
    warningsAr: 'استشيري طبيبكِ إذا كنتِ تتناولين أدوية أخرى', warningsEn: 'Consult your doctor if you are taking other medications',
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
    pharmacistNoteAr: 'يُنصح بالبدء بتناوله قبل الحمل بثلاثة أشهر على الأقل',
    pharmacistNoteEn: 'Recommended to start at least 3 months before pregnancy',
    tags: ['pregnancy', 'vitamins'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: 'prod-2',
    nameAr: 'فيتامين د٣ ١٠٠٠ وحدة', nameEn: 'Vitamin D3 1000 IU',
    brand: 'Nature Made', categoryId: 'cat-2',
    price: 55.00, salePrice: null,
    requiresPrescription: false, inStock: true, stockCount: 120,
    pregnancySafe: true, breastfeedingSafe: true,
    descriptionAr: 'يساعد فيتامين د٣ في امتصاص الكالسيوم وتقوية العظام والمناعة.',
    descriptionEn: 'Supports calcium absorption, bone strength, and immune function.',
    usageAr: 'قرص واحد يومياً', usageEn: 'One tablet daily',
    storageAr: 'يحفظ في درجة حرارة الغرفة', storageEn: 'Store at room temperature',
    warningsAr: 'لا تتجاوزي الجرعة الموصى بها', warningsEn: 'Do not exceed the recommended dose',
    images: ['https://images.unsplash.com/photo-1550572017-edd951b55104?w=400'],
    pharmacistNoteAr: 'شائع جداً للنساء في المملكة بسبب قلة التعرض للشمس',
    pharmacistNoteEn: 'Very common for women in Saudi Arabia due to limited sun exposure',
    tags: ['vitamins', 'bones'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: 'prod-3',
    nameAr: 'حديد + فيتامين ج', nameEn: 'Iron + Vitamin C',
    brand: 'Centrum', categoryId: 'cat-2',
    price: 75.00, salePrice: 65.00,
    requiresPrescription: false, inStock: true, stockCount: 7,
    pregnancySafe: true, breastfeedingSafe: true,
    descriptionAr: 'مكمل الحديد مع فيتامين ج لتحسين الامتصاص، مثالي لعلاج فقر الدم.',
    descriptionEn: 'Iron supplement with Vitamin C for enhanced absorption. Ideal for anemia management.',
    usageAr: 'قرص واحد مرتين يومياً قبل الأكل', usageEn: 'One tablet twice daily before meals',
    storageAr: 'يحفظ في مكان بارد وجاف', storageEn: 'Store in a cool, dry place',
    warningsAr: 'قد يسبب إمساكاً في بعض الحالات', warningsEn: 'May cause constipation in some cases',
    images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'],
    pharmacistNoteAr: 'تجنبي تناوله مع الشاي أو القهوة', pharmacistNoteEn: 'Avoid taking with tea or coffee',
    tags: ['anemia', 'vitamins'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: 'prod-4',
    nameAr: 'كريم ترطيب للحوامل', nameEn: 'Pregnancy Belly Cream',
    brand: 'Bio-Oil', categoryId: 'cat-1',
    price: 120.00, salePrice: null,
    requiresPrescription: false, inStock: true, stockCount: 25,
    pregnancySafe: true, breastfeedingSafe: true,
    descriptionAr: 'كريم طبيعي يساعد على تقليل علامات التمدد خلال الحمل.',
    descriptionEn: 'Natural cream to minimize stretch marks during pregnancy.',
    usageAr: 'يُدهن على المناطق المستهدفة مرتين يومياً', usageEn: 'Apply to targeted areas twice daily',
    storageAr: 'يحفظ بعيداً عن الحرارة المباشرة', storageEn: 'Keep away from direct heat',
    warningsAr: 'للاستخدام الخارجي فقط', warningsEn: 'For external use only',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'],
    pharmacistNoteAr: null, pharmacistNoteEn: null,
    tags: ['pregnancy', 'skincare'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: 'prod-5',
    nameAr: 'ليفوثيروكسين ٥٠ مكجم', nameEn: 'Levothyroxine 50mcg',
    brand: 'Euthyrox', categoryId: 'cat-6',
    price: 35.00, salePrice: null,
    requiresPrescription: true, inStock: true, stockCount: 60,
    pregnancySafe: true, breastfeedingSafe: true,
    descriptionAr: 'علاج قصور الغدة الدرقية. يتطلب وصفة طبية ومتابعة دورية.',
    descriptionEn: 'Thyroid hormone replacement therapy. Requires prescription and regular monitoring.',
    usageAr: 'وفقاً لإرشادات الطبيب', usageEn: 'As directed by your doctor',
    storageAr: 'يحفظ في درجة حرارة الغرفة بعيداً عن الرطوبة', storageEn: 'Store at room temperature away from moisture',
    warningsAr: 'لا تغيري الجرعة دون استشارة طبيبكِ', warningsEn: 'Do not change dosage without consulting your doctor',
    images: ['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400'],
    pharmacistNoteAr: 'يؤخذ على معدة فارغة صباحاً قبل ٣٠ دقيقة من الأكل',
    pharmacistNoteEn: 'Take on an empty stomach in the morning, 30 minutes before food',
    tags: ['thyroid', 'chronic'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: 'prod-6',
    nameAr: 'مسكن ألم الدورة الشهرية', nameEn: 'Menstrual Pain Relief',
    brand: 'Feminax', categoryId: 'cat-5',
    price: 28.00, salePrice: null,
    requiresPrescription: false, inStock: true, stockCount: 85,
    pregnancySafe: false, breastfeedingSafe: false,
    descriptionAr: 'أقراص مخصصة لتخفيف آلام الدورة الشهرية بسرعة وفاعلية.',
    descriptionEn: 'Specially formulated tablets for fast and effective menstrual pain relief.',
    usageAr: 'قرصان كل ٦-٨ ساعات عند الحاجة', usageEn: 'Two tablets every 6–8 hours as needed',
    storageAr: 'يحفظ في درجة حرارة الغرفة', storageEn: 'Store at room temperature',
    warningsAr: 'لا تتجاوزي ٦ أقراص يومياً', warningsEn: 'Do not exceed 6 tablets per day',
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
    pharmacistNoteAr: 'تناوليه مع الطعام لتجنب اضطراب المعدة',
    pharmacistNoteEn: 'Take with food to avoid stomach upset',
    tags: ['menstrual', 'pain'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: 'prod-7',
    nameAr: 'أوميجا-٣ للأم الحامل', nameEn: 'Prenatal Omega-3 DHA',
    brand: 'Nordic Naturals', categoryId: 'cat-1',
    price: 95.00, salePrice: 80.00,
    requiresPrescription: false, inStock: true, stockCount: 30,
    pregnancySafe: true, breastfeedingSafe: true,
    descriptionAr: 'أوميجا-٣ DHA مهم لتطوير دماغ الجنين والجهاز العصبي.',
    descriptionEn: 'DHA Omega-3 essential for fetal brain and nervous system development.',
    usageAr: 'كبسولة واحدة يومياً مع الطعام', usageEn: 'One capsule daily with food',
    storageAr: 'يحفظ في الثلاجة بعد الفتح', storageEn: 'Refrigerate after opening',
    warningsAr: 'استشيري طبيبكِ إذا كان لديكِ حساسية من الأسماك',
    warningsEn: 'Consult your doctor if you have a fish allergy',
    images: ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'],
    pharmacistNoteAr: 'يُنصح به بشدة في الثلث الثالث من الحمل',
    pharmacistNoteEn: 'Highly recommended during the third trimester of pregnancy',
    tags: ['pregnancy', 'brain', 'vitamins'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    id: 'prod-8',
    nameAr: 'كريم مرطب للبشرة الجافة', nameEn: 'Intense Moisture Cream',
    brand: 'CeraVe', categoryId: 'cat-4',
    price: 68.00, salePrice: null,
    requiresPrescription: false, inStock: false, stockCount: 0,
    pregnancySafe: true, breastfeedingSafe: true,
    descriptionAr: 'كريم مرطب طبي يحتوي على السيراميد وحمض الهيالورونيك لترطيب البشرة الجافة والحساسة.',
    descriptionEn: 'Medical moisturizer with ceramides and hyaluronic acid for dry, sensitive skin.',
    usageAr: 'يُطبق على الجلد النظيف مرة أو مرتين يومياً', usageEn: 'Apply to clean skin once or twice daily',
    storageAr: 'يحفظ في درجة حرارة الغرفة', storageEn: 'Store at room temperature',
    warningsAr: 'للاستخدام الخارجي فقط', warningsEn: 'For external use only',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'],
    pharmacistNoteAr: null, pharmacistNoteEn: null,
    tags: ['skincare', 'dry_skin'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

// ── Banners ─────────────────────────────────────────────────

const banners = [
  {
    id: 'banner-1',
    titleAr: 'عروض رمضان الصحية', titleEn: 'Ramadan Health Deals',
    subtitleAr: 'خصم ٢٠٪ على الفيتامينات والمكملات', subtitleEn: '20% off all vitamins & supplements',
    gradient: ['#8B2D6B', '#D4528A'], icon: 'tag', sortOrder: 1,
  },
  {
    id: 'banner-2',
    titleAr: 'وصفتكِ الطبية بكل أمان', titleEn: 'Your Prescription, Safely Handled',
    subtitleAr: 'صيدلانيات متخصصات يراجعن وصفاتكِ', subtitleEn: 'Expert pharmacists review every prescription',
    gradient: ['#059669', '#34D399'], icon: 'shieldCheck', sortOrder: 2,
  },
  {
    id: 'banner-3',
    titleAr: 'توصيل سريع ومحتشم', titleEn: 'Fast & Discreet Delivery',
    subtitleAr: 'تغليف سري لجميع الطلبات', subtitleEn: 'Discreet packaging on all orders',
    gradient: ['#5C1D47', '#8B2D6B'], icon: 'truck', sortOrder: 3,
  },
];

// ── Health Tips ──────────────────────────────────────────────

const healthTips = [
  { id: 'tip-1', textAr: 'تناولي ٨ أكواب من الماء يومياً للحفاظ على صحتكِ.', textEn: 'Drink 8 glasses of water daily for optimal health.' },
  { id: 'tip-2', textAr: 'الحصول على ساعات كافية من النوم يحسن المناعة ويقلل التوتر.', textEn: 'Getting enough sleep boosts immunity and reduces stress.' },
  { id: 'tip-3', textAr: 'فيتامين د مهم جداً للنساء في المملكة — تحققي من مستوياتكِ.', textEn: 'Vitamin D is crucial for women in Saudi Arabia — check your levels.' },
  { id: 'tip-4', textAr: 'استشيري صيدلانيتكِ قبل تناول أي دواء أثناء الحمل.', textEn: 'Consult your pharmacist before taking any medication during pregnancy.' },
];

// ── Promo Codes ─────────────────────────────────────────────

const promoCodes = [
  { code: 'ESTROGEN10', type: 'percentage', value: 10, active: true, expiresAt: '2026-12-31' },
  { code: 'WELCOME', type: 'fixed', value: 20, active: true, expiresAt: '2026-12-31' },
  { code: 'MAMA15', type: 'percentage', value: 15, active: true, expiresAt: '2026-06-30', categoryFilter: 'cat-1' },
];

// ── Seed Function ───────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting Firestore seed...\n');

  // Seed categories
  console.log('📂 Seeding categories...');
  for (const cat of categories) {
    const { id, ...data } = cat;
    await db.doc(`categories/${id}`).set(data);
  }
  console.log(`   ✅ ${categories.length} categories seeded\n`);

  // Seed products
  console.log('💊 Seeding products...');
  for (const prod of products) {
    const { id, ...data } = prod;
    await db.doc(`products/${id}`).set(data);
  }
  console.log(`   ✅ ${products.length} products seeded\n`);

  // Seed banners
  console.log('🎨 Seeding banners...');
  for (const banner of banners) {
    const { id, ...data } = banner;
    await db.doc(`banners/${id}`).set(data);
  }
  console.log(`   ✅ ${banners.length} banners seeded\n`);

  // Seed health tips
  console.log('💡 Seeding health tips...');
  for (const tip of healthTips) {
    const { id, ...data } = tip;
    await db.doc(`healthTips/${id}`).set(data);
  }
  console.log(`   ✅ ${healthTips.length} health tips seeded\n`);

  // Seed promo codes
  console.log('🏷️  Seeding promo codes...');
  for (const promo of promoCodes) {
    const { code, ...data } = promo;
    await db.doc(`promoCodes/${code}`).set(data);
  }
  console.log(`   ✅ ${promoCodes.length} promo codes seeded\n`);

  console.log('🎉 Seed complete! All data has been written to Firestore.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
