import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  Plus, 
  Trash2, 
  Edit, 
  LogOut, 
  Package, 
  DollarSign, 
  User as UserIcon,
  Tag,
  RefreshCw,
  Home,
  LayoutDashboard,
  Users,
  Globe,
  Phone,
  MapPin,
  Menu,
  X,
  FileText,
  BarChart3,
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'providers', 'stats'
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  
  // Form States
  const [newCategory, setNewCategory] = useState({ name: '', image: null });
  const [providerForm, setProviderForm] = useState({
    name: '', phone: '', address: '', email: '', website: '', observation: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', description: '', purchasePrice: 0, price: 0, category: '', provider: '', 
    stock: 0, stockMin: 0, status: 'Activo', images: []
  });

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchCategories(), fetchProviders()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSeedOrders = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      await axios.get(`${API_URL}/api/admin/seed-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Éxito', 'Ventas simuladas generadas correctamente', 'success');
      fetchStats();
    } catch (err) {
      Swal.fire('Error', 'No se pudieron generar ventas', 'error');
    }
  };

  const handleExportExcel = () => {
    if (!stats) return;

    try {
      const wb = XLSX.utils.book_new();

      // 1. Resumen Sheet
      const resumenData = [
        ["REPORTE DE INTELIGENCIA DE NEGOCIO - EL REBAJÓN"],
        ["Fecha de Generación", new Date().toLocaleDateString()],
        [],
        ["INDICADOR", "VALOR"],
        ["Ventas Totales", stats.metrics.totalRevenue],
        ["Ganancia Neta", stats.metrics.totalProfit],
        ["Total Transacciones", stats.metrics.count],
        ["Ticket Promedio", Math.round(stats.metrics.totalRevenue / stats.metrics.count || 0)]
      ];
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Global");

      // 2. Tendencia Sheet
      const trendData = stats.dailyTrend.map(day => ({
        "Fecha": day._id,
        "Ingresos": day.revenue,
        "Ganancia": day.profit
      }));
      const wsTrend = XLSX.utils.json_to_sheet(trendData);
      XLSX.utils.book_append_sheet(wb, wsTrend, "Histórico Diario");

      // 3. Categorías Sheet
      const categoryData = stats.categoryStats.map(cat => ({
        "Categoría": cat._id,
        "Total Ventas": cat.value
      }));
      const wsCat = XLSX.utils.json_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(wb, wsCat, "Ventas por Categoría");

      // 4. Top Productos
      const productData = stats.topProducts.map(prod => ({
        "Producto": prod._id,
        "Unidades Vendidas": prod.sales,
        "Ingresos Generados": prod.revenue
      }));
      const wsProd = XLSX.utils.json_to_sheet(productData);
      XLSX.utils.book_append_sheet(wb, wsProd, "Productos Estrella");

      // Download
      XLSX.writeFile(wb, `Reporte_BI_ElRebajon_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      Swal.fire('Éxito', 'Reporte Excel descargado', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo generar el Excel', 'error');
    }
  };

  const fetchProviders = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.get(`${API_URL}/api/providers`);
      setProviders(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchCategories = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
    }
  };

  const handleSeed = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.get(`${API_URL}/api/seed`);
      Swal.fire('Éxito', 'Base de datos reiniciada', 'success');
      fetchData();
    } catch (err) { Swal.fire('Error', 'No se pudo reiniciar la data', 'error'); }
  };

  // CATEGORY CRUD
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newCategory.name);
    formData.append('image', newCategory.image);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/admin/categories`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setShowCategoryModal(false);
      setNewCategory({ name: '', image: null });
      fetchCategories();
      Swal.fire('Éxito', 'Categoría creada', 'success');
    } catch (err) { Swal.fire('Error', 'No se pudo crear', 'error'); }
  };

  const handleDeleteCategory = async (id) => {
    const confirm = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true });
    if (confirm.isConfirmed) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/admin/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories();
      } catch (err) { Swal.fire('Error', 'Error al eliminar', 'error'); }
    }
  };

  // PROVIDER CRUD
  const handleProviderSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      if (isEditingProvider) {
        await axios.put(`${API_URL}/api/admin/providers/${providerForm._id}`, providerForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/admin/providers`, providerForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowProviderModal(false);
      fetchProviders();
      Swal.fire('Éxito', 'Proveedor guardado', 'success');
    } catch (err) { Swal.fire('Error', 'Error al guardar', 'error'); }
  };

  const handleDeleteProvider = async (id) => {
    const confirm = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true });
    if (confirm.isConfirmed) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/admin/providers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProviders();
      } catch (err) { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
    }
  };

  // PRODUCT CRUD
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(productForm).forEach(key => {
      if (key === 'images') {
        productForm.images.forEach(img => formData.append('images', img));
      } else if (key !== '_id') {
        formData.append(key, productForm[key]);
      }
    });

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      if (isEditingProduct) {
        await axios.put(`${API_URL}/api/admin/products/${productForm._id}`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await axios.post(`${API_URL}/api/admin/products`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      }
      setShowProductModal(false);
      fetchProducts();
      Swal.fire('Éxito', 'Producto guardado', 'success');
    } catch (err) { Swal.fire('Error', 'Error al guardar', 'error'); }
  };

  const handleDeleteProduct = async (id) => {
    const confirm = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true });
    if (confirm.isConfirmed) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
      } catch (err) { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const formatNum = (num) => {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const cleanNum = (val) => {
    return val.replace(/\./g, '');
  };

  const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-brand-red text-white p-4 flex justify-between items-center z-[100] shadow-md">
        <h1 className="text-xl font-black uppercase italic tracking-tighter">EL REBAJÓN</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white/20 rounded-lg">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 w-64 bg-brand-red text-white transition-transform duration-300 ease-in-out z-[110] flex flex-col shadow-2xl`}>
        <div className="p-8">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-1">EL REBAJÓN</h1>
          <span className="bg-white text-brand-red px-2 py-0.5 rounded text-[10px] font-black italic">PANEL ADMINISTRATIVO</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <SidebarLink icon={<BarChart3 size={20} />} label="Centro BI" active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setSidebarOpen(false); }} />
          <SidebarLink icon={<LayoutDashboard size={20} />} label="Inventario" active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setSidebarOpen(false); }} />
          <SidebarLink icon={<Tag size={20} />} label="Categorías" active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }} />
          <SidebarLink icon={<Users size={20} />} label="Proveedores" active={activeTab === 'providers'} onClick={() => { setActiveTab('providers'); setSidebarOpen(false); }} />
          <div className="pt-8 pb-4 border-t border-white/10 mt-4">
            <p className="px-4 text-[10px] font-black uppercase text-white/50 mb-4 tracking-widest">Accesos Rápidos</p>
            <SidebarLink icon={<Home size={20} />} label="Ir a la Tienda" onClick={() => navigate('/')} />
          </div>
        </nav>
        <div className="p-4 bg-black/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-black uppercase">
            <LogOut size={20} /> Salir
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-0">
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          
          {/* DYNAMIC HEADER */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter leading-tight">
                {activeTab === 'products' ? 'Gestión de Inventario' : 
                 activeTab === 'categories' ? 'Gestión de Categorías' : 
                 activeTab === 'providers' ? 'Nuestros Proveedores' : 'Inteligencia de Negocio'}
              </h2>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-wider mt-1">
                {activeTab === 'products' ? 'Administra precios, stock y visibilidad' : 
                 activeTab === 'categories' ? 'Organiza tu catálogo con categorías' : 
                 activeTab === 'providers' ? 'Base de datos de suministros' : 'Analítica avanzada de ventas y rentabilidad'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {activeTab === 'stats' ? (
                <div className="flex gap-3">
                  <button onClick={handleExportExcel} className="bg-white border-2 border-brand-green text-brand-green font-black px-6 py-3 rounded-xl shadow-sm hover:bg-brand-green hover:text-white transition-all flex items-center gap-2 uppercase text-sm">
                    <FileText size={20} /> Descargar Reporte
                  </button>
                  <button onClick={handleSeedOrders} className="bg-brand-red text-white font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 uppercase text-sm">
                    <TrendingUp size={20} /> Simular Ventas (Demo)
                  </button>
                </div>
              ) : activeTab === 'products' ? (
                <>
                  <button onClick={handleSeed} className="bg-white border-2 border-brand-red text-brand-red font-black p-3 rounded-xl hover:bg-brand-red hover:text-white transition-all">
                    <RefreshCw size={20} />
                  </button>
                  <button onClick={() => { setIsEditingProduct(false); setProductForm({ name: '', description: '', purchasePrice: 0, price: 0, category: '', provider: '', stock: 0, stockMin: 0, status: 'Activo', images: [] }); setShowProductModal(true); }} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 uppercase text-sm">
                    <Plus size={20} /> Nuevo Producto
                  </button>
                </>
              ) : activeTab === 'categories' ? (
                <button onClick={() => setShowCategoryModal(true)} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 uppercase text-sm">
                  <Plus size={20} /> Nueva Categoría
                </button>
              ) : (
                <button onClick={() => { setIsEditingProvider(false); setProviderForm({ name: '', phone: '', address: '', email: '', website: '', observation: '' }); setShowProviderModal(true); }} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 uppercase text-sm">
                  <Plus size={20} /> Nuevo Proveedor
                </button>
              )}
            </div>
          </div>

          {loading || (activeTab === 'stats' && statsLoading) ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <RefreshCw className="animate-spin text-brand-red" size={64} />
              <p className="text-gray-400 font-black uppercase italic animate-pulse">Sincronizando Inteligencia...</p>
            </div>
          ) : activeTab === 'stats' ? (
            <div className="space-y-10">
              {/* STATS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Ventas Totales" value={`$${formatNum(stats?.metrics?.totalRevenue)}`} detail={`${stats?.metrics?.count} transacciones`} icon={<ShoppingBag className="text-brand-red"/>} trend="+12%" />
                <MetricCard title="Ganancia Neta" value={`$${formatNum(stats?.metrics?.totalProfit)}`} detail="Margen real" icon={<DollarSign className="text-brand-green"/>} trend="+8%" color="bg-brand-green/10 text-brand-green" />
                <MetricCard title="Ticket Promedio" value={`$${formatNum(Math.round(stats?.metrics?.totalRevenue / stats?.metrics?.count || 0))}`} detail="Por cliente" icon={<TrendingUp className="text-blue-500"/>} trend="+5%" color="bg-blue-50 text-blue-500" />
                <MetricCard title="Productos Activos" value={products.length} detail="En el catálogo" icon={<Package className="text-purple-500"/>} showTrend={false} color="bg-purple-50 text-purple-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SALES TREND CHART */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">Tendencia de Ingresos</h3>
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400"><Calendar size={14}/> Últimos 30 días</div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.dailyTrend}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CATEGORY DIST */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
                  <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-8">Ventas por Categoría</h3>
                  <div className="h-[250px] w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats?.categoryStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {stats?.categoryStats?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* TOP PRODUCTS */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-8">Productos Top de Línea</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-50 pb-4">
                        <th className="pb-4">Producto</th>
                        <th className="pb-4">Unidades</th>
                        <th className="pb-4">Ingresos</th>
                        <th className="pb-4 text-right">Rendimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats?.topProducts?.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 font-black text-gray-800 uppercase italic text-sm">{item._id}</td>
                          <td className="py-4 font-bold text-gray-500">{item.sales} ud</td>
                          <td className="py-4 font-black text-gray-800">${formatNum(item.revenue)}</td>
                          <td className="py-4 text-right">
                             <span className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">
                                <ArrowUpRight size={12}/> High
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'products' ? (
            <div className="grid grid-cols-1 gap-4">
              {products.map((prod) => (
                <div key={prod._id} className={`bg-white rounded-3xl p-6 shadow-sm border ${prod.stock <= prod.stockMin ? 'border-brand-yellow/50 bg-yellow-50/10' : 'border-gray-100'} flex flex-col md:flex-row items-center gap-8 group relative overflow-hidden`}>
                  {prod.status === 'Inactivo' && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center font-black uppercase text-xs text-gray-800">Desactivado</div>}
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                    {prod.mainImage ? <img src={prod.mainImage} className="w-full h-full object-cover" /> : <Package size={40} className="text-gray-200" />}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                      <span className="text-[10px] font-black uppercase text-brand-red bg-red-50 px-2 py-1 rounded-full">{prod.category}</span>
                      {prod.stock <= prod.stockMin && <span className="text-[10px] font-black uppercase text-white bg-brand-yellow px-2 py-1 rounded-full">Bajo Stock</span>}
                    </div>
                    <h4 className="text-xl font-black text-gray-800 uppercase italic truncate">{prod.name}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase">{prod.provider}</p>
                  </div>
                  <div className="flex gap-6 text-center bg-gray-50/50 px-6 py-3 rounded-2xl border border-gray-100">
                    <div><p className="text-[10px] font-black uppercase text-gray-400">Stock</p><p className="font-bold text-sm text-gray-800">{prod.stock}</p></div>
                    <div><p className="text-[10px] font-black uppercase text-gray-400">Compra</p><p className="font-bold text-sm text-gray-600">${formatNum(prod.purchasePrice)}</p></div>
                    <div><p className="text-[10px] font-black uppercase text-brand-red">Venta</p><p className="text-brand-red font-black text-lg">${formatNum(prod.price)}</p></div>
                    <div><p className="text-[10px] font-black uppercase text-blue-500">Ganancia</p><p className="text-blue-600 font-bold">${formatNum(prod.profitMargin)}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsEditingProduct(true); setProductForm(prod); setShowProductModal(true); }} className="p-3 rounded-xl bg-gray-100 transition-all hover:text-blue-500"><Edit size={20} /></button>
                    <button onClick={() => handleDeleteProduct(prod._id)} className="p-3 rounded-xl bg-gray-100 transition-all hover:text-red-500"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <div className="text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">No hay productos</div>}
            </div>
          ) : activeTab === 'categories' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <div key={cat._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center relative group">
                  <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-4 flex items-center justify-center p-4">
                    <img src={cat.image} className="w-full h-full object-contain" />
                  </div>
                  <h4 className="font-black text-gray-800 uppercase italic truncate">{cat.name}</h4>
                  <button onClick={() => handleDeleteCategory(cat._id)} className="absolute top-4 right-4 p-2 bg-red-50 text-brand-red rounded-full opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map((p) => (
                <div key={p._id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-4 relative group">
                  <h3 className="text-2xl font-black text-gray-800 uppercase italic leading-none">{p.name}</h3>
                  <div className="grid grid-cols-1 gap-2 text-gray-500">
                    <div className="flex items-center gap-2 text-xs"><Phone size={14}/> {p.phone || 'N/A'}</div>
                    <div className="flex items-center gap-2 text-xs"><MapPin size={14}/> {p.address || 'N/A'}</div>
                  </div>
                  <div className="flex gap-2 pt-4 mt-auto border-t">
                    <button onClick={() => { setIsEditingProvider(true); setProviderForm(p); setShowProviderModal(true); }} className="flex-1 bg-gray-100 p-3 rounded-xl text-[10px] font-black uppercase">Editar</button>
                    <button onClick={() => handleDeleteProvider(p._id)} className="p-3 bg-red-50 text-brand-red rounded-xl hover:bg-brand-red hover:text-white"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ProductModal show={showProductModal} onClose={() => setShowProductModal(false)} onSubmit={handleProductSubmit} form={productForm} setForm={setProductForm} isEditing={isEditingProduct} categories={categories} providers={providers} formatNum={formatNum} cleanNum={cleanNum} />
      <ProviderModal show={showProviderModal} onClose={() => setShowProviderModal(false)} onSubmit={handleProviderSubmit} form={providerForm} setForm={setProviderForm} isEditing={isEditingProvider} />
      <CategoryModal show={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSubmit={handleAddCategory} form={newCategory} setForm={setNewCategory} />
    </div>
  );
};

// HELPER COMPONENTS
const SidebarLink = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all text-sm font-black uppercase ${active ? 'bg-white text-brand-red shadow-xl scale-105' : 'hover:bg-white/10 text-white/80'}`}>
    {icon} <span>{label}</span>
  </button>
);

const MetricCard = ({ title, value, detail, icon, trend, showTrend = true, color = "bg-red-50 text-brand-red" }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-6 group hover:shadow-xl transition-all">
    <div className="flex justify-between items-start">
      <div className={`p-4 rounded-2xl ${color} transition-transform group-hover:scale-110`}>{icon}</div>
      {showTrend && <span className="bg-brand-green/10 text-brand-green px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1"><ArrowUpRight size={10}/> {trend}</span>}
    </div>
    <div>
      <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">{title}</h4>
      <p className="text-3xl font-black text-gray-800 italic tracking-tighter leading-none">{value}</p>
      <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">{detail}</p>
    </div>
  </div>
);

const ProductModal = ({ show, onClose, onSubmit, form, setForm, isEditing, categories, providers, formatNum, cleanNum }) => {
  if (!show) return null;
  const margin = Number(form.price) - Number(form.purchasePrice);

  const handlePriceChange = (field, e) => {
    const rawVal = cleanNum(e.target.value);
    if (!isNaN(rawVal) || rawVal === '') {
      setForm({...form, [field]: rawVal});
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[300]">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <p className="text-[10px] font-black uppercase text-brand-red tracking-widest mt-1">Gestión avanzada de inventario</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-800"><X size={32} /></button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Nombre del Producto" icon={<Package size={14}/>}>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-brand-red transition-all" />
              </InputGroup>
              <InputGroup label="Categoría" icon={<Tag size={14}/>}>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold">
                  <option value="">Selecciona</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </InputGroup>
            </div>
            <InputGroup label="Descripción" icon={<FileText size={14}/>}>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold min-h-[100px]" />
            </InputGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Valor de Compra" icon={<DollarSign size={14}/>}>
                <input required type="text" value={formatNum(form.purchasePrice)} onChange={e => handlePriceChange('purchasePrice', e)} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-black text-xl text-gray-800" placeholder="0" />
              </InputGroup>
              <InputGroup label="Valor de Venta" icon={<DollarSign size={14}/>}>
                <input required type="text" value={formatNum(form.price)} onChange={e => handlePriceChange('price', e)} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-black text-xl text-brand-red border-2 border-transparent focus:border-brand-red" placeholder="0" />
              </InputGroup>
            </div>
            <div className="bg-blue-50 p-8 rounded-[2rem] flex justify-between items-center border border-blue-100 shadow-inner">
               <div>
                 <p className="text-[10px] font-black uppercase text-blue-500 mb-1">Ganancia Neta Estimada</p>
                 <p className="text-4xl font-black text-blue-600">${formatNum(margin)}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Rentabilidad</p>
                 <p className="text-xl font-black text-blue-500">{form.purchasePrice > 0 ? ((margin/form.purchasePrice)*100).toFixed(1) : 0}%</p>
               </div>
            </div>
          </div>
          <div className="space-y-6">
            <InputGroup label="Proveedor" icon={<Users size={14}/>}>
              <select required value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold">
                <option value="">Selecciona Proveedor</option>
                {providers.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
              </select>
            </InputGroup>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Stock Actual"><input required type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold" /></InputGroup>
              <InputGroup label="Stock Mínimo"><input required type="number" value={form.stockMin} onChange={e => setForm({...form, stockMin: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold" /></InputGroup>
            </div>
            <InputGroup label="Estado"><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl font-bold"><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></InputGroup>
            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 relative group overflow-hidden">
               <input type="file" multiple onChange={e => setForm({...form, images: Array.from(e.target.files)})} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
               <div className="flex flex-col items-center gap-2 text-center">
                  <Plus className="text-brand-red group-hover:rotate-90 transition-transform" />
                  <p className="text-[10px] font-black uppercase text-gray-400">Clic para fotos (Máx 5)</p>
               </div>
               {form.images.length > 0 && (
                 <div className="flex gap-2 overflow-x-auto mt-4 pb-2 relative z-10 no-scrollbar">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative shrink-0">
                        <div className="w-20 h-20 rounded-xl bg-white overflow-hidden border border-gray-200 shadow-sm">{img instanceof File && <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />}</div>
                        {idx === 0 && <span className="absolute -top-1 -right-1 bg-brand-green text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-md border-2 border-white">Principal</span>}
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] font-bold px-1.5 rounded opacity-80">{idx + 1}/5</span>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
          <button type="submit" className="md:col-span-3 bg-brand-red text-white font-black py-6 rounded-[2rem] uppercase tracking-tighter text-2xl shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-4 border-b-8 border-red-800">
            {isEditing ? 'Guardar Cambios' : 'Lanzar Producto Nuevo'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProviderModal = ({ show, onClose, onSubmit, form, setForm, isEditing }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black uppercase">{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3><button onClick={onClose}><X size={32}/></button></div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Nombre"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
          <InputGroup label="Teléfono"><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
          <InputGroup label="Dirección"><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
          <InputGroup label="Sitio Web"><input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
          <div className="md:col-span-2"><InputGroup label="Email"><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup></div>
          <div className="md:col-span-2"><InputGroup label="Observaciones"><textarea value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl min-h-[80px]" /></InputGroup></div>
          <button type="submit" className="md:col-span-2 bg-brand-red text-white font-black py-4 rounded-2xl uppercase shadow-xl">Guardar</button>
        </form>
      </div>
    </div>
  );
};

const CategoryModal = ({ show, onClose, onSubmit, form, setForm }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black uppercase italic tracking-tighter">Nueva Categoría</h3><button onClick={onClose}><X size={32}/></button></div>
        <form onSubmit={onSubmit} className="space-y-6">
          <InputGroup label="Nombre"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold" /></InputGroup>
          <InputGroup label="Icono"><input required type="file" onChange={e => setForm({...form, image: e.target.files[0]})} className="w-full border-2 border-dashed border-gray-100 p-8 rounded-2xl cursor-pointer" /></InputGroup>
          <button type="submit" className="w-full bg-brand-green text-white font-black py-4 rounded-2xl uppercase shadow-lg">Crear</button>
        </form>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon, children }) => (
  <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 flex items-center gap-2 tracking-widest">{icon} {label}</label>{children}</div>
);

export default AdminDashboard;
