"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  tags: string[];
  categories?: {
    name: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Preset Tags States
  const [tagBest1, setTagBest1] = useState(false); // ขายดีอันดับ 1
  const [tagBest, setTagBest] = useState(false);   // ขายดี
  const [tagRec, setTagRec] = useState(false);     // แนะนำ
  const [prodSearchQuery, setProdSearchQuery] = useState("");
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const [otherTags, setOtherTags] = useState("");   // แท็กอื่นๆ

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    category_id: "",
    images: "", // Textarea newline separated
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "",
    slug: "",
  });

  // Verify Admin Session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) {
          setAuthorized(true);
          fetchData();
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        router.push("/admin/login");
      }
    }
    checkAuth();
  }, [router]);

  // Fetch Data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Categories
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });
      
      // Fetch Products with categories name join
      const { data: prodData } = await supabase
        .from("productWeb")
        .select(`
          *,
          categories (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (catData) setCategories(catData);
      if (prodData) setProducts(prodData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  // --- Product CRUD ---
  const openProductAdd = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: 0,
      category_id: categories[0]?.id || "",
      images: "",
    });
    setTagBest1(false);
    setTagBest(false);
    setTagRec(false);
    setOtherTags("");
    setProductModalOpen(true);
  };

  const openProductEdit = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description || "",
      price: prod.price,
      category_id: prod.category_id,
      images: prod.images.join("\n"),
    });
    
    // Set checkboxes based on existing tags
    setTagBest1(prod.tags.includes("ขายดีอันดับ 1"));
    setTagBest(prod.tags.includes("ขายดี"));
    setTagRec(prod.tags.includes("แนะนำ"));
    
    // Filter out presets from otherTags
    const others = prod.tags.filter(t => !["ขายดีอันดับ 1", "ขายดี", "แนะนำ"].includes(t));
    setOtherTags(others.join(", "));
    
    setProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construct final tags list
    const selectedTags: string[] = [];
    if (tagBest1) selectedTags.push("ขายดีอันดับ 1");
    if (tagBest) selectedTags.push("ขายดี");
    if (tagRec) selectedTags.push("แนะนำ");

    const additionalTags = otherTags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    // Merge & deduplicate tags
    const finalTags = Array.from(new Set([...selectedTags, ...additionalTags]));

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      category_id: productForm.category_id,
      images: productForm.images.split("\n").map(u => u.trim()).filter(Boolean),
      tags: finalTags,
    };

    try {
      if (editingProduct) {
        // Update
        const { error } = await supabase
          .from("productWeb")
          .update(payload)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("productWeb")
          .insert([payload]);
        if (error) throw error;
      }
      setProductModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการบันทึกสินค้า: ${err.message || err.details || "ไม่ทราบสาเหตุ"}`);
      console.error("Supabase Error details:", err);
    }
  };

  const handleProductDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบสินค้านี้ใช่หรือไม่?")) return;
    try {
      const { error } = await supabase
        .from("productWeb")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("ไม่สามารถลบสินค้าได้");
      console.error(err);
    }
  };

  // --- Category CRUD ---
  const openCategoryAdd = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", icon: "restaurant", slug: "" });
    setCategoryModalOpen(true);
  };

  const openCategoryEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, icon: cat.icon, slug: cat.slug });
    setCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(categoryForm)
          .eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categories")
          .insert([categoryForm]);
        if (error) throw error;
      }
      setCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการบันทึกหมวดหมู่: ${err.message || err.details || "ไม่ทราบสาเหตุ"}`);
      console.error("Supabase Error details:", err);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm("การลบหมวดหมู่จะทำให้สินค้าทั้งหมดที่ผูกอยู่ถูกลบไปด้วย คุณแน่ใจใช่หรือไม่?")) return;
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("ไม่สามารถลบหมวดหมู่ได้");
      console.error(err);
    }
  };

  if (!authorized) {
    return null;
  }

  // Filter lists by search queries
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(prodSearchQuery.toLowerCase().trim())
  );
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearchQuery.toLowerCase().trim())
  );

  // Calculate statistics
  const totalProducts = products.length;
  const totalCategories = categories.length;
  // Calculate total bestselling & recommended products instead of sales sum
  const totalPromoProducts = products.filter(
    (p) =>
      p.tags.includes("ขายดีอันดับ 1") ||
      p.tags.includes("ขายดี") ||
      p.tags.includes("แนะนำ")
  ).length;

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Top Header */}
      <header className="bg-primary text-white py-4 px-6 sticky top-0 z-40 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">ระบบควบคุมหลังบ้านแอดมิน</h1>
          <p className="text-xs text-white/80">จัดการร้านค้า ขนมไทยแทนคุณ</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm border border-white/40 hover:bg-white/10 px-4 py-2 rounded-full font-medium transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            ดูหน้าร้านค้า
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full font-medium transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">shopping_basket</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">สินค้าทั้งหมด</p>
              <h3 className="text-2xl font-bold text-on-surface mt-1">{totalProducts} รายการ</h3>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">category</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">หมวดหมู่</p>
              <h3 className="text-2xl font-bold text-on-surface mt-1">{totalCategories} ประเภท</h3>
            </div>
          </div>
          <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">stars</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">สินค้าไฮไลท์/แนะนำ</p>
              <h3 className="text-2xl font-bold text-on-surface mt-1">{totalPromoProducts} รายการ</h3>
            </div>
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex border-b border-outline-variant mb-6 gap-2">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 px-4 font-bold text-body-lg flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">cookie</span>
            จัดการสินค้า ({totalProducts})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`pb-3 px-4 font-bold text-body-lg flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "categories"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">category</span>
            จัดการหมวดหมู่ ({totalCategories})
          </button>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="text-center py-20 bg-surface rounded-2xl border border-outline-variant">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-on-surface-variant">กำลังดึงข้อมูล...</p>
          </div>
        ) : (
          <>
            {/* --- PRODUCTS TAB --- */}
            {activeTab === "products" && (
              <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                  <h2 className="font-bold text-headline-sm text-on-surface">รายการสินค้าในระบบ</h2>
                  <div className="flex gap-2 items-center flex-1 max-w-md sm:justify-end">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="ค้นหาชื่อสินค้า..."
                        value={prodSearchQuery}
                        onChange={(e) => setProdSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-8 rounded-full border border-outline-variant bg-surface focus:border-primary focus:outline-none text-body-md"
                      />
                      {prodSearchQuery && (
                        <button
                          onClick={() => setProdSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface-container-high"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={openProductAdd}
                      className="bg-primary text-on-primary font-bold px-4 py-2 h-10 rounded-full text-sm hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      เพิ่มสินค้าใหม่
                    </button>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-surface-container-lowest">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <div key={p.id} className="border border-outline-variant rounded-xl p-4 flex flex-col justify-between bg-surface hover:shadow-md transition-all gap-3">
                        <div className="flex gap-4">
                          {/* Thumbnail Image */}
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant bg-surface-container-high shrink-0">
                            {p.images.length > 0 ? (
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-outline text-2xl">image</span>
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <h3 className="font-bold text-body-lg text-on-surface truncate">{p.name}</h3>
                              <span className="text-primary font-bold text-body-lg shrink-0">฿{p.price}</span>
                            </div>
                            <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                              {p.description || "- ไม่มีรายละเอียด -"}
                            </p>
                            <div className="flex flex-wrap gap-1.5 items-center mt-2">
                              <span className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {p.categories?.name || "ไม่ระบุ"}
                              </span>
                              {p.tags.map((t) => (
                                <span
                                  key={t}
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                    t === "ขายดีอันดับ 1"
                                      ? "bg-red-100 text-red-700 border border-red-200"
                                      : t === "ขายดี"
                                      ? "bg-orange-100 text-orange-700"
                                      : t === "แนะนำ"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-surface-container-high text-on-surface-variant"
                                  }`}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons at bottom of card */}
                        <div className="flex gap-2 justify-end border-t border-outline-variant pt-2 mt-auto">
                          <button
                            onClick={() => openProductEdit(p)}
                            className="h-9 px-4 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleProductDelete(p.id)}
                            className="h-9 px-4 rounded-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface rounded-xl border border-dashed border-outline-variant">
                      {prodSearchQuery.trim() !== "" ? "ไม่พบสินค้าที่ตรงกับการค้นหา" : "ไม่มีรายการสินค้าในระบบแอดมิน"}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- CATEGORIES TAB --- */}
            {activeTab === "categories" && (
              <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                  <h2 className="font-bold text-headline-sm text-on-surface">รายการหมวดหมู่ในระบบ</h2>
                  <div className="flex gap-2 items-center flex-1 max-w-md sm:justify-end">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="ค้นหาชื่อหมวดหมู่..."
                        value={catSearchQuery}
                        onChange={(e) => setCatSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-8 rounded-full border border-outline-variant bg-surface focus:border-primary focus:outline-none text-body-md"
                      />
                      {catSearchQuery && (
                        <button
                          onClick={() => setCatSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface-container-high"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={openCategoryAdd}
                      className="bg-primary text-on-primary font-bold px-4 py-2 h-10 rounded-full text-sm hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      เพิ่มหมวดหมู่ใหม่
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-label-md font-semibold border-b border-outline-variant">
                        <th className="p-4 w-20 text-center">สัญลักษณ์</th>
                        <th className="p-4">ชื่อหมวดหมู่</th>
                        <th className="p-4">Slug (สำหรับลิงก์)</th>
                        <th className="p-4 w-40 text-center">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((c) => (
                          <tr key={c.id} className="hover:bg-surface-container-lowest text-body-md text-on-surface">
                            <td className="p-4 text-center">
                              <span className="material-symbols-outlined text-outline text-2xl">{c.icon}</span>
                            </td>
                            <td className="p-4 font-bold">{c.name}</td>
                            <td className="p-4 text-on-surface-variant text-sm font-mono">{c.slug}</td>
                            <td className="p-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => openCategoryEdit(c)}
                                  className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all active:scale-90"
                                  title="แก้ไข"
                                >
                                  <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button
                                  onClick={() => handleCategoryDelete(c.id)}
                                  className="w-9 h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all active:scale-90"
                                  title="ลบ"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-on-surface-variant">
                            {catSearchQuery.trim() !== "" ? "ไม่พบหมวดหมู่ที่ตรงกับการค้นหา" : "ไม่มีรายการหมวดหมู่ในระบบแอดมิน"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= MODALS ================= */}

      {/* 1. PRODUCT ADD/EDIT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-outline-variant w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center shrink-0">
              <h3 className="font-bold text-headline-sm text-on-surface">
                {editingProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-body-md">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-label-md font-bold mb-1">ชื่อสินค้า (Required)</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none"
                    placeholder="เช่น ข้าวเหนียวมะม่วง"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-label-md font-bold mb-1">ราคาสินค้า (฿)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-label-md font-bold mb-1">หมวดหมู่สินค้า</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Preset Checkboxes */}
                <div className="col-span-2">
                  <label className="block text-label-md font-bold mb-2">ป้ายไฮไลท์สินค้า (เลือกได้มากกว่า 1)</label>
                  <div className="flex gap-4 flex-wrap bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-red-600">
                      <input
                        type="checkbox"
                        checked={tagBest1}
                        onChange={(e) => setTagBest1(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-outline-variant"
                      />
                      ขายดีอันดับ 1 (แสดงภาพการ์ดใหญ่)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-orange-600">
                      <input
                        type="checkbox"
                        checked={tagBest}
                        onChange={(e) => setTagBest(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-outline-variant"
                      />
                      ขายดี
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-600">
                      <input
                        type="checkbox"
                        checked={tagRec}
                        onChange={(e) => setTagRec(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-outline-variant"
                      />
                      แนะนำ
                    </label>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-label-md font-bold mb-1">แท็กอื่นๆ เพิ่มเติม (คั่นด้วยเครื่องหมายคอมมา)</label>
                  <input
                    type="text"
                    value={otherTags}
                    onChange={(e) => setOtherTags(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none"
                    placeholder="เช่น ใหม่, มงคล, VIP, eco"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-label-md font-bold mb-1">รูปภาพสินค้า (1 URL ต่อ 1 บรรทัด สำหรับสไลด์)</label>
                  <textarea
                    rows={3}
                    value={productForm.images}
                    onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                    className="w-full p-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none font-mono text-xs"
                    placeholder="ใส่ลิงก์รูปภาพ เช่น https://images.unsplash.com/...
https://images.unsplash.com/..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-label-md font-bold mb-1">รายละเอียดสินค้า</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full p-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none"
                    placeholder="เขียนบรรยายสรรพคุณสินค้า หรือส่วนผสม..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="h-11 px-6 rounded-full border border-outline-variant hover:bg-surface-container-high font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-full bg-primary text-on-primary hover:shadow-lg font-bold"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CATEGORY ADD/EDIT MODAL */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-bold text-headline-sm text-on-surface">
                {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4 text-body-md">
              <div>
                <label className="block text-label-md font-bold mb-1">ชื่อหมวดหมู่ (Required)</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none"
                  placeholder="เช่น ขนมไทย"
                />
              </div>

              <div>
                <label className="block text-label-md font-bold mb-1">ไอคอน (Material Symbols Icon Name)</label>
                <input
                  type="text"
                  required
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none"
                  placeholder="เช่น restaurant, local_drink, inventory_2"
                />
              </div>

              <div>
                <label className="block text-label-md font-bold mb-1">Slug (สำหรับลิงก์หมวดหมู่)</label>
                <input
                  type="text"
                  required
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none"
                  placeholder="เช่น thai-desserts"
                />
              </div>

              <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="h-11 px-6 rounded-full border border-outline-variant hover:bg-surface-container-high font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-full bg-primary text-on-primary hover:shadow-lg font-bold"
                >
                  บันทึกหมวดหมู่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
