import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PackageSearch, ShoppingCart, TrendingUp, Sparkles, X, ChevronRight, Check } from 'lucide-react';

interface OnboardingGuideProps {
  onComplete: () => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Selamat Datang! 🎉",
      description: "Aplikasi kasir dan manajemen stok pintar untuk toko Anda. Mari pelajari cara pakainya dalam 3 langkah mudah.",
      icon: <Sparkles className="w-12 h-12 text-amber-500" />,
      color: "bg-amber-50"
    },
    {
      title: "1. Siapkan Barang",
      description: "Pertama, tambahkan kategori dan daftar barang dagangan Anda melalui menu Kelola Produk.",
      icon: <PackageSearch className="w-12 h-12 text-[#7E9F85]" />,
      color: "bg-[#F2F6F3]"
    },
    {
      title: "2. Catat Transaksi",
      description: "Gunakan tombol Masuk saat Anda kulakan/restok barang, dan tombol Keluar saat ada barang terjual.",
      icon: <ShoppingCart className="w-12 h-12 text-blue-500" />,
      color: "bg-blue-50"
    },
    {
      title: "3. Pantau Laporan",
      description: "Semua omzet, sisa stok, dan barang terlaris otomatis terhitung. Pantau semuanya di menu Laporan.",
      icon: <TrendingUp className="w-12 h-12 text-emerald-500" />,
      color: "bg-emerald-50"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
      >
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 bg-neutral-100 rounded-full transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`pt-12 pb-8 px-6 flex justify-center transition-colors duration-500 ${steps[step].color}`}>
          <motion.div
            key={step}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="p-4 bg-white rounded-2xl shadow-sm"
          >
            {steps[step].icon}
          </motion.div>
        </div>

        <div className="p-6 text-center">
          <motion.div
            key={`text-${step}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h2 className="text-xl font-bold text-neutral-900 mb-2">{steps[step].title}</h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-8">
              {steps[step].description}
            </p>
          </motion.div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-[#7E9F85]' : 'w-2 bg-neutral-200'}`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                if (step === steps.length - 1) onComplete();
                else setStep(prev => prev + 1);
              }}
              className="flex items-center gap-2 bg-[#7E9F85] hover:bg-[#68856e] active:scale-95 transition-all text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md"
            >
              {step === steps.length - 1 ? (
                <>Mulai <Check className="w-4 h-4" /></>
              ) : (
                <>Lanjut <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
