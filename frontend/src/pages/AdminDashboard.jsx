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
  FileText
} from 'lucide-react';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'providers'
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  
  // Form States
  const [newCategory, setNewCategory] = useState({ name: '', image: null });
  const [providerForm, setProviderForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    website: '',
    observation: ''
  });

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchCategories(), fetchProviders()]);
    setLoading(false);
  };

  const fetchProviders = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.get(`${API_URL}/api/providers`);
      setProviders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.get(`${API_URL}/api/admin/products`);
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
    }
  };

  const handleSeed = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.get(`${API_URL}/api/seed`);
      Swal.fire('Éxito', 'Base de datos reiniciada con datos de prueba', 'success');
      fetchData();
    } catch (err) {
      Swal.fire('Error', 'No se pudo reiniciar la data', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará esta categoría permanentemente",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff0000',
      cancelButtonColor: '#ccc',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        await axios.delete(`${API_URL}/api/admin/categories/${id}`);
        Swal.fire('Eliminado', 'La categoría ha sido eliminada', 'success');
        fetchCategories();
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar la categoría', 'error');
      }
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newCategory.name);
    formData.append('image', newCategory.image);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.post(`${API_URL}/api/admin/categories`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire('Éxito', 'Categoría creada correctamente', 'success');
      setShowCategoryModal(false);
      setNewCategory({ name: '', image: null });
      fetchCategories();
    } catch (err) {
      Swal.fire('Error', 'No se pudo crear la categoría', 'error');
    }
  };

  const handleProviderSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      if (isEditingProvider) {
        await axios.put(`${API_URL}/api/admin/providers/${providerForm._id}`, providerForm);
        Swal.fire('Éxito', 'Proveedor actualizado', 'success');
      } else {
        await axios.post(`${API_URL}/api/admin/providers`, providerForm);
        Swal.fire('Éxito', 'Proveedor creado', 'success');
      }
      setShowProviderModal(false);
      setProviderForm({ name: '', phone: '', address: '', email: '', website: '', observation: '' });
      fetchProviders();
    } catch (err) {
      Swal.fire('Error', 'Error al procesar proveedor', 'error');
    }
  };

  const handleDeleteProvider = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar proveedor?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff0000',
      confirmButtonText: 'Sí, eliminar'
    });
    if (confirm.isConfirmed) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        await axios.delete(`${API_URL}/api/admin/providers/${id}`);
        fetchProviders();
        Swal.fire('Eliminado', 'Proveedor eliminado correctamente', 'success');
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar', 'error');
      }
    }
  };

  const handleEditProvider = (p) => {
    setProviderForm(p);
    setIsEditingProvider(true);
    setShowProviderModal(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-1">
            EL REBAJÓN
          </h1>
          <span className="bg-white text-brand-red px-2 py-0.5 rounded text-[10px] font-black italic">PANEL ADMINISTRATIVO</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <SidebarLink 
            icon={<LayoutDashboard size={20} />} 
            label="Inventario" 
            active={activeTab === 'products'} 
            onClick={() => { setActiveTab('products'); setSidebarOpen(false); }} 
          />
          <SidebarLink 
            icon={<Tag size={20} />} 
            label="Categorías" 
            active={activeTab === 'categories'} 
            onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }} 
          />
          <SidebarLink 
            icon={<Users size={20} />} 
            label="Proveedores" 
            active={activeTab === 'providers'} 
            onClick={() => { setActiveTab('providers'); setSidebarOpen(false); }} 
          />
          
          <div className="pt-8 pb-4">
            <p className="px-4 text-[10px] font-black uppercase text-white/50 mb-2">Accesos Directos</p>
            <SidebarLink 
              icon={<Home size={20} />} 
              label="Ver Tienda" 
              onClick={() => navigate('/')} 
            />
          </div>
        </nav>

        <div className="p-4 bg-black/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm font-black uppercase"
          >
            <LogOut size={20} /> Salir
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-0">
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          
          {/* HEADER */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter leading-tight">
                {activeTab === 'products' ? 'Gestión de Inventario' : 
                 activeTab === 'categories' ? 'Gestión de Categorías' : 'Nuestros Proveedores'}
              </h2>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-wider mt-1">
                {activeTab === 'products' ? 'Administra precios, stock y visibilidad de productos' : 
                 activeTab === 'categories' ? 'Organiza tu catálogo con categorías dinámicas e iconos' : 'Base de datos centralizada de suministros y contactos'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {activeTab === 'products' ? (
                <>
                  <button onClick={handleSeed} className="bg-white border-2 border-brand-red text-brand-red font-black p-3 rounded-xl hover:bg-brand-red hover:text-white transition-all shadow-sm">
                    <RefreshCw size={20} />
                  </button>
                  <button onClick={() => Swal.fire('Info', 'Módulo en desarrollo', 'info')} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 uppercase text-sm">
                    <Plus size={20} /> Nuevo Producto
                  </button>
                </>
              ) : activeTab === 'categories' ? (
                <button onClick={() => setShowCategoryModal(true)} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 uppercase text-sm">
                  <Plus size={20} /> Nueva Categoría
                </button>
              ) : (
                <button onClick={() => { setIsEditingProvider(false); setProviderForm({ name: '', phone: '', address: '', email: '', website: '', observation: '' }); setShowProviderModal(true); }} className="bg-brand-green text-white font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 uppercase text-sm">
                  <Plus size={20} /> Nuevo Proveedor
                </button>
              )}
            </div>
          </div>

          {/* TAB CONTENT */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <RefreshCw className="animate-spin text-brand-red" size={64} />
              <p className="text-gray-400 font-black uppercase italic animate-pulse">Cargando información...</p>
            </div>
          ) : activeTab === 'products' ? (
            <div className="grid grid-cols-1 gap-4">
              {products.map((prod) => (
                <div key={prod._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 group hover:shadow-xl transition-all">
                  <div className="w-32 h-32 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                    {prod.image ? <img src={prod.image} className="w-full h-full object-cover" /> : <Package size={48} className="text-gray-200" />}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <span className="text-[10px] font-black uppercase text-brand-red bg-red-50 px-3 py-1 rounded-full mb-2 inline-block tracking-widest">{prod.category}</span>
                    <h4 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">{prod.name}</h4>
                    <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">{prod.provider}</p>
                  </div>
                  <div className="flex gap-12 text-center bg-gray-50/50 px-10 py-5 rounded-3xl">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Costo</p>
                      <p className="text-gray-600 font-bold">${prod.purchasePrice?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-brand-red mb-1">Venta</p>
                      <p className="text-brand-red font-black text-2xl">${prod.price?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-4 rounded-2xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all"><Edit size={24} /></button>
                    <button className="p-4 rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 size={24} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'categories' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <div key={cat._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 text-center relative group">
                  <div className="w-full aspect-square bg-gray-50 rounded-[1.5rem] mb-6 flex items-center justify-center p-8 border border-gray-50 group-hover:scale-105 transition-transform">
                    <img src={cat.image} className="w-full h-full object-contain" />
                  </div>
                  <h4 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter">{cat.name}</h4>
                  <button onClick={() => handleDeleteCategory(cat._id)} className="absolute top-4 right-4 p-2 bg-red-50 text-brand-red rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-red hover:text-white">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map((p) => (
                <div key={p._id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col gap-6 relative group overflow-hidden">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">{p.name}</h3>
                    <p className="text-brand-red text-xs font-black uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded inline-block w-fit">Socio Comercial</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-gray-500">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-brand-red"><Phone size={16} /></div>
                      <span className="text-xs font-bold">{p.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-brand-red"><Globe size={16} /></div>
                      <span className="text-xs font-bold truncate">{p.website || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 col-span-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-brand-red"><MapPin size={16} /></div>
                      <span className="text-xs font-bold">{p.address || 'N/A'}</span>
                    </div>
                  </div>

                  {p.observation && (
                    <div className="bg-gray-50 p-4 rounded-2xl border-l-4 border-brand-yellow">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Observaciones</p>
                      <p className="text-xs font-bold text-gray-600 leading-relaxed italic">{p.observation}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => handleEditProvider(p)} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-brand-red hover:text-white p-3 rounded-xl transition-all text-[10px] font-black uppercase">
                      <Edit size={14} /> Editar
                    </button>
                    <button onClick={() => handleDeleteProvider(p._id)} className="p-3 bg-red-50 text-brand-red hover:bg-brand-red hover:text-white rounded-xl transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODALS (SAME STYLE) */}
      <ProviderModal 
        show={showProviderModal} 
        onClose={() => setShowProviderModal(false)}
        onSubmit={handleProviderSubmit}
        form={providerForm}
        setForm={setProviderForm}
        isEditing={isEditingProvider}
      />
      
      <CategoryModal 
        show={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={handleAddCategory}
        form={newCategory}
        setForm={setNewCategory}
      />

    </div>
  );
};

// MINI COMPONENTS
const SidebarLink = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all text-sm font-black uppercase ${active ? 'bg-white text-brand-red shadow-lg scale-105' : 'hover:bg-white/10 text-white/80'}`}
  >
    {icon} <span>{label}</span>
  </button>
);

const ProviderModal = ({ show, onClose, onSubmit, form, setForm, isEditing }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
            <p className="text-[10px] font-black uppercase text-brand-red tracking-widest mt-1">Completa los datos del socio comercial</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-800"><X size={32} /></button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Nombre del Proveedor" icon={<UserIcon size={16}/>}>
            <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red p-4 rounded-2xl outline-none font-bold" />
          </InputGroup>
          <InputGroup label="Teléfono" icon={<Phone size={16}/>}>
            <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red p-4 rounded-2xl outline-none font-bold" />
          </InputGroup>
          <InputGroup label="Dirección" icon={<MapPin size={16}/>}>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red p-4 rounded-2xl outline-none font-bold" />
          </InputGroup>
          <InputGroup label="Página Web" icon={<Globe size={16}/>}>
            <input type="text" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red p-4 rounded-2xl outline-none font-bold" />
          </InputGroup>
          <div className="md:col-span-2">
            <InputGroup label="Email Corporativo" icon={<FileText size={16}/>}>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red p-4 rounded-2xl outline-none font-bold" />
            </InputGroup>
          </div>
          <div className="md:col-span-2">
            <InputGroup label="Observaciones" icon={<FileText size={16}/>}>
              <textarea value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} className="w-full bg-gray-50 border-2 border-transparent focus:border-brand-red p-4 rounded-2xl outline-none font-bold min-h-[100px]" />
            </InputGroup>
          </div>
          <button type="submit" className="md:col-span-2 bg-brand-red text-white font-black py-5 rounded-2xl uppercase tracking-tighter text-lg shadow-xl hover:scale-[1.02] transition-transform mt-4">Guardar Proveedor</button>
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
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter">Nueva Categoría</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-800"><X size={32} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <InputGroup label="Nombre">
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold" />
          </InputGroup>
          <InputGroup label="Icono">
            <input required type="file" onChange={e => setForm({...form, image: e.target.files[0]})} className="w-full cursor-pointer" />
          </InputGroup>
          <button type="submit" className="w-full bg-brand-green text-white font-black py-5 rounded-2xl uppercase tracking-tighter text-lg shadow-xl hover:scale-[1.02] transition-transform">Crear Categoría</button>
        </form>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest flex items-center gap-2">
      {icon} {label}
    </label>
    {children}
  </div>
);

export default AdminDashboard;
