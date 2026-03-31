import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  ArrowUpRight, 
  Calendar, 
  PieChart as PieChartIcon, 
  Target, 
  AlertCircle, 
  Download, 
  ChevronRight, 
  Layers,
  Filter,
  FileText,
  Clock,
  Briefcase,
  MessageCircle,
  Plus,
  CreditCard,
  User,
  Users,
  Search,
  Trash2,
  CheckCircle,
  Eye,
  Check,
  X,
  Smartphone,
  Wallet,
  Building
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
  Legend,
  Tooltip as ChartTooltip
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

const ReportesPage = () => {
  const [activeSubTab, setActiveSubTab] = useState('ventas'); // 'ventas', 'inventario', 'rentabilidad', 'exportar'
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Default to 30 days
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  
  // New: Customer Search State
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  
  // Data States
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [profitability, setProfitability] = useState(null);
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartera, setCartera] = useState({ orders: [], totalReceivable: 0 });
  
  // UI States
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Order Form State
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    items: [],
    initialPayment: 0,
    isPlanSepare: false,
    note: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchInventory(),
        fetchProfitability(),
        fetchLeads(),
        fetchOrders(),
        fetchCartera()
      ]);
    } catch (err) {
      console.error("Error fetching report data", err);
      Swal.fire('Error', 'No se pudieron cargar los reportes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    let url = `${API_URL}/api/admin/stats?range=${dateRange}`;
    if (dateRange === 'custom' && customDates.start && customDates.end) {
      url = `${API_URL}/api/admin/stats?start=${customDates.start}&end=${customDates.end}`;
    }
    const res = await axios.get(url, { headers });
    setStats(res.data);
  };

  const fetchInventory = async () => {
    const res = await axios.get(`${API_URL}/api/admin/reports/inventory`, { headers });
    setInventory(res.data);
  };

  const fetchProfitability = async () => {
    const res = await axios.get(`${API_URL}/api/admin/reports/profitability`, { headers });
    setProfitability(res.data);
  };

  const fetchLeads = async () => {
    const res = await axios.get(`${API_URL}/api/admin/reports/leads`, { headers });
    setLeads(res.data);
  };

  const fetchOrders = async () => {
    let url = `${API_URL}/api/admin/orders?q=${searchTerm}`;
    const res = await axios.get(url, { headers });
    setOrders(res.data);
  };

  const fetchCartera = async () => {
    const res = await axios.get(`${API_URL}/api/admin/reports/cartera`, { headers });
    setCartera(res.data);
  };

  const searchProducts = async (q) => {
    if (!q) return setSearchResults([]);
    const res = await axios.get(`${API_URL}/api/admin/products/search?q=${q}`, { headers });
    setSearchResults(res.data);
  };

  const handleCreateOrder = async () => {
    if (newOrder.items.length === 0) return Swal.fire('Error', 'Añade al menos un producto', 'error');
    setIsSubmitting(true);
    Swal.fire({
      title: 'Procesando...',
      text: 'Por favor espere un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await axios.post(`${API_URL}/api/admin/orders`, newOrder, { headers });
      Swal.fire('Éxito', 'Venta registrada correctamente', 'success');
      setShowOrderModal(false);
      setNewOrder({ customerName: '', customerPhone: '', items: [], initialPayment: 0, isPlanSepare: false, note: '' });
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', 'No se pudo registrar la venta', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async (orderId, paymentData) => {
    setIsSubmitting(true);
    Swal.fire({
      title: 'Procesando...',
      text: 'Por favor espere un momento',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      const res = await axios.post(`${API_URL}/api/admin/orders/${orderId}/payments`, paymentData, { headers });
      const updatedOrder = res.data;
      
      const balance = updatedOrder.totalRevenue - updatedOrder.payments.reduce((acc, p) => acc + p.amount, 0);
      
      Swal.fire({
        title: '¡Abono Registrado!',
        text: '¿Deseas enviar el comprobante por WhatsApp?',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: '📱 Enviar WhatsApp',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#25D366'
      }).then((result) => {
        if (result.isConfirmed) {
          const message = `Hola *${updatedOrder.customerName}*, se ha registrado un abono de *$${formatNum(paymentData.amount)}* en El Rebajón. Tu saldo pendiente es *$${formatNum(balance)}*. ¡Gracias por tu compra! 🛍️`;
          const whatsappUrl = `https://wa.me/${updatedOrder.customerPhone}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }
      });

      setShowPaymentModal(false);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', 'No se pudo registrar el pago', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar venta?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff2d2d',
      confirmButtonText: 'Sí, eliminar'
    });
    if (result.isConfirmed) {
      await axios.delete(`${API_URL}/api/admin/orders/${id}`, { headers });
      fetchAllData();
    }
  };

  const searchCustomers = async (query) => {
    if (!query || query.length < 3) {
      setCustomerSuggestions([]);
      return;
    }
    try {
      setIsSearchingCustomer(true);
      const res = await axios.get(`${API_URL}/api/admin/customers/search?q=${query}`, { headers });
      setCustomerSuggestions(res.data);
    } catch (err) {
      console.error("CUSTOMER SEARCH ERROR:", err);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleExportExcel = () => {
    if (!stats || !inventory || !profitability) return;

    try {
      const wb = XLSX.utils.book_new();

      // 1. Resumen Global
      const resumenData = [
        ["REPORTE EJECUTIVO DE INTELIGENCIA DE NEGOCIO - EL REBAJÓN"],
        ["Fecha de Generación", format(new Date(), 'dd/MM/yyyy HH:mm')],
        [],
        ["INDICADORES DE PRODUCTIVIDAD", "VALOR"],
        ["Ingresos Totales (Venta)", stats.metrics.totalRevenue],
        ["Ganancia Neta (Venta)", stats.metrics.totalProfit],
        ["Inversión (Costo de Venta)", stats.metrics.totalCost],
        ["Total Transacciones", stats.metrics.count],
        ["Ticket Promedio", Math.round(stats.metrics.totalRevenue / stats.metrics.count || 0)],
        ["Margen Operativo Promedio", stats.metrics.totalRevenue > 0 ? ((stats.metrics.totalProfit / stats.metrics.totalRevenue) * 100).toFixed(2) + "%" : "0%"],
        [],
        ["INDICADORES DE ACTIVO (INVENTARIO)", "VALOR"],
        ["Capital Inmovilizado (Costo)", inventory.summary.capitalInvertido],
        ["Valor Potencial (Venta)", inventory.summary.valorPotencial],
        ["Ganancia Proyectada", inventory.summary.gananciaPotencial],
        ["Productos en Stock", inventory.summary.totalProducts],
        ["Productos Bajo Stock Mínimo", inventory.summary.lowStockCount],
        ["Productos Sin Existencias", inventory.summary.outOfStockCount]
      ];
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Global");

      // 2. Histórico Diario
      const trendData = stats.dailyTrend.map(day => ({
        "Fecha": day._id,
        "Ingresos": day.revenue,
        "Ganancia": day.profit,
        "Pedidos": day.orders
      }));
      const wsTrend = XLSX.utils.json_to_sheet(trendData);
      XLSX.utils.book_append_sheet(wb, wsTrend, "Histórico Ventas");

      // 3. Distribución Categorías
      const catData = stats.categoryStats.map(cat => ({
        "Categoría": cat._id,
        "Ingresos": cat.value,
        "Unidades Vendidas": cat.units
      }));
      const wsCat = XLSX.utils.json_to_sheet(catData);
      XLSX.utils.book_append_sheet(wb, wsCat, "Ventas por Categoría");

      // 4. Detalle de Rentabilidad
      const rentData = profitability.profitability.map(p => ({
        "Producto": p.name,
        "Categoría": p.category,
        "Proveedor": p.provider,
        "Costo": p.purchasePrice,
        "Venta": p.price,
        "Margen $": p.margin,
        "Margen %": p.marginPct.toFixed(2) + "%",
        "Stock": p.stock,
        "Capital Actual": p.capitalItem,
        "Ganancia Potencial": p.potentialProfit
      }));
      const wsRent = XLSX.utils.json_to_sheet(rentData);
      XLSX.utils.book_append_sheet(wb, wsRent, "Rentabilidad & Productos");

      // 5. Inventario Crítico
      const wsInv = XLSX.utils.json_to_sheet(inventory.products);
      XLSX.utils.book_append_sheet(wb, wsInv, "Master Inventario");

      // 6. Historial de Leads
      const leadsData = leads.map(l => ({
        "Fecha": format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm'),
        "Producto": l.productName,
        "Categoría": l.category || 'General',
        "Precio Ref": l.price,
        "Origen": l.referrer
      }));
      const wsLeads = XLSX.utils.json_to_sheet(leadsData);
      XLSX.utils.book_append_sheet(wb, wsLeads, "Contactos WhatsApp");

      XLSX.writeFile(wb, `Reporte_Avanzado_ElRebajon_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      Swal.fire('¡Éxito!', 'Reporte exportado correctamente', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo generar el archivo Excel', 'error');
    }
  };

  const formatNum = (num) => {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="text-brand-red animate-pulse" size={24} />
            </div>
        </div>
        <p className="text-gray-400 font-black uppercase italic tracking-widest animate-pulse">Procesando Métricas Avanzadas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER MÓDULO */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand-red/10 text-brand-red px-3 py-1 rounded-full text-[10px] font-black uppercase italic tracking-wider">Business Intelligence</span>
            <span className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-[10px] font-black uppercase italic tracking-wider">v2.0</span>
          </div>
          <h2 className="text-5xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">Reportes & BI</h2>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-2">Visión 360° de tu negocio en tiempo real</p>
        </div>

        {/* TABS NAVEGACIÓN INTERNA */}
        <div className="flex p-1.5 bg-gray-100 rounded-2xl sm:rounded-[2rem] gap-1 overflow-x-auto no-scrollbar">
          <SubTab active={activeSubTab === 'ventas'} icon={<TrendingUp size={18} />} label="Ventas" onClick={() => setActiveSubTab('ventas')} />
          <SubTab active={activeSubTab === 'gestion-ventas'} icon={<ShoppingBag size={18} />} label="Gestión" onClick={() => setActiveSubTab('gestion-ventas')} />
          <SubTab active={activeSubTab === 'cartera'} icon={<CreditCard size={18} />} label="Cartera" onClick={() => setActiveSubTab('cartera')} />
          <SubTab active={activeSubTab === 'inventario'} icon={<Layers size={18} />} label="Inventario" onClick={() => setActiveSubTab('inventario')} />
          <SubTab active={activeSubTab === 'rentabilidad'} icon={<Target size={18} />} label="Márgenes" onClick={() => setActiveSubTab('rentabilidad')} />
          <SubTab active={activeSubTab === 'leads'} icon={<MessageCircle size={18} />} label="Mensajes" onClick={() => setActiveSubTab('leads')} />
          <SubTab active={activeSubTab === 'exportar'} icon={<Download size={18} />} label="Exportar" onClick={() => setActiveSubTab('exportar')} />
        </div>
      </div>

      {/* CONTENIDO SEGÚN TAB */}
      <div className="min-h-[600px]">
        {activeSubTab === 'ventas' && (stats ? <StatsView stats={stats} currentRange={dateRange} setCurrentRange={setDateRange} formatNum={formatNum} COLORS={COLORS} fetchAllData={fetchAllData} /> : <NoDataPlaceholder message="No se pudieron cargar las estadísticas de ventas" />)}
        {activeSubTab === 'gestion-ventas' && (
          <GestionVentasView 
            orders={orders} 
            formatNum={formatNum} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            fetchOrders={fetchOrders}
            onNew={() => setShowOrderModal(true)}
            onPayment={(order) => { setSelectedOrder(order); setShowPaymentModal(true); }}
            onDelete={handleDeleteOrder}
          />
        )}
        {activeSubTab === 'cartera' && <CarteraView data={cartera} formatNum={formatNum} />}
        {activeSubTab === 'inventario' && (inventory ? <InventoryView inventory={inventory} formatNum={formatNum} COLORS={COLORS} /> : <NoDataPlaceholder message="No hay datos de inventario disponibles" />)}
        {activeSubTab === 'rentabilidad' && (profitability ? <ProfitabilityView profitability={profitability} formatNum={formatNum} /> : <NoDataPlaceholder message="No hay datos de rentabilidad disponibles" />)}
        {activeSubTab === 'leads' && (
          <LeadsView 
            leads={leads} 
            formatNum={formatNum} 
            onConvert={(lead) => {
              setNewOrder({
                customerName: 'Cliente WhatsApp',
                customerPhone: '',
                items: [{
                  productId: lead.productId,
                  name: lead.productName,
                  quantity: 1,
                  price: lead.price,
                  purchasePrice: 0,
                  category: lead.category
                }],
                initialPayment: 0,
                isPlanSepare: true,
                note: `Venta desde mensaje: ${lead.productName}`
              });
              setShowOrderModal(true);
            }}
          />
        )}
        {activeSubTab === 'exportar' && <ExportView handleExportExcel={handleExportExcel} stats={stats} inventory={inventory} />}
      </div>

      {/* MODALS */}
      {showOrderModal && (
        <NewOrderModal 
          isOpen={showOrderModal} 
          onClose={() => setShowOrderModal(false)}
          formData={newOrder}
          setFormData={setNewOrder}
          onSearch={searchProducts}
          searchResults={searchResults}
          onSearchCustomer={searchCustomers}
          customerSuggestions={customerSuggestions}
          onSave={handleCreateOrder}
          isSubmitting={isSubmitting}
        />
      )}

      {showPaymentModal && selectedOrder && (
        <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          order={selectedOrder}
          onAdd={handleAddPayment}
          isSubmitting={isSubmitting}
          formatNum={formatNum}
        />
      )}
    </div>
  );
};

// --- SUBVIEWS ---

const StatsView = ({ stats, currentRange, setCurrentRange, formatNum, COLORS, fetchAllData }) => (
  <div className="space-y-10 animate-in fade-in duration-500">
    {/* FILTRO PERIODOS */}
    <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
      <div className="p-2 bg-gray-50 rounded-xl text-gray-400"><Calendar size={20}/></div>
      <span className="text-xs font-black uppercase text-gray-500 mr-2">Periodo:</span>
      {['7', '30', '90'].map(r => (
        <button 
          key={r} 
          onClick={() => setCurrentRange(r)}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${currentRange === r ? 'bg-brand-red text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
        >
          Últimos {r} días
        </button>
      ))}
    </div>

    {/* METRICS GRID */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <KPIBox title="Ventas Totales" value={`$${formatNum(stats?.metrics?.totalRevenue)}`} icon={<ShoppingBag className="text-brand-red"/>} color="bg-red-50" />
      <KPIBox title="Ganancia Neta" value={`$${formatNum(stats?.metrics?.totalProfit)}`} icon={<DollarSign className="text-brand-green"/>} color="bg-green-50" />
      <KPIBox title="Ticket Promedio" value={`$${formatNum(Math.round(stats?.metrics?.totalRevenue / stats?.metrics?.count || 0))}`} icon={<TrendingUp className="text-blue-500"/>} color="bg-blue-50" />
      <KPIBox title="Interés WhatsApp" value={stats?.metrics?.totalLeads || 0} icon={<MessageCircle className="text-purple-500"/>} color="bg-purple-50" />
      <KPIBox title="Margen Bruto" value={`${stats?.metrics?.totalRevenue > 0 ? ((stats?.metrics?.totalProfit / stats?.metrics?.totalRevenue) * 100).toFixed(1) : 0}%`} icon={<Target className="text-orange-500"/>} color="bg-orange-50" />
      <KPIBox title="Costo Operativo" value={`$${formatNum(stats?.metrics?.totalCost)}`} icon={<Briefcase className="text-gray-500"/>} color="bg-gray-100" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* TENDENCIA */}
      <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-8 flex items-center gap-2">
            <TrendingUp size={24} className="text-brand-red" /> Rendimiento de Ventas
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyTrend}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <ChartTooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
              <Area name="Ingresos" type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={4} fill="url(#gradRevenue)" />
              <Area name="Ganancia" type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={4} fill="url(#gradProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CATEGORÍAS */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-8 flex items-center gap-2">
            <PieChartIcon size={24} className="text-brand-red" /> Mix de Categorías
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.categoryStats} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" nameKey="_id">
                {stats.categoryStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* TOP PRODUCTS & PROVIDERS */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-8">Productos Estrella</h3>
        <div className="space-y-4">
          {stats.topProducts.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-brand-red hover:text-white transition-all">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-xs text-brand-red group-hover:scale-110 transition-transform">{i+1}</div>
                <div>
                  <p className="font-black uppercase italic text-sm leading-tight">{p._id}</p>
                  <p className="text-[10px] font-bold opacity-60 uppercase">{p.sales} unidades vendidas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black italic">${formatNum(p.revenue)}</p>
                <div className="flex items-center justify-end gap-1 text-[8px] font-black uppercase text-brand-green bg-green-50 px-2 py-0.5 rounded-full group-hover:bg-white/20 group-hover:text-white">
                    <ArrowUpRight size={10}/> Rentable
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-8">Desempeño de Proveedores</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.providerStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'black'}} width={120} />
              <ChartTooltip />
              <Bar dataKey="revenue" radius={[0, 10, 10, 0]} fill="#ef4444">
                {stats.providerStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

const LeadsView = ({ leads, formatNum }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Historial de Interés (Leads)</h3>
        <span className="bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-xs font-black uppercase italic">Total: {leads.length} Contactos</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-50">
              <th className="pb-4">Fecha / Hora</th>
              <th className="pb-4">Producto Interesado</th>
              <th className="pb-4 text-center">Referidor</th>
              <th className="pb-4 text-right">Precio Ref.</th>
              <th className="pb-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-20 text-center text-gray-300 font-black uppercase italic">No hay registros de contacto aún</td>
              </tr>
            ) : leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-gray-300" />
                    <span className="text-xs font-bold text-gray-600">{format(new Date(lead.createdAt), 'dd/MM/yy HH:mm')}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                      <img src={lead.mainImage || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-black uppercase italic text-xs leading-none mb-1">{lead.productName}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{lead.category}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-gray-100 text-gray-500">
                    {lead.referrer}
                  </span>
                </td>
                <td className="py-4 text-right font-black italic text-gray-800">
                  ${formatNum(lead.price)}
                </td>
                <td className="py-4 text-center">
                  <span className="flex items-center justify-center gap-1 text-[10px] font-black text-brand-green uppercase">
                    <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div> Interesado
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const InventoryView = ({ inventory, formatNum, COLORS }) => (
  <div className="space-y-10 animate-in fade-in duration-500">
    {/* INVENTORY KPIS */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPIBox title="Capital Invertido" value={`$${formatNum(inventory.summary.capitalInvertido)}`} detail="Costo de adquisición" icon={<DollarSign className="text-brand-red"/>} color="bg-red-50" />
      <KPIBox title="Valor Inventario" value={`$${formatNum(inventory.summary.valorPotencial)}`} detail="Precio de venta total" icon={<ShoppingBag className="text-brand-green"/>} color="bg-green-50" />
      <KPIBox title="Ganancia Proyectada" value={`$${formatNum(inventory.summary.gananciaPotencial)}`} detail="Margen si vendes todo" icon={<ArrowUpRight className="text-blue-500"/>} color="bg-blue-50" />
      <KPIBox title="Alertas de Stock" value={inventory.summary.lowStockCount || 0} detail="Reponer pronto" icon={<AlertCircle className="text-orange-500"/>} color="bg-orange-50" className={inventory.summary.lowStockCount > 0 ? 'ring-4 ring-orange-100 shadow-xl border-orange-200' : ''} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* DISTRIBUCIÓN VALOR CATEGORÍA */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-8">Capital por Categoría</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventory.categoryDistribution} margin={{left: 20}}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
              <ChartTooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#ef4444">
                {inventory.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP MARGENES % */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">Top Margen Beneficio %</h3>
            <span className="text-[10px] font-black uppercase text-brand-green bg-green-50 px-2 py-1 rounded-lg">Métricas ROI</span>
        </div>
        <div className="space-y-3">
          {inventory.topMargin.map((p, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-brand-green/20 hover:bg-green-50/30 transition-all">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-brand-green shadow-sm overflow-hidden text-xs">
                    {p.marginPct}%
                </div>
                <div className="flex-1">
                    <p className="font-black uppercase italic text-xs truncate max-w-[150px]">{p.name}</p>
                    <p className="text-[9px] font-bold text-gray-400">{p.category}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-brand-red uppercase line-through opacity-40">${formatNum(p.purchasePrice)}</p>
                    <p className="font-black italic text-brand-green text-sm">${formatNum(p.price)}</p>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* TABLA MASTER INVENTARIO */}
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-8">Auditoría General de Stock</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-50">
                        <th className="pb-4">Producto</th>
                        <th className="pb-4 text-center">Existencias</th>
                        <th className="pb-4 text-center">Estado Stock</th>
                        <th className="pb-4 text-right">Inversión Actual</th>
                        <th className="pb-4 text-right">Rentabilidad</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {inventory.products.map((p) => (
                        <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                        <img src={p.mainImage || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-black uppercase italic text-xs leading-none mb-1">{p.name}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{p.provider}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 text-center font-bold text-sm">{p.stock}</td>
                            <td className="py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                    p.stock <= 0 ? 'bg-red-500 text-white shadow-lg shadow-red-100' :
                                    p.stock <= p.stockMin ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' :
                                    'bg-brand-green text-white shadow-lg shadow-green-100'
                                }`}>
                                    {p.stock <= 0 ? 'Sin Stock' : p.stock <= p.stockMin ? 'Bajo' : 'Optimo'}
                                </span>
                            </td>
                            <td className="py-4 text-right font-black italic text-gray-800">${formatNum(p.capitalItem)}</td>
                            <td className="py-4 text-right">
                                <span className="text-[10px] font-black text-brand-green bg-green-50 px-2 py-1 rounded-lg">+{p.marginPct}%</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  </div>
);

const ProfitabilityView = ({ profitability, formatNum }) => (
  <div className="space-y-10 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RESUMEN RENTABILIDAD */}
        <div className="bg-gradient-to-br from-brand-red to-red-700 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <DollarSign className="absolute -right-10 -top-10 opacity-10 w-64 h-64 rotate-12" />
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Margen Promedio</p>
                <p className="text-7xl font-black italic tracking-tighter leading-none mb-2">{profitability.avgMarginPct}%</p>
                <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                    <TrendingUp size={14}/> +0.5% vs mes anterior
                </div>
            </div>
            
            <div className="mt-12 grid grid-cols-3 gap-2 relative z-10">
                <div className="text-center bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                    <p className="text-2xl font-black text-brand-green italic">{profitability.tierCounts.high}</p>
                    <p className="text-[8px] font-black uppercase opacity-60">High ROI</p>
                </div>
                <div className="text-center bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                    <p className="text-2xl font-black text-brand-yellow italic">{profitability.tierCounts.mid}</p>
                    <p className="text-[8px] font-black uppercase opacity-60">Medium</p>
                </div>
                <div className="text-center bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                    <p className="text-2xl font-black text-white/50 italic">{profitability.tierCounts.low}</p>
                    <p className="text-[8px] font-black uppercase opacity-60">Low ROI</p>
                </div>
            </div>
        </div>

        {/* RANKING PROFITABILITY */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-8">Análisis de Retorno de Inversión (ROI)</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black uppercase text-gray-400 border-b border-gray-50 pb-4">
                            <th className="pb-4">Producto</th>
                            <th className="pb-4 text-center">Margen %</th>
                            <th className="pb-4 text-right">Utilidad x Unidad</th>
                            <th className="pb-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {profitability.profitability.slice(0, 10).map((p, i) => (
                            <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">{i+1}</div>
                                        <p className="font-black uppercase italic text-xs truncate max-w-[200px]">{p.name}</p>
                                    </div>
                                </td>
                                <td className="py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-green" style={{width: `${Math.min(p.marginPct, 100)}%`}}></div>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-800">{p.marginPct}%</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right">
                                    <p className="font-black text-sm italic text-gray-800">${formatNum(p.margin)}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">ROI Directo</p>
                                </td>
                                <td className="py-4 text-center">
                                    <span className={`w-3 h-3 rounded-full inline-block ${p.tier === 'high' ? 'bg-brand-green ring-4 ring-green-100' : p.tier === 'mid' ? 'bg-yellow-400 ring-4 ring-yellow-50' : 'bg-gray-300'}`}></span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  </div>
);

const ExportView = ({ handleExportExcel, stats, inventory }) => (
  <div className="animate-in fade-in zoom-in duration-500">
    <div className="max-w-3xl mx-auto bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100 text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-red via-brand-yellow to-brand-green"></div>
        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <FileText size={48} className="text-brand-red" />
        </div>
        <div>
            <h3 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter leading-none mb-4">Exportar Inteligencia</h3>
            <p className="text-gray-400 font-bold uppercase text-sm tracking-widest max-w-[400px] mx-auto">
                Descarga un reporte detallado en formato Excel con todas las métricas de ventas, inventario y rentabilidad filtradas para el periodo seleccionado.
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-8">
            <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Hojas Incluidas</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {['Resumen', 'Ventas', 'Mix Cat', 'Rentabilidad', 'Inventario'].map(h => (
                        <span key={h} className="bg-white px-3 py-1 rounded-full text-[9px] font-black uppercase border border-gray-100 shadow-sm">{h}</span>
                    ))}
                </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Datos Procesados</p>
                <p className="text-2xl font-black italic text-gray-800">{inventory?.summary?.totalProducts + stats?.metrics?.count || 0}</p>
                <p className="text-[8px] font-black uppercase opacity-60">Registros Analizados</p>
            </div>
        </div>

        <button 
            onClick={handleExportExcel}
            className="w-full bg-brand-red text-white py-6 rounded-[2rem] font-black uppercase italic tracking-tighter text-xl shadow-xl hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
        >
            <Download size={28} /> Generar Reporte Maestro (.XLSX)
        </button>
        
        <p className="text-[10px] font-black uppercase text-gray-300 italic tracking-[0.3em]">Confidencial • Uso Administrativo Exclusivo</p>
    </div>
  </div>
);

// --- COMPONENTES AUXILIARES ---

const SubTab = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl sm:rounded-[1.5rem] transition-all whitespace-nowrap ${
      active 
        ? 'bg-white text-brand-red shadow-lg shadow-gray-200/50 scale-105' 
        : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
    }`}
  >
    {icon}
    <span className="text-sm font-black uppercase italic tracking-tight">{label}</span>
  </button>
);

const KPIBox = ({ title, value, detail, icon, color, className = "" }) => (
  <div className={`p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col justify-between group transition-all hover:shadow-xl hover:-translate-y-1 bg-white ${className}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
      <ChevronRight size={16} className="text-gray-200 group-hover:text-brand-red transition-colors" />
    </div>
    <div>
      <h4 className="text-[9px] font-black uppercase text-gray-400 mb-1 tracking-widest">{title}</h4>
      <p className="text-2xl font-black text-gray-800 italic tracking-tighter leading-none">{value}</p>
      {detail && <p className="text-[8px] font-bold text-gray-400 mt-2 uppercase">{detail}</p>}
    </div>
  </div>
);

const NoDataPlaceholder = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 gap-4">
    <AlertCircle className="text-gray-200" size={64} />
    <p className="text-gray-400 font-black uppercase italic tracking-widest text-center px-8">{message || "No hay datos disponibles para mostrar"}</p>
  </div>
);

// --- NEW SALES MANAGEMENT VIEWS ---

const GestionVentasView = ({ orders, formatNum, searchTerm, setSearchTerm, fetchOrders, onNew, onPayment, onDelete }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
      <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors" size={18} />
          <input 
              type="text" 
              placeholder="Buscar por cliente o producto..."
              className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand-red/20 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && fetchOrders()}
          />
      </div>
      <button 
        onClick={onNew}
        className="w-full md:w-auto bg-brand-red text-white px-8 py-3.5 rounded-2xl font-black uppercase italic tracking-tighter shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Nueva Venta Directa
      </button>
    </div>

    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <th className="px-8 py-6">Fecha / Cliente</th>
              <th>Productos</th>
              <th className="text-right">Total</th>
              <th className="text-right">Saldo</th>
              <th className="px-8 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-32 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <ShoppingBag size={48} />
                    <p className="font-black uppercase italic">Sin ventas registradas</p>
                  </div>
                </td>
              </tr>
            ) : orders.map(order => (
              <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-800 italic">{format(new Date(order.createdAt), 'dd MMMM, yyyy')}</span>
                    <span className="text-sm font-bold text-gray-500 uppercase flex items-center gap-1">
                      <User size={12} /> {order.customerName}
                    </span>
                    {order.customerPhone && <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1"><Smartphone size={10} /> {order.customerPhone}</span>}
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-1 py-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-gray-100 rounded-md flex items-center justify-center text-[10px] font-bold text-gray-500">{item.quantity}</span>
                        <span className="text-[11px] font-bold text-gray-700 truncate max-w-[200px]">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="text-right font-black italic text-gray-800">
                  <div className="flex flex-col">
                    <span>${formatNum(order.totalAmount)}</span>
                    {order.isPlanSepare && <span className="text-[9px] bg-brand-yellow/20 text-brand-red px-2 py-0.5 rounded-full inline-block w-fit ml-auto">Plan Separe</span>}
                  </div>
                </td>
                <td className="text-right font-black italic">
                   <div className="flex flex-col">
                    <span className={order.balance > 0 ? "text-brand-red" : "text-brand-green"}>
                      ${formatNum(order.balance)}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{order.paymentStatus === 'PAID' ? 'Saldado' : 'Pendiente'}</span>
                  </div>
                </td>
                <td className="px-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {order.balance > 0 && (
                      <button 
                        onClick={() => onPayment(order)}
                        className="p-2.5 bg-brand-green/10 text-brand-green rounded-xl hover:bg-brand-green hover:text-white transition-all shadow-sm"
                        title="Registrar Abono"
                      >
                        <Wallet size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(order._id)}
                      className="p-2.5 bg-brand-red/10 text-brand-red rounded-xl hover:bg-brand-red hover:text-white transition-all shadow-sm"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const CarteraView = ({ data, formatNum }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KPIBox 
        title="Total Cartera" 
        value={`$${formatNum(data.summary?.totalAccountReceivable || 0)}`} 
        detail={`${data.summary?.totalClientsDebting || 0} Clientes con Deuda`}
        icon={<CreditCard className="text-brand-red" />}
        color="bg-red-50"
      />
      <KPIBox 
        title="Cobro Pendiente Hoy" 
        value={`$${formatNum(data.summary?.dueSoonAmount || 0)}`} 
        detail="Próximos 7 días"
        icon={<Clock className="text-orange-500" />}
        color="bg-orange-50"
      />
      <KPIBox 
        title="Clientes Activos" 
        value={data.summary?.totalClientsDebting || 0} 
        detail="Con saldos pendientes"
        icon={<Users className="text-blue-500" />}
        color="bg-blue-50"
      />
    </div>

    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-800 flex items-center gap-3">
          <Building className="text-brand-red" size={24} /> Desglose de Cuentas por Cobrar
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <th className="px-8 py-6">Cliente</th>
              <th className="text-right">Última Venta</th>
              <th className="text-center">Total Compras</th>
              <th className="text-right">Total Pagado</th>
              <th className="px-8 text-right">Saldo Deudor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.orders?.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-32 text-center text-gray-300 font-black uppercase italic">No hay cuentas pendientes</td>
              </tr>
            ) : data.orders?.map((order, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-800 italic">{order.customerName}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cliente de Cartera</span>
                  </div>
                </td>
                <td className="text-right text-xs font-bold text-gray-500 italic">{order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}</td>
                <td className="text-center">
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black italic">
                    {order.customerInfo?.ordersCount || 1} compras
                  </span>
                </td>
                <td className="text-right font-bold text-brand-green">${formatNum(order.payments?.reduce((acc, p) => acc + p.amount, 0) || 0)}</td>
                <td className="px-8 text-right">
                  <span className="inline-block px-4 py-2 bg-red-50 text-brand-red rounded-2xl font-black italic text-lg shadow-sm">
                    ${formatNum((order.totalRevenue || 0) - (order.payments?.reduce((acc, p) => acc + p.amount, 0) || 0))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const NewOrderModal = ({ isOpen, onClose, formData, setFormData, onSearch, searchResults, onSearchCustomer, customerSuggestions, onSave, isSubmitting }) => {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");

  const addItem = (product) => {
    const exists = formData.items.find(i => i.productId === product._id);
    if (exists) {
        setFormData({
            ...formData,
            items: formData.items.map(i => i.productId === product._id ? {...i, quantity: i.quantity + 1} : i)
        });
    } else {
        setFormData({
            ...formData,
            items: [...formData.items, {
                productId: product._id,
                name: product.name,
                price: product.price,
                purchasePrice: product.purchasePrice || 0,
                quantity: 1,
                category: product.category
            }]
        });
    }
  };

  const removeItem = (id) => {
    setFormData({
        ...formData,
        items: formData.items.filter(i => i.productId !== id)
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-gray-800 leading-none">Registrar Venta</h3>
            <p className="text-[10px] font-black text-brand-red uppercase tracking-[0.2em] mt-2">Paso {step} de 2</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 thin-scrollbar">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Nombre Cliente</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-brand-red/20 transition-all"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Teléfono / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="312..."
                    className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-brand-red/20 transition-all"
                    value={formData.customerPhone}
                    onChange={(e) => {
                      setFormData({...formData, customerPhone: e.target.value});
                      onSearchCustomer(e.target.value);
                    }}
                  />
                  {customerSuggestions.length > 0 && (
                    <div className="absolute z-[101] left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2">
                      {customerSuggestions.map(cust => (
                        <button
                          key={cust._id}
                          onClick={() => {
                            setFormData({...formData, customerPhone: cust.phone, customerName: cust.name});
                            onSearchCustomer('');
                          }}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-black text-gray-800 italic uppercase">{cust.name}</p>
                            <p className="text-[10px] font-bold text-gray-400">{cust.phone}</p>
                          </div>
                          <span className="bg-brand-red/10 text-brand-red text-[8px] font-black px-2 py-1 rounded-full">CLIENTE FRECUENTE</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Buscar Productos</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Escribe el nombre del producto..."
                    className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand-red/20 transition-all"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); onSearch(e.target.value); }}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-gray-50 rounded-2xl border border-gray-100 max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {searchResults.map(p => (
                      <button 
                        key={p._id} 
                        onClick={() => addItem(p)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img src={p.mainImage || p.images?.[0] || 'https://placehold.co/100'} className="w-8 h-8 rounded shadow-sm object-cover" alt="" />
                          <div className="text-left">
                            <p className="text-xs font-black text-gray-800 uppercase italic">{p.name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{p.category}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-brand-red italic">${formatNum(p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Productos Seleccionados</label>
                <div className="space-y-2">
                  {formData.items.map(item => (
                    <div key={item.productId} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100 animate-in slide-in-from-left-4 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-brand-red shadow-sm">{item.quantity}</div>
                        <span className="text-xs font-black uppercase text-gray-700 italic">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-gray-800 italic">${(item.price * item.quantity).toLocaleString()}</span>
                        <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-brand-red transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.items.length === 0 && <p className="text-center py-6 text-[10px] font-black uppercase text-gray-300 italic">No has añadido productos</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
               <div className="bg-brand-red/5 p-6 rounded-[2rem] border border-brand-red/10 border-dashed">
                <p className="text-center text-[10px] font-black uppercase text-brand-red tracking-[0.2em] mb-4">Resumen de Totales</p>
                <div className="flex justify-between items-center mb-2 px-4">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Bruto</span>
                  <span className="text-xl font-black text-gray-800 italic">${formData.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()}</span>
                </div>
                <div className="h-px bg-brand-red/10 my-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-2">Abono Inicial</label>
                    <input 
                      type="number" 
                      className="w-full bg-white border-none rounded-2xl py-4 px-6 text-lg font-black italic text-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all shadow-md"
                      value={formData.initialPayment || ""}
                      onChange={(e) => setFormData({...formData, initialPayment: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Saldo Restante</span>
                      <span className="text-xl font-black text-brand-red italic">
                        ${(formData.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) - (formData.initialPayment || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <input 
                  type="checkbox" 
                  id="sep" 
                  className="w-6 h-6 rounded-lg border-2 border-gray-200 text-brand-red focus:ring-brand-red"
                  checked={formData.isPlanSepare}
                  onChange={(e) => setFormData({...formData, isPlanSepare: e.target.checked})}
                />
                <label htmlFor="sep" className="flex-1 flex flex-col cursor-pointer">
                  <span className="text-xs font-black uppercase text-gray-800 italic">Habilitar Plan Separe</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">Permitir abonos parciales y seguimiento de deuda</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Notas / Comentarios</label>
                <textarea 
                  className="w-full bg-gray-100 border-none rounded-3xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-brand-red/20 transition-all min-h-[100px]"
                  placeholder="Detalles adicionales sobre la entrega o el pago..."
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                ></textarea>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/20">
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-gray-400 hover:bg-gray-100 transition-colors"
            >
              Volver
            </button>
          )}
          <button 
            disabled={isSubmitting || formData.items.length === 0}
            onClick={() => {
              if (step === 1) setStep(2);
              else onSave();
            }}
            className="flex-1 bg-brand-red text-white py-5 rounded-[1.5rem] font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : (step === 1 ? 'Continuar a Totales' : 'Confirmar Venta')}
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentModal = ({ isOpen, onClose, order, onAdd, isSubmitting, formatNum }) => {
  const [data, setData] = useState({ amount: "", method: "Efectivo", note: "" });

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-800">Registrar Abono</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cliente: {order.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-brand-red/5 p-4 rounded-2xl flex justify-between items-center border border-brand-red/10">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Saldo Pendiente</span>
            <span className="text-xl font-black text-brand-red italic">${formatNum(order.balance)}</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Valor del Abono</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-brand-green text-xl">$</span>
                <input 
                  type="number" 
                  className="w-full bg-gray-100 border-none rounded-3xl py-5 pl-12 pr-6 text-xl font-black italic text-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all shadow-inner"
                  placeholder="0.00"
                  value={data.amount}
                  onChange={(e) => setData({...data, amount: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Método de Pago</label>
              <select 
                className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-xs font-black uppercase italic focus:ring-2 focus:ring-brand-red/20 transition-all appearance-none cursor-pointer"
                value={data.method}
                onChange={(e) => setData({...data, method: e.target.value})}
              >
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Transferencia">📱 Transferencia</option>
                <option value="Depósito">🏦 Depósito</option>
                <option value="Otro">💳 Otro</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Nota (opcional)</label>
              <input 
                type="text" 
                placeholder="Ej: Pago quincena"
                className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-brand-red/20 transition-all"
                value={data.note}
                onChange={(e) => setData({...data, note: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50/50">
          <button 
            disabled={isSubmitting || !data.amount || Number(data.amount) <= 0}
            onClick={() => onAdd(order._id, data)}
            className="w-full bg-brand-green text-white py-5 rounded-[1.5rem] font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirmar Abono'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;
