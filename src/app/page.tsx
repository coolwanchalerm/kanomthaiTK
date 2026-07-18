"use client";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { budgetRanges, BudgetRange, Product } from "@/data/products";
import BottomNavBar from "@/components/BottomNavBar";
import { supabase } from "@/lib/supabase";

function HomeContent() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "ขนมไทย";
  const urlSearch = searchParams.get("search") || "";
  
  const [activeBudget, setActiveBudget] = useState<BudgetRange>(budgetRanges[0]);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state if url parameter changes
  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  // Load products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("productWeb")
          .select(`
            *,
            categories (
              name
            )
          `);
        
        if (error) {
          console.error("Error fetching products:", error);
          return;
        }

        if (data) {
          const mapped: Product[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            price: p.price,
            category: p.categories?.name || "",
            images: p.images || [],
            tags: p.tags || [],
          }));
          setProducts(mapped);
        }
      } catch (err) {
        console.error("Exception fetching products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Reset budget when activeCategory changes
  useEffect(() => {
    setActiveBudget(budgetRanges[0]);
  }, [activeCategory]);

  // Filter products based on active category AND budget range
  // If searchQuery is active, perform a global search by product name
  const filteredProducts = products
    .filter((p) => {
      if (searchQuery.trim() !== "") {
        return p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      if (p.category !== activeCategory) return false;
      if (p.price < activeBudget.min || p.price > activeBudget.max) return false;
      return true;
    })
    .sort((a, b) => {
      const getScore = (p: Product) => {
        if (p.tags.includes("ขายดีอันดับ 1")) return 3;
        if (p.tags.includes("ขายดี")) return 2;
        if (p.tags.includes("แนะนำ")) return 1;
        return 0;
      };
      return getScore(b) - getScore(a);
    });

  // The bestseller (Hero card) is the one tagged with "ขายดีอันดับ 1" (or defaults to first product if none is tagged)
  const bestsellerProduct = filteredProducts.find(p => p.tags.includes("ขายดีอันดับ 1")) || (filteredProducts.length > 0 ? filteredProducts[0] : null);
  const otherProducts = filteredProducts.filter(p => p.id !== bestsellerProduct?.id);

  return (
    <>
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-50 bg-primary shadow-sm">
        <div className="relative flex justify-center items-center gap-3 px-container-padding py-stack-md max-w-[1100px] mx-auto">
          <Image
            src="/logo.jpg"
            alt="โลโก้ ขนมไทยแทนคุณ"
            width={36}
            height={36}
            className="rounded-full border border-white/20 shadow-sm shrink-0"
            unoptimized
          />
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-white tracking-tight">
            ขนมไทยแทนคุณ
          </h1>
          <Link
            href="/admin/login"
            className="absolute right-container-padding w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all animate-fade-in"
            title="ระบบหลังบ้านแอดมิน"
          >
            <span className="material-symbols-outlined text-white text-[24px]">
              admin_panel_settings
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-container-padding pb-32">
        {/* Search Input */}
        <section className="mt-stack-md relative z-40">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-[22px] -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้าจากทุกหมวดหมู่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-10 rounded-full border border-outline-variant bg-white focus:border-primary focus:outline-none text-body-md shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-[22px] -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">close</span>
              </button>
            )}

            {/* Search Dropdown */}
            {searchQuery.trim() !== "" && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-outline-variant rounded-2xl shadow-xl overflow-hidden max-h-80 overflow-y-auto animate-fade-in z-50">
                {filteredProducts.length > 0 ? (
                  <>
                    <div className="px-4 py-2 text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 border-b border-outline-variant/50">
                      ผลการค้นหา ({filteredProducts.length} รายการ)
                    </div>
                    {filteredProducts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-surface-container-high border-b border-outline-variant/50 last:border-0 transition-colors"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-container-highest shrink-0 shadow-sm border border-outline-variant/30">
                          {p.images.length > 0 ? (
                            <Image src={p.images[0]} alt={p.name} fill className="object-cover" unoptimized />
                          ) : (
                            <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-outline">image</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-on-surface text-sm truncate">{p.name}</h4>
                          <p className="text-xs text-on-surface-variant truncate">{p.category} • ฿{p.price}</p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                      </Link>
                    ))}
                  </>
                ) : (
                  <div className="p-6 text-center text-sm text-on-surface-variant flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
                    <p>ไม่พบสินค้าที่ค้นหา</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Budget Filter */}
        <section className="mt-stack-md">
          <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-3">
            เลือกตามราคา
          </h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-container-padding px-container-padding">
            {budgetRanges.map((budget) => (
              <button
                key={budget.label}
                onClick={() => setActiveBudget(budget)}
                className={`h-8 px-4 text-xs font-medium rounded-full border transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                  activeBudget.label === budget.label
                    ? "border-primary bg-primary text-on-primary shadow-sm"
                    : "border-outline-variant bg-white text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5"
                }`}
              >
                {budget.label}
              </button>
            ))}
          </div>
        </section>

        {/* Result Count */}
        <div className="mt-stack-md flex items-center justify-between">
          <div className="text-on-surface-variant text-body-md">
            {searchQuery.trim() !== "" ? (
              <p>
                ผลการค้นหาสำหรับ &quot;<span className="text-primary font-semibold">{searchQuery}</span>&quot; พบ <span className="text-primary font-semibold">{filteredProducts.length}</span> รายการ
              </p>
            ) : (
              <p>
                พบ <span className="text-primary font-semibold">{loading ? "..." : filteredProducts.length}</span> รายการ
              </p>
            )}
          </div>
          {(activeBudget.label !== "ทั้งหมด" || searchQuery.trim() !== "") && (
            <button
              onClick={() => {
                setActiveBudget(budgetRanges[0]);
                setSearchQuery("");
              }}
              className="text-primary text-label-sm font-label-sm hover:underline flex items-center gap-1 shrink-0 ml-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Dynamic Gallery Grid */}
        <section className="mt-stack-md grid grid-cols-2 gap-4 md:grid-cols-12">
          {loading ? (
            // Skeleton Loader
            <div className="col-span-2 md:col-span-12 py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-2"><DotLottieReact src="https://lottie.host/d50f8a03-0bfb-45d7-859b-83eb8c9482aa/ldoOzvuinz.lottie" loop autoplay /></div>
              <p className="text-on-surface-variant">กำลังโหลดสินค้าจากระบบ...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              {/* === Hero Card: Bestseller/Highlight product === */}
              {bestsellerProduct && (
                <Link
                  href={`/product/${bestsellerProduct.id}`}
                  className="col-span-2 md:col-span-8 md:row-span-2 rounded-xl overflow-hidden tonal-layer border border-outline-variant group cursor-pointer transition-all hover:shadow-2xl flex flex-col"
                >
                  <div className="relative h-[280px] md:h-[420px]">
                    {bestsellerProduct.images.length > 0 ? (
                      <Image
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={bestsellerProduct.name}
                        src={bestsellerProduct.images[0]}
                        unoptimized
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline text-4xl">image</span>
                      </div>
                    )}
                    {/* Bestseller / Promoted badges */}
                    <div className="absolute top-4 left-4 bg-primary text-on-primary px-3 py-1 rounded-full text-label-sm font-label-sm flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>local_fire_department</span>
                      {bestsellerProduct.tags.includes("ขายดีอันดับ 1") ? "ขายดีอันดับ 1" : bestsellerProduct.tags.includes("ขายดี") ? "ขายดี" : bestsellerProduct.tags.includes("แนะนำ") ? "แนะนำ" : "ยอดนิยม"}
                    </div>
                  </div>
                  <div className="p-container-padding bg-surface-container-lowest animate-fade-in">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">
                          {bestsellerProduct.name}
                        </h3>
                        <p className="text-on-surface-variant text-body-md mt-1 truncate max-w-[200px] md:max-w-[400px]">
                          {bestsellerProduct.description}
                        </p>
                      </div>
                      <span className="text-primary font-bold text-headline-md shrink-0">
                        ฿{bestsellerProduct.price}
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* === Other Products (sorted by tag priority) === */}
              {otherProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="col-span-1 md:col-span-4 rounded-xl overflow-hidden tonal-layer border border-outline-variant group cursor-pointer transition-all hover:shadow-2xl flex flex-col"
                >
                  <div className="relative h-40">
                    {product.images.length > 0 ? (
                      <Image
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={product.name}
                        src={product.images[0]}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline text-2xl">image</span>
                      </div>
                    )}
                    {product.tags.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] uppercase font-bold text-primary shadow-sm">
                        {product.tags[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-stack-md flex flex-col flex-1 bg-surface-container-lowest">
                    <h3 className="font-label-sm text-label-sm text-on-surface font-bold truncate">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-primary font-bold">
                        ฿{product.price}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          ) : (
            <div className="col-span-2 md:col-span-12 py-16 text-center">
              <span className="material-symbols-outlined text-outline text-5xl mb-4 block">search_off</span>
              <p className="text-on-surface-variant text-body-lg mb-2">
                ไม่พบสินค้าที่ตรงกับการค้นหาของคุณ
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveBudget(budgetRanges[0]);
                }}
                className="text-primary font-semibold hover:underline"
              >
                ดูสินค้าทั้งหมด
              </button>
            </div>
          )}
        </section>
      </main>

      {/* BottomNavBar */}
      <BottomNavBar />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <div className="w-24 h-24"><DotLottieReact src="https://lottie.host/d50f8a03-0bfb-45d7-859b-83eb8c9482aa/ldoOzvuinz.lottie" loop autoplay /></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
