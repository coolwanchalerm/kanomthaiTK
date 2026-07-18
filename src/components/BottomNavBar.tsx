"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

interface BottomNavBarProps {
  currentCategory?: string;
}

function BottomNavBarContent({ currentCategory }: BottomNavBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  const activeCategory = currentCategory || searchParams.get("category") || "";

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await supabase
          .from("categories")
          .select("*")
          .order("created_at", { ascending: true });
        if (data) setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-[9999] bg-surface/95 backdrop-blur-md border-t border-outline-variant"
      style={{
        pointerEvents: "auto",
        willChange: "transform",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {categories.length > 0 ? (
        <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 5)}, 1fr)` }}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className="relative flex flex-col items-center justify-center py-2 gap-0.5 active:scale-90 transition-all duration-200 min-w-0"
              >
                {/* Active pill indicator */}
                <span
                  className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-secondary-container w-14 h-7"
                      : "bg-transparent w-8 h-8"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined transition-all duration-200 select-none ${
                      isActive
                        ? "text-on-secondary-container text-[22px]"
                        : "text-on-surface-variant text-[22px]"
                    }`}
                    style={{
                      fontVariationSettings: isActive
                        ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24"
                        : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    {cat.icon}
                  </span>
                </span>

                {/* Label */}
                <span
                  className={`text-[10px] leading-none font-semibold truncate max-w-full px-1 transition-colors duration-200 ${
                    isActive ? "text-on-surface" : "text-on-surface-variant"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        // Skeleton loading state
        <div className="grid grid-cols-4 w-full py-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-1">
              <div className="w-8 h-8 bg-surface-container-high rounded-full animate-pulse" />
              <div className="w-10 h-2.5 bg-surface-container-high rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}

export default function BottomNavBar({ currentCategory }: BottomNavBarProps) {
  return (
    <Suspense
      fallback={
        <nav
          className="fixed bottom-0 left-0 w-full z-[9999] bg-surface border-t border-outline-variant"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="grid grid-cols-4 w-full py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-1">
                <div className="w-8 h-8 bg-surface-container-high rounded-full animate-pulse" />
                <div className="w-10 h-2.5 bg-surface-container-high rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </nav>
      }
    >
      <BottomNavBarContent currentCategory={currentCategory} />
    </Suspense>
  );
}
