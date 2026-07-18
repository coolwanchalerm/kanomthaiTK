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
  
  // Use currentCategory if passed, otherwise default to "ขนมไทย"
  const activeCategory = currentCategory || searchParams.get("category") || "ขนมไทย";

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("created_at", { ascending: true });
        if (data) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    // Navigate back to home page with the selected category in query params
    router.push(`/?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-[9999] bg-surface dark:bg-surface-container-lowest border-t border-outline-variant shadow-sm px-gutter py-stack-sm pb-safe flex items-center" style={{ pointerEvents: "auto" }}>
      <div className="flex w-full overflow-x-auto no-scrollbar justify-around items-center gap-2">
        {categories.length > 0 ? (
          categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className={`flex flex-col items-center justify-center rounded-full px-6 py-1 active:scale-90 transition-all duration-200 flex-shrink-0 ${
                activeCategory === cat.name
                  ? "bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined">{cat.icon}</span>
              <span className="font-label-sm text-label-sm">{cat.name}</span>
            </button>
          ))
        ) : (
          // Skeleton loading state
          <div className="w-full flex justify-around items-center">
            <div className="w-20 h-8 bg-surface-container-high rounded-full animate-pulse"></div>
            <div className="w-20 h-8 bg-surface-container-high rounded-full animate-pulse"></div>
            <div className="w-20 h-8 bg-surface-container-high rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function BottomNavBar({ currentCategory }: BottomNavBarProps) {
  return (
    <Suspense fallback={
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant px-gutter py-stack-sm flex items-center h-16">
        <div className="w-full flex justify-around items-center">
          <div className="w-16 h-8 bg-surface-container-high rounded-full animate-pulse"></div>
          <div className="w-16 h-8 bg-surface-container-high rounded-full animate-pulse"></div>
          <div className="w-16 h-8 bg-surface-container-high rounded-full animate-pulse"></div>
        </div>
      </nav>
    }>
      <BottomNavBarContent currentCategory={currentCategory} />
    </Suspense>
  );
}
