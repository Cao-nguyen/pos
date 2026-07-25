import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Package, TrendingUp, Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    orderCount: 0,
    chartData: [],
    topProducts: [],
    recentOrders: []
  });
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatXAxis = (tickItem: string) => {
    if (!tickItem) return '';
    if (period === 'day') {
      return tickItem; // %H:00
    }
    if (period === 'year') {
      return `T${tickItem.split('-')[1]}`; // T01, T02
    }
    // week, month -> dd/mm
    const dateParts = tickItem.split('-');
    if (dateParts.length === 3) {
       return `${dateParts[2]}/${dateParts[1]}`;
    }
    return tickItem;
  };

  return (
    <div className="flex-1 flex flex-col space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Tổng quan</h2>
          <p className="text-slate-500 mt-2 text-base">Theo dõi hoạt động kinh doanh trực quan.</p>
        </div>
        <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200/60 backdrop-blur-sm">
           {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                period === p 
                  ? 'bg-white shadow-md text-indigo-700 transform scale-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {p === 'day' ? 'Hôm nay' : p === 'week' ? 'Tuần này' : p === 'month' ? 'Tháng này' : 'Năm nay'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Revenue Card */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-7 shadow-xl shadow-indigo-900/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <DollarSign className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                 <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-base font-semibold text-indigo-100 tracking-wide">Doanh thu</h3>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight mb-2">{formatCurrency(stats.revenue)}</div>
              <p className="text-sm text-indigo-200 font-medium opacity-90">
                Trong {period === 'day' ? 'hôm nay' : period === 'week' ? 'tuần này' : period === 'month' ? 'tháng này' : 'năm nay'}
              </p>
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className="rounded-3xl bg-white border border-slate-200/60 p-7 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600">
                 <TrendingUp className="h-6 w-6" />
               </div>
               <h3 className="text-base font-semibold text-slate-600 tracking-wide">Lợi nhuận gộp</h3>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight text-slate-900 mb-2">{formatCurrency(stats.profit)}</div>
              <p className="text-sm text-slate-500 font-medium">Lợi nhuận ước tính</p>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="rounded-3xl bg-white border border-slate-200/60 p-7 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2.5 bg-blue-100 rounded-2xl text-blue-600">
                  <ShoppingBag className="h-6 w-6" />
               </div>
               <h3 className="text-base font-semibold text-slate-600 tracking-wide">Tổng đơn hàng</h3>
            </div>
            <div>
              <div className="text-4xl font-black tracking-tight text-slate-900 mb-2">{stats.orderCount}</div>
              <p className="text-sm text-slate-500 font-medium">Đơn hàng thành công</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12 lg:grid-cols-12">
        {/* Chart */}
        <div className="col-span-1 md:col-span-8 rounded-3xl border border-slate-200/60 bg-white p-7 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-xl font-bold text-slate-900">Biểu đồ doanh thu</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Biến động doanh thu theo thời gian</p>
             </div>
             <div className="p-2.5 bg-slate-100 rounded-xl">
               <CalendarIcon className="h-5 w-5 text-slate-600" />
             </div>
          </div>
          <div className="h-[350px] w-full flex-grow">
            {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="name" 
                        tickFormatter={formatXAxis} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => `${value / 1000}k`} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dx={-10}
                    />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Thời gian: ${formatXAxis(label)}`}
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="total" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="col-span-1 md:col-span-4 rounded-3xl border border-slate-200/60 bg-white p-7 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Sản phẩm bán chạy</h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Đóng góp doanh thu cao nhất</p>
                </div>
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <Package className="h-5 w-5 text-slate-600" />
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                    {loading ? (
                        Array.from({length: 3}).map((_, i) => (
                           <div key={i} className="flex items-center space-x-4 animate-pulse">
                              <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                              </div>
                           </div>
                        ))
                    ) : stats.topProducts && stats.topProducts.length > 0 ? (
                        stats.topProducts.map((product: any, index: number) => (
                            <div key={product._id} className="flex items-center space-x-4">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold shadow-sm ${
                                    index === 0 ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-200' :
                                    index === 1 ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' :
                                    index === 2 ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-200' :
                                    'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100'
                                }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">Đã bán: <span className="font-semibold text-slate-700">{product.totalSold}</span></p>
                                </div>
                                <div className="text-sm font-bold text-slate-900 whitespace-nowrap bg-slate-50 px-2 py-1 rounded">
                                    {formatCurrency(product.revenue)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 py-10">
                            <Package className="h-10 w-10 mb-2 opacity-20" />
                            <p className="text-sm">Chưa có dữ liệu</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

       {/* Recent Orders Table */}
       <div className="rounded-3xl border border-slate-200/60 bg-white shadow-sm overflow-hidden mb-8">
          <div className="p-7 border-b border-slate-100 flex items-center justify-between">
              <div>
                  <h3 className="text-xl font-bold text-slate-900">Giao dịch gần đây</h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Danh sách các đơn hàng mới nhất</p>
              </div>
              <Link to="/orders" className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-sm font-semibold rounded-xl text-slate-700 transition-colors">
                  Xem tất cả <ArrowRight className="h-4 w-4" />
              </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80">
                    <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã Đơn</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách Hàng</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá Trị</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Thời Gian</div>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-8">
                                <div className="flex justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                </div>
                            </td>
                        </tr>
                    ) : stats.recentOrders && stats.recentOrders.length > 0 ? (
                        stats.recentOrders.map((order: any) => (
                            <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                    <Link to={`/orders`} className="hover:underline">#{order.code}</Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     <div className="text-sm text-slate-900 font-medium pb-0.5">{order.customer?.name || 'Khách lẻ'}</div>
                                     {order.customer?.phone && <div className="text-xs text-slate-500">{order.customer.phone}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                    {formatCurrency(order.totalAmount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-md ${
                                        order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        order.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        order.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                        'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                        {
                                            order.status === 'completed' ? 'Đã thanh toán' :
                                            order.status === 'pending' ? 'Chờ xử lý' :
                                            order.status === 'processing' ? 'Đang giao' :
                                            'Đã huỷ'
                                        }
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(order.createdAt).toLocaleString('vi-VN', {
                                        hour: '2-digit', minute: '2-digit',
                                        day: '2-digit', month: '2-digit', year: 'numeric'
                                    })}
                                </td>
                            </tr>
                        ))
                    ) : (
                         <tr>
                             <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                 Chưa có đơn hàng nào
                             </td>
                         </tr>
                    )}
                </tbody>
            </table>
          </div>
       </div>
    </div>
  );
}
