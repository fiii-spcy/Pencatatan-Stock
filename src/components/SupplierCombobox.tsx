import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Building2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SupplierComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const SupplierCombobox: React.FC<SupplierComboboxProps> = ({
  value,
  onChange,
  placeholder = 'Pilih supplier atau ketik baru...',
  className = '',
  id = 'supplier-combobox-input',
}) => {
  const { suppliers } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter suppliers based on current input
  const filteredSuppliers = useMemo(() => {
    if (!value || value.trim() === '') {
      return suppliers;
    }
    const query = value.toLowerCase().trim();
    return suppliers.filter((s) => s.toLowerCase().includes(query));
  }, [suppliers, value]);

  // Check if current value already exactly matches an existing supplier
  const isExactMatch = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    return suppliers.some((s) => s.toLowerCase() === trimmed);
  }, [suppliers, value]);

  const handleSelect = (supplierName: string) => {
    onChange(supplierName);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-[#FAFAFA] border border-neutral-200 rounded-2xl pl-4 pr-16 py-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#7E9F85] focus:bg-white transition-all ${className}`}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full transition-colors"
              title="Hapus"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors cursor-pointer"
            title="Buka daftar supplier"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#7E9F85]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden divide-y divide-neutral-100 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header info */}
          <div className="p-2.5 bg-neutral-50/80 flex items-center justify-between text-[11px] text-neutral-500 font-medium sticky top-0 backdrop-blur-xs z-10">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#7E9F85]" />
              Supplier Terdaftar ({suppliers.length})
            </span>
            <span className="text-[10px] text-neutral-400">
              Pilih atau ketik baru
            </span>
          </div>

          {/* If user typed something not yet in list, give clear prompt */}
          {value.trim() !== '' && !isExactMatch && (
            <div
              onClick={() => handleSelect(value.trim())}
              className="px-4 py-2.5 bg-[#F2F6F3]/70 hover:bg-[#EDF3EE] cursor-pointer text-xs font-semibold text-[#2E4F36] flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#7E9F85] shrink-0"></span>
                <span className="truncate">Gunakan "{value.trim()}" (supplier baru)</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#527459] bg-white px-2 py-0.5 rounded-full border border-[#7E9F85]/20 shrink-0 ml-2">
                Baru
              </span>
            </div>
          )}

          {/* Filtered list of registered suppliers */}
          {filteredSuppliers.length > 0 ? (
            <div className="py-1">
              {filteredSuppliers.map((supp) => {
                const isSelected = supp.toLowerCase() === value.trim().toLowerCase();
                return (
                  <button
                    key={supp}
                    type="button"
                    onClick={() => handleSelect(supp)}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F2F6F3] text-[#2E4F36] font-bold'
                        : 'hover:bg-neutral-50 text-neutral-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#7E9F85]' : 'text-neutral-400'}`} />
                      <span className="truncate">{supp}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#7E9F85] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-neutral-400">
              {value.trim() === '' ? (
                'Belum ada riwayat supplier tersimpan'
              ) : (
                <span>
                  Tidak ada supplier yang cocok. Ketik untuk mendaftarkan supplier baru.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
