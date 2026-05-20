import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', costPrice: '', stock: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
        console.error('Invalid data format', data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      price: Number(formData.price),
      costPrice: Number(formData.costPrice),
      stock: Number(formData.stock)
    };

    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', costPrice: '', stock: '' });
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await fetch(`/api/products/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchProducts();
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: (product.price ?? 0).toString(),
      costPrice: (product.costPrice ?? 0).toString(),
      stock: (product.stock ?? 0).toString()
    });
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 md:p-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Sản phẩm</h2>
          <p className="text-gray-500 mt-1">Quản lý danh sách sản phẩm và tồn kho.</p>
        </div>
        <Button onClick={() => {
          setEditingProduct(null);
          setFormData({ name: '', price: '', costPrice: '', stock: '' });
          setIsDialogOpen(true);
        }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md border-0 h-10 px-4">
          <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm
        </Button>
      </div>

      <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Tên sản phẩm</TableHead>
              <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Giá bán</TableHead>
              <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Giá vốn</TableHead>
              <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Tồn kho</TableHead>
              <TableHead className="text-right font-semibold text-slate-500 uppercase text-xs tracking-wider pr-6">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {products.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                   Chưa có sản phẩm nào.
                 </TableCell>
               </TableRow>
            ) : products.map((product) => (
              <TableRow key={product._id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-semibold text-slate-900 py-4">{product.name}</TableCell>
                <TableCell className="font-medium text-slate-900">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-slate-500">{formatCurrency(product.costPrice)}</TableCell>
                <TableCell>
                  <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md border ${
                      product.stock > 10 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      product.stock > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell className="text-right pr-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition-colors" onClick={() => openEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors" onClick={() => setDeleteId(product._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {products.map((product) => (
          <div key={product._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="font-bold text-slate-900 leading-tight mb-1">{product.name}</div>
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  Kho: <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded border ${
                      product.stock > 10 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      product.stock > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      'bg-red-50 border-red-200 text-red-700'
                  }`}>{product.stock}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0 bg-slate-50 p-1 rounded-lg border border-slate-100">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 rounded-md" onClick={() => openEdit(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 rounded-md" onClick={() => setDeleteId(product._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Giá bán</span>
                <span className="font-black text-indigo-600 truncate block">{formatCurrency(product.price)}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Giá vốn</span>
                <span className="font-bold text-slate-700 truncate block">{formatCurrency(product.costPrice)}</span>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
           <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500">
             Chưa có sản phẩm nào.
           </div>
        )}
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      >
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Tên sản phẩm</label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-50 focus:bg-white rounded-xl border-slate-200"
              placeholder="Ví dụ: Áo thun nam"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Giá bán</label>
              <Input
                type="number"
                required
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="bg-slate-50 focus:bg-white rounded-xl border-slate-200"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Giá vốn</label>
              <Input
                type="number"
                required
                value={formData.costPrice}
                onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                className="bg-slate-50 focus:bg-white rounded-xl border-slate-200"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Tồn kho</label>
            <Input
              type="number"
              required
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: e.target.value })}
              className="bg-slate-50 focus:bg-white rounded-xl border-slate-200"
              placeholder="0"
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="outline" className="rounded-xl font-medium" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button type="submit" className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">Lưu sản phẩm</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4 pt-2">
          <p className="text-slate-600">Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="rounded-xl font-medium" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="destructive" className="rounded-xl font-bold" onClick={confirmDelete}>Xóa sản phẩm</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
