"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("กรุณากรอกรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "รหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      {/* Top logo */}
      <Link href="/" className="mb-8 text-center group">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-md active:scale-95 transition-all">
          <span className="material-symbols-outlined text-white text-3xl">home</span>
        </div>
        <h2 className="text-on-surface-variant font-medium text-body-md hover:underline">
          กลับสู่หน้าหลักร้านค้า
        </h2>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-md bg-surface border border-outline-variant rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">
            ระบบหลังบ้านแอดมิน
          </h1>
          <p className="text-on-surface-variant text-body-md mt-1">
            กรุณากรอกรหัสผ่านเพื่อเข้าจัดการข้อมูลร้านค้า
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-md flex items-center gap-2">
              <span className="material-symbols-outlined text-md">error</span>
              {error}
            </div>
          )}

          <div>
            <label className="block text-label-md font-bold text-on-surface mb-2">
              รหัสผ่านแอดมิน (Admin Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านที่นี่..."
              className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-white text-on-surface focus:border-primary focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-bold active:scale-[0.98] hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">login</span>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบแอดมิน"}
          </button>
        </form>
      </div>
    </div>
  );
}
