import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  phone: string;
  points: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(setCustomers)
      .catch(console.error);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await fetch(`/api/customers/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchCustomers();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      phone: formData.phone,
    };

    try {
      if (editingCustomer) {
        await fetch(`/api/customers/${editingCustomer._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '' });
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
    });
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 md:p-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Khách hàng</h2>
          <p className="text-gray-500 mt-1">Quản lý thông tin và điểm tích lũy của khách hàng.</p>
        </div>
        <Button onClick={() => {
          setEditingCustomer(null);
          setFormData({ name: '', phone: '' });
          setIsDialogOpen(true);
        }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md border-0 h-10 px-4">
          <Plus className="mr-2 h-4 w-4" /> Thêm khách hàng
        </Button>
      </div>

      <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Tên khách hàng</TableHead>
              <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Số điện thoại</TableHead>
              <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Điểm tích lũy</TableHead>
              <TableHead className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Giá trị quy đổi (VND)</TableHead>
              <TableHead className="text-right font-semibold text-slate-500 uppercase text-xs tracking-wider pr-6">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {customers.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                   Chưa có khách hàng nào.
                 </TableCell>
               </TableRow>
            ) : customers.map((customer) => (
              <TableRow key={customer._id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-semibold text-slate-900 py-4">{customer.name}</TableCell>
                <TableCell className="text-slate-600">{customer.phone}</TableCell>
                <TableCell>
                   <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                     {customer.points} điểm
                   </span>
                </TableCell>
                <TableCell className="text-emerald-600 font-bold">
                  {formatCurrency(customer.points * 10)}
                </TableCell>
                <TableCell className="text-right pr-4">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition-colors" onClick={() => openEdit(customer)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors" onClick={() => setDeleteId(customer._id)}>
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
        {customers.map((customer) => (
          <div key={customer._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="font-bold text-slate-900 leading-tight mb-1">{customer.name}</div>
                <div className="text-sm text-slate-500">{customer.phone}</div>
              </div>
              <div className="flex gap-1 shrink-0 bg-slate-50 p-1 rounded-lg border border-slate-100">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 rounded-md" onClick={() => openEdit(customer)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 rounded-md" onClick={() => setDeleteId(customer._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 flex-1 mr-2 text-center">
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block mb-0.5">Điểm tích lũy</span>
                <span className="font-black text-indigo-700">{customer.points}</span>
              </div>
              <div className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 flex-1 ml-2 text-center">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mb-0.5">Giá trị quy đổi</span>
                <span className="font-black text-emerald-700">{formatCurrency(customer.points * 10)}</span>
              </div>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
           <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500">
             Chưa có khách hàng nào.
           </div>
        )}
      </div>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingCustomer ? "Sửa khách hàng" : "Thêm khách hàng"}
      >
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Tên khách hàng</label>
            <Input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-50 focus:bg-white rounded-xl border-slate-200"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">Số điện thoại</label>
            <Input
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="bg-slate-50 focus:bg-white rounded-xl border-slate-200"
              placeholder="0912..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="outline" className="rounded-xl font-medium" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button type="submit" className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">Lưu khách hàng</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4 pt-2">
          <p className="text-slate-600">Bạn có chắc chắn muốn xóa khách hàng này không? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="rounded-xl font-medium" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="destructive" className="rounded-xl font-bold" onClick={confirmDelete}>Xóa khách hàng</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
