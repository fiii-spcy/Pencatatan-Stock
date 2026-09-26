import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Delete,
  Sparkles
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { User } from "../types";
import { useToast } from "./Toast";

export const LoginPage: React.FC = () => {
  const {
    validateCredentials,
    completePinLogin,
    requiresPin,
    currentUser,
    logout,
    isAuthLoading
} = useApp();

  // Step state: 'credentials' (Email & Password) -> 'pin' (4 Digit PIN)
  const [step, setStep] = useState<"credentials" | "pin">("credentials");

  // Sync step with context
  useEffect(() => {
    if (
      requiresPin &&
      currentUser.id !== "user-admin" /* handle initial load mismatch */
    ) {
      setStep("pin");
    } else {
      setStep("credentials");
    }
  }, [requiresPin, currentUser.id]);

  // Step 1: Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: PIN
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Status & Feedback
  const { showToast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  // Timer for lockout countdown
  useEffect(() => {
    if (lockoutTime > Date.now()) {
      const interval = setInterval(() => {
        if (Date.now() >= lockoutTime) {
          setLockoutTime(0);
          setPinAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  // Handle Step 1: Submit Email & Password
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast("Silakan masukkan email dan kata sandi Anda.", 'error');
      return;
    }

    setIsVerifying(true);
    const result = await validateCredentials(email.trim(), password);
    setIsVerifying(false);

    if (!result.success || !result.user) {
      showToast(result.message || "Email atau kata sandi tidak sesuai.", 'error');
      return;
    }

    // Success Step 1 -> Move to PIN screen (now handled by useEffect syncing with Context)
    setPin("");
  };

  // Handle Step 2: Keypad input for PIN
  const handleKeypadPress = (val: string) => {
    if (lockoutTime > Date.now()) return;
    if (val === "backspace") {
      setPin((prev) => prev.slice(0, -1));
    } else if (val === "clear") {
      setPin("");
    } else if (pin.length < 6) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          submitPin(currentUser.id, nextPin);
        }, 120);
      }
    }
  };

  // Handle Step 2: Submit PIN
  const submitPin = (userId: string, pinToVerify: string) => {
    if (lockoutTime > Date.now()) {
      showToast("Tunggu sebentar sebelum mencoba lagi.", 'error');
      return;
    }

    if (!pinToVerify) {
      showToast("Silakan masukkan PIN keamanan.", 'error');
      return;
    }

    setIsVerifying(true);
    const res = completePinLogin(userId, pinToVerify);
    setIsVerifying(false);

    if (!res.success) {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutTime(Date.now() + 60000); // 1 minute lockout
        showToast("Terlalu banyak percobaan salah. Silakan tunggu 1 menit.", 'error');
      } else {
        showToast(res.message || "PIN yang Anda masukkan salah.", 'error');
      }
      setPin("");
    } else {
      setPinAttempts(0);
    }
  };

  const handlePinSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    submitPin(currentUser.id, pin);
  };

  const handleBackToEmail = () => {
    logout();
    setStep("credentials");
    setPin("");
  };

  // Quick fill helper for user convenience
  const fillSampleAccount = (sampleEmail: string, samplePass: string) => {
    setEmail(sampleEmail);
    setPassword(samplePass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2F6F3] via-[#F8FAF8] to-[#EEF3F0] flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-neutral-900 selection:bg-[#7E9F85] selection:text-white">
      {/* Background Soft Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-96 h-96 rounded-full bg-[#7E9F85]/12 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 rounded-full bg-[#5C7D64]/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header Toko */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#719278] to-[#8CAE93] text-white shadow-[0_8px_20px_rgba(113,146,120,0.3)] mb-3 border border-white/40">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
            Toko SS Telur & Sembako
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Sistem Kasir & Manajemen Stok Harian
          </p>
        </div>

        {/* Card Form with Glassmorphism */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_16px_40px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden p-6 sm:p-7">
          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              /* ============================================================
                 STEP 1: FORM EMAIL & PASSWORD
                 ============================================================ */
              <motion.div
                key="step-credentials"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-5">
                  <h2 className="text-base font-bold text-neutral-900">
                    Masuk ke Akun
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Masukkan email dan kata sandi Anda untuk melanjutkan
                  </p>
                </div>

                <form onSubmit={handleSubmitCredentials} className="space-y-4">
                  {/* Email / Identifier Input */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#7E9F85]" />
                      Email atau Username
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      placeholder="nama@gmail.com"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 px-4 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7E9F85] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#7E9F85]" />
                      Kata Sandi / Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                        }}
                        placeholder="Masukkan password Anda..."
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 pl-4 pr-11 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7E9F85] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                        title={
                          showPassword
                            ? "Sembunyikan password"
                            : "Lihat password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isVerifying || !email || !password}
                    className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      email && password && !isVerifying
                        ? "bg-gradient-to-r from-[#719278] to-[#8CAE93] hover:from-[#65856c] hover:to-[#7da084] shadow-[0_4px_16px_rgba(113,146,120,0.35)] active:scale-98"
                        : "bg-neutral-300 cursor-not-allowed text-neutral-500"
                    }`}
                  >
                    <span>
                      {isVerifying ? "Memeriksa akun..." : "Lanjutkan ke PIN"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            ) : (
              /* ============================================================
                 STEP 2: HALAMAN PIN KEAMANAN
                 ============================================================ */
              <motion.div
                key="step-pin"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-[#5C7D64] transition-colors mb-3 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ganti email akun</span>
                </button>

                {/* User Info Bar */}
                <div className="bg-[#F2F6F3] border border-[#7E9F85]/20 rounded-2xl p-3 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#7E9F85] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {currentUser?.name?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {currentUser?.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-mono truncate">
                        {currentUser?.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      currentUser?.role === "admin"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-white text-neutral-700"
                    }`}
                  >
                    {currentUser?.role === "admin" ? "Admin" : "Karyawan"}
                  </span>
                </div>

                <form onSubmit={handlePinSubmitForm} className="space-y-4">
                  <div className="text-center">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#7E9F85]" />
                      Masukkan 4 Digit PIN
                    </label>

                    {/* PIN input field */}
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        value={pin}
                        onChange={(e) => {
                          const clean = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          setPin(clean);
                          if (clean.length === 4) {
                            setTimeout(
                              () => submitPin(currentUser.id, clean),
                              100,
                            );
                          }
                        }}
                        placeholder="••••"
                        className="w-full text-center tracking-[0.4em] font-mono text-xl font-extrabold bg-neutral-50 border border-neutral-200 rounded-2xl py-3 px-10 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#7E9F85] focus:bg-white transition-all"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                        title={showPin ? "Sembunyikan PIN" : "Lihat PIN"}
                      >
                        {showPin ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Dot Indicators */}
                    <div className="flex justify-center gap-2.5 mt-2.5">
                      {[0, 1, 2, 3].map((idx) => {
                        const filled = pin.length > idx;
                        return (
                          <div
                            key={idx}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                              filled
                                ? "bg-[#7E9F85] scale-125 shadow-xs"
                                : "bg-neutral-200"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* On-screen Keypad */}
                  <div className="grid grid-cols-3 gap-2 pt-1 select-none">
                    {[
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      "clear",
                      "0",
                      "backspace",
                    ].map((btn) => {
                      if (btn === "clear") {
                        return (
                          <button
                            key={btn}
                            type="button"
                            onClick={() => handleKeypadPress("clear")}
                            className="py-2.5 rounded-2xl bg-neutral-100/70 hover:bg-neutral-200 active:scale-95 text-xs font-semibold text-neutral-600 transition-all cursor-pointer"
                          >
                            Hapus
                          </button>
                        );
                      }
                      if (btn === "backspace") {
                        return (
                          <button
                            key={btn}
                            type="button"
                            onClick={() => handleKeypadPress("backspace")}
                            className="py-2.5 rounded-2xl bg-neutral-100/70 hover:bg-neutral-200 active:scale-95 flex items-center justify-center text-neutral-600 transition-all cursor-pointer"
                            title="Hapus satu digit"
                          >
                            <Delete className="w-4 h-4" />
                          </button>
                        );
                      }
                      return (
                        <button
                          key={btn}
                          type="button"
                          onClick={() => handleKeypadPress(btn)}
                          className="py-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 active:scale-95 border border-neutral-100 font-bold text-sm text-neutral-800 transition-all cursor-pointer"
                        >
                          {btn}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isVerifying || !pin}
                    className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      pin && !isVerifying
                        ? "bg-gradient-to-r from-[#719278] to-[#8CAE93] hover:from-[#65856c] hover:to-[#7da084] shadow-[0_4px_16px_rgba(113,146,120,0.35)] active:scale-98"
                        : "bg-neutral-300 cursor-not-allowed text-neutral-500"
                    }`}
                  >
                    <span>
                      {isVerifying ? "Memverifikasi..." : "Masuk ke Dashboard"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-neutral-400 mt-4">
          Toko SS Telur & Sembako • Data Tersinkronisasi Otomatis ke Cloud
        </p>
      </div>
    </div>
  );
};
