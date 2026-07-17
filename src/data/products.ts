export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  tags: string[];
  salesCount?: number; // ยอดขาย — ยิ่งสูงยิ่งขายดี (Optional)
};

export const products: Product[] = [
  // ===== ขนมไทย =====
  {
    id: "1",
    name: "ลูกชุบผลไม้รวม (L)",
    description: "Mung bean marzipan fruits, hand-painted. ชุดลูกชุบผลไม้รวมขนาดใหญ่ ปั้นมืออย่างพิถีพิถัน สีสันสวยงาม รสชาติหวานกำลังดี เหมาะสำหรับจัดเบรกหรือเป็นของฝาก",
    price: 120,
    category: "ขนมไทย",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBg8RRLtSyi9c_f1K3WxsLI0-_sO2kJzOalCHrX9of8agNQ5V7cRpR3vv48RlZ67lL53T_WsWsOLSnKrF9IQIvIvOAj1_ISptrE-f_auoJYyJzaFfr5Jah208LUjHGYGBCJoPG9GxR2rf1qqnxl-0HJkzS5HdQMNeWp1BLjQZdW568b3Vbso9TzyFNdPVdcS4ECsfUUYWTT67BIaE-A1PskX9hQ0h-RVzA72kMDWQQwqhnxQFuhI532",
      "https://images.unsplash.com/photo-1551806235-a05ff3f83ce9?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601000938259-9e92002320b2?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: ["Bestseller"],
    salesCount: 320,
  },
  {
    id: "2",
    name: "ขนมครกใบเตย",
    description: "ขนมครกใบเตย สูตรโบราณ หอมกลิ่นใบเตยแท้ 100% แป้งกรอบนอกนุ่มใน หวานมันกะทิลงตัว",
    price: 45,
    category: "ขนมไทย",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAm9Cu-ha7L_c68KfPLM-SCDoNhWo04maRdoVNOUCYApyQvlGy9rugRW0Fccg5pAAq_a8szUg43j5CrBz76D7zoHRj4rdOm4nh62cA-6dH4gL0dQL6Y_tSOGltK0IIAf1VbX7nVFGdb1iSP7EWa8y2rVYvi9SBRgAy9xuoxQez_iFQg8LmvBIsqmnEbcpCgowsqJbRpBUprLEYGxSzejf6kmsDMNYKhYgCnbcOnk0D5Qg6EwpEcyNI5",
      "https://images.unsplash.com/photo-1621287704285-84e1b026079d?q=80&w=2000&auto=format&fit=crop"
    ],
    tags: ["Limited"],
    salesCount: 185,
  },
  {
    id: "3",
    name: "ข้าวเหนียวมะม่วง",
    description: "ข้าวเหนียวมูนกะทิสด หอมมัน ทานคู่กับมะม่วงน้ำดอกไม้สุกงอม รสชาติหวานหอมชื่นใจ",
    price: 85,
    category: "ขนมไทย",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDOL3ntqdjpygfPKX2lWKpEFN8pu-DCudzVrZM1KA2KNlVU3F_hNWlxwdQJ3zfKkCSxPhw-9PzGIBMdygvpV7ZwjcocBbheMAUe_S_Ypw6Vndko4e1HLgcSFyzsZHTWNmAuJOhpjkXZ7ebgvVr0j5fzp83Iu7xLcP4ZYwUepnwD-6XFXn5PDyLkyf19fCHOXBNoFoEJw4WyJeABRZfStulrVxbtExn0njgZYLmsMIYlQyVb1I-M-dlz",
      "https://images.unsplash.com/photo-1605658607317-a006c9a9d701?q=80&w=2000&auto=format&fit=crop"
    ],
    tags: [],
    salesCount: 210,
  },
  {
    id: "7",
    name: "ทองหยิบ",
    description: "ทองหยิบทำจากไข่แดงและน้ำตาลทราย จีบเป็นดอกไม้สวยงาม หวานหอม เป็นขนมมงคลของไทย",
    price: 20,
    category: "ขนมไทย",
    images: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: ["มงคล"],
    salesCount: 150,
  },
  {
    id: "8",
    name: "ขนมชั้นใบเตย",
    description: "ขนมชั้นสีเขียวสลับขาว กลิ่นใบเตยหอมหวาน เนื้อเหนียวนุ่ม ตัดเป็นชิ้นพอดีคำ",
    price: 35,
    category: "ขนมไทย",
    images: [
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: [],
    salesCount: 95,
  },
  {
    id: "9",
    name: "ตะโก้เผือก",
    description: "ตะโก้เผือกเนื้อนุ่ม หน้ากะทิมัน หอมกลิ่นเผือกแท้ๆ ใส่ในกระทงใบตอง",
    price: 15,
    category: "ขนมไทย",
    images: [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: ["New"],
    salesCount: 120,
  },
  {
    id: "10",
    name: "ขนมถ้วยฟูใบเตย",
    description: "ขนมถ้วยฟูเนื้อนุ่มเบา หอมกลิ่นใบเตย หน้าแตกสวย หวานนุ่มลิ้น",
    price: 60,
    category: "ขนมไทย",
    images: [
      "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: [],
    salesCount: 78,
  },

  // ===== ชุดเบรก =====
  {
    id: "5",
    name: "ชุดเบรกมินิ (ชามะนาว + ตะโก้)",
    description: "ชุดเบรกจัดประชุมแบบมินิมอล ประกอบด้วยชามะนาว 1 แก้ว และตะโก้เผือก 2 ชิ้น เสิร์ฟในกล่องรักษ์โลก",
    price: 60,
    category: "ชุดเบรก",
    images: [
      "https://images.unsplash.com/photo-1495147466023-85c6e289c564?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?q=80&w=2000&auto=format&fit=crop"
    ],
    tags: ["ประชุม"],
    salesCount: 240,
  },
  {
    id: "11",
    name: "ชุดเบรกเล็ก (ขนม 2 + น้ำ 1)",
    description: "ขนมไทย 2 ชนิด + น้ำสมุนไพร 1 แก้ว จัดเสิร์ฟในกล่องใสสวยงาม เหมาะกับประชุมทีมเล็กๆ",
    price: 40,
    category: "ชุดเบรก",
    images: [
      "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: ["ยอดนิยม"],
    salesCount: 190,
  },
  {
    id: "12",
    name: "ชุดเบรกกลาง (ขนม 3 + น้ำ 1)",
    description: "ขนมไทย 3 ชนิด คัดสรรพิเศษ + น้ำสมุนไพรเย็น 1 แก้ว บรรจุในกล่องคราฟท์สีน้ำตาลสวยงาม",
    price: 80,
    category: "ชุดเบรก",
    images: [
      "https://images.unsplash.com/photo-1514517220017-8ce97a34a7b6?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: [],
    salesCount: 110,
  },
  {
    id: "13",
    name: "ชุดเบรกใหญ่ Premium",
    description: "ชุดเบรกพรีเมียม ขนมไทย 5 ชนิด + น้ำสมุนไพร 2 แก้ว + ผลไม้ตามฤดูกาล จัดเสิร์ฟสำหรับ VIP",
    price: 150,
    category: "ชุดเบรก",
    images: [
      "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: ["Premium", "VIP"],
    salesCount: 85,
  },
  {
    id: "14",
    name: "ชุดเบรกขนมจีบ",
    description: "ชุดขนมจีบนึ่งสดใหม่ 6 ลูก + น้ำจิ้มสูตรพิเศษ เหมาะสำหรับเบรกเช้า",
    price: 20,
    category: "ชุดเบรก",
    images: [
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: ["เบรกเช้า"],
    salesCount: 160,
  },

  // ===== น้ำสมุนไพร =====
  {
    id: "4",
    name: "น้ำอัญชันมะนาว",
    description: "น้ำอัญชันมะนาวเย็นชื่นใจ ดับกระหายคลายร้อน ได้ประโยชน์จากดอกอัญชันและวิตามินซีจากมะนาวสด",
    price: 35,
    category: "น้ำสมุนไพร",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDKj0R9R0W9-bO6ef-KOwr2QksAmqBXAyDRhTAb1I1iZaUsg_oZNKZ3aDdRI3cVk1QiutsK1A8dVRRQHZLvbJ-nAdyzMOAg7eTVr7qOemxpgf-RukMhr4h28OWF8zRW0QfJRsxsgSvB5tbnkuuanVnxy2tdjrCtSIjQBnj89Xm-VDQGmVV9pKDoIpRPCp1lZobZ2hicn6j5BqWqAnr_Me2AAAg8sX5TRoEVyQMv29W_HoVrJoDsE4zf",
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=2000&auto=format&fit=crop"
    ],
    tags: ["eco"],
    salesCount: 275,
  },
  {
    id: "6",
    name: "น้ำเก๊กฮวย",
    description: "น้ำเก๊กฮวยต้มสด หวานน้อย หอมกลิ่นเก๊กฮวยแท้ ช่วยแก้ร้อนใน ดื่มแล้วชื่นใจ",
    price: 30,
    category: "น้ำสมุนไพร",
    images: [
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: [],
    salesCount: 130,
  },
  {
    id: "15",
    name: "น้ำตะไคร้ใบเตย",
    description: "น้ำตะไคร้ใบเตยสดต้ม หวานน้อย สดชื่น ช่วยขับลม ดื่มเย็นๆ ชื่นใจ",
    price: 20,
    category: "น้ำสมุนไพร",
    images: [
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: ["ใหม่"],
    salesCount: 90,
  },
  {
    id: "16",
    name: "น้ำมะตูม",
    description: "น้ำมะตูมต้มสด หวานหอมจากน้ำตาลอ้อย ดื่มแล้วชื่นใจ มีสรรพคุณแก้ร้อนใน บำรุงปอด",
    price: 25,
    category: "น้ำสมุนไพร",
    images: [
      "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: [],
    salesCount: 105,
  },
  {
    id: "17",
    name: "น้ำขิงผสมน้ำผึ้ง",
    description: "น้ำขิงสดผสมน้ำผึ้งแท้ ดื่มได้ทั้งร้อนและเย็น ช่วยกระตุ้นระบบย่อยอาหาร บรรเทาอาการท้องอืด",
    price: 40,
    category: "น้ำสมุนไพร",
    images: [
      "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: ["แนะนำ"],
    salesCount: 200,
  },
  {
    id: "18",
    name: "น้ำใบบัวบก",
    description: "น้ำใบบัวบกปั่นสด ผสมน้ำผึ้งเล็กน้อย ช่วยบำรุงสมอง ผิวพรรณ และแก้ร้อนใน",
    price: 45,
    category: "น้ำสมุนไพร",
    images: [
      "https://images.unsplash.com/photo-1610970881699-44a015e5f7ce?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: [],
    salesCount: 65,
  },
  {
    id: "19",
    name: "น้ำกระเจี๊ยบ",
    description: "น้ำกระเจี๊ยบแดงเข้มข้น หวานอมเปรี้ยว ช่วยลดความดัน อุดมไปด้วยวิตามินซี",
    price: 90,
    category: "น้ำสมุนไพร",
    images: [
      "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=2000&auto=format&fit=crop",
    ],
    tags: ["Premium"],
    salesCount: 55,
  },
];

export type BudgetRange = {
  label: string;
  min: number;
  max: number;
};

export const budgetRanges: BudgetRange[] = [
  { label: "ทั้งหมด", min: 0, max: Infinity },
  { label: "≤20฿", min: 0, max: 20 },
  { label: "21-40฿", min: 21, max: 40 },
  { label: "41-60฿", min: 41, max: 60 },
  { label: "61-80฿", min: 61, max: 80 },
  { label: "80฿+", min: 81, max: Infinity },
];

export const categories = [
  { id: "thai-desserts", name: "ขนมไทย", icon: "restaurant" },
  { id: "break-sets", name: "ชุดเบรก", icon: "inventory_2" },
  { id: "herbal-drinks", name: "น้ำสมุนไพร", icon: "local_drink" },
];
