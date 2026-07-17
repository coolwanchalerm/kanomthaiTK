"use client";

import { use, useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/data/products";
import html2canvas from "html2canvas-pro";
import BottomNavBar from "@/components/BottomNavBar";
import { supabase } from "@/lib/supabase";

export default function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const captureRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch product and related products from Supabase
  useEffect(() => {
    async function fetchProductData() {
      try {
        setLoading(true);
        // 1. Fetch main product
        const { data: p, error } = await supabase
          .from("productWeb")
          .select(`
            *,
            categories (
              name
            )
          `)
          .eq("id", resolvedParams.id)
          .single();

        if (error) {
          console.error("Error fetching product:", error);
          setProduct(null);
          return;
        }

        if (p) {
          const mappedProduct: Product = {
            id: p.id,
            name: p.name,
            description: p.description || "",
            price: p.price,
            category: p.categories?.name || "",
            images: p.images || [],
            tags: p.tags || [],
            salesCount: p.sales_count || 0,
          };
          setProduct(mappedProduct);

          // 2. Fetch related products (same category)
          const { data: rpData } = await supabase
            .from("productWeb")
            .select(`
              *,
              categories (
                name
              )
            `)
            .eq("category_id", p.category_id)
            .neq("id", p.id)
            .limit(4);

          if (rpData) {
            const mappedRp: Product[] = rpData.map((rp: any) => ({
              id: rp.id,
              name: rp.name,
              description: rp.description || "",
              price: rp.price,
              category: rp.categories?.name || "",
              images: rp.images || [],
              tags: rp.tags || [],
              salesCount: rp.sales_count || 0,
            }));
            setRelatedProducts(mappedRp);
          }
        }
      } catch (err) {
        console.error("Exception fetching product detail:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [resolvedParams.id]);

  // Track carousel scroll position
  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    const slideWidth = el.offsetWidth;
    const index = Math.round(el.scrollLeft / slideWidth);
    setActiveSlide(index);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, loading]);

  const scrollToSlide = (index: number) => {
    if (!carouselRef.current) return;
    const slideWidth = carouselRef.current.offsetWidth;
    carouselRef.current.scrollTo({ left: slideWidth * index, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!captureRef.current || !product) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(captureRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#f8f9fa",
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.download = `${product.name}.jpg`;
      link.href = dataUrl;
      link.click();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save image", err);
      alert("ไม่สามารถบันทึกรูปภาพได้");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!captureRef.current || !product) return;
    try {
      setIsExporting(true);

      // Create a ClipboardItem with a Promise resolving to the Blob.
      // This prevents browsers (like Safari/Chrome) from blocking clipboard write
      // due to loss of user-activation context during async html2canvas execution.
      const clipboardItem = new ClipboardItem({
        "image/png": new Promise<Blob>((resolve, reject) => {
          html2canvas(captureRef.current!, {
            useCORS: true,
            scale: 2,
            backgroundColor: "#f8f9fa",
          })
            .then((canvas) => {
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("ไม่สามารถสร้าง Blob รูปภาพได้"));
                }
              }, "image/png");
            })
            .catch((err) => reject(err));
        }),
      });

      await navigator.clipboard.write([clipboardItem]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err: any) {
      console.error("Failed to copy image", err);
      alert(`เกิดข้อผิดพลาดในการคัดลอก: ${err.message || err.name || "เบราว์เซอร์ไม่รองรับการคัดลอกแบบรูปภาพ"}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant">กำลังโหลดรายละเอียดสินค้า...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <span className="material-symbols-outlined text-outline text-6xl mb-4">
          search_off
        </span>
        <h1 className="text-headline-md font-headline-md mb-2 text-on-surface">
          ไม่พบสินค้า
        </h1>
        <p className="text-on-surface-variant text-body-md mb-6">
          สินค้าที่คุณค้นหาอาจถูกลบหรือไม่มีอยู่ในระบบ
        </p>
        <Link
          href="/"
          className="bg-primary text-on-primary px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-50 bg-primary shadow-sm">
        <div className="flex justify-between items-center px-container-padding py-stack-md max-w-[1100px] mx-auto">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-white">
              arrow_back
            </span>
          </button>
          <h1 className="font-headline-md text-headline-md text-white truncate px-4">
            {product.name}
          </h1>
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-white">
              home
            </span>
          </Link>
        </div>
      </header>

      {/* Search Input (Ignored in html2canvas capture) */}
      <div className="max-w-[1100px] mx-auto px-container-padding mt-4 mb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
            }
          }}
          className="relative"
        >
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้าอื่น ๆ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-10 rounded-full border border-outline-variant bg-white focus:border-primary focus:outline-none text-body-md shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">close</span>
            </button>
          )}
        </form>
      </div>

      {/* Capturable Content Area */}
      <div ref={captureRef}>
        {/* Image Carousel */}
        <div className="relative w-full max-w-[1100px] mx-auto">
          <div className="relative aspect-[4/3] bg-surface-container-highest overflow-hidden md:rounded-b-2xl">
            {product.images.length > 0 ? (
              <div
                ref={carouselRef}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
              >
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full h-full flex-shrink-0 snap-center relative"
                  >
                    <Image
                      src={img}
                      alt={`${product.name} image ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                      crossOrigin="anonymous"
                      priority={idx === 0}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-outline text-6xl">image</span>
              </div>
            )}

            {/* Navigation Arrows (Desktop) */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => scrollToSlide(Math.max(0, activeSlide - 1))}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-all ${
                    activeSlide === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-on-surface">
                    chevron_left
                  </span>
                </button>
                <button
                  onClick={() =>
                    scrollToSlide(
                      Math.min(product.images.length - 1, activeSlide + 1)
                    )
                  }
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-all ${
                    activeSlide === product.images.length - 1
                      ? "opacity-0 pointer-events-none"
                      : "opacity-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-on-surface">
                    chevron_right
                  </span>
                </button>
              </>
            )}

            {/* Slide Counter Badge */}
            {product.images.length > 1 && (
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                {activeSlide + 1} / {product.images.length}
              </div>
            )}

            {/* Dots Indicator */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSlide(idx)}
                    className={`rounded-full transition-all duration-300 ${
                      activeSlide === idx
                        ? "w-6 h-2 bg-white shadow-md"
                        : "w-2 h-2 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="px-container-padding py-stack-lg bg-surface max-w-[1100px] mx-auto">
          {/* Price & Name */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-bold leading-tight">
                {product.name}
              </h2>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide">
                  {product.category}
                </span>
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-on-surface-variant text-label-sm font-label-sm uppercase tracking-widest mb-1">
                ราคา
              </p>
              <span className="text-primary font-bold text-display-lg-mobile">
                ฿{product.price}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-stack-lg border-t border-outline-variant pt-stack-lg">
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                description
              </span>
              รายละเอียด / Description
            </h3>
            <p className="text-body-lg text-on-surface font-body-lg whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Action Buttons (Copy/Save) */}
          <div data-html2canvas-ignore="true" className="mt-stack-lg flex gap-3 border-t border-outline-variant pt-stack-lg">
            <button
              onClick={handleCopy}
              disabled={isExporting}
              className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-full border font-bold text-body-md active:scale-95 transition-all disabled:opacity-50 ${
                copySuccess
                  ? "border-primary bg-secondary-container text-on-secondary-container"
                  : "border-primary text-primary hover:bg-primary/5"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                {copySuccess ? "check_circle" : "content_copy"}
              </span>
              {isExporting ? "กำลังประมวลผล..." : copySuccess ? "คัดลอกแล้ว!" : "คัดลอกภาพ"}
            </button>

            <button
              onClick={handleSave}
              disabled={isExporting}
              className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-full font-bold text-body-md active:scale-95 transition-all disabled:opacity-50 ${
                saveSuccess
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-primary text-on-primary hover:shadow-lg"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                {saveSuccess ? "check_circle" : "download"}
              </span>
              {isExporting
                ? "กำลังประมวลผล..."
                : saveSuccess
                ? "บันทึกสำเร็จ!"
                : "บันทึกรูปภาพ"}
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-container-padding mt-stack-sm pb-8">
          <div className="border-t border-outline-variant pt-stack-lg">
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                grid_view
              </span>
              สินค้าที่เกี่ยวข้อง / Related
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/product/${rp.id}`}
                  className="group rounded-xl overflow-hidden border border-outline-variant bg-surface-container-lowest hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-28 md:h-36 overflow-hidden">
                    {rp.images.length > 0 ? (
                      <Image
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={rp.name}
                        src={rp.images[0]}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline text-xl">image</span>
                      </div>
                    )}
                    {rp.tags.length > 0 && (
                      <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] uppercase font-bold text-primary">
                        {rp.tags[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-on-surface font-semibold text-[13px] truncate leading-tight">
                      {rp.name}
                    </h4>
                    <p className="text-primary font-bold text-[14px] mt-1">
                      ฿{rp.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BottomNavBar */}
      <BottomNavBar currentCategory={product.category} />
    </div>
  );
}
