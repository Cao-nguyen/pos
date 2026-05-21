import React, { useEffect, useState } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { generateVietQR } from '../utils/qr';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Dialog } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Trash2, Search, Filter, Eye } from 'lucide-react';

interface Order {
  _id: string;
  code: string;
  customer?: { name: string, points?: number };
  products: { product: { name: string }, quantity: number, price: number }[];
  totalAmount: number;
  subtotal: number;
  pointsDiscount: number;
  customDiscount: number;
  shippingFee: number;
  vatAmount: number;
  vatRate: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  note?: string;
  mergedOrders?: Order[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

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

  const handleDownloadInvoice = async () => {
    const element = document.getElementById('invoice-print-area');
    if (!element) return;
    try {
      const data = await toPng(element, { 
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.href = data;
      link.download = `hoadon-${invoiceOrder?.code || 'HD'}.png`;
      link.click();
    } catch (error) {
      console.error('Lỗi tải ảnh:', error);
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

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Tìm kiếm theo tên khách hàng..." 
            className="pl-11 h-12 bg-slate-50 focus:bg-white rounded-xl border-slate-200 text-base"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
        </div>
        <div className="sm:w-64 relative w-full">
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
        
        {selectedOrderIds.length > 1 && (
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-6 rounded-xl shrink-0"
            onClick={() => {
              const ordersToMerge = orders.filter(o => selectedOrderIds.includes(o._id));
              const mergedProducts: any[] = [];
              ordersToMerge.forEach(o => mergedProducts.push(...o.products));

              const mergedOrder = {
                _id: 'merged',
                code: 'GỘP: ' + ordersToMerge.map(o => o.code).join(', '),
                createdAt: new Date().toISOString(),
                customer: ordersToMerge[0].customer,
                products: mergedProducts,
                subtotal: ordersToMerge.reduce((sum, o) => sum + (o.subtotal || o.totalAmount), 0),
                totalAmount: ordersToMerge.reduce((sum, o) => sum + o.totalAmount, 0),
                pointsDiscount: ordersToMerge.reduce((sum, o) => sum + (o.pointsDiscount || 0), 0),
                customDiscount: ordersToMerge.reduce((sum, o) => sum + (o.customDiscount || 0), 0),
                shippingFee: ordersToMerge.reduce((sum, o) => sum + (o.shippingFee || 0), 0),
                vatRate: ordersToMerge[0].vatRate,
                vatAmount: ordersToMerge.reduce((sum, o) => sum + (o.vatAmount || 0), 0),
                status: 'completed' as 'completed',
                mergedOrders: ordersToMerge
              };
              
              setInvoiceOrder(mergedOrder as Order);
            }}
          >
            Gộp {selectedOrderIds.length} hoá đơn
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-12 px-4 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrderIds(filteredOrders.map(o => o._id));
                      } else {
                        setSelectedOrderIds([]);
                      }
                    }}
                  />
                </TableHead>
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
                    <TableCell className="px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedOrderIds.includes(order._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds([...selectedOrderIds, order._id]);
                          } else {
                            setSelectedOrderIds(selectedOrderIds.filter(id => id !== order._id));
                          }
                        }}
                      />
                    </TableCell>
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
                      <div className="flex justify-end gap-2">
                        {order.status !== 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInvoiceOrder(order);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {order.status !== 'completed' && (
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
                        )}
                      </div>
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
              <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block mb-1">Ghi chú</span>
              <span className="text-amber-900 font-medium">{selectedOrder.note}</span>
            </div>
          )}
          {selectedOrder && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-sm">
               <div className="flex justify-between text-slate-500">
                 <span>Tạm tính</span>
                 <span className="text-slate-900">{formatCurrency(selectedOrder.subtotal || 0)}</span>
               </div>
               {selectedOrder.pointsDiscount > 0 && (
                 <div className="flex justify-between text-emerald-600">
                   <span>Trừ điểm</span>
                   <span>-{formatCurrency(selectedOrder.pointsDiscount)}</span>
                 </div>
               )}
               {selectedOrder.customDiscount > 0 && (
                 <div className="flex justify-between text-emerald-600">
                   <span>Giảm giá thêm</span>
                   <span>-{formatCurrency(selectedOrder.customDiscount)}</span>
                 </div>
               )}
               {selectedOrder.shippingFee > 0 && (
                 <div className="flex justify-between text-slate-500">
                   <span>Phí vận chuyển</span>
                   <span className="text-slate-900">+{formatCurrency(selectedOrder.shippingFee)}</span>
                 </div>
               )}
               {selectedOrder.vatAmount > 0 && (
                 <div className="flex justify-between text-slate-500">
                   <span>VAT ({selectedOrder.vatRate}%)</span>
                   <span className="text-slate-900">+{formatCurrency(selectedOrder.vatAmount)}</span>
                 </div>
               )}
               <div className="flex justify-between font-bold border-t border-slate-200 pt-2 mt-2">
                 <span className="text-slate-700">Tổng thanh toán</span>
                 <span className="text-indigo-600 text-base">{formatCurrency(selectedOrder.totalAmount)}</span>
               </div>
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

      {/* Invoice Modal */}
      <Dialog 
        isOpen={!!invoiceOrder} 
        onClose={() => setInvoiceOrder(null)}
        title="Hoá đơn thanh toán"
      >
        {invoiceOrder && (
          <div className="space-y-6 pt-4 print:block">
            <div id="invoice-print-area" className="bg-white p-4">
                <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
                   <h2 className="text-xl font-black text-slate-900 uppercase">HOÁ ĐƠN BÁN HÀNG</h2>
                   {invoiceOrder.code.startsWith('GỘP') && (
                     <p className="text-xs text-indigo-600 font-semibold mt-1">{invoiceOrder.code}</p>
                   )}
                   <div className="text-sm text-slate-600 text-left mt-4 space-y-1">
                     {invoiceOrder.customer && (
                       <p><strong>Tên khách hàng:</strong> {invoiceOrder.customer.name}</p>
                     )}
                     {invoiceOrder.customer?.points !== undefined && (
                       <p><strong>Điểm tích luỹ:</strong> {invoiceOrder.customer.points}</p>
                     )}
                     <p><strong>Thời gian tạo hoá đơn:</strong> {format(new Date(invoiceOrder.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                   </div>
                </div>
                
                <div>
                   <h3 className="text-base font-bold text-slate-900 mb-2 mt-4">Các sản phẩm</h3>
                   <div className="space-y-2 text-sm font-medium border-b border-dashed border-slate-300 pb-4">
                   {invoiceOrder.mergedOrders ? (
                     invoiceOrder.mergedOrders.map((order, orderIdx) => (
                       <div key={order._id} className={orderIdx > 0 ? "mt-4 pt-4 border-t border-dashed border-slate-300" : ""}>
                         {order.products.map((item: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex-1">
                                <div className="text-slate-800">{item.product?.name || 'Sản phẩm đã xóa'}</div>
                                <div className="text-slate-500 text-xs">{item.quantity} x {formatCurrency(item.price || 0)}</div>
                              </div>
                              <div className="text-slate-900">
                                {formatCurrency((item.price || 0) * item.quantity)}
                              </div>
                           </div>
                         ))}
                         {order.note && (
                           <div className="mt-2 text-sm">
                             <p className="font-semibold text-slate-700 mb-1">Ghi chú:</p>
                             <p className="text-slate-600 italic">{order.note}</p>
                           </div>
                         )}
                       </div>
                     ))
                   ) : (
                     <>
                       {invoiceOrder.products.map((item: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-start gap-2 mb-2">
                            <div className="flex-1">
                              <div className="text-slate-800">{item.product?.name || 'Sản phẩm đã xóa'}</div>
                              <div className="text-slate-500 text-xs">{item.quantity} x {formatCurrency(item.price || 0)}</div>
                            </div>
                            <div className="text-slate-900">
                              {formatCurrency((item.price || 0) * item.quantity)}
                            </div>
                         </div>
                       ))}
                       {invoiceOrder.note && (
                         <div className="mt-3 pt-3 border-t border-dashed border-slate-300 text-sm">
                           <p className="font-semibold text-slate-700 mb-1">Ghi chú:</p>
                           <p className="text-slate-600 italic">{invoiceOrder.note}</p>
                         </div>
                       )}
                     </>
                   )}
                </div>
                
                <div className="space-y-2 text-sm border-b border-dashed border-slate-300 py-4">
                    <div className="flex justify-between text-slate-600">
                      <span>Tạm tính</span>
                      <span>{formatCurrency(invoiceOrder.subtotal || invoiceOrder.totalAmount)}</span>
                    </div>
                    {invoiceOrder.pointsDiscount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Trừ điểm</span>
                        <span>-{formatCurrency(invoiceOrder.pointsDiscount)}</span>
                      </div>
                    )}
                    {invoiceOrder.customDiscount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Giảm giá thêm</span>
                        <span>-{formatCurrency(invoiceOrder.customDiscount)}</span>
                      </div>
                    )}
                    {invoiceOrder.shippingFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Vận chuyển</span>
                        <span>{formatCurrency(invoiceOrder.shippingFee)}</span>
                      </div>
                    )}
                    {invoiceOrder.vatAmount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>VAT ({invoiceOrder.vatRate || 0}%)</span>
                        <span>{formatCurrency(invoiceOrder.vatAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-lg pt-2 text-slate-900">
                      <span>Thành tiền</span>
                      <span>{formatCurrency(invoiceOrder.totalAmount)}</span>
                    </div>
                </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 print:bg-white print:border print:border-slate-200 mt-4">
                    <p className="text-sm font-semibold text-slate-600 text-center">Quét mã QR để thanh toán</p>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                        <QRCodeSVG 
                          value={generateVietQR("0002010102111531397007040052044600009362810200938550010A000000727012500069704230111936281020090208QRIBFTTA5204513753037045802VN5913LY CAO NGUYEN6006Ha Noi8707CLASSIC6304916D", invoiceOrder.totalAmount || 0, `LST${(invoiceOrder.totalAmount || 0) / 1000}K`)}
                          size={200}
                          level="Q"
                        />
                    </div>
                    <p className="text-sm text-center text-slate-800 font-medium">Nội dung chuyển khoản: LST{(invoiceOrder.totalAmount || 0) / 1000}K</p>
                    <p className="text-sm text-center text-slate-800 font-bold italic mt-4">Cảm ơn và hẹn gặp lại quý khách!</p>
                </div>
            </div>
            
            <div className="flex gap-3 pt-4 print:hidden">
              <Button onClick={() => window.print()} variant="outline" className="flex-1 border-slate-300">
                 In hoá đơn
              </Button>
              <Button onClick={handleDownloadInvoice} variant="outline" className="flex-1 border-slate-300 text-indigo-600 hover:text-indigo-700">
                 Tải ảnh
              </Button>
              <Button onClick={() => setInvoiceOrder(null)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                 Đóng
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
