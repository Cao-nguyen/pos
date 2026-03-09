import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { Search, ShoppingCart, User, X, Plus, Minus, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';

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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-auto space-y-4 p-1">
        {cart.length === 0 ? (
          <div className="text-center text-slate-500 py-8">Giỏ hàng trống</div>
        ) : (
          cart.map(item => (
            <div key={item._id} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
              <div className="flex-1">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs text-slate-500">{formatCurrency(item.price)}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item._id, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <input 
                  type="number" 
                  className="w-12 h-7 text-center text-sm border rounded-md hide-arrows"
                  value={item.quantity === 0 ? '' : item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      setItemQuantity(item._id, val);
                    } else if (e.target.value === '') {
                      // Allow empty string temporarily while typing, but we need to handle it.
                      // We can set it to 0, which will remove it, so let's just keep it as 0
                      setItemQuantity(item._id, 0);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || parseInt(e.target.value) <= 0) {
                      setItemQuantity(item._id, 0); // This will remove the item
                    }
                  }}
                  min="0"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item._id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t pt-4 space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Khách hàng</label>
          <select 
            className="w-full p-2 border rounded-md text-sm"
            value={selectedCustomer?._id || ''}
            onChange={e => {
              const customer = customers.find(c => c._id === e.target.value);
              setSelectedCustomer(customer || null);
              setUsePoints(false);
            }}
          >
            <option value="">Khách lẻ</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>{c.name} - {c.phone} ({c.points} điểm)</option>
            ))}
          </select>
        </div>

        {selectedCustomer && selectedCustomer.points > 0 && (
          <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
            <div className="text-sm text-green-800">
              Dùng {selectedCustomer.points} điểm (-{formatCurrency(selectedCustomer.points * 10)})
            </div>
            <input 
              type="checkbox" 
              checked={usePoints} 
              onChange={e => setUsePoints(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block">Ghi chú đơn hàng</label>
          <Input 
            placeholder="Nhập ghi chú..." 
            value={note}
            onChange={e => setNote(e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Tổng cộng:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <Button className="w-full" size="lg" disabled={cart.length === 0} onClick={() => setIsCheckoutOpen(true)}>
          Thanh toán
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Tìm kiếm sản phẩm..." 
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto pb-20 md:pb-0">
          {filteredProducts.map(product => (
            <div 
              key={product._id} 
              className="cursor-pointer border rounded-lg bg-white shadow-sm hover:border-slate-400 transition-colors active:scale-95 flex flex-col"
              onClick={() => addToCart(product)}
            >
              <div className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="font-medium line-clamp-2">{product.name}</div>
                  <div className="text-slate-500 text-sm mt-1">Kho: {product.stock}</div>
                </div>
                <div className="font-bold text-lg mt-2 text-slate-900">
                  {formatCurrency(product.price)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden md:block w-96 bg-white border rounded-lg p-4 shadow-sm h-full overflow-hidden flex flex-col">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" /> Giỏ hàng
        </h3>
        {renderCartContent()}
      </div>

      {/* Mobile Cart Button */}
      <div className="md:hidden fixed bottom-4 right-4 z-40">
        <Button 
          size="lg" 
          className="rounded-full shadow-lg h-14 w-14 p-0 relative"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart className="h-6 w-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Cart Drawer/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-4 animate-in slide-in-from-right duration-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Giỏ hàng</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {renderCartContent()}
          </div>
        </div>
      )}

      {/* Checkout Confirmation Dialog */}
      <Dialog 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)}
        title="Xác nhận thanh toán"
      >
        <div className="space-y-4">
          <p>Bạn có chắc chắn muốn thanh toán đơn hàng này?</p>
          <div className="bg-slate-50 p-4 rounded-md space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span className="font-medium">{selectedCustomer?.name || 'Khách lẻ'}</span>
            </div>
            <div className="flex justify-between">
              <span>Tổng tiền:</span>
              <span className="font-bold text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Trạng thái đơn hàng</label>
            <select 
              className="w-full p-2 border rounded-md text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'pending' | 'completed')}
            >
              <option value="completed">Hoàn thành (Giao ngay)</option>
              <option value="pending">Đang giao / Chờ xử lý</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Hủy</Button>
            <Button onClick={handleCheckout}>Xác nhận</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
