import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, FileText, Menu, Printer, X, Sparkles } from 'lucide-react';
import { cn } from './ui/button';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/pos', label: 'Bán hàng', icon: ShoppingCart },
    { href: '/products', label: 'Sản phẩm', icon: Package },
    { href: '/customers', label: 'Khách hàng', icon: Users },
    { href: '/orders', label: 'Đơn hàng', icon: FileText },
  ];

  return (
    <div className="h-screen bg-[#f3f4f6] flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col bg-[#0f172a] text-slate-300">
        <div className="p-6 pb-2 flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
           </div>
           <h1 className="text-xl font-bold text-white tracking-tight">Lotus Shop</h1>
        </div>
        
        <div className="px-6 py-4">
           <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mb-3">Menu Quản Lý</p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === item.href
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px]", location.pathname === item.href ? "text-indigo-400" : "text-slate-400")} />
                  {item.label}
                </Link>
              ))}
            </nav>
        </div>

        <div className="mt-auto p-6">
           <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                 QL
              </div>
              <div>
                 <p className="text-sm font-semibold text-white">Quản lý cửa hàng</p>
                 <p className="text-xs text-slate-400">Admin</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
           </div>
            <h1 className="text-lg font-bold text-slate-900">Lotus Shop</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-bold text-slate-900">Menu</h2>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                    location.pathname === item.href
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", location.pathname === item.href ? "text-indigo-600" : "text-slate-400")} />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                     QL
                  </div>
                  <div>
                     <p className="text-sm font-semibold text-slate-900">Quản lý cửa hàng</p>
                     <p className="text-xs text-slate-500">Admin</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f3f4f6] overflow-hidden">
        {/* We can use an inner container to limit width if needed, or leave it fluid */}
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative p-0">
            {children}
        </div>
      </main>
    </div>
  );
}
