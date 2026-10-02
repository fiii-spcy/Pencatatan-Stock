import sys
import re

def modify_pagemasuk(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    content = content.replace(
        "import { PackagePlus, ChevronDown, Check } from 'lucide-react';",
        "import { PackagePlus, ChevronDown, Check, Pencil, Trash2, X } from 'lucide-react';"
    )

    # 2. useApp
    content = content.replace(
        "currentUser,\n    transactions\n} = useApp();",
        "currentUser,\n    transactions,\n    isAdmin,\n    updateTransaction,\n    deleteTransaction\n} = useApp();"
    )

    # 3. State
    state_injection = """  const [note, setNote] = useState<string>('');

  // Edit History State
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSupplier, setEditSupplier] = useState('');
  const [editNote, setEditNote] = useState('');

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    const qtyNum = parseFloat(editQuantity.replace(',', '.'));
    if (isNaN(qtyNum) || qtyNum <= 0) {
      showToast('Jumlah tidak valid', 'error');
      return;
    }
    const res = updateTransaction(editingTx.id, {
      quantity: qtyNum,
      buyPrice: parseFloat(editPrice) || 0,
      supplier: editSupplier.trim() || undefined,
      note: editNote.trim() || undefined
    });
    if (res.success) {
      showToast('Transaksi berhasil diubah', 'success');
      setEditingTx(null);
    } else {
      showToast(res.message || 'Gagal mengubah', 'error');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Yakin ingin menghapus riwayat ini?')) {
      const res = deleteTransaction(id);
      if (res.success) showToast('Transaksi dihapus', 'success');
      else showToast(res.message || 'Gagal menghapus', 'error');
    }
  };"""
    content = content.replace("  const [note, setNote] = useState<string>('');", state_injection)

    # 4. Table Header (add Aksi if isAdmin)
    th_old = '<th className="py-2.5 px-4 text-right font-semibold w-1/5 text-[#3E6047]">Sisa</th>\n              </tr>'
    th_new = '<th className="py-2.5 px-4 text-right font-semibold w-1/5 text-[#3E6047]">Sisa</th>\n                {isAdmin && <th className="py-2.5 px-4 text-center font-semibold w-1/5">Aksi</th>}\n              </tr>'
    content = content.replace(th_old, th_new)

    # 5. Table Body (add Aksi buttons)
    td_old = '<td className="py-3 px-4 text-right">\n                        <span className="font-bold text-black">\n                          {tx.currentBalance} {tx.unit}\n                        </span>\n                      </td>\n                    </tr>'
    td_new = '<td className="py-3 px-4 text-right">\n                        <span className="font-bold text-black">\n                          {tx.currentBalance} {tx.unit}\n                        </span>\n                      </td>\n                      {isAdmin && (\n                        <td className="py-3 px-4 text-center">\n                          <div className="flex items-center justify-center gap-2">\n                            <button\n                              onClick={() => {\n                                setEditingTx(tx);\n                                setEditQuantity(tx.quantity.toString());\n                                setEditPrice((tx.buyPrice || 0).toString());\n                                setEditSupplier(tx.supplier || \'\');\n                                setEditNote(tx.note || \'\');\n                              }}\n                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"\n                              title="Edit Transaksi"\n                            >\n                              <Pencil className="w-4 h-4" />\n                            </button>\n                            <button\n                              onClick={() => handleDelete(tx.id)}\n                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"\n                              title="Hapus Transaksi"\n                            >\n                              <Trash2 className="w-4 h-4" />\n                            </button>\n                          </div>\n                        </td>\n                      )}\n                    </tr>'
    content = content.replace(td_old, td_new)

    # 6. Modal Rendering
    modal_code = """
      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-black">Edit Transaksi Masuk</h3>
              <button onClick={() => setEditingTx(null)} className="p-2 hover:bg-neutral-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Jumlah</label>
                <input
                  type="number"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Harga Modal</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Penyuplai</label>
                <input
                  type="text"
                  value={editSupplier}
                  onChange={(e) => setEditSupplier(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#7E9F85] text-white font-bold py-3 rounded-xl mt-2 hover:bg-[#6F8F75]"
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
"""
    content = content.replace("    </div>\n  );\n};\n", modal_code)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

modify_pagemasuk('src/components/PageMasuk.tsx')

def modify_pagekeluar(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    content = content.replace(
        "import {\n  PackageMinus,\n  AlertTriangle,\n  PackageX,\n  Check,\n  Info,\n} from 'lucide-react';",
        "import {\n  PackageMinus,\n  AlertTriangle,\n  PackageX,\n  Check,\n  Info,\n  Pencil,\n  Trash2,\n  X\n} from 'lucide-react';"
    )

    # 2. useApp
    content = content.replace(
        "currentUser,\n    transactions,\n  } = useApp();",
        "currentUser,\n    transactions,\n    isAdmin,\n    updateTransaction,\n    deleteTransaction\n  } = useApp();"
    )

    # 3. State
    state_injection = """  const [useAltUnit, setUseAltUnit] = useState<boolean>(false);

  // Edit History State
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editOutType, setEditOutType] = useState<'out_sale' | 'out_damaged'>('out_sale');
  const [editPrice, setEditPrice] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editNote, setEditNote] = useState('');

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    const qtyNum = parseFloat(editQuantity.replace(',', '.'));
    if (isNaN(qtyNum) || qtyNum <= 0) {
      showToast('Jumlah tidak valid', 'error');
      return;
    }
    const res = updateTransaction(editingTx.id, {
      quantity: qtyNum,
      type: editOutType,
      sellPrice: parseFloat(editPrice) || 0,
      reason: editReason.trim() || undefined,
      note: editNote.trim() || undefined
    });
    if (res.success) {
      showToast('Transaksi berhasil diubah', 'success');
      setEditingTx(null);
    } else {
      showToast(res.message || 'Gagal mengubah', 'error');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Yakin ingin menghapus riwayat ini?')) {
      const res = deleteTransaction(id);
      if (res.success) showToast('Transaksi dihapus', 'success');
      else showToast(res.message || 'Gagal menghapus', 'error');
    }
  };"""
    content = content.replace("  const [useAltUnit, setUseAltUnit] = useState<boolean>(false);", state_injection)

    # 4. Table Header
    th_old = '<th className="py-2.5 px-4 text-right font-semibold w-1/5 text-[#3E6047]">Sisa</th>\n              </tr>'
    th_new = '<th className="py-2.5 px-4 text-right font-semibold w-1/5 text-[#3E6047]">Sisa</th>\n                {isAdmin && <th className="py-2.5 px-4 text-center font-semibold w-1/5">Aksi</th>}\n              </tr>'
    content = content.replace(th_old, th_new)

    # 5. Table Body
    td_old = '<td className="py-3 px-4 text-right">\n                        <span className="font-bold text-black">\n                          {tx.currentBalance} {tx.unit}\n                        </span>\n                      </td>\n                    </tr>'
    td_new = '<td className="py-3 px-4 text-right">\n                        <span className="font-bold text-black">\n                          {tx.currentBalance} {tx.unit}\n                        </span>\n                      </td>\n                      {isAdmin && (\n                        <td className="py-3 px-4 text-center">\n                          <div className="flex items-center justify-center gap-2">\n                            <button\n                              onClick={() => {\n                                setEditingTx(tx);\n                                setEditQuantity(tx.quantity.toString());\n                                setEditOutType(tx.type as any);\n                                setEditPrice((tx.sellPrice || 0).toString());\n                                setEditReason(tx.reason || \'\');\n                                setEditNote(tx.note || \'\');\n                              }}\n                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"\n                              title="Edit Transaksi"\n                            >\n                              <Pencil className="w-4 h-4" />\n                            </button>\n                            <button\n                              onClick={() => handleDelete(tx.id)}\n                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"\n                              title="Hapus Transaksi"\n                            >\n                              <Trash2 className="w-4 h-4" />\n                            </button>\n                          </div>\n                        </td>\n                      )}\n                    </tr>'
    content = content.replace(td_old, td_new)

    # 6. Modal Rendering
    modal_code = """
      {/* Edit Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-black">Edit Transaksi Keluar</h3>
              <button onClick={() => setEditingTx(null)} className="p-2 hover:bg-neutral-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Tipe Keluar</label>
                <select
                  value={editOutType}
                  onChange={(e) => setEditOutType(e.target.value as any)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                >
                  <option value="out_sale">Terjual</option>
                  <option value="out_damaged">Barang Rusak/Pecah</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Jumlah</label>
                <input
                  type="number"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                  required
                />
              </div>
              {editOutType === 'out_sale' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                  />
                </div>
              )}
              {editOutType === 'out_damaged' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">Alasan Rusak</label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#7E9F85]/20 focus:border-[#7E9F85] outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#7E9F85] text-white font-bold py-3 rounded-xl mt-2 hover:bg-[#6F8F75]"
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
"""
    content = content.replace("    </div>\n  );\n};\n", modal_code)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

modify_pagekeluar('src/components/PageKeluar.tsx')
