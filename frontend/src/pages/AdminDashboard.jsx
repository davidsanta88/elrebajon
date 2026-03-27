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
      const res = await axios.get(`${API_URL}/api/admin/products`);
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
      await axios.post(`${API_URL}/api/admin/categories`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
        await axios.delete(`${API_URL}/api/admin/categories/${id}`);
        fetchCategories();
      } catch (err) { Swal.fire('Error', 'Error al eliminar', 'error'); }
    }
  };

  // PROVIDER CRUD
  const handleProviderSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      if (isEditingProvider) {
        await axios.put(`${API_URL}/api/admin/providers/${providerForm._id}`, providerForm);
      } else {
        await axios.post(`${API_URL}/api/admin/providers`, providerForm);
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
        await axios.delete(`${API_URL}/api/admin/providers/${id}`);
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
      if (isEditingProduct) {
        await axios.put(`${API_URL}/api/admin/products/${productForm._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API_URL}/api/admin/products`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
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
        await axios.delete(`${API_URL}/api/admin/products/${id}`);
        fetchProducts();
      } catch (err) { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

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
          <SidebarLink icon={<LayoutDashboard size={20} />} label="Inventario" active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setSidebarOpen(false); }} />
          <SidebarLink icon={<Tag size={20} />} label="Categorías" active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); setSidebarOpen(false); }} />
          <SidebarLink icon={<Users size={20} />} label="Proveedores" active={activeTab === 'providers'} onClick={() => { setActiveTab('providers'); setSidebarOpen(false); }} />
          <div className="pt-8 pb-4">
            <p className="px-4 text-[10px] font-black uppercase text-white/50 mb-2">Accesos Directos</p>
            <SidebarLink icon={<Home size={20} />} label="Ver Tienda" onClick={() => navigate('/')} />
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
          
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter leading-tight">
                {activeTab === 'products' ? 'Gestión de Inventario' : activeTab === 'categories' ? 'Gestión de Categorías' : 'Nuestros Proveedores'}
              </h2>
              <p className="text-gray-400 font-bold uppercase text-xs tracking-wider mt-1">
                {activeTab === 'products' ? 'Administra precios, stock y visibilidad de productos' : activeTab === 'categories' ? 'Organiza tu catálogo con categorías dinámicas' : 'Base de datos de suministros'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {activeTab === 'products' ? (
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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <RefreshCw className="animate-spin text-brand-red" size={64} />
              <p className="text-gray-400 font-black uppercase italic animate-pulse">Cargando...</p>
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
                  <div className="flex gap-6 text-center bg-gray-50/50 px-6 py-3 rounded-2xl">
                    <div><p className="text-[10px] uppercase text-gray-400">Stock</p><p className="font-black text-sm">{prod.stock}</p></div>
                    <div><p className="text-[10px] uppercase text-blue-500">Ganancia</p><p className="text-blue-600 font-bold">${prod.profitMargin?.toLocaleString()}</p></div>
                    <div><p className="text-[10px] uppercase text-brand-red">Venta</p><p className="text-brand-red font-black text-lg">${prod.price?.toLocaleString()}</p></div>
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

      <ProductModal show={showProductModal} onClose={() => setShowProductModal(false)} onSubmit={handleProductSubmit} form={productForm} setForm={setProductForm} isEditing={isEditingProduct} categories={categories} providers={providers} />
      <ProviderModal show={showProviderModal} onClose={() => setShowProviderModal(false)} onSubmit={handleProviderSubmit} form={providerForm} setForm={setProviderForm} isEditing={isEditingProvider} />
      <CategoryModal show={showCategoryModal} onClose={() => setShowCategoryModal(false)} onSubmit={handleAddCategory} form={newCategory} setForm={setNewCategory} />
    </div>
  );
};

// HELPER COMPONENTS
const SidebarLink = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all text-sm font-black uppercase ${active ? 'bg-white text-brand-red shadow-lg' : 'hover:bg-white/10 text-white/80'}`}>
    {icon} <span>{label}</span>
  </button>
);

const ProductModal = ({ show, onClose, onSubmit, form, setForm, isEditing, categories, providers }) => {
  if (!show) return null;
  const margin = Number(form.price) - Number(form.purchasePrice);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-gray-800 uppercase italic">Producto</h3>
          <button onClick={onClose}><X size={32} /></button>
        </div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Nombre"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none" /></InputGroup>
            <InputGroup label="Categoría">
              <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl">
                <option value="">Selecciona</option>
                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </InputGroup>
            <div className="md:col-span-2"><InputGroup label="Descripción"><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl min-h-[80px]" /></InputGroup></div>
            <InputGroup label="Valor Compra"><input type="number" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
            <InputGroup label="Valor Venta"><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
            <div className="md:col-span-2 bg-blue-50 p-6 rounded-3xl flex justify-between items-center">
               <p className="text-xs font-black uppercase text-blue-500">Ganancia: <span className="text-2xl ml-2">${margin.toLocaleString()}</span></p>
               <p className="text-xs font-black uppercase text-blue-400">{form.purchasePrice > 0 ? ((margin/form.purchasePrice)*100).toFixed(1) : 0}%</p>
            </div>
          </div>
          <div className="space-y-6">
            <InputGroup label="Proveedor"><select required value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl">
              <option value="">Selecciona</option>
              {providers.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
            </select></InputGroup>
            <div className="grid grid-cols-2 gap-2"><InputGroup label="Stock"><input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup><InputGroup label="Min"><input type="number" value={form.stockMin} onChange={e => setForm({...form, stockMin: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup></div>
            <InputGroup label="Estado"><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl"><option value="Activo">Activo</option><option value="Inactivo">Inactivo</option></select></InputGroup>
            <InputGroup label="Fotos"><input type="file" multiple onChange={e => setForm({...form, images: Array.from(e.target.files)})} className="text-xs" />
               {form.images.length > 0 && <p className="text-[10px] uppercase font-bold text-brand-red mt-2">{form.images.length} archivos seleccionados</p>}
            </InputGroup>
          </div>
          <button type="submit" className="md:col-span-3 bg-brand-red text-white font-black py-5 rounded-2xl uppercase text-xl shadow-xl hover:scale-[1.01] transition-all">Guardar Producto</button>
        </form>
      </div>
    </div>
  );
};

const ProviderModal = ({ show, onClose, onSubmit, form, setForm, isEditing }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black uppercase">{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3><button onClick={onClose}><X size={32}/></button></div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label="Nombre"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
          <InputGroup label="Teléfono"><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
          <InputGroup label="Dirección"><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
          <InputGroup label="Sitio Web"><input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup>
          <div className="md:col-span-2"><InputGroup label="Email"><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl" /></InputGroup></div>
          <div className="md:col-span-2"><InputGroup label="Observaciones"><textarea value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl min-h-[80px]" /></InputGroup></div>
          <button type="submit" className="md:col-span-2 bg-brand-red text-white font-black py-4 rounded-2xl uppercase">Guardar</button>
        </form>
      </div>
    </div>
  );
};

const CategoryModal = ({ show, onClose, onSubmit, form, setForm }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black uppercase italic">Nueva Categoría</h3><button onClick={onClose}><X size={32}/></button></div>
        <form onSubmit={onSubmit} className="space-y-6">
          <InputGroup label="Nombre"><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl outline-none" /></InputGroup>
          <InputGroup label="Icono"><input required type="file" onChange={e => setForm({...form, image: e.target.files[0]})} className="w-full border-2 border-dashed border-gray-100 p-8 rounded-2xl" /></InputGroup>
          <button type="submit" className="w-full bg-brand-green text-white font-black py-4 rounded-2xl uppercase shadow-lg">Crear</button>
        </form>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon, children }) => (
  <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 flex items-center gap-2">{icon} {label}</label>{children}</div>
);

export default AdminDashboard;
