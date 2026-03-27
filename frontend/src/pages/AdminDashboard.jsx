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
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

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
      await axios.post(`${API_URL}/api/seed`);
      Swal.fire('Éxito', 'Base de datos reiniciada con datos de prueba', 'success');
      fetchProducts();
    } catch (err) {
      Swal.fire('Error', 'No se pudo reiniciar la data', 'error');
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
        
        {/* DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-800 uppercase italic">Gestión de Inventario</h2>
            <p className="text-gray-500 font-bold uppercase text-xs">Administra tus productos, precios y proveedores</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
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
          </div>
        </div>

        {/* PRODUCTS TABLE / CARDS */}
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="animate-spin text-brand-red" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {products.length === 0 ? (
              <div className="bg-white p-20 rounded-3xl text-center shadow-sm">
                <Package size={64} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-black uppercase italic">No hay productos disponibles</p>
              </div>
            ) : (
                products.map((prod) => (
                  <div key={prod._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                    {/* Image Placeholder */}
                    <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Package size={40} className="text-gray-300" />
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 w-full text-center md:text-left">
                      <span className="text-[10px] font-black uppercase text-brand-red bg-red-50 px-2 py-0.5 rounded-full mb-1 inline-block">
                        {prod.category}
                      </span>
                      <h4 className="text-lg font-black text-gray-800 uppercase truncate">{prod.name}</h4>
                      <p className="text-xs font-bold text-gray-400 flex items-center justify-center md:justify-start gap-1">
                        <UserIcon size={12} /> Proveedor: <span className="text-gray-600">{prod.provider || 'Sin asignar'}</span>
                      </p>
                    </div>

                    {/* Prices */}
                    <div className="flex gap-4 md:gap-8 bg-gray-50 px-6 py-3 rounded-2xl w-full md:w-auto justify-center">
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Costo (Compra)</p>
                        <p className="text-gray-500 font-bold">${prod.purchasePrice?.toLocaleString() || '0'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-brand-red mb-0.5">Venta (Público)</p>
                        <p className="text-brand-red font-black text-xl">${prod.price?.toLocaleString() || '0'}</p>
                      </div>
                    </div>

                    {/* Actions */}
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
        )}

      </main>

    </div>
  );
};

export default AdminDashboard;
