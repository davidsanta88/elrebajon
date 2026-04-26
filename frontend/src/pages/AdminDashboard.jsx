import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ReportesPage from './ReportesPage';
import OrderCreationView from './OrderCreationView';
import ClientsView from './ClientsView';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
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
  ShoppingCart,
  ArrowUpRight,
  Calendar,
  ShieldCheck,
  Flame,
  ToggleLeft,
  ToggleRight,
  Clock,
  Smartphone,
  CreditCard,
  Wallet,
  Building,
  Percent,
  ArrowLeft,
  ArrowRight,
  Search
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartera, setCartera] = useState({ orders: [], totalReceivable: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({ name: '', status: 'Activo' });
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  
  // POS / Order Creation State (LIFTED)
  const [posOrder, setPosOrder] = useState({
    customerName: '',
    customerPhone: '',
    items: [],
    totalRevenue: 0,
    initialPayment: 0,
    paymentMethod: 'Efectivo',
    isPlanSepare: false,
    note: ''
  });
  const [posSearchResults, setPosSearchResults] = useState([]);
  const [posCustomerSuggestions, setPosCustomerSuggestions] = useState([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [offersSearchTerm, setOffersSearchTerm] = useState('');
  const [offersCategoryFilter, setOffersCategoryFilter] = useState('');
  const [productsSearchTerm, setProductsSearchTerm] = useState('');
  const [productsCategoryFilter, setProductsCategoryFilter] = useState('');


  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const searchPOSProducts = async (q) => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/products/search?q=${q || ''}`, { headers });
      setPosSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onSearchCustomer = async (q, force = false) => {
    if (!force && (!q || q.length < 3)) {
      setPosCustomerSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/admin/customers?q=${q || ''}`, { headers });
      setPosCustomerSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (customerData) => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/customers`, customerData, { headers });
      Swal.fire('Éxito', 'Cliente creado correctamente', 'success');
      // Auto-select the new customer in POS
      setPosOrder({
        ...posOrder,
        customerName: res.data.name,
        customerPhone: res.data.phone
      });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear cliente';
      Swal.fire('Error', msg, 'error');
      throw err;
    }
  };

  const handlePOSSave = async () => {
    if (posOrder.items.length === 0) return Swal.fire('Error', 'Añade al menos un producto', 'error');
    setIsSubmittingOrder(true);
    Swal.fire({ title: 'Procesando...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      await axios.post(`${API_URL}/api/admin/orders`, posOrder, { headers });
      Swal.fire('Éxito', 'Venta registrada correctamente', 'success');
      setPosOrder({ customerName: '', customerPhone: '', items: [], totalRevenue: 0, initialPayment: 0, isPlanSepare: false, note: '', paymentMethod: 'Efectivo' });
      setActiveTab('products'); 
      fetchStats();
    } catch (err) {
      Swal.fire('Error', 'No se pudo registrar la venta', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [categoryForm, setCategoryForm] = useState({ name: '', image: null, status: 'Activo' });
  const [brandForm, setBrandForm] = useState({ name: '', category: '', status: 'Activo' });
  const [providerForm, setProviderForm] = useState({
    name: '', phone: '', address: '', email: '', website: '', observation: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', description: '', purchasePrice: 0, price: 0, category: '', brand: '', provider: '', 
    stock: 20, status: 'Activo', condition: 'Nuevo', images: [], location: 'Bodega', priority: 0
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
    if (activeTab === 'cartera') {
      fetchCartera();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchCategories(), fetchProviders(), fetchBrands(), fetchCartera(), fetchLocations()]);
    setLoading(false);
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/locations`, { headers });
      setLocations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCartera = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/reports/cartera`, { headers });
      setCartera(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayment = async (orderId, paymentData) => {
    setIsSubmittingOrder(true);
    Swal.fire({ title: 'Procesando...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
      const res = await axios.post(`${API_URL}/api/admin/orders/${orderId}/payments`, paymentData, { headers });
      const updatedOrder = res.data;
      const balance = updatedOrder.totalRevenue - updatedOrder.payments.reduce((acc, p) => acc + p.amount, 0);
      
      Swal.fire({
        title: '¡Abono Registrado!',
        text: `Abono de $${formatNum(paymentData.amount)} registrado. Saldo pendiente: $${formatNum(balance)}.`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: '📱 Enviar WhatsApp',
        confirmButtonColor: '#25D366'
      }).then((result) => {
        if (result.isConfirmed) {
          const message = `Hola *${updatedOrder.customerName}*, se registró un abono de *$${formatNum(paymentData.amount)}*. Tu saldo pendiente es *$${formatNum(balance)}*. ¡Gracias!`;
          window.open(`https://wa.me/${updatedOrder.customerPhone}?text=${encodeURIComponent(message)}`, '_blank');
        }
      });

      setShowPaymentModal(false);
      fetchCartera();
    } catch (err) {
      Swal.fire('Error', 'No se pudo registrar el pago', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
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
    if (isSubmitting) return;

    setIsSubmitting(true);
    Swal.fire({
      title: 'Procesando...',
      text: 'Por favor espere un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const formData = new FormData();
    Object.keys(productForm).forEach(key => {
      if (key === 'images') {
        productForm.images.forEach(img => {
          if (img instanceof File) {
             formData.append('images', img);
             formData.append('imageOrder', 'FILE');
          } else {
             formData.append('imageOrder', img); // Es la URL existente
          }
        });
      } else if (key !== '_id') {
        const val = productForm[key];
        // Solo añadir si el valor no es nulo, indefinido o la cadena "null"
        if (val !== null && val !== undefined && val !== "" && val !== "null") {
          formData.append(key, val);
        }
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
        stock: 20, status: 'Activo', condition: 'Nuevo', images: [], priority: 0
      });
      fetchProducts();
      Swal.fire('Éxito', 'Producto guardado correctamente', 'success');
    } catch (err) { 
      Swal.fire('Error', 'Error al guardar', 'error'); 
    } finally {
      setIsSubmitting(false);
    }
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

  const handlePriorityQuickUpdate = async (id, newPriority) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/admin/products/${id}/priority`, { priority: Number(newPriority) }, { headers: { Authorization: `Bearer ${token}` } });
      fetchProducts(); // Auto re-sort
    } catch (err) {
      console.error("Error updating priority:", err);
      Swal.fire('Error', 'No se pudo actualizar la prioridad', 'error');
    }
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditingLocation) {
        await axios.put(`${API_URL}/api/admin/locations/${locationForm._id}`, locationForm, { headers });
        Swal.fire('Éxito', 'Ubicación actualizada', 'success');
      } else {
        await axios.post(`${API_URL}/api/admin/locations`, locationForm, { headers });
        Swal.fire('Éxito', 'Ubicación creada', 'success');
      }
      setShowLocationModal(false);
      fetchLocations();
    } catch (err) {
      Swal.fire('Error', 'No se pudo guardar la ubicación', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/admin/locations/${id}`, { headers });
        Swal.fire('Eliminado', 'La ubicación ha sido eliminada', 'success');
        fetchLocations();
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar la ubicación', 'error');
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
      
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-brand-red text-white p-3 flex justify-between items-center z-[100] shadow-md">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white/20 rounded-lg">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="h-8">
          <img src="/logo-rebajon.png" alt="El Rebajón" className="h-full w-auto object-contain brightness-110" />
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 w-56 bg-brand-red text-white transition-transform duration-300 ease-in-out z-[110] flex flex-col shadow-2xl shrink-0`}>
        <div className="p-4 flex flex-col items-center">
          <img src="/logo-rebajon.png" alt="El Rebajón" className="w-full max-w-[140px] h-auto mb-2 brightness-110" />
          <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[7px] font-black italic uppercase tracking-widest border border-white/10">PANEL ADMINISTRATIVO</span>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto thin-scrollbar">
          <SidebarLink icon={<LayoutDashboard size={18} />} label="Productos" active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setSidebarOpen(false); }} />
          <SidebarLink icon={<Flame size={18} />} label="Ofertas" active={activeTab === 'offers'} onClick={() => { setActiveTab('offers'); setSidebarOpen(false); }} />
          <SidebarLink icon={<ShoppingCart size={18} />} label="Registrar Venta" active={activeTab === 'pos'} onClick={() => { setActiveTab('pos'); setSidebarOpen(false); }} />
          <div className="pt-2 pb-2 border-t border-white/5 my-1"></div>
          <SidebarLink icon={<BarChart3 size={18} />} label="Reportes & BI" active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setSidebarOpen(false); }} />
          <SidebarLink icon={<Users size={18} />} label="Clientes" active={activeTab === 'clients'} onClick={() => { setActiveTab('clients'); setSidebarOpen(false); }} />
          <SidebarLink icon={<CreditCard size={18} />} label="Cartera" active={activeTab === 'cartera'} onClick={() => { setActiveTab('cartera'); setSidebarOpen(false); }} />
          <div className="pt-2 pb-2 border-t border-white/5 my-1"></div>
          <SidebarLink icon={<Tag size={18} />} label="Categorías" active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }} />
          <SidebarLink icon={<ShieldCheck size={18} />} label="Marcas" active={activeTab === 'brands'} onClick={() => { setActiveTab('brands'); setSidebarOpen(false); }} />
          <SidebarLink icon={<Users size={18} />} label="Proveedores" active={activeTab === 'providers'} onClick={() => { setActiveTab('providers'); setSidebarOpen(false); }} />
          <SidebarLink icon={<MapPin size={18} />} label="Ubicaciones" active={activeTab === 'locations'} onClick={() => { setActiveTab('locations'); setSidebarOpen(false); }} />
          <div className="pt-6 pb-2 border-t border-white/10 mt-2">
            <p className="px-3 text-[9px] font-black uppercase text-white/50 mb-2 tracking-widest">Accesos Rápidos</p>
            <SidebarLink icon={<Home size={18} />} label="Ir a la Tienda" onClick={() => navigate('/')} />
          </div>
        </nav>
        <div className="p-3 bg-black/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-xs font-black uppercase">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 overflow-y-auto pt-20 lg:pt-0 bg-gray-50/50 ${activeTab === 'pos' ? 'h-screen' : ''}`}>
        <div className={`${activeTab === 'pos' ? 'p-0 h-full' : 'p-2 md:p-6 lg:p-8'} max-w-full`}>
          
          {/* DYNAMIC HEADER (Hiden on POS) */}
          {activeTab !== 'pos' && (
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-[ -0.05em] leading-none mb-1">
                  {activeTab === 'products' ? 'Productos' : 
                   activeTab === 'categories' ? 'Categorías' : 
                   activeTab === 'brands' ? 'Marcas' : 
                   activeTab === 'providers' ? 'Proveedores' :
                   activeTab === 'offers' ? 'Ofertas' : 
                   activeTab === 'locations' ? 'Ubicaciones' :
                   activeTab === 'pos' ? 'Punto de Venta' :
                   activeTab === 'clients' ? 'Directorio de Clientes' : 
                   activeTab === 'cartera' ? 'Cartera de Clientes' : 'Reportes & BI'}
                </h2>
                <p className="text-gray-400 font-bold uppercase text-[8px] tracking-[0.1em] leading-none opacity-60">
                  {activeTab === 'products' ? 'Gestión de productos y precios' : 
                   activeTab === 'categories' ? 'Categorías de productos' : 
                   activeTab === 'brands' ? 'Marcas filtradas' : 
                   activeTab === 'providers' ? 'Base de proveedores' :
                   activeTab === 'pos' ? 'Registrar nueva transacción' :
                   activeTab === 'clients' ? 'Gestión integral de clientes' :
                   activeTab === 'cartera' ? 'Seguimiento de saldos y abonos' :
                   activeTab === 'locations' ? 'Ubicaciones físicas de productos' :
                   activeTab === 'offers' ? 'Productos en promoción' : 'Vista general del negocio'}
                </p>
              </div>
              
              <div className="flex gap-2">
                {activeTab === 'stats' || activeTab === 'pos' || activeTab === 'clients' ? null : activeTab === 'products' ? (
                  <>
                    <button onClick={handleSeed} className="bg-white border text-brand-red font-black p-2 rounded-lg hover:bg-brand-red hover:text-white transition-all">
                      <RefreshCw size={16} />
                    </button>
                    <button onClick={() => { setIsEditingProduct(false); setProductForm({ name: '', description: '', purchasePrice: 0, price: 0, category: '', brand: '', provider: '', stock: 20, stockMin: 0, status: 'Activo', images: [], priority: 0 }); setShowProductModal(true); }} className="bg-brand-green text-white font-black px-4 py-2 rounded-lg shadow-sm hover:scale-105 transition-transform flex items-center gap-1.5 uppercase text-[10px]">
                      <Plus size={16} /> Nuevo
                    </button>
                  </>
                ) : activeTab === 'categories' ? (
                  <button onClick={() => { setIsEditingCategory(false); setCategoryForm({ name: '', image: null, status: 'Activo' }); setShowCategoryModal(true); }} className="bg-brand-green text-white font-black px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 uppercase text-[10px]">
                    <Plus size={16} /> Nueva
                  </button>
                ) : activeTab === 'brands' ? (
                  <button onClick={() => { setIsEditingBrand(false); setBrandForm({ name: '', category: '', status: 'Activo' }); setShowBrandModal(true); }} className="bg-brand-green text-white font-black px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 uppercase text-[10px]">
                    <Plus size={16} /> Nueva
                  </button>
                ) : activeTab === 'locations' ? (
                  <button onClick={() => { setIsEditingLocation(false); setLocationForm({ name: '', description: '', status: 'Activo' }); setShowLocationModal(true); }} className="bg-brand-green text-white font-black px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 uppercase text-[10px]">
                    <Plus size={16} /> Nueva
                  </button>
                ) : (
                  <button onClick={() => { setIsEditingProvider(false); setProviderForm({ name: '', phone: '', address: '', email: '', website: '', observation: '' }); setShowProviderModal(true); }} className="bg-brand-green text-white font-black px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 uppercase text-[10px]">
                    <Plus size={16} /> Nuevo
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <RefreshCw className="animate-spin text-brand-red" size={64} />
              <p className="text-gray-400 font-black uppercase italic animate-pulse">Cargando...</p>
            </div>
          ) : activeTab === 'stats' ? (
            <ReportesPage setActiveTab={setActiveTab} />
          ) : activeTab === 'pos' ? (
            <OrderCreationView 
               onClose={() => setActiveTab('products')}
               formData={posOrder}
               setFormData={setPosOrder}
               onSearch={searchPOSProducts}
               searchResults={posSearchResults}
               onSearchCustomer={onSearchCustomer}
               onCreateCustomer={handleCreateCustomer}
               customerSuggestions={posCustomerSuggestions}
               onSave={handlePOSSave}
               isSubmitting={isSubmittingOrder}
               formatNum={num => num.toLocaleString('es-CO')}
            />
          ) : activeTab === 'clients' ? (
            <ClientsView />
          ) : activeTab === 'offers' ? (
            <div className="space-y-4">
              {/* OFFERS SUMMARY BANNER */}
              <div className="bg-gradient-to-r from-brand-red to-red-700 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">Ofertas Activas</p>
                  <p className="text-3xl font-black italic tracking-tighter leading-none">{products.filter(p => p.isOffer).length}</p>
                </div>
                <Flame size={32} className="opacity-20" />
              </div>
              {/* OFFERS FILTERS */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar producto en oferta..." 
                    value={offersSearchTerm}
                    onChange={(e) => setOffersSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none focus:border-brand-red transition-all shadow-sm"
                  />
                </div>
                <select 
                  value={offersCategoryFilter}
                  onChange={(e) => setOffersCategoryFilter(e.target.value)}
                  className="bg-white border border-gray-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:border-brand-red transition-all shadow-sm"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products
                  .filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(offersSearchTerm.toLowerCase());
                    const matchesCategory = !offersCategoryFilter || p.category === offersCategoryFilter;
                    return matchesSearch && matchesCategory;
                  })
                  .slice()
                  .sort((a, b) => (b.isOffer ? 1 : -1))
                  .map((prod) => {
                  const isActive = prod.isOffer;
                  const discount = prod.originalPrice && prod.offerPrice
                    ? Math.round(((prod.originalPrice - prod.offerPrice) / prod.originalPrice) * 100)
                    : null;

                  return (
                    <div key={prod._id} className={`bg-white rounded-2xl p-4 border transition-all duration-300 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:shadow-md ${
                      isActive ? 'border-brand-red/20 bg-amber-50/20' : 'border-gray-100'
                    }`}>
                      {/* BADGE DESCUENTO */}
                      {isActive && discount && (
                        <div className="absolute top-0 right-0">
                           <div className="bg-brand-red text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm">
                              -{discount}% OFF
                           </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                          {prod.mainImage
                            ? <img src={prod.mainImage} className="w-full h-full object-cover" />
                            : <Package size={24} className="m-auto mt-4 text-gray-200" />}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="text-[8px] font-black uppercase text-brand-red tracking-widest mb-1">{prod.category}</span>
                          <h4 className="font-black text-gray-800 uppercase italic truncate text-sm leading-tight mb-1">{prod.name}</h4>
                          <div className="flex items-center gap-2">
                            {isActive && prod.offerPrice ? (
                              <>
                                <span className="text-sm font-black text-brand-red italic leading-none">${formatNum(prod.offerPrice)}</span>
                                {prod.originalPrice && <span className="text-[10px] text-gray-300 line-through font-bold">${formatNum(prod.originalPrice)}</span>}
                              </>
                            ) : (
                              <span className="text-sm font-black text-gray-400 italic leading-none">${formatNum(prod.price)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-50 mt-1">
                        {isActive && (
                          <button 
                            onClick={() => handleOpenOfferModal(prod)} 
                            className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <Edit size={14} /> Configurar
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleOffer(prod)}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm ${
                            isActive ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <Smartphone size={14} />
                          {isActive ? 'Activa' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {products.filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(offersSearchTerm.toLowerCase());
                    const matchesCategory = !offersCategoryFilter || p.category === offersCategoryFilter;
                    return matchesSearch && matchesCategory;
                  }).length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">
                    No hay productos en oferta que coincidan
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'categories' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <div key={cat._id} className={`bg-gray-100 rounded-2xl shadow-sm border border-gray-200 text-center relative group overflow-hidden transition-all hover:border-brand-red ${cat.status === 'Inactivo' ? 'opacity-50' : ''}`}>
                  <div className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden bg-white">
                    <img src={cat.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2.5 bg-white border-t">
                    <h4 className="text-[10px] font-black text-gray-800 uppercase italic truncate leading-none">{cat.name}</h4>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button onClick={() => { setIsEditingCategory(true); setCategoryForm(cat); setShowCategoryModal(true); }} className="p-1.5 bg-white shadow-md text-blue-500 rounded-lg">
                      <Edit size={12} />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat._id)} className="p-1.5 bg-white shadow-md text-brand-red rounded-lg">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">
                  No hay categorías registradas
                </div>
              )}
            </div>
          ) : activeTab === 'products' ? (
            <div className="space-y-4">
               {/* PRODUCTS FILTERS */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o ID..." 
                      value={productsSearchTerm}
                      onChange={(e) => setProductsSearchTerm(e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none focus:border-brand-red transition-all shadow-sm"
                    />
                  </div>
                  <select 
                    value={productsCategoryFilter}
                    onChange={(e) => setProductsCategoryFilter(e.target.value)}
                    className="bg-white border border-gray-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:border-brand-red transition-all shadow-sm"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* CABECERA TABLA (SOLO DESKTOP) */}
                  <div className="hidden lg:grid grid-cols-[60px_80px_1fr_120px_100px_100px_110px_110px_120px] gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <div className="text-center">#</div>
                    <div className="text-center">Visor Img</div>
                    <div>Nombre Producto</div>
                    <div>Categoría</div>
                    <div className="text-center">Condición</div>
                    <div className="text-center">Stock</div>
                    <div className="text-right">Compra</div>
                    <div className="text-right">Venta</div>
                    <div className="text-right">Acciones</div>
                  </div>

                  {/* FILAS DE PRODUCTOS / TARJETAS MÓVILES */}
                  <div className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto thin-scrollbar">
                    {products
                      .filter(p => {
                        const matchesSearch = p.name.toLowerCase().includes(productsSearchTerm.toLowerCase()) || p._id.toLowerCase().includes(productsSearchTerm.toLowerCase());
                        const matchesCategory = !productsCategoryFilter || p.category === productsCategoryFilter;
                        return matchesSearch && matchesCategory;
                      })
                      .map((prod) => {
                        const profit = prod.price - (prod.purchasePrice || 0);
                        const marginPercent = prod.purchasePrice > 0 ? ((profit / prod.purchasePrice) * 100).toFixed(0) : 0;
                        const allImages = (prod.images && prod.images.length > 0 ? prod.images : [prod.mainImage]).filter(Boolean);
                        const isInactive = prod.status === 'Inactivo';

                        return (
                          <React.Fragment key={prod._id}>
                            {/* VISTA DESKTOP (TABLA) */}
                            <div className={`hidden lg:grid grid-cols-[60px_80px_1fr_120px_100px_100px_110px_110px_120px] gap-4 px-6 py-4 items-center hover:bg-gray-50/80 transition-all group ${isInactive ? 'opacity-40 grayscale' : ''}`}>
                              {/* RANKING */}
                              <div className="flex items-center justify-center">
                                <input 
                                  type="number" 
                                  defaultValue={prod.priority || 0}
                                  onBlur={(e) => handlePriorityQuickUpdate(prod._id, e.target.value)}
                                  className="w-12 text-center bg-gray-100 border border-gray-200 rounded-lg py-1 text-[10px] font-black outline-none focus:border-brand-red transition-all"
                                />
                              </div>

                              {/* VISOR IMG */}
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border-2 border-white shadow-sm mx-auto">
                                {allImages.length > 0 ? (
                                  <Swiper modules={[Autoplay]} autoplay={{ delay: 3000 + Math.random() * 2000 }} loop={allImages.length > 1} className="w-full h-full">
                                    {allImages.map((img, idx) => (
                                      <SwiperSlide key={idx}><img src={img?.startsWith('http') ? img : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/${img}`} className="w-full h-full object-cover" /></SwiperSlide>
                                    ))}
                                  </Swiper>
                                ) : <div className="w-full h-full flex items-center justify-center text-gray-200"><Package size={20} /></div>}
                              </div>

                              {/* INFO */}
                              <div className="min-w-0">
                                <h4 className="font-black text-gray-800 uppercase italic truncate text-sm leading-tight leading-none mb-1">{prod.name}</h4>
                                <span className="text-[8px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md uppercase">SKU: {prod._id.slice(-6).toUpperCase()}</span>
                              </div>

                              {/* CATEGORIA */}
                              <div>
                                <span className="inline-block bg-brand-red/5 text-brand-red font-black text-[9px] px-2 py-1 rounded-lg uppercase italic border border-brand-red/10">{prod.category}</span>
                              </div>

                              {/* CONDICION */}
                              <div className="text-center">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${prod.condition === 'Usado' ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-blue-200 text-blue-600 bg-blue-50'} uppercase`}>{prod.condition || 'Nuevo'}</span>
                              </div>

                              {/* STOCK */}
                              <div className="text-center flex flex-col items-center">
                                <p className={`text-[11px] font-black ${prod.stock <= (prod.stockMin || 0) ? 'text-red-500' : 'text-gray-700'}`}>{prod.stock} Uni.</p>
                                {prod.stock <= (prod.stockMin || 0) && <span className="text-[7px] font-black uppercase text-red-400 animate-pulse">Low Stock</span>}
                              </div>

                              {/* COMPRA */}
                              <div className="text-right">
                                <p className="text-gray-300 font-bold text-[10px] leading-none tracking-tighter decoration-gray-200">${formatNum(prod.purchasePrice || 0)}</p>
                              </div>

                              {/* VENTA */}
                              <div className="text-right">
                                <p className="text-brand-red font-black text-[14px] leading-none italic tracking-tighter">${formatNum(prod.price)}</p>
                                <p className="text-[8px] font-black text-brand-green mt-1">+{marginPercent}%</p>
                              </div>

                              {/* ACCIONES */}
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => { setIsEditingProduct(true); setProductForm(prod); setShowProductModal(true); }} className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteProduct(prod._id)} className="p-2 bg-red-50 text-brand-red rounded-xl hover:bg-brand-red hover:text-white transition-all shadow-sm"><Trash2 size={14} /></button>
                              </div>
                            </div>

                            {/* VISTA MÓVIL (TARJETAS) */}
                            <div className={`lg:hidden p-4 flex flex-col gap-4 bg-white hover:bg-gray-50/50 transition-colors relative ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                               <div className="flex gap-4">
                                  {/* IMAGEN MÓVIL */}
                                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-lg shrink-0">
                                    {allImages.length > 0 ? (
                                      <Swiper modules={[Autoplay]} autoplay={{ delay: 3500 }} loop={allImages.length > 1} className="w-full h-full">
                                        {allImages.map((img, idx) => (
                                          <SwiperSlide key={idx}><img src={img?.startsWith('http') ? img : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/${img}`} className="w-full h-full object-cover" /></SwiperSlide>
                                        ))}
                                      </Swiper>
                                    ) : <div className="w-full h-full flex items-center justify-center text-gray-200"><Package size={24} /></div>}
                                  </div>

                                  {/* INFO MÓVIL */}
                                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                     <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] font-black bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-md uppercase italic">{prod.category}</span>
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${prod.condition === 'Usado' ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-blue-200 text-blue-600 bg-blue-50'} uppercase`}>{prod.condition || 'Nuevo'}</span>
                                     </div>
                                     <h4 className="font-black text-gray-800 uppercase italic truncate text-sm leading-tight">{prod.name}</h4>
                                     <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-brand-red font-black text-base italic tracking-tighter leading-none">${formatNum(prod.price)}</p>
                                        <span className="text-[9px] font-black text-brand-green bg-green-50 px-1.5 py-0.5 rounded">+{marginPercent}% Rent.</span>
                                     </div>
                                  </div>
                               </div>

                               {/* ESTADÍSTICAS RÁPIDAS MÓVIL */}
                               <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-2xl p-3 border border-gray-100/50">
                                  <div className="text-center">
                                    <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Existencias</p>
                                    <p className={`text-xs font-black italic ${prod.stock <= (prod.stockMin || 0) ? 'text-red-500' : 'text-gray-800'}`}>{prod.stock} U.</p>
                                  </div>
                                  <div className="text-center border-l border-gray-200">
                                    <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Costo</p>
                                    <p className="text-xs font-black text-gray-500 italic">${formatNum(prod.purchasePrice || 0)}</p>
                                  </div>
                                  <div className="text-center border-l border-gray-200">
                                    <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Ganancia</p>
                                    <p className="text-xs font-black text-brand-green italic">+${formatNum(profit)}</p>
                                  </div>
                               </div>

                               {/* BOTONES DE ACCIÓN MÓVIL */}
                               <div className="flex gap-2">
                                  <button 
                                    onClick={() => { setIsEditingProduct(true); setProductForm(prod); setShowProductModal(true); }}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black uppercase text-[11px] italic flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                                  >
                                    <Edit size={16} /> Editar Producto
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProduct(prod._id)}
                                    className="w-14 bg-red-50 text-brand-red rounded-2xl border border-red-100 flex items-center justify-center active:scale-95 transition-all"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                               </div>
                            </div>
                          </React.Fragment>
                        );
                      })}

                    {products.length === 0 && (
                      <div className="text-center py-24 bg-white rounded-xl text-gray-300 font-black uppercase italic text-xs tracking-[0.2em] animate-pulse">
                        El inventario está vacío
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'providers' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map((p) => (
                <div key={p._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                  <h3 className="text-sm font-black text-gray-800 uppercase italic leading-none">{p.name}</h3>
                  <div className="space-y-1 text-gray-400">
                    <div className="flex items-center gap-2 text-[9px] font-bold"><Phone size={10}/> {p.phone || 'N/A'}</div>
                    <div className="flex items-center gap-2 text-[9px] font-bold"><MapPin size={10}/> {p.address || 'N/A'}</div>
                  </div>
                  <div className="flex gap-1.5 pt-2 mt-auto border-t">
                    <button onClick={() => { setIsEditingProvider(true); setProviderForm(p); setShowProviderModal(true); }} className="flex-1 bg-gray-50 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-gray-100 transition-all">Editar</button>
                    <button onClick={() => handleDeleteProvider(p._id)} className="p-1.5 bg-red-50 text-brand-red rounded-lg hover:bg-brand-red hover:text-white transition-all"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
              {providers.length === 0 && <div className="col-span-full text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">No hay proveedores registrados</div>}
            </div>
          ) : activeTab === 'brands' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand) => (
                <div key={brand._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-gray-800 uppercase italic leading-none">{brand.name}</h4>
                      <span className="text-[9px] font-black text-brand-red uppercase mt-1 inline-block">{brand.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-2 mt-auto border-t">
                    <button onClick={() => { setIsEditingBrand(true); setBrandForm(brand); setShowBrandModal(true); }} className="flex-1 bg-gray-50 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-gray-100 transition-all">Editar</button>
                    <button onClick={() => handleDeleteBrand(brand._id)} className="p-1.5 bg-red-50 text-brand-red rounded-lg hover:bg-brand-red hover:text-white transition-all"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {brands.length === 0 && <div className="col-span-full text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">No hay marcas registradas</div>}
            </div>
          ) : activeTab === 'locations' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((loc) => (
                <div key={loc._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 relative group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red"><MapPin size={20}/></div>
                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase italic leading-none">{loc.name}</h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-1">{loc.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-2 mt-auto border-t">
                    <button onClick={() => { setIsEditingLocation(true); setLocationForm(loc); setShowLocationModal(true); }} className="flex-1 bg-gray-50 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-gray-100 transition-all">Editar</button>
                    <button onClick={() => handleDeleteLocation(loc._id)} className="p-1.5 bg-red-50 text-brand-red rounded-lg hover:bg-brand-red hover:text-white transition-all"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
              {locations.length === 0 && <div className="col-span-full text-center py-20 bg-white rounded-3xl text-gray-400 font-black uppercase italic">No hay ubicaciones registradas</div>}
            </div>
          ) : activeTab === 'cartera' ? (
            <CarteraView 
              data={cartera} 
              formatNum={formatNum} 
              onPayment={(order) => { setSelectedOrder(order); setShowPaymentModal(true); }}
            />
          ) : null}
        </div>
      </main>

      <ProductModal show={showProductModal} onClose={() => setShowProductModal(false)} onSubmit={handleProductSubmit} form={productForm} setForm={setProductForm} isEditing={isEditingProduct} categories={categories} brands={brands} providers={providers} locations={locations} formatNum={formatNum} cleanNum={cleanNum} isSubmitting={isSubmitting} />
      <ProviderModal show={showProviderModal} onClose={() => setShowProviderModal(false)} onSubmit={handleProviderSubmit} form={providerForm} setForm={setProviderForm} isEditing={isEditingProvider} />
      <CategoryModal show={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSubmit={handleCategorySubmit} form={categoryForm} setForm={setCategoryForm} isEditing={isEditingCategory} />
      <BrandModal show={showBrandModal} onClose={() => setShowBrandModal(false)} onSubmit={handleBrandSubmit} form={brandForm} setForm={setBrandForm} isEditing={isEditingBrand} categories={categories} />
      <LocationModal show={showLocationModal} onClose={() => setShowLocationModal(false)} onSubmit={handleLocationSubmit} form={locationForm} setForm={setLocationForm} isEditing={isEditingLocation} />
      <OfferModal show={showOfferModal} onClose={() => setShowOfferModal(false)} onSubmit={handleOfferSubmit} form={offerForm} setForm={setOfferForm} product={selectedOfferProduct} formatNum={formatNum} cleanNum={cleanNum} />
      
      {showPaymentModal && selectedOrder && (
        <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          order={selectedOrder}
          onAdd={handleAddPayment}
          isSubmitting={isSubmittingOrder}
          formatNum={formatNum}
        />
      )}
    </div>
  );
};

// HELPER COMPONENTS
const SidebarLink = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-black uppercase ${active ? 'bg-white text-brand-red shadow-lg' : 'hover:bg-white/5 text-white/70'}`}>
    {icon} <span>{label}</span>
  </button>
);

const MetricCard = ({ title, value, detail, icon, trend, showTrend = true, color = "bg-red-50 text-brand-red" }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 group hover:border-brand-red/20 transition-all">
    <div className={`p-2 rounded-lg ${color} shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <h4 className="text-[7.5px] font-black uppercase text-gray-300 mb-0.5 tracking-[0.15em] leading-none">{title}</h4>
      <p className="text-[13px] font-black text-gray-800 italic tracking-[-0.03em] leading-none">{value}</p>
    </div>
    {showTrend && <span className="text-brand-green bg-green-50 px-1 rounded text-[7px] font-black inline-flex items-center gap-0.5 italic">{trend}</span>}
  </div>
);

const ProductModal = ({ show, onClose, onSubmit, form, setForm, isEditing, categories, brands, providers, locations, formatNum, cleanNum, isSubmitting }) => {
  const [draggingIdx, setDraggingIdx] = React.useState(null);

  if (!show) return null;
  const margin = Number(form.price) - Number(form.purchasePrice);

  const moveImage = (idx, direction) => {
    const newImages = [...form.images];
    const newIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= newImages.length) return;
    [newImages[idx], newImages[newIdx]] = [newImages[newIdx], newImages[idx]];
    setForm({ ...form, images: newImages });
  };

  const handleDragStart = (idx) => {
    setDraggingIdx(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (idx) => {
    if (draggingIdx === null || draggingIdx === idx) return;
    const newImages = [...form.images];
    const item = newImages.splice(draggingIdx, 1)[0];
    newImages.splice(idx, 0, item);
    setForm({ ...form, images: newImages });
    setDraggingIdx(null);
  };

  const handlePriceChange = (field, e) => {
    const rawVal = cleanNum(e.target.value);
    if (!isNaN(rawVal) || rawVal === '') {
      setForm({...form, [field]: rawVal});
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 z-[300]">
      <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-4xl shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <p className="text-[7.5px] font-black uppercase text-brand-red tracking-widest mt-0.5">Gestión avanzada de inventario</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-800"><X size={20} /></button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Nombre del Producto" icon={<Package size={12}/>}>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold border-2 border-transparent focus:border-brand-red transition-all text-xs" />
              </InputGroup>
              <InputGroup label="Categoría" icon={<Tag size={12}/>}>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value, brand: ''})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold text-xs">
                  <option value="">Selecciona</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </InputGroup>
              <InputGroup label="Marca" icon={<ShieldCheck size={12}/>}>
                <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold text-xs">
                  <option value="">Sin Marca / Otra</option>
                  {brands.filter(b => b.category === form.category).map(b => (
                    <option key={b._id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </InputGroup>
            </div>
            <InputGroup label="Descripción" icon={<FileText size={12}/>}>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold min-h-[80px] text-xs" />
            </InputGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Valor de Compra" icon={<DollarSign size={12}/>}>
                <input required type="text" value={formatNum(form.purchasePrice)} onChange={e => handlePriceChange('purchasePrice', e)} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-black text-sm text-gray-800" placeholder="0" />
              </InputGroup>
              <InputGroup label="Valor de Venta" icon={<DollarSign size={12}/>}>
                <input required type="text" value={formatNum(form.price)} onChange={e => handlePriceChange('price', e)} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-black text-sm text-brand-red border-2 border-transparent focus:border-brand-red" placeholder="0" />
              </InputGroup>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center border border-blue-100 shadow-inner">
               <div>
                 <p className="text-[8px] font-black uppercase text-blue-500 mb-0.5 leading-none">Ganancia Neta</p>
                 <p className="text-xl font-black text-blue-600 leading-none">${formatNum(margin)}</p>
               </div>
               <div className="text-right">
                 <p className="text-[8px] font-black uppercase text-blue-400 mb-0.5 leading-none">Rentabilidad</p>
                 <p className="text-sm font-black text-blue-500 leading-none">{form.purchasePrice > 0 ? ((margin/form.purchasePrice)*100).toFixed(1) : 0}%</p>
               </div>
            </div>
          </div>
          <div className="space-y-4">
            <InputGroup label="Proveedor" icon={<Users size={12}/>}>
              <select required value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold text-xs">
                <option value="">Selecciona Proveedor</option>
                {providers.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
              </select>
            </InputGroup>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Stock Actual" icon={<Package size={12}/>}>
                <input type="number" required value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl font-bold text-xs" />
              </InputGroup>
              <InputGroup label="Prioridad (Ranking)" icon={<TrendingUp size={12}/>}>
                <input type="number" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full bg-brand-red/5 p-2.5 rounded-xl outline-none font-black text-brand-red border-2 border-brand-red/10 focus:border-brand-red transition-all text-xs" placeholder="0" />
              </InputGroup>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Ubicación" icon={<MapPin size={12}/>}>
                <select required value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold text-xs uppercase">
                  <option value="Bodega">📦 BODEGA</option>
                  {locations.filter(l => l.status === 'Activo').map(l => (
                    <option key={l._id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </InputGroup>
              <InputGroup label="Estado" icon={<ToggleRight size={12}/>}>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl font-bold text-xs">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </InputGroup>
            </div>
            <InputGroup label="Condición" icon={<Flame size={12}/>}>
              <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl font-bold text-brand-red text-xs">
                <option value="Nuevo">📦 Nuevo</option>
                <option value="Usado">♻️ Usado</option>
              </select>
            </InputGroup>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group overflow-hidden">
               <input type="file" multiple onChange={e => {
                  const newFiles = Array.from(e.target.files);
                  if (newFiles.length === 0) return;
                  setForm(prev => {
                     const combined = [...prev.images, ...newFiles];
                     return {...prev, images: combined};
                  });
                  setTimeout(() => {
                     if (e.target) e.target.value = null;
                  }, 0);
               }} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="" />
               <div className="flex flex-col items-center gap-1.5 text-center pointer-events-none">
                  <Plus className="text-brand-red group-hover:rotate-90 transition-transform" size={16} />
                  <p className="text-[8px] font-black uppercase text-gray-400">Clic para fotos</p>
               </div>
                  <div className="flex gap-1.5 overflow-x-auto mt-3 pb-1 relative z-30 no-scrollbar min-h-[64px]">
                     {form.images.map((img, idx) => (
                       <div 
                         key={idx} 
                         draggable="true"
                         onDragStart={() => handleDragStart(idx)}
                         onDragOver={handleDragOver}
                         onDrop={() => handleDrop(idx)}
                         onDragEnd={() => setDraggingIdx(null)}
                         className={`relative shrink-0 group/img pt-1 pr-1 transition-all duration-200 cursor-move ${draggingIdx === idx ? 'opacity-30 scale-90' : 'opacity-100'}`}
                       >
                         <div className="w-14 h-14 rounded-lg bg-white overflow-hidden border border-gray-200 shadow-sm pointer-events-none group-hover/img:border-brand-red/30 transition-colors">
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
                          className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity z-50 shadow-md hover:scale-110 pointer-events-auto"
                        >
                          <X size={8} />
                        </button>

                        {/* REORDER BUTTONS */}
                        <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 pb-1 opacity-0 group-hover/img:opacity-100 transition-opacity z-40">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveImage(idx, 'left'); }}
                            disabled={idx === 0}
                            className={`p-0.5 rounded bg-white/90 text-gray-800 shadow-sm hover:bg-brand-red hover:text-white transition-colors ${idx === 0 ? 'invisible' : ''}`}
                          >
                            <ArrowLeft size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveImage(idx, 'right'); }}
                            disabled={idx === form.images.length - 1}
                            className={`p-0.5 rounded bg-white/90 text-gray-800 shadow-sm hover:bg-brand-red hover:text-white transition-colors ${idx === form.images.length - 1 ? 'invisible' : ''}`}
                          >
                            <ArrowRight size={10} />
                          </button>
                        </div>

                        {idx === 0 && <span className="absolute -top-1 -left-1 bg-brand-green text-white text-[6px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm border border-white z-20 pointer-events-none">Main</span>}
                      </div>
                    ))}
                 </div>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`md:col-span-3 bg-brand-red text-white font-black py-3 rounded-xl uppercase tracking-tight text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all mt-2 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : (
              isEditing ? 'Guardar Cambios' : 'Lanzar Producto Nuevo'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProviderModal = ({ show, onClose, onSubmit, form, setForm, isEditing }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 z-[200]">
      <div className="bg-white rounded-2xl p-5 w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">
            {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Nombre"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl text-xs font-bold" /></InputGroup>
          <InputGroup label="Teléfono"><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl text-xs font-bold" /></InputGroup>
          <InputGroup label="Dirección"><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl text-xs font-bold" /></InputGroup>
          <InputGroup label="Sitio Web"><input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl text-xs font-bold" /></InputGroup>
          <div className="md:col-span-2"><InputGroup label="Email"><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl text-xs font-bold" /></InputGroup></div>
          <div className="md:col-span-2"><InputGroup label="Observaciones"><textarea value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl min-h-[60px] text-xs font-bold" /></InputGroup></div>
          <button type="submit" className="md:col-span-2 bg-brand-red text-white font-black py-3 rounded-xl uppercase shadow-lg text-sm">Guardar</button>
        </form>
      </div>
    </div>
  );
};

const CategoryModal = ({ show, onClose, onSubmit, form, setForm, isEditing }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 z-[200]">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <InputGroup label="Nombre"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold text-xs" /></InputGroup>
          <InputGroup label="Estado">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold text-xs">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </InputGroup>
          <InputGroup label="Icono">
            <input type="file" onChange={e => setForm({...form, image: e.target.files[0]})} className="w-full border-2 border-dashed border-gray-100 p-6 rounded-xl cursor-pointer text-xs" required={!isEditing} />
            {isEditing && <p className="text-[7.5px] text-gray-400 mt-1 italic px-2 uppercase font-black">Mantener imagen actual si está vacío</p>}
          </InputGroup>
          <button type="submit" className={`w-full text-white font-black py-3 rounded-xl uppercase shadow-lg text-sm ${isEditing ? 'bg-blue-500' : 'bg-brand-green'}`}>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 z-[200]">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">
            {isEditing ? 'Editar Marca' : 'Nueva Marca'}
          </h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <InputGroup label="Nombre de la Marca"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold text-xs" /></InputGroup>
          <InputGroup label="Categoría Asignada">
            <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold text-xs">
              <option value="">Selecciona Categoría</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Estado">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-50 p-2.5 rounded-xl outline-none font-bold text-xs">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </InputGroup>
          <button type="submit" className={`w-full text-white font-black py-3 rounded-xl uppercase shadow-lg text-sm ${isEditing ? 'bg-blue-500' : 'bg-brand-green'}`}>
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 z-[300]">
      <div className="bg-white rounded-2xl p-5 w-full max-w-xl shadow-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Flame className="text-brand-red" size={20} />
              <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">Configurar Oferta</h3>
            </div>
            <p className="text-[7.5px] font-black uppercase text-brand-red tracking-widest opacity-60">Producto: {product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* PRODUCT PREVIEW */}
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 mb-4 border border-gray-100">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shrink-0">
            {product.mainImage
              ? <img src={product.mainImage} className="w-full h-full object-cover" />
              : <Package size={20} className="m-3 text-gray-300" />}
          </div>
          <div>
            <h4 className="font-black text-gray-800 uppercase italic text-xs leading-none mb-1">{product.name}</h4>
            <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">{product.category} · {product.condition}</p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* TOGGLE OFERTA */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div>
              <p className="font-black text-gray-800 uppercase text-xs leading-none mb-1">¿Producto en Oferta?</p>
              <p className="text-[8px] text-gray-400 font-bold uppercase leading-none opacity-60">Activa para mostrar en tienda</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isOffer: !form.isOffer })}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${
                form.isOffer ? 'bg-brand-red text-white shadow-lg' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {form.isOffer ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {form.isOffer ? 'ACTIVA' : 'INACTIVA'}
            </button>
          </div>

          {form.isOffer && (
            <>
              {/* PRICES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputGroup label="Precio Antes (Normal)" icon={<DollarSign size={12}/>}>
                  <input
                    required
                    type="text"
                    value={formatNum(form.originalPrice)}
                    onChange={e => handlePriceChange('originalPrice', e)}
                    className="w-full bg-gray-50 p-3 rounded-xl outline-none font-bold text-xs line-through text-gray-400 border border-gray-100"
                    placeholder="0"
                  />
                </InputGroup>
                <InputGroup label="Precio Oferta (Nuevo)" icon={<Flame size={12}/>}>
                  <input
                    required
                    type="text"
                    value={formatNum(form.offerPrice)}
                    onChange={e => handlePriceChange('offerPrice', e)}
                    className="w-full bg-red-50 p-3 rounded-xl outline-none font-black text-sm text-brand-red border-2 border-brand-red/20 focus:border-brand-red transition-all"
                    placeholder="0"
                  />
                </InputGroup>
              </div>

              {/* DISCOUNT PREVIEW */}
              {discount > 0 && (
                <div className="bg-gradient-to-r from-red-600 to-brand-red rounded-xl p-4 text-white flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2">
                  <div>
                    <p className="text-[14px] font-black italic">-{discount}% DE DESCUENTO</p>
                    <p className="text-[9px] font-bold opacity-90 uppercase tracking-widest">Ahorro total: ${formatNum(savings)}</p>
                  </div>
                  <Percent size={28} className="opacity-20 translate-x-1" />
                </div>
              )}

              {/* DATES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputGroup label="Fecha Inicio" icon={<Calendar size={12}/>}>
                  <input
                    type="date"
                    value={form.offerStartDate}
                    onChange={e => setForm({ ...form, offerStartDate: e.target.value })}
                    className="w-full bg-gray-50 p-3 rounded-xl outline-none font-bold text-[11px] border border-gray-100"
                  />
                </InputGroup>
                <InputGroup label="Fecha Fin" icon={<Clock size={12}/>}>
                  <input
                    type="date"
                    value={form.offerEndDate}
                    onChange={e => setForm({ ...form, offerEndDate: e.target.value })}
                    className="w-full bg-gray-50 p-3 rounded-xl outline-none font-bold text-[11px] border border-gray-100"
                  />
                </InputGroup>
              </div>
            </>
          )}

          <button
            type="submit"
            className={`w-full font-black py-3 rounded-xl uppercase tracking-tight text-sm shadow-xl transition-all ${
              form.isOffer
                ? 'bg-brand-red text-white'
                : 'bg-gray-400 text-white'
            }`}
          >
            {form.isOffer ? '🔥 Activar Oferta' : 'Guardar (sin oferta)'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- CARTERA COMPONENTS ---

const CarteraView = ({ data, formatNum, onPayment }) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <MetricCard title="Total Cartera" value={`$${formatNum(data.summary?.totalAccountReceivable || 0)}`} detail={`${data.summary?.totalClientsDebting || 0} Deudores`} icon={<CreditCard size={18} />} color="bg-red-50 text-brand-red" trend="Actualizado" />
      <MetricCard title="Cobro Próximo" value={`$${formatNum(data.summary?.dueSoonAmount || 0)}`} detail="Próximos 7 días" icon={<Clock size={18} />} color="bg-orange-50 text-orange-500" trend="Pendiente" />
      <MetricCard title="Gestión" value={data.summary?.totalClientsDebting || 0} detail="Acciones pendientes" icon={<Users size={18} />} color="bg-blue-50 text-blue-500" trend="Activo" />
    </div>

    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
        <Building className="text-brand-red opacity-80" size={16} />
        <div>
          <h3 className="text-[11px] font-black text-gray-800 uppercase italic leading-none">Cuentas por Cobrar</h3>
          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">Seguimiento de saldos pendientes</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 italic">
              <th className="px-4 py-3">Cliente / Última Venta</th>
              <th className="py-3 text-right">Monto Total</th>
              <th className="py-3 text-right">Pagado</th>
              <th className="py-3 text-right">Saldo Deudor</th>
              <th className="px-4 py-3 text-center">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.orders?.length === 0 ? (
              <tr><td colSpan="5" className="py-20 text-center text-gray-200 font-black uppercase italic text-xs opacity-20">Sin deudas</td></tr>
            ) : data.orders?.map((order, idx) => (
              <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-4 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-800 italic uppercase leading-none mb-1">{order.customerName}</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider leading-none">Venta: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '--'}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right text-[10px] font-bold text-gray-500 italic">${formatNum(order.totalRevenue || 0)}</td>
                <td className="py-2.5 text-right font-bold text-brand-green text-[10px]">${formatNum(order.totalPaid || 0)}</td>
                <td className="py-2.5 text-right">
                  <span className="inline-block px-2 py-1 bg-red-50 text-brand-red rounded-lg font-black italic text-[11px] border border-brand-red/10 shadow-sm">
                    ${formatNum(order.balance || 0)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button 
                    onClick={() => onPayment(order)}
                    className="p-1 px-3 bg-brand-green text-white rounded-lg text-[9px] font-black uppercase hover:brightness-110 active:scale-95 transition-all shadow-md italic tracking-tight"
                  >
                    Abonar Pago
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const PaymentModal = ({ isOpen, onClose, order, onAdd, isSubmitting, formatNum }) => {
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState('Efectivo');
  const [note, setNote] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    onAdd(order._id, { amount: Number(amount), method, note });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[400] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">Registrar Abono</h3>
            <p className="text-[8px] font-black uppercase text-brand-green tracking-widest mt-1 opacity-60">Gestionar Saldo Pendiente</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500">
             <X size={20} />
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3 border border-gray-100">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente</span>
            <span className="text-[10px] font-black text-gray-800 italic uppercase">{order.customerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Venta</span>
            <span className="text-[10px] font-black text-gray-800 italic">${formatNum(order.totalRevenue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saldo Actual</span>
            <span className="text-[12px] font-black text-brand-red italic">${formatNum(order.balance)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase px-2 italic tracking-widest">Monto del Abono</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green" size={18} />
              <input 
                type="number" 
                autoFocus
                placeholder="0.00"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 pl-10 pr-4 text-lg font-black italic text-gray-800 focus:border-brand-green focus:bg-white transition-all outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                max={order.balance}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase px-2 italic tracking-widest">Medio de Pago</label>
            <select 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-4 text-xs font-black italic text-gray-800 outline-none focus:border-brand-green transition-all appearance-none"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="Efectivo">💵 Efectivo</option>
              <option value="Transf. Neque">📱 Neque</option>
              <option value="Transf. Bancaria">🏦 Transferencia</option>
              <option value="Tarjeta">💳 Tarjeta</option>
            </select>
          </div>

          <div className="space-y-1.5">
             <label className="text-[9px] font-black text-gray-400 uppercase px-2 italic tracking-widest">Nota / Observación</label>
             <textarea 
               className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-4 text-xs font-bold text-gray-800 outline-none focus:border-brand-green transition-all"
               rows="2"
               placeholder="Eje: Abono por transferencia bancaria..."
               value={note}
               onChange={(e) => setNote(e.target.value)}
             />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !amount}
            className="w-full bg-brand-green text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm shadow-xl shadow-green-100 hover:brightness-110 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Wallet size={18} /> CONFIRMAR ABONO
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const LocationModal = ({ show, onClose, onSubmit, form, setForm, isEditing }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[400] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">{isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'}</h3>
            <p className="text-[9px] font-black uppercase text-brand-red tracking-widest mt-2 opacity-60">Organización Física de Inventario</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-red-50 rounded-full transition-all text-gray-400 hover:text-brand-red">
             <X size={24} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase px-2 italic tracking-widest text-brand-red">Nombre de la Ubicación</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" size={20} />
              <input 
                type="text" 
                placeholder="EJ: ESTANTE A, BODEGA 2..."
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-black italic text-gray-800 focus:border-brand-red focus:bg-white transition-all outline-none uppercase"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase px-2 italic tracking-widest">Estado Operativo</label>
            <select 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-4 text-xs font-black italic text-gray-800 outline-none focus:border-brand-red transition-all appearance-none"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Activo">🟢 ACTIVO</option>
              <option value="Inactivo">🔴 INACTIVO</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-brand-red text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm shadow-xl shadow-red-100 hover:brightness-110 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2">
            <Plus size={20} /> {isEditing ? 'ACTUALIZAR UBICACIÓN' : 'CREAR UBICACIÓN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
