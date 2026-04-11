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
  Building,
  Grid3x3,
  Globe,
  Monitor,
  MapPin
} from 'lucide-react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  CircleMarker
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

const ReportesPage = ({ setActiveTab }) => {
  const [activeSubTab, setActiveSubTab] = useState('ventas'); // 'ventas', 'inventario', 'rentabilidad', 'exportar'
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Default to 30 days
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  
  // New: Customer Search State (MOVED TO DASHBOARD)
  
  // Data States
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [profitability, setProfitability] = useState(null);
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartera, setCartera] = useState({ orders: [], totalReceivable: 0 });
  const [traffic, setTraffic] = useState(null);
  
  // UI States
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Order Form State (MOVED TO DASHBOARD)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const formatNum = (num) => {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

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
        fetchCartera(),
        fetchTraffic()
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

  const fetchTraffic = async () => {
    const res = await axios.get(`${API_URL}/api/admin/reports/traffic?range=${dateRange}`, { headers });
    setTraffic(res.data);
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* HEADER MÓDULO */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="bg-brand-red text-white px-2 py-0.5 rounded text-[8px] font-black uppercase italic tracking-wider leading-none">BI ADVANCED</span>
            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-black uppercase italic tracking-wider leading-none">v2.1</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-[-0.05em] leading-none mb-1">Reportes & BI</h2>
          <p className="text-gray-400 font-bold uppercase text-[8.5px] tracking-[0.1em] leading-none opacity-60">Gestión operativa y financiera detallada</p>
        </div>

        {/* TABS NAVEGACIÓN INTERNA */}
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 gap-0.5 overflow-x-auto no-scrollbar">
          <SubTab active={activeSubTab === 'ventas'} icon={<TrendingUp size={16} />} label="Ventas" onClick={() => setActiveSubTab('ventas')} />
          <SubTab active={activeSubTab === 'gestion-ventas'} icon={<ShoppingBag size={16} />} label="Gestión" onClick={() => setActiveSubTab('gestion-ventas')} />
          <SubTab active={activeSubTab === 'cartera'} icon={<CreditCard size={16} />} label="Cartera" onClick={() => setActiveSubTab('cartera')} />
          <SubTab active={activeSubTab === 'inventario'} icon={<Layers size={16} />} label="Productos" onClick={() => setActiveSubTab('inventario')} />
          <SubTab active={activeSubTab === 'rentabilidad'} icon={<Target size={16} />} label="Márgenes" onClick={() => setActiveSubTab('rentabilidad')} />
          <SubTab active={activeSubTab === 'leads'} icon={<MessageCircle size={16} />} label="Mensajes" onClick={() => setActiveSubTab('leads')} />
          <SubTab active={activeSubTab === 'traffic'} icon={<Globe size={16} />} label="Tráfico" onClick={() => setActiveSubTab('traffic')} />
          <SubTab active={activeSubTab === 'exportar'} icon={<Download size={16} />} label="Export" onClick={() => setActiveSubTab('exportar')} />
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
            onNew={() => setActiveTab('pos')}
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
              Swal.fire({
                title: 'Convertir Lead',
                text: 'Registra la venta de este producto en el Punto de Venta',
                icon: 'info',
                confirmButtonText: 'Ir al POS'
              }).then(() => setActiveTab('pos'));
            }}
          />
        )}
        {activeSubTab === 'traffic' && (traffic ? <TrafficView data={traffic} formatNum={formatNum} COLORS={COLORS} /> : <NoDataPlaceholder message="No hay datos de tráfico disponibles" />)}
        {activeSubTab === 'exportar' && <ExportView handleExportExcel={handleExportExcel} stats={stats} inventory={inventory} />}
      </div>


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
  <div className="space-y-4 animate-in fade-in duration-500">
    {/* FILTRO PERIODOS COMPACTO */}
    <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 px-3 rounded-lg border border-gray-100 w-fit">
      <span className="text-[10px] font-black uppercase text-gray-400 mr-1 italic">Periodo:</span>
      {['7', '30', '90'].map(r => (
        <button 
          key={r} 
          onClick={() => setCurrentRange(r)}
          className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${currentRange === r ? 'bg-brand-red text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
        >
          {r} Días
        </button>
      ))}
    </div>

    {/* METRICS GRID COMPACTO */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <KPIBox title="Ventas Totales" value={`$${formatNum(stats?.metrics?.totalRevenue)}`} icon={<ShoppingBag size={18} className="text-brand-red"/>} color="bg-red-50" />
      <KPIBox title="Ganancia Neta" value={`$${formatNum(stats?.metrics?.totalProfit)}`} icon={<DollarSign size={18} className="text-brand-green"/>} color="bg-green-50" />
      <KPIBox title="Ticket Promedio" value={`$${formatNum(Math.round(stats?.metrics?.totalRevenue / stats?.metrics?.count || 0))}`} icon={<TrendingUp size={18} className="text-blue-500"/>} color="bg-blue-50" />
      <KPIBox title="Lead WhatsApp" value={stats?.metrics?.totalLeads || 0} icon={<MessageCircle size={18} className="text-purple-500"/>} color="bg-purple-50" />
      <KPIBox title="Margen Bruto" value={`${stats?.metrics?.totalRevenue > 0 ? ((stats?.metrics?.totalProfit / stats?.metrics?.totalRevenue) * 100).toFixed(1) : 0}%`} icon={<Target size={18} className="text-orange-500"/>} color="bg-orange-50" />
      <KPIBox title="Operación" value={`$${formatNum(stats?.metrics?.totalCost)}`} icon={<Briefcase size={18} className="text-gray-500"/>} color="bg-gray-50" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* TENDENCIA COMPACTA */}
      <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <SectionHeader title="Rendimiento Comercial" detail="Evolución de ingresos y utilidad" icon={<TrendingUp size={16} />} />
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyTrend}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f8f8" />
              <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold'}} />
              <ChartTooltip contentStyle={{borderRadius: '12px', border: 'none', fontSize: '10px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Area name="Ingresos" type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} fill="url(#gradRevenue)" />
              <Area name="Ganancia" type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fill="url(#gradProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CATEGORÍAS COMPACTO */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <SectionHeader title="Mix de Productos" detail="Ventas por categoría" icon={<PieChartIcon size={16} />} />
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.categoryStats} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" nameKey="_id">
                {stats.categoryStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <ChartTooltip textStyle={{fontSize: 10}} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: 9, paddingTop: '10px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* TOP PRODUCTS & PROVIDERS COMPACTO */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <SectionHeader title="Best Sellers" detail="Productos de alta rotación" />
        <div className="grid grid-cols-1 gap-2">
          {stats.topProducts.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2 px-3 bg-gray-50 rounded-lg group hover:border-brand-red/30 border border-transparent transition-all">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center font-black text-[10px] text-brand-red border border-gray-100 shadow-sm">{i+1}</div>
                <div>
                  <p className="font-black uppercase italic text-[10px] leading-tight truncate max-w-[120px]">{p._id}</p>
                  <p className="text-[8px] font-bold opacity-40 uppercase">{p.sales} Vendidos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black italic text-xs text-brand-red leading-none">${formatNum(p.revenue)}</p>
                <span className="text-[7px] font-black uppercase text-brand-green bg-green-50 px-1.5 py-0.5 rounded leading-none mt-1 inline-block">Rentable</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <SectionHeader title="Proveedores" detail="Rendimiento por origen" />
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.providerStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f8f8f8" />
              <XAxis type="number" hide />
              <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'black'}} width={80} />
              <ChartTooltip textStyle={{fontSize: 10}} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill="#ef4444" barSize={10}>
                {stats.providerStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

const LeadsView = ({ leads, formatNum }) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <SectionHeader title="Historial de Leads" detail={`Total: ${leads.length} Contactos`} icon={<MessageCircle size={16}/>} />
      
      {/* VISTA DESKTOP */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[9px] font-black uppercase text-gray-400 border-b border-gray-100 italic">
              <th className="pb-2">Fecha</th>
              <th className="pb-2">Producto de Interés</th>
              <th className="pb-2 text-center">Referidor</th>
              <th className="pb-2 text-right">Precio</th>
              <th className="pb-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.length === 0 ? (
              <tr><td colSpan="5" className="py-10 text-center text-gray-300 font-black uppercase italic text-[10px]">No hay registros</td></tr>
            ) : leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-600">{format(new Date(lead.createdAt), 'dd/MM HH:mm')}</span>
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0 border border-gray-50">
                      <img src={lead.mainImage || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black uppercase italic text-[10px] leading-none mb-0.5 truncate max-w-[150px]">{lead.productName}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase leading-none">{lead.category}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 text-center">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-gray-100 text-gray-400">{lead.referrer}</span>
                </td>
                <td className="py-2.5 text-right font-black italic text-gray-800 text-[10px]">${formatNum(lead.price)}</td>
                <td className="py-2.5 text-center px-2">
                   <span className="text-[9px] font-black text-brand-green uppercase flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full"></div> Lead
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VISTA MÓVIL */}
      <div className="lg:hidden space-y-3">
        {leads.length === 0 ? (
          <div className="py-10 text-center text-gray-300 font-black uppercase italic text-[10px]">No hay registros</div>
        ) : leads.map((lead) => (
          <div key={lead._id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3 group hover:border-brand-green/30 transition-all">
             <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-xl bg-white overflow-hidden border border-gray-200 shadow-sm shrink-0">
                      <img src={lead.mainImage || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                   </div>
                   <div className="min-w-0">
                      <h4 className="text-[11px] font-black text-gray-800 uppercase italic leading-tight mb-0.5 truncate">{lead.productName}</h4>
                      <div className="flex flex-col gap-0.5">
                         <p className="text-[10px] font-black text-brand-red uppercase italic leading-none">{lead.customerName || 'Interesado Anónimo'}</p>
                         <p className="text-[9px] font-bold text-gray-400 leading-none">{lead.customerPhone || 'Sin número'}</p>
                      </div>
                   </div>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-xs font-black text-gray-800 italic leading-none mb-1">${formatNum(lead.price)}</p>
                   <p className="text-[7.5px] font-bold text-gray-400 uppercase">{format(new Date(lead.createdAt), 'dd/MM HH:mm')}</p>
                </div>
             </div>
             
             <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                 <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></div> 
                    <span className="text-[8px] font-black text-brand-green uppercase tracking-widest">Procedencia: {lead.referrer}</span>
                 </div>
                 
                 {lead.customerPhone && lead.customerPhone !== 'Sin número' && (
                   <button 
                    onClick={() => {
                        const cleanPhone = lead.customerPhone.replace(/\D/g, '');
                        const finalPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
                        window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(`¡Hola ${lead.customerName}! Vi que te interesó el producto *${lead.productName}* en El Rebajón. ¿En qué puedo ayudarte?`)}`, '_blank');
                    }}
                    className="flex items-center gap-1.5 bg-brand-green text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase hover:brightness-110 active:scale-95 transition-all shadow-sm"
                   >
                      <MessageCircle size={12} fill="white" /> Responder
                   </button>
                 )}
             </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const InventoryView = ({ inventory, formatNum, COLORS }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    {/* PRODUCT KPIS COMPACTO */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <KPIBox title="Capital en Stock" value={`$${formatNum(inventory.summary.capitalInvertido)}`} icon={<DollarSign size={18} className="text-brand-red"/>} color="bg-red-50" />
      <KPIBox title="Valor Venta" value={`$${formatNum(inventory.summary.valorPotencial)}`} icon={<ShoppingBag size={18} className="text-brand-green"/>} color="bg-green-50" />
      <KPIBox title="Utilidad Estimada" value={`$${formatNum(inventory.summary.gananciaPotencial)}`} icon={<TrendingUp size={18} className="text-blue-500"/>} color="bg-blue-50" />
      <KPIBox title="Alerta Crítica" value={inventory.summary.lowStockCount || 0} icon={<AlertCircle size={18} className="text-orange-500"/>} color="bg-orange-50" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <SectionHeader title="Capital por Área" detail="Inversión distribuida" icon={<Layers size={16}/>} />
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventory.categoryDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f8f8" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold'}} />
              <ChartTooltip textStyle={{fontSize: 10}} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#ef4444" barSize={15}>
                {inventory.categoryDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <SectionHeader title="Top Margen ROI %" detail="Productos más rentables" icon={<Target size={16}/>} />
        <div className="grid grid-cols-1 gap-1.5">
          {inventory.topMargin.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:border-brand-green/30 border border-transparent transition-all">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-brand-green shadow-sm text-[10px] leading-tight text-center">
                    {p.marginPct}<br/>%
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black uppercase italic text-[10px] truncate leading-none mb-0.5">{p.name}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">{p.category}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-brand-red opacity-30 line-through leading-none mb-0.5">${formatNum(p.purchasePrice)}</p>
                    <p className="font-black italic text-brand-green text-[11px] leading-none">${formatNum(p.price)}</p>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <SectionHeader title="Auditoría de Almacén" detail="Detalle global de existencias" icon={<Package size={16}/>} />
        
        {/* VISTA DESKTOP */}
        <div className="hidden lg:block overflow-x-auto overflow-y-auto max-h-[400px] thin-scrollbar">
            <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10">
                    <tr className="text-[9px] font-black uppercase text-gray-400 border-b border-gray-100 italic">
                        <th className="pb-2">Producto</th>
                        <th className="pb-2 text-center">Stock</th>
                        <th className="pb-2 text-center">Estado</th>
                        <th className="pb-2 text-right">Inversión</th>
                        <th className="pb-2 text-right">ROI %</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {inventory.products.map((p) => (
                        <tr key={p._id} className="hover:bg-gray-50/20 transition-colors">
                            <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-gray-100 overflow-hidden shrink-0">
                                        <img src={p.mainImage || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black uppercase italic text-[10px] leading-none mb-0.5 truncate max-w-[180px]">{p.name}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase">{p.provider}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-2.5 text-center font-bold text-[10px]">{p.stock}</td>
                            <td className="py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                    p.stock <= 0 ? 'bg-red-500 text-white' :
                                    p.stock <= p.stockMin ? 'bg-orange-500 text-white' :
                                    'bg-brand-green text-white'
                                }`}>
                                    {p.stock <= 0 ? 'Agotado' : p.stock <= p.stockMin ? 'Bajo' : 'Optimo'}
                                </span>
                            </td>
                            <td className="py-2.5 text-right font-black italic text-gray-800 text-[10px]">${formatNum(p.capitalItem)}</td>
                            <td className="py-2.5 text-right">
                                <span className="text-[9px] font-black text-brand-green bg-green-50 px-1.5 py-0.5 rounded leading-none">{p.marginPct}%</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* VISTA MÓVIL */}
        <div className="lg:hidden space-y-3">
           {inventory.products.map((p) => (
              <div key={p._id} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-3">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                       <img src={p.mainImage || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-[10px] font-black text-gray-800 uppercase italic truncate">{p.name}</h4>
                       <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded italic ${
                             p.stock <= 0 ? 'bg-red-100 text-red-600' :
                             p.stock <= p.stockMin ? 'bg-orange-100 text-orange-600' :
                             'bg-brand-green/10 text-brand-green'
                          }`}>
                             {p.stock} UNIDADES · {p.stock <= 0 ? 'AGOTADO' : p.stock <= p.stockMin ? 'BAJO' : 'OK'}
                          </span>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[11px] font-black text-gray-800 italic">${formatNum(p.capitalItem)}</p>
                       <p className="text-[7.5px] font-black uppercase text-gray-300">Inversión</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
                    <div className="flex flex-col">
                       <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Rentabilidad</p>
                       <span className="text-[10px] font-black text-brand-green italic">ROI {p.marginPct}%</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Proveedor</p>
                       <span className="text-[9px] font-bold text-gray-500 uppercase">{p.provider}</span>
                    </div>
                 </div>
              </div>
           ))}
        </div>
    </div>
  </div>
);

const ProfitabilityView = ({ profitability, formatNum }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* RESUMEN RENTABILIDAD COMPACTO */}
        <div className="bg-gradient-to-br from-brand-red to-red-700 p-4 rounded-xl text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
            <DollarSign className="absolute -right-5 -top-5 opacity-10 w-32 h-32 rotate-12" />
            <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Margen Promedio</p>
                <p className="text-3xl font-black italic tracking-tighter leading-none">{profitability.avgMarginPct}%</p>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-1.5 relative z-10">
                <div className="text-center bg-white/10 p-2 rounded-lg backdrop-blur-md">
                    <p className="text-sm font-black text-brand-green italic">{profitability.tierCounts.high}</p>
                    <p className="text-[7px] font-black uppercase opacity-60">High</p>
                </div>
                <div className="text-center bg-white/10 p-2 rounded-lg backdrop-blur-md">
                    <p className="text-sm font-black text-brand-yellow italic">{profitability.tierCounts.mid}</p>
                    <p className="text-[7px] font-black uppercase opacity-60">Mid</p>
                </div>
                <div className="text-center bg-white/10 p-2 rounded-lg backdrop-blur-md">
                    <p className="text-sm font-black text-white/50 italic">{profitability.tierCounts.low}</p>
                    <p className="text-[7px] font-black uppercase opacity-60">Low</p>
                </div>
            </div>
        </div>

        {/* RANKING PROFITABILITY COMPACTO */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <SectionHeader title="Ranking ROI" detail="Top 10 Retorno de Inversión" icon={<TrendingUp size={16}/>} />
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[9px] font-black uppercase text-gray-400 border-b border-gray-50 italic">
                            <th className="pb-2">Producto</th>
                            <th className="pb-2 text-center">ROI %</th>
                            <th className="pb-2 text-right">Utilidad</th>
                            <th className="pb-2 text-center">Stat</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {profitability.profitability.slice(0, 10).map((p, i) => (
                            <tr key={i} className="group hover:bg-gray-50/50 transition-all font-bold">
                                <td className="py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-400">{i+1}</div>
                                        <p className="font-black uppercase italic text-[10px] truncate max-w-[150px]">{p.name}</p>
                                    </div>
                                </td>
                                <td className="py-2 text-center">
                                    <span className="text-[10px] font-black text-brand-green">{p.marginPct}%</span>
                                </td>
                                <td className="py-2 text-right">
                                    <p className="font-black text-[10px] italic text-gray-800">${formatNum(p.margin)}</p>
                                </td>
                                <td className="py-2 text-center px-2">
                                    <div className={`w-2 h-2 rounded-full inline-block ${p.tier === 'high' ? 'bg-brand-green' : p.tier === 'mid' ? 'bg-yellow-400' : 'bg-gray-300'}`}></div>
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
  <div className="animate-in fade-in zoom-in duration-500 max-w-xl mx-auto">
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 text-center space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-red"></div>
        <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto transition-transform">
            <FileText size={32} className="text-brand-red" />
        </div>
        <div>
            <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter leading-none mb-2">Exportar Reportes</h3>
            <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest max-w-[300px] mx-auto">
                Generar reporte consolidado en formato Excel (.xlsx)
            </p>
        </div>

        <div className="grid grid-cols-2 gap-3 py-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <p className="text-[8px] font-black uppercase text-gray-400 mb-2 tracking-widest">Contenido</p>
                <div className="flex flex-wrap justify-center gap-1">
                    {['Ventas', 'Stock', 'ROI'].map(h => (
                        <span key={h} className="bg-white px-2 py-0.5 rounded-full text-[7px] font-black uppercase border border-gray-100 shadow-sm">{h}</span>
                    ))}
                </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <p className="text-[8px] font-black uppercase text-gray-400 mb-1 tracking-widest">Registros</p>
                <p className="text-lg font-black italic text-gray-800">{inventory?.summary?.totalProducts + stats?.metrics?.count || 0}</p>
                <p className="text-[7px] font-black uppercase opacity-40">Procesados</p>
            </div>
        </div>

        <button 
            onClick={handleExportExcel}
            className="w-full bg-brand-red text-white py-3 rounded-xl font-black uppercase italic tracking-tight text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
            <Download size={18} /> DESCARGAR MAESTRO
        </button>
        
        <p className="text-[8px] font-black uppercase text-gray-300 italic tracking-[0.2em]">Confidencial • Admin Only</p>
    </div>
  </div>
);

// --- COMPONENTE DE TRÁFICO (NEW) ---

const TrafficView = ({ data, formatNum, COLORS }) => {
  // Fix Leaflet Icon Issue
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Default center of Colombia (approx)
  const COLOMBIA_CENTER = [4.5709, -74.2973];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TRAFFIC KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPIBox title="Visitantes Totales" value={formatNum(data.totalVisitors)} icon={<Users size={18} className="text-brand-red"/>} color="bg-red-50" />
        <KPIBox title="Municipios Activos" value={data.municipalityStats.length} icon={<Globe size={18} className="text-blue-500"/>} color="bg-blue-50" />
        <KPIBox title="Dispositivos" value={data.deviceStats.length} icon={<Monitor size={18} className="text-purple-500"/>} color="bg-purple-50" />
        <KPIBox title="Sesiones Activas" value={formatNum(Math.round(data.totalVisitors * 1.2))} icon={<Clock size={18} className="text-brand-green"/>} color="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DAILY TREND */}
        <div className="lg:col-span-2 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
          <SectionHeader title="Tráfico Diario" detail="Evolución de visitantes en el tiempo" icon={<TrendingUp size={16}/>} />
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrend}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                  <ChartTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="visitors" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* TOP MUNICIPALITIES */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
          <SectionHeader title="Principales Municipios" detail="Distribución geográfica" icon={<MapPin size={16}/>} />
          <div className="space-y-3 mt-4">
            {data.municipalityStats.slice(0, 8).map((m, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-brand-red group-hover:text-white transition-all">
                    {i+1}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase italic text-gray-700 leading-none">{m._id}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{m.region}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black italic text-brand-red leading-none">{m.count}</p>
                  <p className="text-[7px] font-bold text-gray-300 uppercase leading-none">Visitas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAPA DE TRÁFICO */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
        <SectionHeader title="Mapa de Calor de Visitantes" detail="Vistas en tiempo real por ubicación" icon={<Globe size={16}/>} />
        <div className="h-[450px] rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-inner z-0">
          <MapContainer center={COLOMBIA_CENTER} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data.mapPoints.map((point, idx) => (
              point.lat && point.lon ? (
                <Marker key={idx} position={[point.lat, point.lon]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-black uppercase text-[10px] text-brand-red mb-1">{point.city}</p>
                      <p className="text-[9px] font-bold uppercase">{point.count} Visitantes</p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </div>
        <p className="text-[8px] font-bold text-gray-300 italic mt-3 text-center uppercase tracking-[0.25em]">Datos aproximados basados en la geolocalización de IP Pública</p>
      </div>
    </div>
  );
};


// --- COMPONENTES AUXILIARES COMPACTOS ---

const SubTab = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
      active 
        ? 'bg-brand-red text-white shadow-md' 
        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
    }`}
  >
    {icon}
    <span className="text-[10px] font-black uppercase italic tracking-tight">{label}</span>
  </button>
);

const MetricCard = ({ title, value, detail, icon, color, className = "" }) => (
  <div className={`p-2.5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2.5 group transition-all hover:border-brand-red/20 bg-white ${className}`}>
    <div className={`p-1.5 rounded-md ${color} shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <h4 className="text-[7.5px] font-black uppercase text-gray-300 mb-0.5 tracking-[0.15em] leading-none">{title}</h4>
      <p className="text-[13px] font-black text-gray-800 italic tracking-[-0.03em] leading-none">{value}</p>
      {detail && <p className="text-[7.5px] font-bold text-gray-300 mt-1 uppercase leading-none opacity-50">{detail}</p>}
    </div>
  </div>
);

const KPIBox = ({ title, value, detail, icon, color, className = "" }) => (
  <MetricCard title={title} value={value} detail={detail} icon={icon} color={color} className={className} />
);

const SectionHeader = ({ title, detail, icon }) => (
  <div className="flex items-center gap-2 mb-3">
    {icon && <div className="text-brand-red opacity-80">{icon}</div>}
    <div>
      <h3 className="text-[11px] font-black text-gray-800 uppercase italic leading-none">{title}</h3>
      {detail && <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">{detail}</p>}
    </div>
  </div>
);

const NoDataPlaceholder = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 gap-3">
    <AlertCircle className="text-gray-200" size={32} />
    <p className="text-xs text-gray-400 font-black uppercase italic tracking-widest text-center px-8">{message || "No hay datos disponibles"}</p>
  </div>
);

// --- NEW SALES MANAGEMENT VIEWS ---

const GestionVentasView = ({ orders, formatNum, searchTerm, setSearchTerm, fetchOrders, onNew, onPayment, onDelete }) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    <div className="flex flex-col md:flex-row justify-between gap-3 items-center">
      <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors" size={14} />
          <input 
              type="text" 
              placeholder="Buscar venta..."
              className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-9 pr-4 text-xs font-bold focus:ring-2 focus:ring-brand-red/10 transition-all outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && fetchOrders()}
          />
      </div>
      <button 
        onClick={onNew}
        className="w-full md:w-auto bg-brand-red text-white px-6 py-3 rounded-xl font-black uppercase italic tracking-tight shadow-lg shadow-red-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
      >
        <Plus size={18} /> NUEVA VENTA POS
      </button>
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* VISTA DESKTOP */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-50 text-[8px] font-black uppercase tracking-widest text-gray-300 bg-gray-50/20 italic">
              <th className="px-6 py-4">Fecha / Cliente</th>
              <th className="py-4">Detalle Productos</th>
              <th className="py-4 text-right">Monto</th>
              <th className="py-4 text-right">Estado</th>
              <th className="px-6 py-4 text-center">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <tr><td colSpan="5" className="py-20 text-center text-gray-300 font-black uppercase text-[10px] italic opacity-20">Sin ventas registradas</td></tr>
            ) : orders.map(order => (
              <tr key={order._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-800 italic uppercase leading-none mb-1">{format(new Date(order.createdAt), 'dd MMM, yy')}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">{order.customerName}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex flex-col">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-black text-brand-red">{item.quantity}x</span>
                        <span className="text-[9px] font-bold text-gray-500 truncate max-w-[200px] uppercase italic">{item.name}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && <span className="text-[7.5px] font-black text-brand-red uppercase italic mt-1">+{order.items.length - 2} más...</span>}
                  </div>
                </td>
                <td className="py-4 text-right font-black italic text-gray-800 text-xs pr-4">
                   ${formatNum(order.totalRevenue || order.totalAmount)}
                </td>
                <td className="py-4 text-right">
                    <div className="flex flex-col items-end leading-none">
                        <span className={`text-[11px] font-black italic ${order.balance > 0 ? 'text-brand-red' : 'text-brand-green'}`}>
                           ${formatNum(order.balance)}
                        </span>
                        <span className="text-[7px] font-bold text-gray-300 uppercase mt-1">{order.balance > 0 ? 'Pendiente' : 'Pagado'}</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                       {order.balance > 0 && (
                        <button onClick={() => onPayment(order)} className="p-2 text-brand-green hover:bg-green-50 rounded-lg transition-all" title="Registrar Abono"><CreditCard size={16} /></button>
                       )}
                       <button onClick={() => onDelete(order._id)} className="p-2 text-gray-300 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VISTA MÓVIL */}
      <div className="lg:hidden divide-y divide-gray-50">
        {orders.length === 0 ? (
          <div className="py-20 text-center text-gray-300 font-black uppercase text-[10px] italic">Sin ventas registradas</div>
        ) : orders.map(order => (
          <div key={order._id} className="p-4 flex flex-col gap-3 bg-white active:bg-gray-50 transition-colors">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-[8px] font-black uppercase text-brand-red leading-none mb-1 opacity-60">{format(new Date(order.createdAt), 'dd MMMM, yyyy')}</p>
                   <h4 className="text-[11px] font-black text-gray-800 uppercase italic leading-tight">{order.customerName}</h4>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase italic ${order.balance > 0 ? 'bg-red-50 text-brand-red' : 'bg-green-50 text-brand-green'}`}>
                   {order.balance > 0 ? 'Con Pendiente' : 'Pagado'}
                </div>
             </div>

             <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50 space-y-2">
                <div className="flex flex-col gap-1">
                   {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-[9.5px]">
                         <span className="font-bold text-gray-500 uppercase italic truncate pr-4">{item.name}</span>
                         <span className="font-black text-gray-800 shrink-0">{item.quantity} x ${formatNum(item.price)}</span>
                      </div>
                   ))}
                   {order.items.length > 3 && <p className="text-[8px] font-black text-brand-red italic mt-1 uppercase text-right">+{order.items.length - 3} productos adicionales</p>}
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between items-end">
                   <div>
                      <p className="text-[7.5px] font-black text-gray-400 uppercase leading-none mb-1">Total Venta</p>
                      <p className="text-sm font-black text-gray-800 italic leading-none">${formatNum(order.totalRevenue || order.totalAmount)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[7.5px] font-black text-brand-red uppercase leading-none mb-1">Saldo Deudor</p>
                      <p className="text-sm font-black text-brand-red italic leading-none">${formatNum(order.balance)}</p>
                   </div>
                </div>
             </div>

             <div className="flex gap-2">
                {order.balance > 0 && (
                   <button 
                     onClick={() => onPayment(order)}
                     className="flex-1 bg-brand-green text-white py-3 rounded-2xl font-black uppercase text-[10px] italic flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                   >
                     <Plus size={16} /> Abonar a Deuda
                   </button>
                )}
                <button 
                  onClick={() => onDelete(order._id)}
                  className={`bg-white border text-gray-400 py-3 rounded-2xl flex items-center justify-center transition-all ${order.balance > 0 ? 'w-14 border-gray-100' : 'flex-1 border-red-100 text-brand-red font-black uppercase text-[10px] italic gap-2'}`}
                >
                  <Trash2 size={order.balance > 0 ? 18 : 16} />
                  {order.balance <= 0 && "Eliminar Registro"}
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CarteraView = ({ data, formatNum }) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <KPIBox title="Total Cartera" value={`$${formatNum(data.summary?.totalAccountReceivable || 0)}`} detail={`${data.summary?.totalClientsDebting || 0} Deudores`} icon={<CreditCard size={18} className="text-brand-red" />} color="bg-red-50" />
      <KPIBox title="Cobro Próximo" value={`$${formatNum(data.summary?.dueSoonAmount || 0)}`} detail="Próximos 7 días" icon={<Clock size={18} className="text-orange-500" />} color="bg-orange-50" />
      <KPIBox title="Gestión Activa" value={data.summary?.totalClientsDebting || 0} detail="Acciones de cobro" icon={<Users size={18} className="text-blue-500" />} color="bg-blue-50" />
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <SectionHeader title="Cuentas por Cobrar" detail="Seguimiento detallado de saldos pendientes" icon={<Building size={16} />} />
      </div>

      {/* VISTA DESKTOP */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 italic bg-gray-50/20">
              <th className="px-6 py-4">Cliente / Registro</th>
              <th className="py-4 text-center">Frecuencia</th>
              <th className="py-4 text-right">Monto Pagado</th>
              <th className="px-6 py-4 text-right">Saldo en Cartera</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.orders?.length === 0 ? (
              <tr><td colSpan="4" className="py-20 text-center text-gray-300 font-black uppercase italic text-xs opacity-40">No hay deudas activas</td></tr>
            ) : data.orders?.map((order, idx) => (
              <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-800 italic uppercase leading-none mb-1">{order.customerName}</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">{order.createdAt ? format(new Date(order.createdAt), 'dd MMM, yyyy') : '--'}</span>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black italic uppercase">
                    {order.customerInfo?.ordersCount || 1} Compras
                  </span>
                </td>
                <td className="py-4 text-right font-bold text-brand-green text-[11px] italic pr-4">${formatNum(order.payments?.reduce((acc, p) => acc + p.amount, 0) || 0)}</td>
                <td className="px-6 py-4 text-right">
                  <span className="bg-red-50 text-brand-red px-3 py-1.5 rounded-xl font-black italic text-xs shadow-sm border border-red-100">
                    ${formatNum((order.totalRevenue || 0) - (order.payments?.reduce((acc, p) => acc + p.amount, 0) || 0))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VISTA MÓVIL */}
      <div className="lg:hidden divide-y divide-gray-50">
        {data.orders?.length === 0 ? (
          <div className="py-20 text-center text-gray-300 font-black uppercase italic text-xs">No hay deudas activas</div>
        ) : data.orders?.map((order, idx) => {
          const paid = order.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
          const balance = (order.totalRevenue || 0) - paid;
          return (
            <div key={idx} className="p-4 flex flex-col gap-4 bg-white active:bg-gray-50 transition-colors">
               <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[11px] font-black text-gray-800 uppercase italic leading-tight mb-1">{order.customerName}</h4>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(order.createdAt), 'dd MMMM')}</span>
                  </div>
                  <div className="bg-red-50 text-brand-red px-3 py-1.5 rounded-2xl border border-red-100">
                    <p className="text-sm font-black italic leading-none">${formatNum(balance)}</p>
                    <p className="text-[7.5px] font-black uppercase text-center mt-1">Saldo</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100/50">
                  <div className="flex flex-col">
                    <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto Pagado</p>
                    <span className="text-[10px] font-black text-brand-green italic">${formatNum(paid)}</span>
                  </div>
                  <div className="flex flex-col border-l border-gray-200 pl-3">
                    <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest mb-1">Frecuencia</p>
                    <span className="text-[10px] font-black text-blue-600 uppercase italic">{order.customerInfo?.ordersCount || 1} Compras</span>
                  </div>
               </div>

               <button 
                 className="w-full bg-white border border-gray-200 text-gray-500 py-3 rounded-2xl font-black uppercase text-[10px] italic flex items-center justify-center gap-2 active:scale-95 transition-all"
               >
                 Ver Historial de Abonos
               </button>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);


export default ReportesPage;
