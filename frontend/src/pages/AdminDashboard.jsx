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
  Home
} from 'lucide-react';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'categories'
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', image: null });
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setLoading(false);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-brand-red text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black uppercase italic tracking-tighter">
              El Rebajón <span className="bg-white text-brand-red px-2 py-0.5 rounded ml-2 text-xs not-italic">ADMIN</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="hover:bg-white/20 p-2 rounded-full transition-colors">
              <Home size={20} />
            </button>
            <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold uppercase transition-colors">
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8">
        
        {/* TABS */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-black uppercase text-sm transition-all ${activeTab === 'products' ? 'bg-brand-red text-white shadow-lg' : 'bg-white text-gray-400'}`}
          >
            Productos
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-black uppercase text-sm transition-all ${activeTab === 'categories' ? 'bg-brand-red text-white shadow-lg' : 'bg-white text-gray-400'}`}
          >
            Categorías
          </button>
        </div>

        {/* DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-800 uppercase italic">
              {activeTab === 'products' ? 'Gestión de Inventario' : 'Gestión de Categorías'}
            </h2>
            <p className="text-gray-500 font-bold uppercase text-xs">
              {activeTab === 'products' ? 'Administra tus productos, precios y proveedores' : 'Administra las categorías de productos para el home'}
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {activeTab === 'products' ? (
              <>
                <button 
                  onClick={handleSeed}
                  className="flex-1 md:flex-none border-2 border-brand-red text-brand-red font-black py-2 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-red hover:text-white transition-colors uppercase text-sm"
                >
                  <RefreshCw size={18} /> Reiniciar Data
                </button>
                <button 
                  onClick={() => Swal.fire('Información', 'Módulo de creación en desarrollo', 'info')}
                  className="flex-1 md:flex-none bg-brand-green text-white font-black py-2 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-transform uppercase text-sm"
                >
                  <Plus size={18} /> Nuevo Producto
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="flex-1 md:flex-none bg-brand-green text-white font-black py-2 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-105 transition-transform uppercase text-sm"
              >
                <Plus size={18} /> Nueva Categoría
              </button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="animate-spin text-brand-red" size={48} />
          </div>
        ) : activeTab === 'products' ? (
          <div className="grid grid-cols-1 gap-4">
            {products.length === 0 ? (
              <div className="bg-white p-20 rounded-3xl text-center shadow-sm">
                <Package size={64} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-black uppercase italic">No hay productos disponibles</p>
              </div>
            ) : (
                products.map((prod) => (
                  <div key={prod._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                    {/* ... (Existing product card code) ... */}
                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Package size={40} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 w-full text-center md:text-left">
                      <span className="text-[10px] font-black uppercase text-brand-red bg-red-50 px-2 py-0.5 rounded-full mb-1 inline-block">
                        {prod.category}
                      </span>
                      <h4 className="text-lg font-black text-gray-800 uppercase truncate">{prod.name}</h4>
                      <p className="text-xs font-bold text-gray-400 flex items-center justify-center md:justify-start gap-1">
                        <UserIcon size={12} /> Proveedor: <span className="text-gray-600">{prod.provider || 'Sin asignar'}</span>
                      </p>
                    </div>
                    <div className="flex gap-4 md:gap-8 bg-gray-50 px-6 py-3 rounded-2xl w-full md:w-auto justify-center">
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Costo</p>
                        <p className="text-gray-500 font-bold">${prod.purchasePrice?.toLocaleString() || '0'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-brand-red mb-0.5">Venta</p>
                        <p className="text-brand-red font-black text-xl">${prod.price?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto justify-center">
                      <button className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit size={20} />
                      </button>
                      <button className="p-3 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div key={cat._id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-4 text-center group relative overflow-hidden">
                <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden p-4">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-black text-gray-800 uppercase italic tracking-tighter">{cat.name}</h4>
                </div>
                <button 
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="absolute top-2 right-2 bg-red-50 text-brand-red p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-red hover:text-white shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full bg-white p-20 rounded-3xl text-center shadow-sm">
                <Tag size={64} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-black uppercase italic">No hay categorías configuradas</p>
              </div>
            )}
          </div>
        )}

        {/* CATEGORY MODAL */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Nueva Categoría</h3>
                <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600 font-black text-2xl">×</button>
              </div>
              
              <form onSubmit={handleAddCategory} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1 ml-1">Nombre</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-100 rounded-xl px-4 py-3 border-2 border-transparent focus:border-brand-yellow outline-none font-bold text-gray-700"
                    placeholder="Ej: Hogar"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1 ml-1">Icono/Imagen</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-brand-yellow transition-colors cursor-pointer group">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setNewCategory({...newCategory, image: e.target.files[0]})}
                      required 
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Plus size={32} className="text-gray-300 group-hover:text-brand-yellow transition-colors" />
                      <p className="text-[10px] font-black uppercase text-gray-400 group-hover:text-gray-600 transition-colors">
                        {newCategory.image ? newCategory.image.name : 'Haz clic para subir imagen'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 border-2 border-gray-200 text-gray-400 font-black py-4 rounded-xl uppercase text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-brand-green text-white font-black py-4 rounded-xl shadow-lg uppercase text-xs hover:scale-105 transition-transform"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

export default AdminDashboard;
