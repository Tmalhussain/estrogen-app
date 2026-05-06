import { eq } from 'drizzle-orm';
import { db, schema } from '../src/db/index.ts';
import { hashPassword } from '../src/lib/passwords.ts';

const products: (typeof schema.products.$inferInsert)[] = [
  {
    sku: 'EST-FOL-5MG-60',
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
    sku: 'EST-FE-VC-30',
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
    stockCount: 12,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Gentle, slow-release iron paired with vitamin C for better absorption.',
    tags: ['iron', 'energy'],
  },
  {
    sku: 'EST-LEV-50-100',
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
    stockCount: 50,
    rxRequired: true,
    pregnancySafe: true,
    description:
      'Synthetic thyroid hormone for hypothyroidism. Take on an empty stomach 30–60 minutes before breakfast.',
    pharmacistNote:
      'Avoid taking with calcium, iron, or coffee within 4 hours.',
    tags: ['thyroid', 'rx'],
  },
  {
    sku: 'EST-VITD3-5K-90',
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
    stockCount: 8,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'High-potency vitamin D3 for bone health, immunity, and mood.',
    tags: ['immunity', 'bones'],
  },
  {
    sku: 'EST-HA-30',
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
    stockCount: 6,
    rxRequired: false,
    pregnancySafe: true,
    description: 'Lightweight serum that locks in 10× its weight in moisture.',
    tags: ['hydrating', 'fragrance-free'],
  },
  {
    sku: 'EST-MEF-500-20',
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
    stockCount: 31,
    rxRequired: false,
    pregnancySafe: false,
    description: 'NSAID effective for menstrual cramps and heavy periods. Take with food.',
    pharmacistNote:
      'Not safe in the third trimester of pregnancy. Avoid if you have stomach ulcers.',
    tags: ['cramps', 'period'],
  },
  {
    sku: 'EST-PRE-MV-60',
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
    stockCount: 14,
    rxRequired: false,
    pregnancySafe: true,
    description:
      'Whole-food prenatal with folate, iron, choline, DHA, and probiotics.',
    tags: ['prenatal', 'whole-food'],
  },
  {
    sku: 'EST-PARA-500-24',
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
    stockCount: 80,
    rxRequired: false,
    pregnancySafe: true,
    description: 'Trusted pain and fever relief.',
    tags: ['fever', 'headache'],
  },
  {
    sku: 'EST-MET-500-60',
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
    stockCount: 18,
    rxRequired: true,
    pregnancySafe: true,
    description:
      'First-line therapy for type-2 diabetes and PCOS-related insulin resistance.',
    pharmacistNote: 'Take with meals to reduce nausea.',
    tags: ['diabetes', 'pcos', 'rx'],
  },
];

const existing = db.select({ id: schema.products.id }).from(schema.products).all();
if (existing.length > 0) {
  console.log(`already seeded (${existing.length} products) — skipping`);
} else {
  db.insert(schema.products).values(products).run();
  console.log(`seeded ${products.length} products`);
}

const demoEmail = 'demo@estrogen.sa';
const demoUser = db
  .select({ id: schema.users.id })
  .from(schema.users)
  .where(eq(schema.users.email, demoEmail))
  .all();
if (demoUser.length === 0) {
  db.insert(schema.users)
    .values({
      email: demoEmail,
      passwordHash: hashPassword('demo12345'),
      firstName: 'Demo',
      lastName: 'User',
      phone: '+966500000000',
      role: 'customer',
    })
    .run();
  console.log(`created demo user ${demoEmail} / demo12345`);
} else {
  console.log('demo user already present');
}
