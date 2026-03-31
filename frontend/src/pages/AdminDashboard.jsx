import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ReportesPage from './ReportesPage';
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
  Calendar,
  ShieldCheck,
  Flame,
  ToggleLeft,
  ToggleRight,
  Percent,
  Clock
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
  const [brands, setBrands] = useState([]);
  const [providers, setProviders] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'providers', 'stats', 'offers'
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState(null);
  
  // Form States
  const [categoryForm, setCategoryForm] = useState({ name: '', image: null, status: 'Activo' });
  const [brandForm, setBrandForm] = useState({ name: '', category: '', status: 'Activo' });
  const [providerForm, setProviderForm] = useState({
    name: '', phone: '', address: '', email: '', website: '', observation: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', description: '', purchasePrice: 0, price: 0, category: '', brand: '', provider: '', 
    stock: 0, stockMin: 0, status: 'Activo', condition: 'Nuevo', images: []
  });
  const [offerForm, setOfferForm] = useState({
    isOffer: true,
    offerPrice: 0,
    originalPrice: 0,
    offerStartDate: '',
    offerEndDate: ''
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
    await Promise.all([fetchProducts(), fetchCategories(), fetchProviders(), fetchBrands()]);
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
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchBrands = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/admin/brands`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBrands(res.data);
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
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', categoryForm.name);
    formData.append('status', categoryForm.status);
    if (categoryForm.image) {
      formData.append('image', categoryForm.image);
    }
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      if (isEditingCategory) {
        await axios.put(`${API_URL}/api/admin/categories/${categoryForm._id}`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await axios.post(`${API_URL}/api/admin/categories`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      }
      setShowCategoryModal(false);
      setCategoryForm({ name: '', image: null, status: 'Activo' });
      fetchCategories();
      Swal.fire('Éxito', 'Categoría guardada', 'success');
    } catch (err) { Swal.fire('Error', 'No se pudo guardar', 'error'); }
  };


  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      if (isEditingBrand) {
        await axios.put(`${API_URL}/api/admin/brands/${brandForm._id}`, brandForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/admin/brands`, brandForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowBrandModal(false);
      fetchBrands();
      Swal.fire('Éxito', 'Marca guardada', 'success');
    } catch (err) { Swal.fire('Error', 'No se pudo guardar la marca', 'error'); }
  };

  const handleDeleteBrand = async (id) => {
    const confirm = await Swal.fire({ title: '¿Eliminar marca?', icon: 'warning', showCancelButton: true });
    if (confirm.isConfirmed) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/admin/brands/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchBrands();
      } catch (err) { Swal.fire('Error', 'Error al eliminar', 'error'); }
    }
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
      setProductForm({
        name: '', description: '', purchasePrice: 0, price: 0, category: '', provider: '', 
        stock: 0, stockMin: 0, status: 'Activo', condition: 'Nuevo', images: []
      });
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

  // OFFER CRUD
  const handleOpenOfferModal = (product) => {
    setSelectedOfferProduct(product);
    setOfferForm({
      isOffer: product.isOffer || false,
      offerPrice: product.offerPrice || product.price || 0,
      originalPrice: product.originalPrice || product.price || 0,
      offerStartDate: product.offerStartDate ? product.offerStartDate.split('T')[0] : '',
      offerEndDate: product.offerEndDate ? product.offerEndDate.split('T')[0] : ''
    });
    setShowOfferModal(true);
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOfferProduct) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/admin/products/${selectedOfferProduct._id}/offer`,
        offerForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowOfferModal(false);
      fetchProducts();
      Swal.fire('¡Éxito!', offerForm.isOffer ? '🔥 ¡Oferta activada!' : 'Oferta desactivada', 'success');
    } catch (err) {
      Swal.fire('Error', 'No se pudo guardar la oferta', 'error');
    }
  };

  const handleToggleOffer = async (product) => {
    if (!product.isOffer) {
      // Open modal to configure offer
      handleOpenOfferModal(product);
    } else {
      // Deactivate directly
      const confirm = await Swal.fire({
        title: '¿Desactivar oferta?',
        text: `El producto "${product.name}" saldrá de las ofertas`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar'
      });
      if (confirm.isConfirmed) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
          const token = localStorage.getItem('token');
          await axios.put(
            `${API_URL}/api/admin/products/${product._id}/offer`,
            { isOffer: false },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchProducts();
          Swal.fire('Listo', 'Oferta desactivada', 'success');
        } catch (err) {
          Swal.fire('Error', 'No se pudo desactivar', 'error');
        }
      }
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
          <SidebarLink icon={<BarChart3 size={20} />} label="Reportes & BI" active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setSidebarOpen(false); }} />
          <SidebarLink icon={<LayoutDashboard size={20} />} label="Inventario" active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setSidebarOpen(false); }} />
          <SidebarLink icon={<Flame size={20} />} label="Ofertas" active={activeTab === 'offers'} onClick={() => { setActiveTab('offers'); setSidebarOpen(false); }} />
          <SidebarLink icon={<Tag size={20} />} label="Categorías" active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }} />
          <SidebarLink icon={<ShieldCheck size={20} />} label="Marcas" active={activeTab === 'brands'} onClick={() => { setActiveTab('brands'); setSidebarOpen(false); }} />
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
                 activeTab === 'brands' ? 'Gestión de Marcas' : 
                 activeTab === 'providers' ? 'Nuestros Proveedores' :
                 activeTab === 'offers' ? '🔥 Gestión de Ofertas' : 'Inteligencia de Negocio'}
              </h2>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-wider mt-1">
                {activeTab === 'products' ? 'Administra precios, stock y visibilidad' : 
                 activeTab === 'categories' ? 'Organiza tu catálogo con categorías' : 
                 activeTab === 'brands' ? 'Marcas filtradas por categoría' : 
                 activeTab === 'providers' ? 'Base de datos de suministros' :
                 activeTab === 'offers' ? 'Activa ofertas con precios especiales y fechas' : 'Analítica avanzada de ventas y rentabilidad'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {activeTab === 'stats' ? null : activeTab === 'products' ? (
                <>
                  <button onClick={handleSeed} className="bg-white border-2 border-brand-red text-brand-red font-black p-3 rounded-xl hover:bg-brand-red hover:text-white transition-all">
                    <RefreshCw size={20} />
                  </button>
                  <button onClick={() => { setIsEditingProduct(false); setProductForm({ name: '', description: '', purchasePrice: 0, price: 0, category: '', provider: '', stock: 0, stockMin: 0, status: 'Activo', images: [] }); setShowProductModal(true); }} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 uppercase text-sm">
                    <Plus size={20} /> Nuevo Producto
                  </button>
                </>
              ) : activeTab === 'categories' ? (
                <button onClick={() => { setIsEditingCategory(false); setCategoryForm({ name: '', image: null, status: 'Activo' }); setShowCategoryModal(true); }} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 uppercase text-sm">
                  <Plus size={20} /> Nueva Categoría
                </button>
              ) : activeTab === 'brands' ? (
                <button onClick={() => { setIsEditingBrand(false); setBrandForm({ name: '', category: '', status: 'Activo' }); setShowBrandModal(true); }} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 uppercase text-sm">
                  <Plus size={20} /> Nueva Marca
                </button>
              ) : (
                <button onClick={() => { setIsEditingProvider(false); setProviderForm({ name: '', phone: '', address: '', email: '', website: '', observation: '' }); setShowProviderModal(true); }} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 uppercase text-sm">
                  <Plus size={20} /> Nuevo Proveedor
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <RefreshCw className="animate-spin text-brand-red" size={64} />
              <p className="text-gray-400 font-black uppercase italic animate-pulse">Cargando...</p>
            </div>
          ) : activeTab === 'stats' ? (
            <ReportesPage />
          ) : activeTab === 'offers' ? (
            <div className="space-y-4">
              {/* OFFERS SUMMARY BANNER */}
              <div className="bg-gradient-to-r from-brand-red to-red-700 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Ofertas Activas</p>
                  <p className="text-5xl font-black italic tracking-tighter leading-none">{products.filter(p => p.isOffer).length}</p>
                  <p className="text-xs font-bold opacity-70 mt-1 uppercase">de {products.length} productos totales</p>
                </div>
                <Flame size={64} className="opacity-20" />
              </div>

              {/* PRODUCT LIST WITH OFFER TOGGLE */}
              <div className="grid grid-cols-1 gap-3">
                {products.map((prod) => {
                  const isActive = prod.isOffer;
                  const discount = prod.originalPrice && prod.offerPrice
                    ? Math.round(((prod.originalPrice - prod.offerPrice) / prod.originalPrice) * 100)
                    : null;
                  const now = new Date();
                  const isExpired = prod.offerEndDate && new Date(prod.offerEndDate) < now;

                  return (
                    <div key={prod._id} className={`bg-white rounded-3xl p-4 sm:p-5 border-2 transition-all duration-300 shadow-sm flex flex-col md:flex-row items-center gap-4 ${
                      isActive ? 'border-brand-yellow bg-amber-50/30 shadow-amber-100' : 'border-gray-100'
                    }`}>
                      {/* PRODUCT IMAGE */}
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                        {prod.mainImage
                          ? <img src={prod.mainImage} className="w-full h-full object-cover" />
                          : <Package size={28} className="m-auto mt-3 text-gray-200" />}
                      </div>

                      {/* PRODUCT INFO */}
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-1">
                          <span className="text-[10px] font-black uppercase text-brand-red bg-red-50 px-2 py-0.5 rounded-full">{prod.category}</span>
                          {isActive && !isExpired && (
                            <span className="text-[10px] font-black uppercase text-white bg-brand-red px-2 py-0.5 rounded-full animate-pulse">🔥 En Oferta</span>
                          )}
                          {isActive && isExpired && (
                            <span className="text-[10px] font-black uppercase text-white bg-gray-400 px-2 py-0.5 rounded-full">⏰ Vencida</span>
                          )}
                        </div>
                        <h4 className="font-black text-gray-800 uppercase italic tracking-tight text-sm sm:text-base">{prod.name}</h4>
                        {isActive && prod.offerPrice && (
                          <div className="flex items-center gap-2 mt-1 justify-center md:justify-start">
                            {prod.originalPrice && <span className="text-xs text-gray-400 line-through">${formatNum(prod.originalPrice)}</span>}
                            <span className="text-brand-red font-black text-sm">${formatNum(prod.offerPrice)}</span>
                            {discount && <span className="bg-brand-green text-white text-[9px] font-black px-2 py-0.5 rounded-full">-{discount}%</span>}
                          </div>
                        )}
                        {!isActive && (
                          <span className="text-xs text-gray-400 font-bold">${formatNum(prod.price)}</span>
                        )}
                        {isActive && prod.offerStartDate && (
                          <p className="text-[9px] font-bold text-gray-400 mt-0.5 flex items-center gap-1 justify-center md:justify-start">
                            <Clock size={10} />
                            {prod.offerStartDate ? new Date(prod.offerStartDate).toLocaleDateString('es-CO') : ''}
                            {' → '}
                            {prod.offerEndDate ? new Date(prod.offerEndDate).toLocaleDateString('es-CO') : 'Sin fecha fin'}
                          </p>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-3 shrink-0">
                        {isActive && (
                          <button
                            onClick={() => handleOpenOfferModal(prod)}
                            className="p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                            title="Editar oferta"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleOffer(prod)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase transition-all shadow-sm ${
                            isActive
                              ? 'bg-brand-yellow border-2 border-amber-300 text-amber-800 hover:bg-red-500 hover:text-white hover:border-red-500'
                              : 'bg-gray-100 text-gray-500 hover:bg-brand-red hover:text-white'
                          }`}
                        >
                          {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          {isActive ? 'Activa' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {products.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">
                    No hay productos en el inventario
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'brands' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {brands.map((brand) => (
                <div key={brand._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group">
                  <div>
                    <h4 className="font-black text-gray-800 uppercase italic leading-none">{brand.name}</h4>
                    <span className="text-[10px] font-bold text-brand-red uppercase">{brand.category}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setIsEditingBrand(true); setBrandForm(brand); setShowBrandModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteBrand(brand._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
              {brands.length === 0 && <div className="md:col-span-3 text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">No hay marcas registradas</div>}
            </div>
          ) : activeTab === 'categories' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <div key={cat._id} className={`bg-brand-red rounded-[2.5rem] shadow-xl border border-red-800/20 text-center relative group overflow-hidden transition-transform hover:scale-105 ${cat.status === 'Inactivo' ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                  {cat.status === 'Inactivo' && (
                    <div className="absolute top-4 left-4 bg-gray-800/80 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full z-20">
                      Inactivo
                    </div>
                  )}
                  <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                    <img src={cat.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <h4 className="font-black text-white uppercase italic truncate tracking-tighter leading-none mb-1">{cat.name}</h4>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button onClick={() => { setIsEditingCategory(true); setCategoryForm(cat); setShowCategoryModal(true); }} className="p-2 bg-white text-blue-500 rounded-full hover:bg-blue-500 hover:text-white">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat._id)} className="p-2 bg-white text-brand-red rounded-full hover:bg-brand-red hover:text-white">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <div className="col-span-full text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">No hay categorías</div>}
            </div>
          ) : activeTab === 'products' ? (
            <div className="grid grid-cols-1 gap-4">
              {products.map((prod) => (
                <div key={prod._id} className={`bg-white rounded-3xl p-4 sm:p-6 shadow-sm border ${prod.stock <= prod.stockMin ? 'border-brand-yellow/50 bg-yellow-50/10' : 'border-gray-100'} flex flex-col md:flex-row items-center gap-4 sm:gap-8 group relative overflow-hidden`}>
                  {prod.status === 'Inactivo' && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center font-black uppercase text-xs text-gray-800">Desactivado</div>}
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                    {prod.mainImage ? <img src={prod.mainImage} className="w-full h-full object-cover" /> : <Package size={40} className="text-gray-200" />}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                      <span className="text-[10px] font-black uppercase text-brand-red bg-red-50 px-2 py-1 rounded-full">{prod.category}</span>
                      {prod.brand && <span className="text-[10px] font-black uppercase text-brand-green bg-green-50 px-2 py-1 rounded-full">{prod.brand}</span>}
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${prod.condition === 'Usado' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{prod.condition}</span>
                      {prod.stock <= prod.stockMin && <span className="text-[10px] font-black uppercase text-white bg-brand-yellow px-2 py-1 rounded-full">Bajo Stock</span>}
                    </div>
                    <h4 className="text-xl font-black text-gray-800 uppercase italic truncate">{prod.name}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase">{prod.provider}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-center bg-gray-50/50 px-4 sm:px-6 py-3 rounded-2xl border border-gray-100 w-full md:w-auto">
                    <div><p className="text-[8px] sm:text-[10px] font-black uppercase text-gray-400">Stock</p><p className="font-bold text-xs sm:text-sm text-gray-800">{prod.stock}</p></div>
                    <div><p className="text-[8px] sm:text-[10px] font-black uppercase text-gray-400">Compra</p><p className="font-bold text-xs sm:text-sm text-gray-600">${formatNum(prod.purchasePrice)}</p></div>
                    <div><p className="text-[8px] sm:text-[10px] font-black uppercase text-brand-red">Venta</p><p className="text-brand-red font-black text-sm sm:text-lg">${formatNum(prod.price)}</p></div>
                    <div className="hidden xs:block"><p className="text-[8px] sm:text-[10px] font-black uppercase text-blue-500">Ganancia</p><p className="text-blue-600 font-bold text-xs sm:text-sm">${formatNum(prod.profitMargin)}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsEditingProduct(true); setProductForm(prod); setShowProductModal(true); }} className="p-3 rounded-xl bg-gray-100 transition-all hover:text-blue-500"><Edit size={20} /></button>
                    <button onClick={() => handleDeleteProduct(prod._id)} className="p-3 rounded-xl bg-gray-100 transition-all hover:text-red-500"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <div className="text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">No hay productos</div>}
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
              {providers.length === 0 && <div className="col-span-full text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">No hay proveedores</div>}
            </div>
          )}
        </div>
      </main>

      <ProductModal show={showProductModal} onClose={() => setShowProductModal(false)} onSubmit={handleProductSubmit} form={productForm} setForm={setProductForm} isEditing={isEditingProduct} categories={categories} brands={brands} providers={providers} formatNum={formatNum} cleanNum={cleanNum} />
      <ProviderModal show={showProviderModal} onClose={() => setShowProviderModal(false)} onSubmit={handleProviderSubmit} form={providerForm} setForm={setProviderForm} isEditing={isEditingProvider} />
      <CategoryModal show={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSubmit={handleCategorySubmit} form={categoryForm} setForm={setCategoryForm} isEditing={isEditingCategory} />
      <BrandModal show={showBrandModal} onClose={() => setShowBrandModal(false)} onSubmit={handleBrandSubmit} form={brandForm} setForm={setBrandForm} isEditing={isEditingBrand} categories={categories} />
      <OfferModal show={showOfferModal} onClose={() => setShowOfferModal(false)} onSubmit={handleOfferSubmit} form={offerForm} setForm={setOfferForm} product={selectedOfferProduct} formatNum={formatNum} cleanNum={cleanNum} />
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
  <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-4 sm:gap-6 group hover:shadow-xl transition-all">
    <div className="flex justify-between items-start">
      <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${color} transition-transform group-hover:scale-110`}>{icon}</div>
      {showTrend && <span className="bg-brand-green/10 text-brand-green px-2 py-1 rounded-lg text-[8px] sm:text-[10px] font-black flex items-center gap-1"><ArrowUpRight size={10}/> {trend}</span>}
    </div>
    <div>
      <h4 className="text-[8px] sm:text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">{title}</h4>
      <p className="text-xl sm:text-3xl font-black text-gray-800 italic tracking-tighter leading-none">{value}</p>
      <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 mt-2 uppercase">{detail}</p>
    </div>
  </div>
);

const ProductModal = ({ show, onClose, onSubmit, form, setForm, isEditing, categories, brands, providers, formatNum, cleanNum }) => {
  if (!show) return null;
  const margin = Number(form.price) - Number(form.purchasePrice);

  const handlePriceChange = (field, e) => {
    const rawVal = cleanNum(e.target.value);
    if (!isNaN(rawVal) || rawVal === '') {
      setForm({...form, [field]: rawVal});
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[300]">
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 w-full max-w-5xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl sm:text-3xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <p className="text-[8px] sm:text-[10px] font-black uppercase text-brand-red tracking-widest mt-1">Gestión avanzada de inventario</p>
          </div>
          <button onClick={onClose} className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-800"><X size={24} className="sm:w-8 sm:h-8" /></button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Nombre del Producto" icon={<Package size={14}/>}>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-brand-red transition-all" />
              </InputGroup>
              <InputGroup label="Categoría" icon={<Tag size={14}/>}>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value, brand: ''})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold">
                  <option value="">Selecciona</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </InputGroup>
              <InputGroup label="Marca" icon={<ShieldCheck size={14}/>}>
                <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold">
                  <option value="">Sin Marca / Otra</option>
                  {brands.filter(b => b.category === form.category).map(b => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
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
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Estado"><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl font-bold"><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></InputGroup>
              <InputGroup label="Condición"><select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-brand-red"><option value="Nuevo">📦 Nuevo</option><option value="Usado">♻️ Usado</option></select></InputGroup>
            </div>
            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 relative group overflow-hidden">
               <input type="file" multiple onChange={e => {
                  const newFiles = Array.from(e.target.files);
                  if (newFiles.length === 0) return;
                  setForm(prev => {
                     const combined = [...prev.images, ...newFiles].slice(0, 5);
                     return {...prev, images: combined};
                  });
                  setTimeout(() => {
                     if (e.target) e.target.value = null;
                  }, 0);
               }} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="" />
               <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                  <Plus className="text-brand-red group-hover:rotate-90 transition-transform" />
                  <p className="text-[10px] font-black uppercase text-gray-400">Clic para fotos (Máx 5)</p>
               </div>
                 <div className="flex gap-2 overflow-x-auto mt-4 pb-2 relative z-30 no-scrollbar">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative shrink-0 group/img pt-2 pr-2">
                        <div className="w-20 h-20 rounded-xl bg-white overflow-hidden border border-gray-200 shadow-sm pointer-events-auto">
                           <img 
                             src={img instanceof File ? URL.createObjectURL(img) : img} 
                             className="w-full h-full object-cover" 
                           />
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setForm(prev => {
                               const newImages = prev.images.filter((_, i) => i !== idx);
                               return {...prev, images: newImages};
                            });
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity z-40 shadow-md hover:scale-110 pointer-events-auto"
                        >
                          <X size={12} />
                        </button>
                        {idx === 0 && <span className="absolute -bottom-1 -right-0 bg-brand-green text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-md border-2 border-white z-20 pointer-events-none">Principal</span>}
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] font-bold px-1.5 rounded opacity-80 z-20 pointer-events-none">{idx + 1}/5</span>
                      </div>
                    ))}
                 </div>
            </div>
          </div>
          <button type="submit" className="md:col-span-3 bg-brand-red text-white font-black py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] uppercase tracking-tighter text-xl sm:text-2xl shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-4 border-b-4 sm:border-b-8 border-red-800">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[200]">
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6"><h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter">{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3><button onClick={onClose}><X size={24} className="sm:w-8 sm:h-8"/></button></div>
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

const CategoryModal = ({ show, onClose, onSubmit, form, setForm, isEditing }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[200]">
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter">
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <button onClick={onClose}><X size={24} className="sm:w-8 sm:h-8"/></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <InputGroup label="Nombre"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold" /></InputGroup>
          <InputGroup label="Estado">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </InputGroup>
          <InputGroup label="Icono">
            <input type="file" onChange={e => setForm({...form, image: e.target.files[0]})} className="w-full border-2 border-dashed border-gray-100 p-8 rounded-2xl cursor-pointer" required={!isEditing} />
            {isEditing && <p className="text-[10px] text-gray-400 mt-2 italic px-2">Deja vacío para mantener la imagen actual</p>}
          </InputGroup>
          <button type="submit" className={`w-full text-white font-black py-4 rounded-2xl uppercase shadow-lg ${isEditing ? 'bg-blue-500' : 'bg-brand-green'}`}>
            {isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
          </button>
        </form>
      </div>
    </div>
  );
};

const BrandModal = ({ show, onClose, onSubmit, form, setForm, isEditing, categories }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[200]">
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter">
            {isEditing ? 'Editar Marca' : 'Nueva Marca'}
          </h3>
          <button onClick={onClose}><X size={24} className="sm:w-8 sm:h-8"/></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <InputGroup label="Nombre de la Marca"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold" /></InputGroup>
          <InputGroup label="Categoría Asignada">
            <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold">
              <option value="">Selecciona Categoría</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Estado">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </InputGroup>
          <button type="submit" className={`w-full text-white font-black py-4 rounded-2xl uppercase shadow-lg ${isEditing ? 'bg-blue-500' : 'bg-brand-green'}`}>
            {isEditing ? 'Guardar Cambios' : 'Crear Marca'}
          </button>
        </form>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon, children }) => (
  <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 flex items-center gap-2 tracking-widest">{icon} {label}</label>{children}</div>
);

const OfferModal = ({ show, onClose, onSubmit, form, setForm, product, formatNum, cleanNum }) => {
  if (!show || !product) return null;
  const discount = form.originalPrice && form.offerPrice && form.originalPrice > 0
    ? Math.round(((form.originalPrice - form.offerPrice) / form.originalPrice) * 100)
    : 0;
  const savings = form.originalPrice && form.offerPrice ? form.originalPrice - form.offerPrice : 0;

  const handlePriceChange = (field, e) => {
    const rawVal = cleanNum(e.target.value);
    if (rawVal === '') {
      setForm({ ...form, [field]: 0 });
    } else {
      const numVal = parseInt(rawVal, 10);
      if (!isNaN(numVal)) {
        setForm({ ...form, [field]: numVal });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[300]">
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="text-brand-red" size={24} />
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Configurar Oferta</h3>
            </div>
            <p className="text-[10px] font-black uppercase text-brand-red tracking-widest">Producto: {product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* PRODUCT PREVIEW */}
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 mb-6 border border-gray-100">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shrink-0">
            {product.mainImage
              ? <img src={product.mainImage} className="w-full h-full object-cover" />
              : <Package size={28} className="m-3 text-gray-300" />}
          </div>
          <div>
            <h4 className="font-black text-gray-800 uppercase italic text-sm">{product.name}</h4>
            <p className="text-xs text-gray-400 font-bold uppercase">{product.category} · {product.condition}</p>
            <p className="text-brand-red font-black text-sm">Precio actual: ${formatNum(product.price)}</p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={onSubmit} className="space-y-5">
          {/* TOGGLE OFERTA */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div>
              <p className="font-black text-gray-800 uppercase text-sm">¿Producto en Oferta?</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Activa para mostrar en la sección de ofertas</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isOffer: !form.isOffer })}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm uppercase transition-all ${
                form.isOffer ? 'bg-brand-red text-white shadow-lg shadow-red-200' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {form.isOffer ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {form.isOffer ? 'ACTIVA' : 'INACTIVA'}
            </button>
          </div>

          {form.isOffer && (
            <>
              {/* PRICES */}
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Precio Antes" icon={<DollarSign size={14}/>}>
                  <input
                    required
                    type="text"
                    value={formatNum(form.originalPrice)}
                    onChange={e => handlePriceChange('originalPrice', e)}
                    className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-gray-300 transition-all line-through text-gray-500"
                    placeholder="0"
                  />
                </InputGroup>
                <InputGroup label="Precio Oferta (Ahora)" icon={<Flame size={14}/>}>
                  <input
                    required
                    type="text"
                    value={formatNum(form.offerPrice)}
                    onChange={e => handlePriceChange('offerPrice', e)}
                    className="w-full bg-red-50 p-4 rounded-2xl outline-none font-black text-xl text-brand-red border-2 border-brand-red/20 focus:border-brand-red transition-all"
                    placeholder="0"
                  />
                </InputGroup>
              </div>

              {/* DISCOUNT PREVIEW */}
              {discount > 0 && (
                <div className="bg-gradient-to-r from-brand-red to-red-600 rounded-[1.5rem] p-5 text-white flex items-center justify-between shadow-lg">
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-70">Descuento aplicado</p>
                    <p className="text-4xl font-black italic">-{discount}%</p>
                    <p className="text-xs font-bold opacity-70">El cliente ahorra ${formatNum(savings)}</p>
                  </div>
                  <Percent size={48} className="opacity-20" />
                </div>
              )}

              {/* DATES */}
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Fecha Inicio" icon={<Calendar size={14}/>}>
                  <input
                    type="date"
                    value={form.offerStartDate}
                    onChange={e => setForm({ ...form, offerStartDate: e.target.value })}
                    className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-brand-red transition-all"
                  />
                </InputGroup>
                <InputGroup label="Fecha Fin" icon={<Clock size={14}/>}>
                  <input
                    type="date"
                    value={form.offerEndDate}
                    onChange={e => setForm({ ...form, offerEndDate: e.target.value })}
                    className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-brand-red transition-all"
                  />
                </InputGroup>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase px-2">💡 Deja las fechas vacías para que la oferta no tenga límite de tiempo</p>
            </>
          )}

          <button
            type="submit"
            className={`w-full font-black py-5 rounded-[1.5rem] uppercase tracking-tighter text-xl shadow-2xl hover:scale-[1.01] active:scale-95 transition-all border-b-4 ${
              form.isOffer
                ? 'bg-brand-red text-white border-red-800 shadow-red-200'
                : 'bg-gray-400 text-white border-gray-600'
            }`}
          >
            {form.isOffer ? '🔥 Activar Oferta' : 'Guardar (sin oferta)'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
