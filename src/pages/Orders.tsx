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

  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(setOrders)
      .catch(console.error);
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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Lịch sử đơn hàng</h2>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-md border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Tìm kiếm theo tên khách hàng..." 
            className="pl-9"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
        </div>
        <div className="sm:w-64 relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
          <select 
            className="w-full pl-9 p-2 border rounded-md text-sm h-10 appearance-none bg-white relative"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Thành công</option>
            <option value="pending">Đang xử lý</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Mã đơn</TableHead>
              <TableHead className="min-w-[140px]">Ngày tạo</TableHead>
              <TableHead className="min-w-[120px]">Khách hàng</TableHead>
              <TableHead className="min-w-[200px]">Sản phẩm</TableHead>
              <TableHead className="min-w-[100px]">Tổng tiền</TableHead>
              <TableHead className="min-w-[120px]">Trạng thái</TableHead>
              <TableHead className="min-w-[80px] text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Không tìm thấy đơn hàng nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow 
                  key={order._id} 
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsStatusDialogOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{order.code}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell>{order.customer?.name || 'Khách lẻ'}</TableCell>
                  <TableCell>
                    {order.products.map((p, i) => (
                      <div key={i} className="text-xs">
                        {p.product?.name || 'Sản phẩm đã xóa'} x{p.quantity}
                      </div>
                    ))}
                    {order.note && (
                      <div className="text-xs text-slate-500 mt-1 italic">
                        Ghi chú: {order.note}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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

      <Dialog 
        isOpen={isStatusDialogOpen} 
        onClose={() => setIsStatusDialogOpen(false)}
        title={`Cập nhật trạng thái: ${selectedOrder?.code}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Thay đổi trạng thái đơn hàng sẽ ảnh hưởng đến tồn kho và điểm tích lũy của khách hàng.
          </p>
          {selectedOrder?.note && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm">
              <span className="font-semibold text-yellow-800">Ghi chú: </span>
              <span className="text-yellow-900">{selectedOrder.note}</span>
            </div>
          )}
          <div className="grid gap-2">
            <Button 
              variant={selectedOrder?.status === 'pending' ? 'default' : 'outline'}
              onClick={() => handleStatusChange('pending')}
              className="justify-start"
            >
              Đang xử lý (Pending)
            </Button>
            <Button 
              variant={selectedOrder?.status === 'completed' ? 'default' : 'outline'}
              onClick={() => handleStatusChange('completed')}
              className="justify-start"
            >
              Thành công (Completed)
            </Button>
            <Button 
              variant={selectedOrder?.status === 'cancelled' ? 'destructive' : 'outline'}
              onClick={() => handleStatusChange('cancelled')}
              className="justify-start text-red-600 hover:text-red-50 hover:bg-red-600"
            >
              Hủy đơn (Cancelled)
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setIsStatusDialogOpen(false)}>Đóng</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa đơn hàng"
      >
        <div className="space-y-4">
          <p className="text-red-600 font-medium">
            Cảnh báo: Hành động này không thể hoàn tác!
          </p>
          <p className="text-sm text-slate-600">
            Nếu bạn xóa đơn hàng này:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Đơn hàng sẽ biến mất khỏi lịch sử.</li>
              <li>Nếu đơn hàng đang hoạt động (Pending/Completed), tồn kho sản phẩm sẽ được hoàn lại.</li>
              <li>Điểm tích lũy của khách hàng sẽ được tính toán lại (hoàn điểm đã dùng, trừ điểm đã tích).</li>
            </ul>
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={confirmDelete}>Xóa vĩnh viễn</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
