"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // If already logged in, redirect to admin
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) {
          router.replace("/admin");
        }
      } catch {
        // not logged in, stay on login page
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, [router]);

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
        setPassword("");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-24 h-24">
          <DotLottieReact
            src="https://lottie.host/d50f8a03-0bfb-45d7-859b-83eb8c9482aa/ldoOzvuinz.lottie"
            loop
            autoplay
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      {/* Back to store */}
      <Link href="/" className="mb-8 text-center group">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-md active:scale-95 group-hover:scale-105 transition-all">
          <span className="material-symbols-outlined text-white text-3xl">home</span>
        </div>
        <h2 className="text-on-surface-variant font-medium text-body-md group-hover:underline">
          กลับสู่หน้าหลักร้านค้า
        </h2>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-md bg-surface border border-outline-variant rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">ระบบหลังบ้านแอดมิน</h1>
          <p className="text-on-surface-variant text-body-md mt-1">กรุณากรอกรหัสผ่านเพื่อเข้าจัดการข้อมูลร้านค้า</p>
        </div>

        {/* Session info badge */}
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3 mb-6 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
          <span>Session มีอายุ <strong className="text-on-surface">7 วัน</strong> หลังล็อกอิน</span>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-error-container text-on-error-container rounded-xl text-body-md flex items-center gap-2">
              <span className="material-symbols-outlined text-md shrink-0">error</span>
              {error}
            </div>
          )}

          <div>
            <label className="block text-label-md font-bold text-on-surface mb-2">
              รหัสผ่านแอดมิน
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านที่นี่..."
                className="w-full h-12 px-4 pr-12 rounded-xl border border-outline-variant bg-white text-on-surface focus:border-primary focus:outline-none transition-colors"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-primary text-on-primary font-bold active:scale-[0.98] hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-5 h-5">
                  <DotLottieReact
                    src="https://lottie.host/d50f8a03-0bfb-45d7-859b-83eb8c9482aa/ldoOzvuinz.lottie"
                    loop
                    autoplay
                  />
                </div>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">login</span>
                เข้าสู่ระบบแอดมิน
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-on-surface-variant/60 text-center">
        ข้อมูลที่ป้อนจะถูกเข้ารหัสและส่งอย่างปลอดภัย
      </p>
    </div>
  );
}
