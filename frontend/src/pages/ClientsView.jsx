import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  ShoppingBag,
  RefreshCw,
  X,
  CheckCircle,
  Plus
} from 'lucide-react';

const ClientsView = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (q = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/customers?q=${q}`, { headers });
      setCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchCustomers(val);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/admin/customers/${id}`, { headers });
        Swal.fire('Eliminado', 'El cliente ha sido eliminado', 'success');
        fetchCustomers(searchTerm);
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar el cliente', 'error');
      }
    }
  };

  const openModal = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setForm({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        email: customer.email || ''
      });
    } else {
      setSelectedCustomer(null);
      setForm({ name: '', phone: '', address: '', email: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        // Edit Mode
        await axios.put(`${API_URL}/api/admin/customers/${selectedCustomer._id}`, form, { headers });
        Swal.fire('Éxito', 'Cliente actualizado correctamente', 'success');
      } else {
        // Create Mode
        await axios.post(`${API_URL}/api/admin/customers`, form, { headers });
        Swal.fire('Éxito', 'Cliente creado correctamente', 'success');
      }
      setShowModal(false);
      fetchCustomers(searchTerm);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error en la operación';
      Swal.fire('Error', msg, 'error');
    }
  };

  const formatNum = (num) => {
    if (!num && num !== 0) return '0';
    return num.toLocaleString('es-CO');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* SEARCH AND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono..."
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-brand-red/10 outline-none transition-all uppercase placeholder:italic placeholder:font-normal placeholder:lowercase"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            <Users className="text-brand-red" size={20} />
            <span className="text-sm font-black text-gray-700 italic uppercase">{customers.length} Clientes</span>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-brand-red text-white font-black px-4 py-2 rounded-xl shadow-md hover:scale-105 transition-transform flex items-center gap-1.5 uppercase text-xs"
          >
            <Plus size={18} /> Nuevo Cliente
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <RefreshCw className="animate-spin text-brand-red" size={64} />
          <p className="text-gray-400 font-black uppercase italic animate-pulse">Consultando base de datos...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* VISTA DESKTOP (TABLA) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 italic bg-gray-50/50">
                  <th className="px-6 py-4">Cliente / Contacto</th>
                  <th className="px-6 py-4">Ubicación / Email</th>
                  <th className="px-6 py-4 text-center">Actividad</th>
                  <th className="px-6 py-4 text-right">Total Compras</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center text-gray-200 font-black uppercase italic text-sm">No se encontraron clientes</td></tr>
                ) : customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-800 italic uppercase leading-none mb-1.5">{c.name}</span>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Phone size={10} className="text-brand-red" />
                          <span className="text-[10px] font-bold uppercase">{c.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <MapPin size={10} />
                          <span className="text-[10px] font-bold uppercase truncate max-w-[200px]">{c.address || 'Sin dirección'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Mail size={10} />
                          <span className="text-[10px] font-bold lowercase truncate max-w-[200px]">{c.email || 'sin@correo.com'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-black italic uppercase mb-1">
                          {c.ordersCount || 0} Ventas
                        </span>
                        <span className="text-[8px] font-bold text-gray-300 uppercase">Frecuente</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-brand-green italic tracking-tighter leading-none mb-1">
                          ${formatNum(c.totalSpent)}
                        </span>
                        <span className="text-[8px] font-bold text-gray-300 uppercase">Inversión Total</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openModal(c)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar Cliente"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c._id)}
                          className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar Cliente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VISTA MÓVIL (TARJETAS) */}
          <div className="lg:hidden divide-y divide-gray-50">
             {customers.length === 0 ? (
               <div className="py-20 text-center text-gray-200 font-black uppercase italic text-sm">No hay clientes registrados</div>
             ) : customers.map((c) => (
                <div key={c._id} className="p-4 flex flex-col gap-4 bg-white active:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h3 className="text-sm font-black text-gray-800 uppercase italic leading-tight mb-1">{c.name}</h3>
                      <div className="flex items-center gap-2 text-brand-red">
                        <Phone size={12} />
                        <span className="text-xs font-bold">{c.phone}</span>
                      </div>
                    </div>
                    <div className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-xl">
                      <p className="text-[14px] font-black italic leading-none">${formatNum(c.totalSpent)}</p>
                      <p className="text-[7.5px] font-black uppercase text-center mt-1">Total</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100/50">
                    <div className="flex flex-col">
                      <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest mb-1">Actividad</p>
                      <span className="text-[10px] font-black text-blue-600 uppercase italic">{c.ordersCount || 0} Ventas</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-3">
                      <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest mb-1">Correo</p>
                      <span className="text-[9px] font-bold text-gray-500 truncate lowercase">{c.email || 'sin@correo.com'}</span>
                    </div>
                    <div className="col-span-2 flex flex-col pt-2 border-t border-gray-200 mt-1">
                      <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-widest mb-1">Dirección Registrada</p>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin size={10} className="text-gray-400" />
                        <span className="text-[10px] font-bold uppercase truncate">{c.address || 'Sin dirección registrada'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => openModal(c)}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black uppercase text-[11px] italic flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                    >
                      <Edit size={16} /> Editar Perfil
                    </button>
                    <button 
                      onClick={() => handleDelete(c._id)}
                      className="w-14 bg-red-50 text-brand-red rounded-2xl border border-red-100 flex items-center justify-center"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
             ))}
          </div>
        </div>

      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSave}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-tight text-gray-800">
                  {selectedCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
                  {selectedCustomer ? 'Actualizar perfil de cliente' : 'Registrar nuevo cliente en la base'}
                </p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-black italic text-gray-800 focus:ring-2 focus:ring-brand-red/10 transition-all outline-none uppercase"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Teléfono</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-black italic text-gray-800 focus:ring-2 focus:ring-brand-red/10 transition-all outline-none uppercase"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Email (Opcional)</label>
                  <input 
                    type="email" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-black italic text-gray-800 focus:ring-2 focus:ring-brand-red/10 transition-all outline-none lowercase"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Dirección de Entrega</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-black italic text-gray-800 focus:ring-2 focus:ring-brand-red/10 transition-all outline-none uppercase"
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-2">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-gray-200 text-gray-400 py-3 rounded-xl font-black uppercase italic tracking-tight text-xs hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 bg-brand-green text-white py-3 rounded-xl font-black uppercase italic tracking-tight text-xs shadow-md border border-brand-green/10 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> {selectedCustomer ? 'GUARDAR CAMBIOS' : 'CREAR CLIENTE'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClientsView;
