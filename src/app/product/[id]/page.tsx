"use client";

import { use, useRef, useState, useCallback, useEffect } from "react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
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
  const isMountedRef = useRef(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Track mount state to prevent setState on unmounted component
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

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



  const handleCopy = async () => {
    if (!captureRef.current || !product || isExporting) return;
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
            // Remove html2canvas cloned elements from DOM after render
            onclone: (_doc, element) => {
              element.style.position = "static";
            },
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

      // Clean up any stray canvas elements html2canvas may have left in the DOM
      document.querySelectorAll("canvas").forEach((c) => {
        if (!captureRef.current?.contains(c)) c.remove();
      });

      if (isMountedRef.current) {
        setCopySuccess(true);
        setTimeout(() => { if (isMountedRef.current) setCopySuccess(false); }, 2000);
      }
    } catch (err: any) {
      console.error("Failed to copy image", err);
      // Clean up stray canvas elements even on error
      document.querySelectorAll("canvas").forEach((c) => {
        if (!captureRef.current?.contains(c)) c.remove();
      });
      alert(`เกิดข้อผิดพลาดในการคัดลอก: ${err.message || err.name || "เบราว์เซอร์ไม่รองรับการคัดลอกแบบรูปภาพ"}`);
    } finally {
      if (isMountedRef.current) setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <div className="w-24 h-24 mb-2"><DotLottieReact src="https://lottie.host/d50f8a03-0bfb-45d7-859b-83eb8c9482aa/ldoOzvuinz.lottie" loop autoplay /></div>
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

      {/* Capturable Content Area - isolation:isolate prevents stacking context leaks from html2canvas */}
      <div ref={captureRef} className="relative" style={{ isolation: "isolate" }}>
        {/* Image Carousel */}
        <div className="relative w-full max-w-[1100px] mx-auto">
          <div className="relative aspect-[4/3] bg-surface-container-highest overflow-hidden md:rounded-b-2xl">
            {product.images.length > 0 ? (
              <div
                ref={carouselRef}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
                style={{ touchAction: "pan-x" }}
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

          {/* Action Buttons (Contact & Copy) */}
          <div data-html2canvas-ignore="true" className="mt-stack-lg flex flex-col gap-4 border-t border-outline-variant pt-stack-lg">
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Copy Image Button */}
              <button
                onClick={handleCopy}
                disabled={isExporting}
                className={`w-full sm:w-auto sm:flex-1 h-12 px-4 flex items-center justify-center gap-2 rounded-full font-bold text-body-md active:scale-95 transition-all disabled:opacity-50 shrink-0 ${
                  copySuccess
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-primary text-on-primary hover:shadow-lg"
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  {copySuccess ? "check_circle" : "content_copy"}
                </span>
                {isExporting ? "กำลังประมวลผล..." : copySuccess ? "คัดลอกแล้ว!" : "คัดลอกภาพ"}
              </button>

              <div className="flex gap-3 w-full sm:w-auto sm:flex-1">
                {/* Messenger Button */}
                <Link
                  href="#"
                  target="_blank"
                  className="flex-1 h-12 flex items-center justify-center gap-2 rounded-full font-bold text-white text-sm bg-[#0084FF] hover:bg-[#0074E4] hover:shadow-lg active:scale-95 transition-all"
                  onClick={(e) => { e.preventDefault(); alert("รอใส่ลิงก์ Facebook Messenger"); }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.9 1.455 5.485 3.738 7.155.239.176.386.452.4.747l.088 2.378c.026.697.801 1.104 1.394.733l2.67-1.671a1.01 1.01 0 0 1 .803-.105 10.456 10.456 0 0 0 .907.039c5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.093 11.196l-2.482-2.656a.79.79 0 0 0-1.124-.047l-3.235 2.915c-.454.409.197 1.077.683.659l2.48-2.657a.792.792 0 0 1 1.125.048l3.235 2.914c.454.409-.197-1.077-.682-.658z"/>
                  </svg>
                  สั่งซื้อ
                </Link>

                {/* LINE Button */}
                <Link
                  href="#"
                  target="_blank"
                  className="flex-1 h-12 flex items-center justify-center gap-2 rounded-full font-bold text-white text-sm bg-[#06C755] hover:bg-[#05B34C] hover:shadow-lg active:scale-95 transition-all"
                  onClick={(e) => { e.preventDefault(); alert("รอใส่ลิงก์ LINE Official"); }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.298.079.757.039 1.08l-.168 1.02c-.05.303-.24 1.186 1.047.645 1.288-.54 6.916-4.069 9.435-6.967 1.739-1.907 2.554-3.93 2.554-5.978zm-15.006 3.195h-2.906a.602.602 0 0 1-.601-.602V7.127c0-.332.27-.601.601-.601.332 0 .602.269.602.601v5.168h2.304c.332 0 .601.27.601.602 0 .332-.269.602-.601.602zm2.146 0h-1.201a.602.602 0 0 1-.602-.602V7.127c0-.332.27-.601.602-.601h1.201c.332 0 .602.269.602.601v5.77a.602.602 0 0 1-.602.602zm4.331 0h-1.121a.602.602 0 0 1-.58-.436l-1.636-2.585v2.419a.602.602 0 0 1-.601.602h-1.119a.602.602 0 0 1-.602-.602V7.127c0-.332.27-.601.602-.601h1.119c.143 0 .28.051.389.141a.596.596 0 0 1 .19.295l1.635 2.584V7.127c0-.332.27-.601.602-.601h1.122a.602.602 0 0 1 .602.601v5.77c0 .332-.27.602-.602.602zm3.327-4.566h-2.148v1.109h2.148c.333 0 .602.27.602.601 0 .332-.269.602-.602.602h-2.148v1.652a.602.602 0 0 1-.602.602h-1.119a.602.602 0 0 1-.602-.602V7.127c0-.332.27-.601.602-.601h3.869c.332 0 .602.269.602.601 0 .332-.27.602-.602.602z"/>
                  </svg>
                  สั่งซื้อ
                </Link>
              </div>
            </div>
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
              รายการที่คุณอาจชอบ
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
