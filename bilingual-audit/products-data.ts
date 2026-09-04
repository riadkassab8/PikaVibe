export type Product = {
  id: string;
  backendId?: number;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  category: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image: string;
  images: string[];
  description: string;
  specifications: string[];
  rating: number;
  inStock: boolean;
  stock: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  active?: boolean;
  variants?: Array<{ name: string; options: string[] }>;
};

const photo = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const products: Product[] = [
  {
    id: 'cast-iron-skillet',
    name: '12-inch Cast Iron Skillet',
    category: 'Cookware',
    price: 2850,
    oldPrice: 3300,
    discount: 14,
    image: photo('photo-1556909212-d5b604d0c90d'),
    images: [photo('photo-1556909212-d5b604d0c90d'), photo('photo-1515003197210-e0cd71810b5f')],
    description: 'A generous, pre-seasoned skillet for smoky sukuma, seared nyama and everything in between. Built to stay in the family.',
    specifications: ['Pre-seasoned cast iron', '30 cm diameter', 'Oven and stovetop safe', 'Easy-grip helper handle'],
    rating: 4.9, inStock: true, stock: 8, isBestSeller: true,
  },
  {
    id: 'copper-saucepan',
    name: 'Copper Glow Saucepan',
    category: 'Cookware',
    price: 3950,
    oldPrice: 4500,
    discount: 12,
    image: photo('photo-1584990347449-ae8b7a0e3b7f'),
    images: [photo('photo-1584990347449-ae8b7a0e3b7f'), photo('photo-1556911220-bff31c812dba')],
    description: 'Beautiful on the hob, dependable at the table. A 2-litre saucepan with a cool-touch handle and even heat.',
    specifications: ['2 litre capacity', 'Stainless steel core', 'Tempered glass lid', 'Works on gas and electric'],
    rating: 4.7, inStock: true, stock: 6, isNew: true,
  },
  {
    id: 'glass-pantry-set',
    name: 'Clear Pantry Jar Set',
    category: 'Storage',
    price: 2200,
    oldPrice: 2600,
    discount: 15,
    image: photo('photo-1583947215259-38e31be8751f'),
    images: [photo('photo-1583947215259-38e31be8751f'), photo('photo-1610701596007-11502861dcfa')],
    description: 'Six satisfying glass jars for tea leaves, flour, grains and the little things that deserve a home.',
    specifications: ['Set of 6 jars', 'Airtight bamboo lids', '750 ml each', 'Food-safe glass'],
    rating: 4.8, inStock: true, stock: 12, isBestSeller: true,
  },
  {
    id: 'stackable-baskets',
    name: 'Stackable Kiondo Baskets',
    category: 'Storage',
    price: 1800,
    image: photo('photo-1558618666-fcd25c85cd64'),
    images: [photo('photo-1558618666-fcd25c85cd64'), photo('photo-1594620302200-9a762244a156')],
    description: 'Hand-feel storage with a modern silhouette. Keep pantry produce, linens or toys beautifully corralled.',
    specifications: ['Set of 2 baskets', 'Woven natural fibre', 'Nestable design', 'Approx. 28 × 20 × 15 cm'],
    rating: 4.6, inStock: true, stock: 9, isNew: true,
  },
  {
    id: 'bamboo-utensils',
    name: 'Bamboo Cooking Utensil Set',
    category: 'Cookware',
    price: 1450,
    image: photo('photo-1556911220-bff31c812dba'),
    images: [photo('photo-1556911220-bff31c812dba'), photo('photo-1600566753190-17f0baa2a6c3')],
    description: 'Five everyday helpers, shaped to feel right in your hand and gentle on your favourite pans.',
    specifications: ['5-piece set', 'Natural bamboo', 'Smooth hand-finished grain', 'Includes stand'],
    rating: 4.8, inStock: true, stock: 14, isBestSeller: true,
  },
  {
    id: 'countertop-kettle',
    name: 'Cream Pour Electric Kettle',
    category: 'Small Appliances',
    price: 4200,
    image: photo('photo-1570222094114-d054a817e56b'),
    images: [photo('photo-1570222094114-d054a817e56b'), photo('photo-1517256064527-09c73fc73e38')],
    description: 'A quiet little ritual-maker for chai, coffee and the first cup before the house wakes up.',
    specifications: ['1.7 litre capacity', 'Auto shut-off', 'Boil-dry protection', '360° swivel base'],
    rating: 4.5, inStock: true, stock: 5, isNew: true,
  },
  {
    id: 'scrub-brush-trio',
    name: 'Home Reset Brush Trio',
    category: 'Cleaning',
    price: 980,
    image: photo('photo-1583947215259-38e31be8751f'),
    images: [photo('photo-1583947215259-38e31be8751f'), photo('photo-1581578731548-c64695cc6952')],
    description: 'A small, sturdy trio for the jobs that need a little more elbow grease: dishes, corners and fresh produce.',
    specifications: ['3 different brushes', 'Recycled plastic handles', 'Natural bristles', 'Hang loops included'],
    rating: 4.4, inStock: true, stock: 10,
  },
  {
    id: 'linen-hand-towels',
    name: 'Woven Kitchen Cloths',
    category: 'Cleaning',
    price: 1250,
    image: photo('photo-1604014237800-1c9102c219da'),
    images: [photo('photo-1604014237800-1c9102c219da'), photo('photo-1583845112203-454c7c7c4f01')],
    description: 'Soft, absorbent and made for being used. Two textured cloths to bring a little order to the sink.',
    specifications: ['Set of 2', 'Cotton and linen blend', '45 × 65 cm', 'Machine washable'],
    rating: 4.6, inStock: true, stock: 11,
  },
  {
    id: 'bathroom-organiser',
    name: 'Stoneware Bath Organiser',
    category: 'Bathroom',
    price: 1650,
    image: photo('photo-1556228578-8c89e6adf883'),
    images: [photo('photo-1556228578-8c89e6adf883'), photo('photo-1611930022073-b7a4ba5fcccd')],
    description: 'A weighty, tactile home for toothbrushes, brushes or the small things that gather beside the basin.',
    specifications: ['Hand-finished stoneware', 'Matte sand glaze', 'Non-slip base', '12 × 8 × 10 cm'],
    rating: 4.7, inStock: true, stock: 7, isBestSeller: true,
  },
  {
    id: 'lunchbox',
    name: 'Everyday Stainless Lunchbox',
    category: 'Storage',
    price: 2100,
    image: photo('photo-1606787366850-de6330128bfc'),
    images: [photo('photo-1606787366850-de6330128bfc'), photo('photo-1547592180-85f173990554')],
    description: 'A leak-resistant lunchbox for packed lunches, leftovers and the food you want to take with you.',
    specifications: ['900 ml capacity', 'Stainless steel body', 'Two compartments', 'BPA-free silicone seal'],
    rating: 4.8, inStock: true, stock: 8, isNew: true,
  },
  {
    id: 'ceramic-serving-bowl',
    name: 'Sunset Serving Bowl',
    category: 'Dining',
    price: 2400,
    image: photo('photo-1610701596007-11502861dcfa'),
    images: [photo('photo-1610701596007-11502861dcfa'), photo('photo-1603199506016-b9a594b593c0')],
    description: 'A hand-shaped bowl with enough presence for the centre of the table, and enough ease for every day.',
    specifications: ['Hand-finished ceramic', '24 cm diameter', 'Microwave safe', 'Warm ochre glaze'],
    rating: 4.9, inStock: true, stock: 6,
  },
];

export const categories = ['All', 'Cookware', 'Storage', 'Cleaning', 'Bathroom', 'Small Appliances', 'Dining'];