import React, { useEffect, useState, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Dialog } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Printer, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Order {
  _id: string;
  code: string;
  customer?: { _id: string, name: string, phone: string };
  products: { product: { name: string }, quantity: number, price: number }[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  note?: string;
  pointsUsed: number;
  discountAmount: number;
}

export default function Invoices() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceNote, setInvoiceNote] = useState<string>('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then((data: Order[]) => {
        // Only show pending orders
        setOrders(data.filter(o => o.status === 'pending'));
      })
      .catch(console.error);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  // Group orders by customer
  const customersWithPendingOrders = Array.from(new Set(orders.map(o => o.customer?._id).filter(Boolean)))
    .map(id => {
      const customerOrders = orders.filter(o => o.customer?._id === id);
      const customer = customerOrders[0].customer;
      return {
        _id: id as string,
        name: customer?.name || 'Unknown',
        phone: customer?.phone || '',
        orderCount: customerOrders.length,
        totalAmount: customerOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      };
    });

  const filteredCustomers = customersWithPendingOrders.filter(c => 
    c.name.toLowerCase().includes(customerFilter.toLowerCase()) || 
    c.phone.includes(customerFilter)
  );

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedOrders([]); // Reset selection when changing customer
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectedCustomerData = customersWithPendingOrders.find(c => c._id === selectedCustomer);
  const customerOrders = orders.filter(o => o.customer?._id === selectedCustomer);
  
  // Calculate combined invoice data
  const ordersToInvoice = orders.filter(o => selectedOrders.includes(o._id));
  
  // Flatten products without combining
  const invoiceProducts = ordersToInvoice.flatMap(order => 
    order.products.map(p => ({
      orderCode: order.code,
      name: p.product?.name || 'Sản phẩm đã xóa',
      price: p.price,
      quantity: p.quantity
    }))
  );

  const totalPointsUsed = ordersToInvoice.reduce((sum, o) => sum + o.pointsUsed, 0);
  const totalDiscount = ordersToInvoice.reduce((sum, o) => sum + o.discountAmount, 0);
  const finalTotal = ordersToInvoice.reduce((sum, o) => sum + o.totalAmount, 0);
  const subtotal = finalTotal + totalDiscount;

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      // A5 dimensions in mm: 148 x 210
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`HoaDon_${selectedCustomerData?.name}_${format(new Date(), 'ddMMyy')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Lỗi tạo PDF');
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <h2 className="text-3xl font-bold tracking-tight">Tạo Hóa Đơn</h2>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Left column: Customer List */}
        <div className="w-full md:w-1/3 bg-white border rounded-md flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold mb-3">Khách hàng có đơn chờ</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Tìm tên, SĐT..." 
                className="pl-9"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {filteredCustomers.length === 0 ? (
              <div className="text-center p-4 text-slate-500 text-sm">Không có dữ liệu</div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map(customer => (
                  <div 
                    key={customer._id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${selectedCustomer === customer._id ? 'bg-slate-900 text-white border-slate-900' : 'hover:bg-slate-50'}`}
                    onClick={() => handleCustomerSelect(customer._id)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className={`text-xs mt-1 ${selectedCustomer === customer._id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {customer.phone} • {customer.orderCount} đơn hàng
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Orders for selected customer */}
        <div className="w-full md:w-2/3 bg-white border rounded-md flex flex-col overflow-hidden">
          {!selectedCustomer ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Chọn một khách hàng để xem các đơn hàng chờ xử lý
            </div>
          ) : (
            <>
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{selectedCustomerData?.name}</h3>
                  <p className="text-sm text-slate-500">Chọn các đơn hàng để gộp thành hóa đơn</p>
                </div>
                <Button 
                  disabled={selectedOrders.length === 0}
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Tạo hóa đơn ({selectedOrders.length})
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-3">
                  {customerOrders.map(order => (
                    <div 
                      key={order._id}
                      className={`p-4 rounded-md border cursor-pointer transition-colors flex items-start gap-4 ${selectedOrders.includes(order._id) ? 'border-blue-500 bg-blue-50' : 'hover:border-slate-400'}`}
                      onClick={() => toggleOrderSelection(order._id)}
                    >
                      <input 
                        type="checkbox" 
                        className="mt-1 h-4 w-4"
                        checked={selectedOrders.includes(order._id)}
                        readOnly
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium">{order.code}</span>
                            <span className="text-xs text-slate-500 ml-2">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                          <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          {order.products.map(p => `${p.product?.name} (x${p.quantity})`).join(', ')}
                        </div>
                        {order.note && (
                          <div className="text-xs text-slate-500 mt-2 italic">
                            Ghi chú: {order.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      <Dialog 
        isOpen={isInvoiceModalOpen} 
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Hóa Đơn Bán Hàng"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Ghi chú chung cho hóa đơn (Tùy chọn)</label>
              <Input 
                placeholder="Nhập ghi chú sẽ in trên hóa đơn..." 
                value={invoiceNote}
                onChange={(e) => setInvoiceNote(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={downloadPDF} className="gap-2">
                <Download className="h-4 w-4" /> Tải PDF (A5)
              </Button>
            </div>
          </div>

          {/* Invoice Preview (A5 proportions roughly) */}
          <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-[60vh] flex justify-center">
            <div 
              ref={invoiceRef} 
              className="bg-white p-8 shadow-sm relative"
              style={{ width: '148mm', minHeight: '210mm', color: '#000' }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-slate-900"></div>
              
              <div className="text-center mb-8 border-b pb-6 border-slate-200 mt-4">
                <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-900">Lotus Shop</h1>
                <p className="text-sm text-slate-500 mt-2 uppercase tracking-widest font-medium">Hóa Đơn Bán Hàng</p>
              </div>

              <div className="flex justify-between items-start mb-8 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Khách hàng</p>
                  <p className="font-bold text-base text-slate-900">{selectedCustomerData?.name}</p>
                  <p className="text-slate-600 mt-1">{selectedCustomerData?.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Thông tin đơn</p>
                  <p className="text-slate-600 mt-1">Ngày: <span className="font-medium text-slate-900">{format(new Date(), 'dd/MM/yyyy HH:mm')}</span></p>
                  <p className="text-slate-600 mt-1">Mã: <span className="font-medium text-slate-900">{ordersToInvoice.map(o => o.code).join(', ')}</span></p>
                </div>
              </div>

              <table className="w-full text-sm mb-8">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-900">
                    <th className="text-left py-3 font-bold uppercase tracking-wider text-xs">Mã đơn</th>
                    <th className="text-left py-3 font-bold uppercase tracking-wider text-xs">Sản phẩm</th>
                    <th className="text-center py-3 font-bold uppercase tracking-wider text-xs w-12">SL</th>
                    <th className="text-right py-3 font-bold uppercase tracking-wider text-xs w-24">Đơn giá</th>
                    <th className="text-right py-3 font-bold uppercase tracking-wider text-xs w-28">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceProducts.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-3 pr-2 text-slate-500 text-xs">{item.orderCode}</td>
                      <td className="py-3 pr-2 font-medium text-slate-900">{item.name}</td>
                      <td className="text-center py-3 text-slate-600">{item.quantity}</td>
                      <td className="text-right py-3 text-slate-600">{formatCurrency(item.price)}</td>
                      <td className="text-right py-3 font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-col gap-6 mb-8">
                <div className="w-full flex justify-end">
                  <div className="w-64 space-y-3 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Tạm tính:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Giảm giá (Điểm):</span>
                        <span className="font-medium text-red-600">-{formatCurrency(totalDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-slate-900 mt-3 text-slate-900">
                      <span>Tổng cộng:</span>
                      <span>{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {ordersToInvoice.some(o => o.note && o.note.trim() !== '') && (
                  <div className="w-full mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-2">Ghi chú đơn hàng</p>
                    <div className="text-sm text-slate-700 space-y-2 pt-2">
                      {ordersToInvoice.filter(o => o.note && o.note.trim() !== '').map(o => (
                        <div key={o._id} className="flex gap-2">
                          <span className="font-semibold text-slate-900 whitespace-nowrap">{o.code}:</span> 
                          <span className="italic">{o.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {invoiceNote.trim() !== '' && (
                  <div className="w-full mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-2">Ghi chú hóa đơn</p>
                    <div className="text-sm text-slate-700 pt-2 italic">
                      {invoiceNote}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-16 text-center">
                <div className="w-16 h-1 bg-slate-200 mx-auto mb-6"></div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Cảm ơn quý khách!</p>
                <p className="text-xs text-slate-500 mt-2">Hẹn gặp lại quý khách lần sau</p>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
