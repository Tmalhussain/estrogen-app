export type Category =
  | 'pregnancy'
  | 'vitamins'
  | 'hormonal'
  | 'skincare'
  | 'menstrual'
  | 'pain'
  | 'chronic'
  | 'postpartum'
  | 'baby-care';

/**
 * Life-stage axis. Independent of `category` (which is the *type* of
 * product). Used so customers can browse by who the product is for —
 * a new mum looking for baby vitamin D drops, a teen starting her
 * cycle, a 60-year-old on calcium for bone density.
 *
 * - baby:        0–24 months (infant)
 * - young-girl:  2–17 (toddler through teen, includes puberty/first cycle)
 * - lady:        18–49 (fertility, pregnancy, postpartum)
 * - golden:      50+ (menopause, bone density, longevity)
 */
export type LifeStage = 'baby' | 'young-girl' | 'lady' | 'golden';

export type Product = {
  id: string;
  name: string;
  nameAr: string;
  brand: string;
  category: Category;
  lifeStage: LifeStage;
  price: number;
  oldPrice?: number;
  unit: string;
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  stockCount: number;
  rxRequired: boolean;
  pregnancySafe: boolean;
  description: string;
  pharmacistNote?: string;
  tags: string[];
};

import type { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export const categories: { id: Category; label: string; icon: IoniconName }[] = [
  { id: 'pregnancy', label: 'Pregnancy', icon: 'flower-outline' },
  { id: 'vitamins', label: 'Vitamins', icon: 'medkit-outline' },
  { id: 'hormonal', label: 'Hormonal', icon: 'pulse-outline' },
  { id: 'skincare', label: 'Skincare', icon: 'sparkles-outline' },
  { id: 'menstrual', label: 'Cycle', icon: 'moon-outline' },
  { id: 'pain', label: 'Pain Relief', icon: 'bandage-outline' },
  { id: 'chronic', label: 'Chronic', icon: 'fitness-outline' },
  { id: 'postpartum', label: 'Postpartum', icon: 'happy-outline' },
  { id: 'baby-care', label: 'Baby care', icon: 'water-outline' },
];

export const lifeStages: {
  id: LifeStage;
  label: string;
  ageRange: string;
  icon: IoniconName;
}[] = [
  { id: 'baby', label: 'Babies', ageRange: '0–2 yrs', icon: 'happy-outline' },
  { id: 'young-girl', label: 'Young girls', ageRange: '2–17 yrs', icon: 'school-outline' },
  { id: 'lady', label: 'Ladies', ageRange: '18–49 yrs', icon: 'woman-outline' },
  { id: 'golden', label: 'Golden ages', ageRange: '50+ yrs', icon: 'sunny-outline' },
];

export const products: Product[] = [
  {
    id: 'p001',
    name: 'Folic Acid 5mg',
    nameAr: 'حمض الفوليك ٥ مغ',
    brand: 'Centrum',
    category: 'pregnancy',
    lifeStage: 'lady',
    price: 38,
    unit: '60 tablets',
    image:
      'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 312,
    inStock: true,
    stockCount: 24,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Daily folic acid supplement recommended in early pregnancy and pre-conception to support fetal neural tube development.',
    pharmacistNote:
      'Take one tablet daily with water, ideally in the morning. Continue for the first 12 weeks of pregnancy or as advised.',
    tags: ['daily', 'pre-natal'],
  },
  {
    id: 'p002',
    name: 'Iron + Vitamin C',
    nameAr: 'حديد + فيتامين C',
    brand: 'FerroPlus',
    category: 'vitamins',
    lifeStage: 'lady',
    price: 65,
    oldPrice: 78,
    unit: '30 capsules',
    image:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    reviews: 189,
    inStock: true,
    stockCount: 12,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Gentle, slow-release iron paired with vitamin C for better absorption. Helps with iron-deficiency anemia common in pregnancy and menstruation.',
    pharmacistNote:
      'Best absorbed on an empty stomach with a glass of orange juice. May cause mild stomach upset — switch to with-food if needed.',
    tags: ['iron', 'energy'],
  },
  {
    id: 'p003',
    name: 'Levothyroxine 50mcg',
    nameAr: 'ليفوثيروكسين ٥٠ مكغ',
    brand: 'Eltroxin',
    category: 'hormonal',
    lifeStage: 'lady',
    price: 28,
    unit: '100 tablets',
    image:
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 542,
    inStock: true,
    stockCount: 50,
    rxRequired: true,
    pregnancySafe: true,
    description:
      'Synthetic thyroid hormone for hypothyroidism. Take on an empty stomach 30–60 minutes before breakfast.',
    pharmacistNote:
      'Avoid taking with calcium, iron, or coffee within 4 hours — they reduce absorption.',
    tags: ['thyroid', 'rx'],
  },
  {
    id: 'p004',
    name: 'Vitamin D3 5000 IU',
    nameAr: 'فيتامين D3 ٥٠٠٠ وحدة',
    brand: 'Nordic Naturals',
    category: 'vitamins',
    lifeStage: 'lady',
    price: 92,
    unit: '90 softgels',
    image:
      'https://images.unsplash.com/photo-1626451184952-f1b35eb05f76?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviews: 233,
    inStock: true,
    stockCount: 8,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'High-potency vitamin D3 for bone health, immunity, and mood. Common deficiency in Saudi Arabia despite year-round sun.',
    tags: ['immunity', 'bones'],
  },
  {
    id: 'p005',
    name: 'Hyaluronic Serum',
    nameAr: 'سيروم حمض الهيالورونيك',
    brand: 'La Roche-Posay',
    category: 'skincare',
    lifeStage: 'lady',
    price: 145,
    oldPrice: 175,
    unit: '30 ml',
    image:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 1024,
    inStock: true,
    stockCount: 6,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Lightweight serum that locks in 10× its weight in moisture. Fragrance-free and pregnancy-safe.',
    tags: ['hydrating', 'fragrance-free'],
  },
  {
    id: 'p006',
    name: 'Mefenamic Acid 500mg',
    nameAr: 'حمض الميفيناميك ٥٠٠ مغ',
    brand: 'Ponstan',
    category: 'menstrual',
    lifeStage: 'lady',
    price: 22,
    unit: '20 tablets',
    image:
      'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    reviews: 412,
    inStock: true,
    stockCount: 31,
    rxRequired: false,
    pregnancySafe: false,
    description:
      'NSAID effective for menstrual cramps and heavy periods. Take with food.',
    pharmacistNote:
      'Not safe in the third trimester of pregnancy. Avoid if you have stomach ulcers.',
    tags: ['cramps', 'period'],
  },
  {
    id: 'p007',
    name: 'Prenatal Multivitamin',
    nameAr: 'فيتامينات ما قبل الولادة',
    brand: 'Garden of Life',
    category: 'pregnancy',
    lifeStage: 'lady',
    price: 178,
    unit: '60 tablets',
    image:
      'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 678,
    inStock: true,
    stockCount: 14,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Whole-food prenatal with folate, iron, choline, DHA, and probiotics. Easy on the stomach.',
    tags: ['prenatal', 'whole-food'],
  },
  {
    id: 'p008',
    name: 'Paracetamol 500mg',
    nameAr: 'باراسيتامول ٥٠٠ مغ',
    brand: 'Panadol',
    category: 'pain',
    lifeStage: 'lady',
    price: 12,
    unit: '24 tablets',
    image:
      'https://images.unsplash.com/photo-1550572017-26b5655c4e3a?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    reviews: 1502,
    inStock: true,
    stockCount: 80,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Trusted pain and fever relief. The pregnancy-safe choice for most aches and headaches.',
    tags: ['fever', 'headache'],
  },
  {
    id: 'p009',
    name: 'Stretch Mark Oil',
    nameAr: 'زيت علامات التمدد',
    brand: 'Bio-Oil',
    category: 'postpartum',
    lifeStage: 'lady',
    price: 88,
    unit: '125 ml',
    image:
      'https://images.unsplash.com/photo-1591375276070-1c3d9b1e75d3?auto=format&fit=crop&w=600&q=80',
    rating: 4.4,
    reviews: 287,
    inStock: false,
    stockCount: 0,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Massage oil to improve the appearance of stretch marks during and after pregnancy.',
    tags: ['stretch-marks', 'postpartum'],
  },
  {
    id: 'p010',
    name: 'Metformin 500mg',
    nameAr: 'ميتفورمين ٥٠٠ مغ',
    brand: 'Glucophage',
    category: 'chronic',
    lifeStage: 'lady',
    price: 34,
    unit: '60 tablets',
    image:
      'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviews: 211,
    inStock: true,
    stockCount: 18,
    rxRequired: true,
    pregnancySafe: true,
    description:
      'First-line therapy for type-2 diabetes and PCOS-related insulin resistance.',
    pharmacistNote:
      'Take with meals to reduce nausea. Notify your doctor if you experience any unusual muscle pain.',
    tags: ['diabetes', 'pcos', 'rx'],
  },
  {
    id: 'p011',
    name: 'Magnesium Glycinate',
    nameAr: 'جلايسينات المغنيسيوم',
    brand: 'Pure Encapsulations',
    category: 'vitamins',
    lifeStage: 'lady',
    price: 110,
    unit: '90 capsules',
    image:
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 354,
    inStock: true,
    stockCount: 22,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Highly bioavailable magnesium for sleep, muscle relaxation, and PMS-related cramps.',
    tags: ['sleep', 'pms'],
  },
  {
    id: 'p012',
    name: 'SPF 50+ Sunscreen',
    nameAr: 'واقي شمس SPF 50+',
    brand: 'EltaMD',
    category: 'skincare',
    lifeStage: 'lady',
    price: 165,
    unit: '85 ml',
    image:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 891,
    inStock: true,
    stockCount: 4,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Mineral, fragrance-free SPF 50+. Pregnancy-safe and dermatologist-recommended.',
    tags: ['sunscreen', 'mineral'],
  },

  // Babies (0–2 yrs)
  {
    id: 'p013',
    name: 'Baby Vitamin D Drops 400 IU',
    nameAr: 'قطرات فيتامين د للأطفال ٤٠٠ وحدة',
    brand: 'Ddrops',
    category: 'baby-care',
    lifeStage: 'baby',
    price: 78,
    unit: '2.5 ml dropper',
    image:
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 1240,
    inStock: true,
    stockCount: 36,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'A single tasteless, oil-based drop a day. Recommended by Saudi pediatricians for breastfed babies from birth.',
    pharmacistNote:
      'One drop on the nipple before feeding, or directly into baby\'s mouth. Continue daily through the first year.',
    tags: ['infant', 'breastfeeding'],
  },
  {
    id: 'p014',
    name: 'Infant Paracetamol 120mg/5ml',
    nameAr: 'باراسيتامول للأطفال ١٢٠ مغ/٥مل',
    brand: 'Calpol',
    category: 'pain',
    lifeStage: 'baby',
    price: 18,
    unit: '100 ml suspension',
    image:
      'https://images.unsplash.com/photo-1632571401005-458e9d244591?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviews: 802,
    inStock: true,
    stockCount: 45,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Sugar-free strawberry-flavoured infant paracetamol for fever and teething pain. From 2 months.',
    pharmacistNote:
      'Dose by weight, not age. Don\'t exceed 4 doses in 24 hours. Call us if fever lasts >3 days.',
    tags: ['fever', 'teething', 'infant'],
  },
  {
    id: 'p015',
    name: 'Diaper Rash Cream',
    nameAr: 'كريم التهاب الحفاض',
    brand: 'Sudocrem',
    category: 'baby-care',
    lifeStage: 'baby',
    price: 32,
    unit: '125 g',
    image:
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 1568,
    inStock: true,
    stockCount: 60,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Zinc oxide barrier cream that soothes nappy rash and protects sensitive skin. Used in Saudi homes for decades.',
    tags: ['nappy-rash', 'zinc'],
  },

  // Young girls (2–17 yrs, includes puberty / first cycle)
  {
    id: 'p016',
    name: 'Children\'s Multivitamin Gummies',
    nameAr: 'فيتامينات الأطفال علكة',
    brand: 'L\'il Critters',
    category: 'vitamins',
    lifeStage: 'young-girl',
    price: 64,
    unit: '70 gummies',
    image:
      'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    reviews: 423,
    inStock: true,
    stockCount: 28,
    rxRequired: false,
    pregnancySafe: false,
    description:
      'Daily gummy with vitamins A, C, D, E, B6, B12, and zinc. For ages 2 and up.',
    pharmacistNote:
      'Two gummies a day with food. Keep out of reach — they taste like candy.',
    tags: ['kids', 'gummy', 'daily'],
  },
  {
    id: 'p017',
    name: 'First Period Starter Pack',
    nameAr: 'باقة الدورة الأولى',
    brand: 'Always',
    category: 'menstrual',
    lifeStage: 'young-girl',
    price: 45,
    unit: '24 pads + booklet',
    image:
      'https://images.unsplash.com/photo-1612277795130-d36c8f99c5fc?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviews: 187,
    inStock: true,
    stockCount: 22,
    rxRequired: false,
    pregnancySafe: false,
    description:
      'A discreet starter kit with day and night pads and a small Arabic-English guide for first-cycle questions. Designed for ages 10–14.',
    pharmacistNote:
      'A women pharmacist is happy to walk you and your daughter through cycle questions over chat — just ask.',
    tags: ['puberty', 'first-period', 'teen'],
  },
  {
    id: 'p018',
    name: 'Teen Acne Face Wash',
    nameAr: 'غسول للوجه لحب الشباب',
    brand: 'CeraVe',
    category: 'skincare',
    lifeStage: 'young-girl',
    price: 89,
    unit: '237 ml',
    image:
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 631,
    inStock: true,
    stockCount: 18,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Salicylic acid 2% cleanser for teen-onset acne. Fragrance-free and dermatologist-tested.',
    pharmacistNote:
      'Once daily to start; build up to twice if skin tolerates. Follow with a non-comedogenic moisturizer.',
    tags: ['acne', 'puberty', 'teen'],
  },

  // Golden ages (50+ yrs)
  {
    id: 'p019',
    name: 'Calcium 600 + D3',
    nameAr: 'كالسيوم ٦٠٠ + د٣',
    brand: 'Caltrate',
    category: 'vitamins',
    lifeStage: 'golden',
    price: 72,
    unit: '120 tablets',
    image:
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviews: 512,
    inStock: true,
    stockCount: 30,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Bone-density support after menopause. 600 mg calcium with 800 IU vitamin D3 in each tablet.',
    pharmacistNote:
      'Best taken with a meal that contains some fat. Split the dose — calcium absorbs better in 500 mg portions.',
    tags: ['bones', 'menopause', 'osteoporosis'],
  },
  {
    id: 'p020',
    name: 'Glucosamine + Chondroitin',
    nameAr: 'جلوكوزامين + كوندرويتين',
    brand: 'Move Free',
    category: 'vitamins',
    lifeStage: 'golden',
    price: 158,
    oldPrice: 185,
    unit: '120 tablets',
    image:
      'https://images.unsplash.com/photo-1626516015207-8a4cc9bb6f47?auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    reviews: 287,
    inStock: true,
    stockCount: 12,
    rxRequired: false,
    pregnancySafe: false,
    description:
      'Joint comfort and cartilage support for daily knee, hip, and hand stiffness.',
    pharmacistNote:
      'Allow 4–8 weeks for the full effect. Avoid if you\'re allergic to shellfish.',
    tags: ['joints', 'mobility'],
  },
  {
    id: 'p021',
    name: 'Omega-3 + B12 Brain Support',
    nameAr: 'أوميغا ٣ + ب١٢',
    brand: 'Nordic Naturals',
    category: 'vitamins',
    lifeStage: 'golden',
    price: 142,
    unit: '60 softgels',
    image:
      'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 364,
    inStock: true,
    stockCount: 16,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'High-EPA fish oil paired with B12 for cognitive sharpness, heart health, and energy.',
    tags: ['brain', 'heart', 'omega-3'],
  },
  {
    id: 'p022',
    name: 'HRT Estradiol Patch 50mcg',
    nameAr: 'لاصقة استراديول ٥٠ مكغ',
    brand: 'Climara',
    category: 'hormonal',
    lifeStage: 'golden',
    price: 195,
    unit: '4 patches',
    image:
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviews: 142,
    inStock: true,
    stockCount: 8,
    rxRequired: true,
    pregnancySafe: false,
    description:
      'Transdermal estradiol for menopausal symptom relief — hot flashes, night sweats, vaginal dryness.',
    pharmacistNote:
      'Apply to clean dry skin once a week, rotating the site. Always paired with progesterone if you still have a uterus.',
    tags: ['menopause', 'hrt', 'rx'],
  },
];

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function productsByCategory(cat: Category): Product[] {
  return products.filter((p) => p.category === cat);
}

export function productsByLifeStage(stage: LifeStage): Product[] {
  return products.filter((p) => p.lifeStage === stage);
}

export function searchProducts(q: string): Product[] {
  if (!q.trim()) return products;
  const term = q.trim().toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.nameAr.includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.tags.some((t) => t.includes(term))
  );
}
