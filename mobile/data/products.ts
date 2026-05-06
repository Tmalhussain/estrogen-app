export type Category =
  | 'pregnancy'
  | 'vitamins'
  | 'hormonal'
  | 'skincare'
  | 'menstrual'
  | 'pain'
  | 'chronic'
  | 'postpartum';

export type Product = {
  id: string;
  name: string;
  nameAr: string;
  brand: string;
  category: Category;
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
];

export const products: Product[] = [
  {
    id: 'p001',
    name: 'Folic Acid 5mg',
    nameAr: 'حمض الفوليك ٥ مغ',
    brand: 'Centrum',
    category: 'pregnancy',
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
];

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function productsByCategory(cat: Category): Product[] {
  return products.filter((p) => p.category === cat);
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
