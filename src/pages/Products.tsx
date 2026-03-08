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

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
      .catch(console.error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Sản phẩm</h2>
        <Button onClick={() => {
          setEditingProduct(null);
          setFormData({ name: '', price: '', costPrice: '', stock: '' });
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </div>

      <div className="hidden md:block rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Giá bán</TableHead>
              <TableHead>Giá vốn</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{formatCurrency(product.price)}</TableCell>
                <TableCell>{formatCurrency(product.costPrice)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteId(product._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {products.map((product) => (
          <div key={product._id} className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-lg">{product.name}</div>
                <div className="text-sm text-slate-500">Kho: <span className="font-medium text-slate-900">{product.stock}</span></div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(product._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <span className="text-xs text-slate-500 uppercase block">Giá bán</span>
                <span className="font-medium text-slate-900">{formatCurrency(product.price)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase block">Giá vốn</span>
                <span className="font-medium text-slate-900">{formatCurrency(product.costPrice)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tên sản phẩm</label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Giá bán</label>
              <Input
                type="number"
                required
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Giá vốn</label>
              <Input
                type="number"
                required
                value={formData.costPrice}
                onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Tồn kho</label>
            <Input
              type="number"
              required
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p>Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={confirmDelete}>Xóa</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
