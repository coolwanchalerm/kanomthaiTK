"use client";

import { useEffect, useRef, useState } from "react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { getOptimizedImageUrl } from "@/lib/image-url";

// Common Thai dessert name suggestions for autocomplete
const THAI_DESSERT_SUGGESTIONS = [
  "เบรกขนม 2 อย่าง",
  "เบรกขนม 3 อย่าง",
  "วุ้นกะทิ",
  "วุ้นมะพร้าวอ่อน",
  "ขนมเปียกปูน",
  "ขนมลืมลาวา",
  "ข้าวเหนียวมะม่วง",
  "ข้าวเหนียวสังขยา",
  "ข้าวเหนียวทุเรียน",
  "ข้าวต้มมัด",
  "บัวลอยน้ำขิง",
  "บัวลอยไข่หวาน",
  "ลอดช่องน้ำกะทิ",
  "ลอดช่องสิงคโปร์",
  "สังขยาใบเตย",
  "สังขยาฟักทอง",
  "ทองหยิบ",
  "ทองหยอด",
  "ฝอยทอง",
  "กล้วยบวชชี",
  "กล้วยทอด",
  "เผือกทอด",
  "มันทอด",
  "ขนมต้ม",
  "ขนมชั้น",
  "ขนมกล้วย",
  "ขนมใส่ไส้",
  "ขนมครก",
  "ขนมถ้วยฟู",
  "ขนมหน้าตั้ง",
  "ขนมทองพับ",
  "ขนมดอกลำดวน",
  "ขนมดอกจอก",
  "ขนมกระยาสารท",
  "ขนมเทียน",
  "ขนมจาก",
  "น้ำแข็งไสราดกะทิ",
  "น้ำแข็งไสเผือก",
  "วุ้นกรอบ",
  "วุ้นหวาน",
  "ไอศกรีมกะทิ",
  "ไอศกรีมข้าวเหนียว",
  "มะพร้าวแก้ว",
  "ฟักทองแก้ว",
  "กล้วยแก้ว",
  "ชุดขนมไทย",
];
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

  // Storage Stats State
  const [storageUsedBytes, setStorageUsedBytes] = useState<number | null>(null);
  const [storageFileCount, setStorageFileCount] = useState<number>(0);
  const [storageQuotaBytes, setStorageQuotaBytes] = useState<number>(1 * 1024 * 1024 * 1024); // default 1GB
  const [storageLoading, setStorageLoading] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);

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
  const [nameAutocomplete, setNameAutocomplete] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [descAutocomplete, setDescAutocomplete] = useState<string[]>([]);
  const [showDescAutocomplete, setShowDescAutocomplete] = useState(false);
  const descAutocompleteRef = useRef<HTMLDivElement>(null);

  // Compress high-res images client-side before uploading/saving
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/webp", 0.85));
        };
        img.onerror = (err) => reject(err);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    price: string | number;
    category_id: string;
  }>({
    name: "",
    description: "",
    price: "",
    category_id: "",
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "",
    slug: "",
  });

  // Delete Confirmation States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "product" | "category"; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Verify Admin Session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) {
          setAuthorized(true);
          fetchData();
          fetchStorageInfo();
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

  // Fetch Supabase Storage usage info
  const fetchStorageInfo = async () => {
    try {
      setStorageLoading(true);
      let totalBytes = 0;
      let totalFiles = 0;

      // Images are stored as Google Drive URLs in productWeb.images column
      const { data: prods } = await supabase
        .from("productWeb")
        .select("images");

      if (prods) {
        for (const p of prods) {
          for (const img of (p.images || []) as string[]) {
            if (img.includes("googleusercontent.com") || img.startsWith("http")) {
              // Google Drive URL or external URL — count file but no local byte cost
              totalFiles++;
            } else if (img.startsWith("data:")) {
              // Legacy base64 — count byte size
              totalBytes += Math.round(img.length * 0.75);
              totalFiles++;
            }
          }
        }
      }

      setStorageUsedBytes(totalBytes);
      setStorageFileCount(totalFiles);
    } catch (err) {
      console.error("Error fetching storage info:", err);
    } finally {
      setStorageLoading(false);
    }
  };

  // Export database as JSON backup
  const handleExportBackup = async () => {
    if (exportingBackup) return;
    try {
      setExportingBackup(true);
      const { data: prodData } = await supabase
        .from("productWeb")
        .select(`*, categories(name)`)
        .order("created_at", { ascending: false });
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      const backupData = {
        exported_at: new Date().toISOString(),
        products: prodData || [],
        categories: catData || [],
      };

      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kanomthaink-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการ Export: " + (err.message || "ไม่ทราบสาเหตุ"));
    } finally {
      setExportingBackup(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  // Handle image files selection — compress client-side then upload to Google Drive
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(true);
      const newImages: string[] = [];
      const failedFiles: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`กำลังอัปโหลดรูปที่ ${i + 1}/${files.length} (${file.name})...`);

        try {
          // 1. Compress image client-side (Max 1200px, 0.82 quality)
          const compressedDataUrl = await compressImage(file);

          // 2. Convert compressed dataURL back to Blob (WebP)
          const fetchRes = await fetch(compressedDataUrl);
          const blob = await fetchRes.blob();

          // 3. Upload to Google Drive via API route
          const formData = new FormData();
          formData.append("file", blob, `image-${Date.now()}-${i}.webp`);

          const uploadRes = await fetch("/api/upload-drive", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error || `Upload failed (${uploadRes.status})`);
          }

          const { url } = await uploadRes.json();
          if (url) {
            newImages.push(url);
            // Progressively add each image to state so user sees real-time progress
            setProductImages((prev) => [...prev, url]);
          }

          // Small pause between multiple files to prevent Google Apps Script throttling
          if (i < files.length - 1) {
            await new Promise((r) => setTimeout(r, 400));
          }
        } catch (fileErr: any) {
          console.error(`Failed to upload ${file.name}:`, fileErr);
          failedFiles.push(file.name);
        }
      }

      if (failedFiles.length > 0) {
        alert(`อัปโหลดสำเร็จ ${newImages.length} รูป แต่มี ${failedFiles.length} รูปที่ล้มเหลว (${failedFiles.join(", ")}) โปรดลองอัปโหลดรูปที่เหลืออีกครั้ง`);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: " + (err.message || "ไม่ทราบสาเหตุ"));
    } finally {
      setUploadingImages(false);
      setUploadProgress("");
      // Reset input value
      e.target.value = "";
    }
  };

  const removeProductImage = (indexToRemove: number) => {
    const imgToRemove = productImages[indexToRemove];
    setProductImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    
    // Asynchronously delete the removed file from Google Drive
    if (imgToRemove) {
      fetch("/api/delete-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imgToRemove }),
      }).catch((err) => console.error("Failed to delete image from Drive:", err));
    }
  };

  // --- Product CRUD ---
  const openProductAdd = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: "",
      category_id: categories[0]?.id || "",
    });
    setProductImages([]);
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
      price: String(prod.price),
      category_id: prod.category_id,
    });
    setProductImages((prod.images || []).map(getOptimizedImageUrl));
    
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
      price: Number(productForm.price) || 0,
      category_id: productForm.category_id,
      images: productImages,
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

  // --- Delete confirmation triggers ---
  const confirmDeleteProduct = (id: string, name: string) => {
    setDeleteTarget({ id, type: "product", name });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCategory = (id: string, name: string) => {
    setDeleteTarget({ id, type: "category", name });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.type === "product") {
        const targetProd = products.find((p) => p.id === deleteTarget.id);
        const imagesToDelete = targetProd?.images || [];

        const { error } = await supabase
          .from("productWeb")
          .delete()
          .eq("id", deleteTarget.id);
        if (error) throw error;

        // Delete product images from Google Drive
        if (imagesToDelete.length > 0) {
          fetch("/api/delete-drive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls: imagesToDelete }),
          }).catch((err) => console.error("Failed to delete product images from Drive:", err));
        }
      } else {
        const prodsInCategory = products.filter((p) => p.category_id === deleteTarget.id);
        const imagesToDelete = prodsInCategory.flatMap((p) => p.images || []);

        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", deleteTarget.id);
        if (error) throw error;

        // Delete all images under the deleted category
        if (imagesToDelete.length > 0) {
          fetch("/api/delete-drive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls: imagesToDelete }),
          }).catch((err) => console.error("Failed to delete category images from Drive:", err));
        }
      }
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      alert(`ไม่สามารถลบ${deleteTarget.type === "product" ? "สินค้า" : "หมวดหมู่"}ได้: ${err.message || err.details || "ไม่ทราบสาเหตุ"}`);
      console.error(err);
    } finally {
      setDeleting(false);
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
      <header className="bg-primary text-white py-3 px-6 sticky top-0 z-40 shadow-md flex justify-between items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">ระบบควบคุมหลังบ้าน</h1>
          <p className="text-xs text-white/70 hidden sm:block">ขนมไทยแทนคุณ</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Admin badge */}
          <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            Admin Online
          </div>
          <Link href="/" className="text-sm border border-white/30 hover:bg-white/10 px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span className="hidden sm:inline">ดูหน้าร้านค้า</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-white/20 hover:bg-red-500/80 border border-white/20 hover:border-red-400/50 px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 group"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* Stats Section */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

          {/* Storage Card */}
          <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-outline-variant shadow-sm flex items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              storageLoading ? "bg-blue-50 text-blue-400" :
              storageUsedBytes !== null && storageUsedBytes / storageQuotaBytes > 0.8 ? "bg-red-100 text-red-600" :
              storageUsedBytes !== null && storageUsedBytes / storageQuotaBytes > 0.5 ? "bg-yellow-100 text-yellow-700" :
              "bg-blue-50 text-blue-600"
            }`}>
              <span className="material-symbols-outlined text-2xl">cloud</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">พื้นที่จัดเก็บ</p>
              {storageLoading ? (
                <div className="mt-2 h-5 w-24 bg-surface-container-high rounded animate-pulse" />
              ) : (
                <h3 className="text-2xl font-bold text-on-surface mt-1">
                  {storageUsedBytes === null
                    ? "—"
                    : storageUsedBytes < 1024 * 1024
                    ? `${(storageUsedBytes / 1024).toFixed(0)} KB`
                    : storageUsedBytes < 1024 * 1024 * 1024
                    ? `${(storageUsedBytes / (1024 * 1024)).toFixed(1)} MB`
                    : `${(storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`}
                </h3>
              )}
              {/* Mini progress bar */}
              {!storageLoading && storageUsedBytes !== null && (
                <div className="mt-2 h-1.5 bg-outline-variant rounded-full overflow-hidden w-full">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      storageUsedBytes / storageQuotaBytes > 0.8 ? "bg-red-500" :
                      storageUsedBytes / storageQuotaBytes > 0.5 ? "bg-yellow-500" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min((storageUsedBytes / storageQuotaBytes) * 100, 100).toFixed(1)}%` }}
                  />
                </div>
              )}
              {!storageLoading && storageUsedBytes !== null && (
                <p className="text-[10px] text-on-surface-variant mt-1">
                  {storageFileCount} ไฟล์ • จาก {(storageQuotaBytes / (1024 * 1024 * 1024)).toFixed(0)} GB
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Backup & Refresh Row */}
        <div className="flex justify-end gap-2 mb-8">
          <button
            onClick={fetchStorageInfo}
            disabled={storageLoading}
            className="h-8 px-3 rounded-full bg-surface border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            รีเฟรชพื้นที่
          </button>
          <button
            onClick={handleExportBackup}
            disabled={exportingBackup}
            className="h-8 px-3 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">{exportingBackup ? "hourglass_empty" : "download"}</span>
            {exportingBackup ? "กำลัง Export..." : "Backup JSON"}
          </button>
        </div>


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
            <div className="w-24 h-24 mx-auto mb-2"><DotLottieReact src="/loading.lottie" loop autoplay /></div>
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
                    filteredProducts.map((p, idx) => (
                      <div key={p.id} className="border border-outline-variant rounded-xl p-4 flex flex-col justify-between bg-surface hover:shadow-md transition-all gap-3">
                        <div className="flex gap-4">
                          {/* Thumbnail Image */}
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant bg-surface-container-high shrink-0">
                            {p.images.length > 0 ? (
                              <Image
                                src={getOptimizedImageUrl(p.images[0])}
                                alt={p.name}
                                fill
                                className="object-cover"
                                priority={idx < 6}
                                loading={idx < 6 ? "eager" : "lazy"}
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
                            onClick={() => confirmDeleteProduct(p.id, p.name)}
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
                                  onClick={() => confirmDeleteCategory(c.id, c.name)}
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
                  <div className="relative" ref={autocompleteRef}>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductForm({ ...productForm, name: val });
                        if (val.trim().length > 0) {
                          const filtered = THAI_DESSERT_SUGGESTIONS.filter((s) =>
                            s.toLowerCase().includes(val.toLowerCase())
                          );
                          setNameAutocomplete(filtered);
                          setShowAutocomplete(filtered.length > 0);
                        } else {
                          setNameAutocomplete(THAI_DESSERT_SUGGESTIONS.slice(0, 8));
                          setShowAutocomplete(true);
                        }
                      }}
                      onFocus={() => {
                        const val = productForm.name.trim();
                        if (val.length === 0) {
                          setNameAutocomplete(THAI_DESSERT_SUGGESTIONS.slice(0, 8));
                        } else {
                          const filtered = THAI_DESSERT_SUGGESTIONS.filter((s) =>
                            s.toLowerCase().includes(val.toLowerCase())
                          );
                          setNameAutocomplete(filtered);
                        }
                        setShowAutocomplete(true);
                      }}
                      onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                      className="w-full h-11 px-3.5 pr-10 rounded-lg border border-outline-variant focus:border-primary focus:outline-none"
                      placeholder="พิมพ์หรือเลือกจากรายการแนะนำ..."
                      autoComplete="off"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                      {showAutocomplete ? "expand_less" : "expand_more"}
                    </span>

                    {/* Autocomplete Dropdown */}
                    {showAutocomplete && nameAutocomplete.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden max-h-52 overflow-y-auto">
                        {nameAutocomplete.length < THAI_DESSERT_SUGGESTIONS.length && (
                          <div className="px-3.5 py-2 text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider border-b border-outline-variant bg-surface-container-low">
                            รายการที่เกี่ยวข้อง
                          </div>
                        )}
                        {nameAutocomplete.length === THAI_DESSERT_SUGGESTIONS.slice(0,8).length && productForm.name.trim() === "" && (
                          <div className="px-3.5 py-2 text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider border-b border-outline-variant bg-surface-container-low">
                            ✨ ขนมไทยยอดนิยม
                          </div>
                        )}
                        {nameAutocomplete.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={() => {
                              setProductForm({ ...productForm, name: suggestion });
                              setShowAutocomplete(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-body-md hover:bg-primary/5 active:bg-primary/10 transition-colors flex items-center gap-2 ${
                              productForm.name === suggestion ? "bg-primary/10 text-primary font-bold" : "text-on-surface"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">cookie</span>
                            {suggestion}
                            {productForm.name === suggestion && (
                              <span className="material-symbols-outlined text-primary text-[16px] ml-auto">check</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-label-md font-bold mb-1">ราคาสินค้า (฿)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    required
                    value={productForm.price}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
                      setProductForm({ ...productForm, price: cleanVal });
                    }}
                    className="w-full h-11 px-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none text-body-md"
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
                  <label className="block text-label-md font-bold mb-1">
                    รูปภาพสินค้า (อัปโหลดไฟล์รูปภาพ)
                  </label>
                  
                  {/* File upload drag & drop area */}
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer text-center relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      disabled={uploadingImages}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="material-symbols-outlined text-primary text-3xl mb-1">
                      cloud_upload
                    </span>
                    <p className="text-sm font-bold text-on-surface">
                      {uploadingImages ? (uploadProgress || "กำลังประมวลผลและอัปโหลดรูปภาพ...") : "คลิกเลือกไฟล์รูปภาพเพื่ออัปโหลด"}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      รองรับ JPG, PNG, WebP (เลือกได้หลายรูปเพื่อทำสไลด์)
                    </p>
                  </div>

                  {/* Thumbnail Previews */}
                  {productImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {productImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-outline-variant group bg-surface-container-high">
                          <Image
                            src={getOptimizedImageUrl(img)}
                            alt={`รูปสินค้า ${idx + 1}`}
                            fill
                            className="object-cover"
                            loading="eager"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => removeProductImage(idx)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition-all"
                            title="ลบรูปภาพนี้"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-label-md font-bold mb-1">รายละเอียดสินค้า</label>
                  <div className="relative" ref={descAutocompleteRef}>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductForm({ ...productForm, description: val });
                        // Filter from existing product descriptions
                        const existing = products
                          .map((p) => p.description)
                          .filter((d) => d && d.trim() !== "");
                        const unique = Array.from(new Set(existing));
                        if (val.trim().length > 0) {
                          const filtered = unique.filter((d) =>
                            d.toLowerCase().includes(val.toLowerCase())
                          );
                          setDescAutocomplete(filtered);
                          setShowDescAutocomplete(filtered.length > 0);
                        } else {
                          setDescAutocomplete(unique.slice(0, 5));
                          setShowDescAutocomplete(unique.length > 0);
                        }
                      }}
                      onFocus={() => {
                        const existing = products
                          .map((p) => p.description)
                          .filter((d) => d && d.trim() !== "");
                        const unique = Array.from(new Set(existing));
                        const val = productForm.description.trim();
                        if (val.length === 0) {
                          setDescAutocomplete(unique.slice(0, 5));
                        } else {
                          const filtered = unique.filter((d) =>
                            d.toLowerCase().includes(val.toLowerCase())
                          );
                          setDescAutocomplete(filtered);
                        }
                        setShowDescAutocomplete(unique.length > 0);
                      }}
                      onBlur={() => setTimeout(() => setShowDescAutocomplete(false), 150)}
                      onKeyDown={(e) => { if (e.key === "Escape") setShowDescAutocomplete(false); }}
                      className="w-full p-3.5 rounded-lg border border-outline-variant focus:border-primary focus:outline-none resize-none"
                      placeholder="เขียนรายละเอียด หรือเลือกจากสินค้าที่มีในระบบ..."
                    />

                    {/* Description Autocomplete Dropdown — opens UPWARD to avoid covering the save button */}
                    {showDescAutocomplete && descAutocomplete.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                        <div className="px-3.5 py-2 text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider border-b border-outline-variant bg-surface-container-low flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">history</span>
                            รายละเอียดจากสินค้าในระบบ
                          </div>
                          <button
                            type="button"
                            onMouseDown={() => setShowDescAutocomplete(false)}
                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface-container-high"
                          >
                            <span className="material-symbols-outlined text-[13px]">close</span>
                          </button>
                        </div>
                        {descAutocomplete.map((desc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => {
                              setProductForm({ ...productForm, description: desc });
                              setShowDescAutocomplete(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-sm hover:bg-primary/5 active:bg-primary/10 transition-colors flex items-start gap-2 ${
                              productForm.description === desc ? "bg-primary/10" : ""
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px] text-on-surface-variant shrink-0 mt-0.5">description</span>
                            <span className="text-on-surface line-clamp-2 text-xs leading-relaxed">{desc}</span>
                            {productForm.description === desc && (
                              <span className="material-symbols-outlined text-primary text-[15px] ml-auto shrink-0">check</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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

      {/* 3. DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-outline-variant w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col p-6 animate-scale-in text-center text-body-md">
            {/* Warning icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            
            <h3 className="font-bold text-headline-sm text-on-surface mb-2">
              ยืนยันการลบข้อมูล
            </h3>
            
            <p className="text-on-surface-variant mb-6 text-sm">
              {deleteTarget.type === "product" ? (
                <>คุณต้องการลบสินค้า <strong>&quot;{deleteTarget.name}&quot;</strong> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</>
              ) : (
                <>การลบหมวดหมู่ <strong>&quot;{deleteTarget.name}&quot;</strong> จะทำให้สินค้าทั้งหมดที่อยู่ในหมวดหมู่นี้ถูกลบออกไปด้วย คุณแน่ใจใช่หรือไม่?</>
              )}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="h-10 px-5 rounded-full border border-outline-variant hover:bg-surface-container-high font-bold text-sm transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="h-10 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-6 h-6"><DotLottieReact src="/loading.lottie" loop autoplay /></div>
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>ลบข้อมูล</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
