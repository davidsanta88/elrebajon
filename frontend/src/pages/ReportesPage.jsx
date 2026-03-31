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
  MessageCircle
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
  
  // Data States
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [profitability, setProfitability] = useState(null);
  const [leads, setLeads] = useState([]);
  
  // Filters
  const [dateRange, setDateRange] = useState('30'); // '7', '30', '90', 'custom'
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

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
        fetchLeads()
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
    try {
      const res = await axios.get(`${API_URL}/api/admin/reports/leads`, { headers });
      setLeads(res.data);
    } catch (err) {
      console.error("Error fetching leads", err);
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
          <SubTab active={activeSubTab === 'inventario'} icon={<Layers size={18} />} label="Inventario" onClick={() => setActiveSubTab('inventario')} />
          <SubTab active={activeSubTab === 'rentabilidad'} icon={<Target size={18} />} label="Márgenes" onClick={() => setActiveSubTab('rentabilidad')} />
          <SubTab active={activeSubTab === 'leads'} icon={<MessageCircle size={18} />} label="Mensajes/CRM" onClick={() => setActiveSubTab('leads')} />
          <SubTab active={activeSubTab === 'exportar'} icon={<Download size={18} />} label="Exportar" onClick={() => setActiveSubTab('exportar')} />
        </div>
      </div>

      {/* CONTENIDO SEGÚN TAB */}
      <div className="min-h-[600px]">
        {activeSubTab === 'ventas' && (stats ? <StatsView stats={stats} dateRange={dateRange} setDateRange={setDateRange} formatNum={formatNum} COLORS={COLORS} fetchAllData={fetchAllData} /> : <NoDataPlaceholder message="No se pudieron cargar las estadísticas de ventas" />)}
        {activeSubTab === 'inventario' && (inventory ? <InventoryView inventory={inventory} formatNum={formatNum} COLORS={COLORS} /> : <NoDataPlaceholder message="No hay datos de inventario disponibles" />)}
        {activeSubTab === 'rentabilidad' && (profitability ? <ProfitabilityView profitability={profitability} formatNum={formatNum} /> : <NoDataPlaceholder message="No hay datos de rentabilidad disponibles" />)}
        {activeSubTab === 'leads' && <LeadsView leads={leads} formatNum={formatNum} />}
        {activeSubTab === 'exportar' && <ExportView handleExportExcel={handleExportExcel} stats={stats} inventory={inventory} />}
      </div>
    </div>
  );
};

// --- SUBVIEWS ---

const StatsView = ({ stats, dateRange, setDateRange, formatNum, COLORS, fetchAllData }) => (
  <div className="space-y-10 animate-in fade-in duration-500">
    {/* FILTRO PERIODOS */}
    <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
      <div className="p-2 bg-gray-50 rounded-xl text-gray-400"><Calendar size={20}/></div>
      <span className="text-xs font-black uppercase text-gray-500 mr-2">Periodo:</span>
      {['7', '30', '90'].map(r => (
        <button 
          key={r} 
          onClick={() => setDateRange(r)}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${dateRange === r ? 'bg-brand-red text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
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

export default ReportesPage;
