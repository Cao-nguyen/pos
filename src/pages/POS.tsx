import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { Search, ShoppingCart, User, X, Plus, Minus, Trash2, Tag, CreditCard, Clock, ChevronRight, Package } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { cn } from '../components/ui/button';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  points: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); // Mobile Cart Drawer
  const [note, setNote] = useState('');

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
    fetch('/api/customers').then(res => res.json()).then(setCustomers);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const setItemQuantity = (id: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        return { ...item, quantity: Math.max(0, quantity) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = (usePoints && selectedCustomer) ? Math.min(subtotal, selectedCustomer.points * 10) : 0;
  const total = subtotal - discount;
  const pointsUsed = discount / 10;

  const [status, setStatus] = useState<'pending' | 'completed'>('completed');

  const handleCheckout = async () => {
    try {
      const payload = {
        customerId: selectedCustomer?._id,
        products: cart.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        pointsUsed: usePoints ? pointsUsed : 0,
        discountAmount: discount,
        totalAmount: total,
        status, // Add status to payload
        note
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Checkout failed');

      alert('Thanh toán thành công!');
      setCart([]);
      setSelectedCustomer(null);
      setUsePoints(false);
      setNote('');
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      // Refresh data
      fetch('/api/products').then(res => res.json()).then(setProducts);
      fetch('/api/customers').then(res => res.json()).then(setCustomers);
    } catch (error) {
      alert('Lỗi thanh toán: ' + error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const renderCartContent = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Cart Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <ShoppingCart className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-slate-900 leading-tight">Đơn hàng hiện tại</h3>
                <p className="text-xs text-slate-500">{cart.reduce((a, b) => a + b.quantity, 0)} sản phẩm</p>
             </div>
          </div>
          {cart.length > 0 && (
             <button onClick={() => setCart([])} className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition-colors">
                Xoá tất cả
             </button>
          )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
             <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                <ShoppingCart className="w-8 h-8 opacity-20" />
             </div>
             <p className="text-sm font-medium">Giỏ hàng trống</p>
          </div>
        ) : (
          <div className="space-y-3">
              {cart.map(item => (
                <div key={item._id} className="flex flex-col gap-2 bg-white border border-slate-200 p-3 rounded-xl hover:border-indigo-200 transition-colors shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                        <div className="font-semibold text-sm text-slate-900 leading-tight line-clamp-2 mb-1">{item.name}</div>
                        <div className="text-indigo-600 font-bold text-sm hidden sm:block">{formatCurrency(item.price)}</div>
                    </div>
                    <button onClick={() => setItemQuantity(item._id, 0)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                     <div className="text-indigo-600 font-bold text-sm sm:hidden block">{formatCurrency(item.price)}</div>
                     <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 ml-auto">
                        <button className="h-7 w-7 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-indigo-600 transition-colors" onClick={() => updateQuantity(item._id, -1)}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <input 
                          type="number" 
                          className="w-10 h-7 text-center text-sm font-bold bg-transparent border-none focus:ring-0 hide-arrows text-slate-800"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) setItemQuantity(item._id, val);
                            else if (e.target.value === '') setItemQuantity(item._id, 0);
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '' || parseInt(e.target.value) <= 0) setItemQuantity(item._id, 0);
                          }}
                          min="0"
                        />
                        <button className="h-7 w-7 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-indigo-600 transition-colors" onClick={() => updateQuantity(item._id, 1)}>
                          <Plus className="h-3 w-3" />
                        </button>
                     </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      <div className="border-t border-slate-100 bg-slate-50/80 p-5 shrink-0">
        <div className="space-y-4 mb-4">
            <div className="relative">
               <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
               <select 
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                value={selectedCustomer?._id || ''}
                onChange={e => {
                  const customer = customers.find(c => c._id === e.target.value);
                  setSelectedCustomer(customer || null);
                  setUsePoints(false);
                }}
              >
                <option value="">Khách lẻ (Không lưu điểm)</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} - {c.phone} ({c.points} điểm)</option>
                ))}
              </select>
            </div>

            {selectedCustomer && selectedCustomer.points > 0 && (
              <label className="flex items-center justify-between bg-emerald-50 hover:bg-emerald-100/70 cursor-pointer p-3 rounded-lg border border-emerald-200 transition-colors">
                <div className="flex items-center gap-2">
                   <Tag className="w-4 h-4 text-emerald-600" />
                   <span className="text-sm font-semibold text-emerald-800">Dùng {selectedCustomer.points} điểm thưởng</span>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-sm font-bold text-emerald-600">-{formatCurrency(selectedCustomer.points * 10)}</span>
                   <input 
                    type="checkbox" 
                    checked={usePoints} 
                    onChange={e => setUsePoints(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 accent-emerald-600"
                  />
                </div>
              </label>
            )}

            <div className="relative">
                <Input 
                    placeholder="Thêm ghi chú đơn hàng..." 
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="text-sm bg-white"
                />
            </div>
        </div>

        <div className="space-y-2 text-sm bg-white p-4 rounded-xl border border-slate-200 mb-4">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Tạm tính</span>
            <span className="text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Giảm giá điểm</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl pt-3 border-t border-slate-100 text-slate-900">
            <span>Tổng cộng</span>
            <span className="text-indigo-600">{formatCurrency(total)}</span>
          </div>
        </div>

        <Button 
          className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2" 
          disabled={cart.length === 0} 
          onClick={() => setIsCheckoutOpen(true)}
        >
          <CreditCard className="w-5 h-5" /> Thanh toán {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col md:flex-row gap-6 p-4 sm:p-6 md:p-8 box-border">
      {/* Product Grid Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white z-10 shrink-0">
            <div>
               <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Sản phẩm</h2>
               <p className="text-sm text-slate-500">Chọn sản phẩm để thêm vào đơn hàng</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Tìm sản phẩm theo tên..." 
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-xl font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/50">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product._id} 
                  className="group cursor-pointer bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all active:scale-95 flex flex-col h-full relative"
                  onClick={() => addToCart(product)}
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white rounded-full p-1.5 shadow-sm">
                      <Plus className="w-4 h-4" />
                  </div>
                  <div className="p-4 flex flex-col justify-between h-full">
                    <div className="mb-4">
                      {/* Placeholder for Product Image */}
                      <div className="w-full h-24 bg-slate-100 rounded-xl mb-3 flex items-center justify-center group-hover:bg-indigo-50/50 transition-colors">
                         <Package className="w-8 h-8 text-slate-300 group-hover:text-indigo-300 transition-colors" />
                      </div>
                      <div className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">{product.name}</div>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                         <span className={cn("px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium uppercase tracking-wide", product.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                             Còn {product.stock}
                         </span>
                      </div>
                    </div>
                    <div className="font-bold text-lg text-slate-900 mt-auto">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                      <Package className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-medium">Không tìm thấy sản phẩm nào</p>
                  </div>
              )}
            </div>
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden md:block w-[400px] shrink-0 h-full">
        {renderCartContent()}
      </div>

      {/* Mobile Cart Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <button 
          className="rounded-full shadow-2xl h-16 w-16 bg-indigo-600 text-white flex items-center justify-center relative hover:bg-indigo-700 active:scale-95 transition-all"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart className="h-7 w-7" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-black/5 animate-bounce">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Cart Drawer/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden flex justify-end">
          <div className="w-[90%] max-w-md bg-transparent h-full p-4 animate-in slide-in-from-right duration-300">
             {renderCartContent()}
          </div>
          {/* Close area */}
          <div className="absolute inset-0 -z-10" onClick={() => setIsCartOpen(false)}></div>
        </div>
      )}

      {/* Checkout Confirmation Dialog */}
      <Dialog 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)}
        title="Xác nhận thanh toán"
      >
        <div className="space-y-6 pt-4">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-semibold text-slate-900 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100 flex items-center gap-1">
                 <User className="w-3 h-3 text-indigo-500" /> {selectedCustomer?.name || 'Khách lẻ'}
              </span>
            </div>
             <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Số lượng:</span>
              <span className="font-semibold text-slate-900">{cart.reduce((a,b) => a+b.quantity, 0)} sản phẩm</span>
            </div>
            {discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-600 font-medium whitespace-nowrap">Giảm giá:</span>
                  <span className="font-bold text-emerald-600">-{formatCurrency(discount)}</span>
                </div>
            )}
            <div className="pt-3 border-t border-slate-200/60 flex justify-between items-end">
              <span className="text-slate-500 font-medium">Tổng thanh toán:</span>
              <span className="font-black text-2xl text-indigo-600 leading-none">{formatCurrency(total)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> Trạng thái giao hàng</label>
            <div className="grid grid-cols-2 gap-3">
               <label className={cn("cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all", status === 'completed' ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300")}>
                  <input type="radio" name="status" value="completed" className="sr-only" checked={status === 'completed'} onChange={() => setStatus('completed')} />
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", status === 'completed' ? "border-indigo-600" : "border-slate-300")}>
                     {status === 'completed' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                  </div>
                  <span className="text-sm font-semibold text-center leading-tight">Hoàn thành<br/><span className="font-normal text-xs">(Giao ngay)</span></span>
               </label>
               <label className={cn("cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all", status === 'pending' ? "border-amber-500 bg-amber-50/50" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300")}>
                  <input type="radio" name="status" value="pending" className="sr-only" checked={status === 'pending'} onChange={() => setStatus('pending')} />
                   <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", status === 'pending' ? "border-amber-500" : "border-slate-300")}>
                     {status === 'pending' && <div className="w-3 h-3 bg-amber-500 rounded-full"></div>}
                  </div>
                  <span className="text-sm font-semibold text-center leading-tight">Chờ xử lý<br/><span className="font-normal text-xs">(Giao sau)</span></span>
               </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-semibold border-slate-200 text-slate-600" onClick={() => setIsCheckoutOpen(false)}>Hủy bỏ</Button>
            <Button className="flex-[2] h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 text-white" onClick={handleCheckout}>
               Xác nhận thanh toán <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
