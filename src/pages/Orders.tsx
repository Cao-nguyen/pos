import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Dialog } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Trash2, Search, Filter } from 'lucide-react';

interface Order {
  _id: string;
  code: string;
  customer?: { name: string };
  products: { product: { name: string }, quantity: number }[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  note?: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
        console.error('Invalid data format', data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.message);
        return;
      }

      setIsStatusDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error(error);
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/orders/${deleteId}`, { method: 'DELETE' });
        if (!res.ok) {
           const err = await res.json();
           alert(err.message);
           return;
        }
        setDeleteId(null);
        fetchOrders();
      } catch (error) {
        console.error(error);
        alert('Lỗi xóa đơn hàng');
      }
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'default'; // Black
      case 'pending': return 'secondary'; // Gray
      case 'cancelled': return 'destructive'; // Red
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
     switch(status) {
      case 'completed': return 'Thành công';
      case 'pending': return 'Đang xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    const customerName = order.customer?.name || 'Khách lẻ';
    const matchCustomer = customerName.toLowerCase().includes(customerFilter.toLowerCase());
    return matchStatus && matchCustomer;
  });

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-6 md:p-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-slate-900">Lịch sử đơn hàng</h2>
           <p className="text-slate-500 mt-1">Quản lý và cập nhật trạng thái các đơn hàng.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Tìm kiếm theo tên khách hàng..." 
            className="pl-11 h-12 bg-slate-50 focus:bg-white rounded-xl border-slate-200 text-base"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
        </div>
        <div className="sm:w-64 relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
          <select 
            className="w-full pl-11 pr-10 border-slate-200 rounded-xl text-base h-12 appearance-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 relative transition-colors cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Thành công</option>
            <option value="pending">Đang xử lý</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
             <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="min-w-[120px] font-semibold text-slate-500 uppercase text-xs tracking-wider">Mã đơn</TableHead>
                <TableHead className="min-w-[140px] font-semibold text-slate-500 uppercase text-xs tracking-wider">Ngày tạo</TableHead>
                <TableHead className="min-w-[140px] font-semibold text-slate-500 uppercase text-xs tracking-wider">Khách hàng</TableHead>
                <TableHead className="min-w-[250px] font-semibold text-slate-500 uppercase text-xs tracking-wider">Sản phẩm</TableHead>
                <TableHead className="min-w-[120px] font-semibold text-slate-500 uppercase text-xs tracking-wider">Tổng tiền</TableHead>
                <TableHead className="min-w-[140px] font-semibold text-slate-500 uppercase text-xs tracking-wider">Trạng thái</TableHead>
                <TableHead className="min-w-[80px] font-semibold text-slate-500 uppercase text-xs tracking-wider text-right pr-6">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                     <div className="flex flex-col items-center justify-center">
                        <Filter className="w-10 h-10 mb-3 text-slate-300" />
                        <p className="text-base font-medium text-slate-600">Không tìm thấy đơn hàng nào phù hợp.</p>
                     </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow 
                    key={order._id} 
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsStatusDialogOpen(true);
                    }}
                  >
                    <TableCell className="font-bold text-indigo-600">{order.code}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                       <span className="font-semibold text-slate-900">{order.customer?.name || 'Khách lẻ'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {order.products.map((p, i) => (
                          <div key={i} className="text-sm text-slate-700 font-medium">
                            {p.product?.name || 'Sản phẩm đã xóa'} <span className="text-slate-400">x{p.quantity}</span>
                          </div>
                        ))}
                      </div>
                      {order.note && (
                        <div className="text-xs text-amber-600 mt-1.5 font-medium bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-100">
                          Ghi chú: {order.note}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-md border ${
                          order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                      }`}>
                         {getStatusLabel(order.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(order._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog 
        isOpen={isStatusDialogOpen} 
        onClose={() => setIsStatusDialogOpen(false)}
        title={`Cập nhật đơn: ${selectedOrder?.code}`}
      >
        <div className="space-y-5 pt-2">
          <p className="text-sm text-slate-500">
            Thay đổi trạng thái đơn hàng sẽ ảnh hưởng đến <span className="font-semibold text-slate-700">tồn kho</span> và <span className="font-semibold text-slate-700">điểm tích lũy</span> của khách hàng.
          </p>
          {selectedOrder?.note && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm">
              <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block mb-1">Ghi chú của đơn hàng</span>
              <span className="text-amber-900 font-medium">{selectedOrder.note}</span>
            </div>
          )}
          <div className="grid gap-3">
             <label className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition-colors ${selectedOrder?.status === 'completed' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}>
                <input type="radio" name="orderStatus" className="sr-only" checked={selectedOrder?.status === 'completed'} onChange={() => handleStatusChange('completed')} />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedOrder?.status === 'completed' ? 'border-emerald-500' : 'border-slate-300'}`}>
                   {selectedOrder?.status === 'completed' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>}
                </div>
                <span className={`font-semibold ${selectedOrder?.status === 'completed' ? 'text-emerald-700' : 'text-slate-700'}`}>Thành công (Đã giao)</span>
             </label>

             <label className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition-colors ${selectedOrder?.status === 'pending' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 hover:border-amber-300 bg-white'}`}>
                <input type="radio" name="orderStatus" className="sr-only" checked={selectedOrder?.status === 'pending'} onChange={() => handleStatusChange('pending')} />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedOrder?.status === 'pending' ? 'border-amber-500' : 'border-slate-300'}`}>
                   {selectedOrder?.status === 'pending' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>}
                </div>
                <span className={`font-semibold ${selectedOrder?.status === 'pending' ? 'text-amber-700' : 'text-slate-700'}`}>Đang xử lý (Chờ giao)</span>
             </label>

             <label className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition-colors ${selectedOrder?.status === 'cancelled' ? 'border-red-500 bg-red-50/50' : 'border-slate-200 hover:border-red-300 bg-white'}`}>
                <input type="radio" name="orderStatus" className="sr-only" checked={selectedOrder?.status === 'cancelled'} onChange={() => handleStatusChange('cancelled')} />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedOrder?.status === 'cancelled' ? 'border-red-500' : 'border-slate-300'}`}>
                   {selectedOrder?.status === 'cancelled' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>}
                </div>
                <span className={`font-semibold ${selectedOrder?.status === 'cancelled' ? 'text-red-700' : 'text-slate-700'}`}>Hủy đơn (Khách không nhận)</span>
             </label>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button variant="outline" className="rounded-xl font-medium" onClick={() => setIsStatusDialogOpen(false)}>Đóng lại</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa đơn hàng"
      >
        <div className="space-y-4 pt-2">
          <p className="text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-100">
            Cảnh báo: Hành động này không thể hoàn tác!
          </p>
          <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="font-semibold mb-2 text-slate-800">Nếu bạn xóa đơn hàng này:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Đơn hàng sẽ biến mất khỏi lịch sử hệ thống.</li>
              <li>Nếu đơn hàng đang hoạt động, lượng tồn kho sản phẩm sẽ được tự động cộng lại.</li>
              <li>Điểm tích lũy của khách hàng liên quan sẽ bị trừ (nếu trước đó đã cộng).</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="rounded-xl font-medium" onClick={() => setDeleteId(null)}>Hủy bỏ</Button>
            <Button variant="destructive" className="rounded-xl font-bold" onClick={confirmDelete}>Xóa vĩnh viễn</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
