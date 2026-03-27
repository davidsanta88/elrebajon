import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Menu, 
  Search, 
  MessageCircle, 
  PhoneCall, 
  Flame,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, FreeMode } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const AppContent = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Carousel slides removed for space optimization

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setLoading(false);
    }
  };

  const allProducts = products;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-brand-red text-white p-2 px-3 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* LOGO & MENU */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button className="p-1">
              <Menu size={20} />
            </button>
            <h1 className="text-base sm:text-xl font-black uppercase italic tracking-tighter leading-none whitespace-nowrap">
              El Rebajón
            </h1>
          </div>
          
          {/* INLINE CATEGORIES (CENTER / MARQUEE) */}
          <div className="flex-1 overflow-hidden h-10 flex items-center">
            <Swiper
              modules={[Autoplay, FreeMode]}
              loop={true}
              speed={15000}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
              }}
              freeMode={true}
              slidesPerView="auto"
              spaceBetween={12}
              className="w-full categories-marquee"
            >
              {categories.map((cat, idx) => (
                <SwiperSlide key={cat._id || idx} style={{ width: 'auto' }}>
                  <button className="flex items-center shrink-0 bg-white/10 hover:bg-brand-yellow hover:text-brand-red px-3 py-1.5 rounded-full transition-all active:scale-95 border border-white/5 group">
                    <span className="text-[10px] sm:text-[13px] font-black uppercase tracking-tighter whitespace-nowrap">
                      {cat.name}
                    </span>
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* CONTACT BUTTON */}
          <div className="shrink-0 flex items-center gap-1 bg-white/15 border border-white/20 rounded-full px-2 py-1 hover:bg-white/30 transition-colors cursor-pointer">
            <MessageCircle size={12} className="text-white" fill="white" />
            <span className="text-[8px] sm:text-[10px] font-black uppercase hidden sm:inline">Chat</span>
          </div>
        </div>
      </header>
      {/* COMPACT WELCOME BANNER (Saves space) */}
      <section className="bg-gradient-to-r from-brand-red to-red-600 py-3 px-4 shadow-inner">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">📦</span>
            <h2 className="text-white font-black uppercase italic tracking-tighter text-sm sm:text-lg leading-tight">
              ¡Productos <span className="text-brand-yellow">Nuevos</span> y <span className="text-brand-yellow">Usados</span>!
            </h2>
            <span className="text-2xl animate-bounce">♻️</span>
          </div>
        </div>
      </section>

      {/* SEARCH BAR SECTION REMOVED (NOW IN HEADER) */}
      


      {/* HERO BANNERS ARE REMOVED ACCORDING TO USER REQUEST */}

      {/* CATALOGO COMPLETO */}
      <section className="py-8 container mx-auto px-4" id="catalogo">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-[3px] w-16 bg-brand-red rounded-full"></div>
          <h3 className="text-2xl sm:text-3xl font-black uppercase text-gray-800 tracking-tight italic">Nuestros Productos</h3>
          <div className="h-[3px] w-16 bg-brand-red rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allProducts.map((prod) => (
            <div key={prod._id} className={`bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative ${
              prod.isOffer ? 'border-4 border-brand-yellow scale-[1.02] z-10' : 'border border-gray-100'
            }`}>
              {/* OFFER BADGE */}
              {prod.isOffer && (
                <div className="absolute top-4 left-[-10px] z-20 bg-brand-red text-white font-black px-4 py-1.5 rounded-r-full shadow-lg text-[10px] uppercase italic tracking-widest animate-pulse border-y-2 border-brand-yellow">
                  🔥 ¡OFERTA!
                </div>
              )}

              <div className="aspect-square bg-gray-100 relative">
                <img src={prod.mainImage || `https://placehold.co/400x400?text=${prod.name}`} alt={prod.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <div className="bg-white/90 px-2 py-0.5 rounded text-[8px] font-black text-brand-red uppercase shadow-md border border-gray-100">
                    {prod.category}
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-1 grow">
                <h4 className="text-[11px] font-black text-gray-800 uppercase line-clamp-1 italic tracking-tight">{prod.name}</h4>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                  <div className="flex flex-col">
                    {prod.isOffer && <span className="text-[9px] text-gray-400 line-through font-bold">${(prod.price * 1.2).toLocaleString()}</span>}
                    <span className="text-brand-red font-black text-xl italic tracking-tighter leading-none">${prod.price.toLocaleString()}</span>
                  </div>
                  <button className="bg-brand-red text-white rounded-lg px-4 py-2 font-black uppercase text-[10px] shadow-sm hover:scale-105 active:scale-95 transition-transform">
                    VER
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA WHATSAPP */}
      <section className="py-8 container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-[1px] w-12 bg-gray-200"></div>
          <h3 className="text-sm font-black uppercase text-gray-400 tracking-[0.2em]">¿Te interesa algo?</h3>
          <div className="h-[1px] w-12 bg-gray-200"></div>
        </div>
        
        <button className="w-full max-w-sm mx-auto bg-brand-green text-white font-black text-xl py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform active:scale-95 shadow-green-200">
          <MessageCircle size={32} fill="white" />
          Hablar por WhatsApp
        </button>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-white border-t border-gray-100 py-8 px-4">
        <p className="text-gray-400 text-xs font-bold italic tracking-wider mb-6 text-center uppercase">Compra fácil y seguro en tu pueblo</p>
        <div className="flex justify-center gap-12 mb-8">
          <a href="tel:+573000000000" className="flex flex-col items-center gap-1 text-brand-red transition-opacity hover:opacity-70">
            <PhoneCall size={24} />
            <span className="font-black uppercase text-[10px]">Llámanos</span>
          </a>
          <a href="https://wa.me/573000000000" className="flex flex-col items-center gap-1 text-brand-green transition-opacity hover:opacity-70">
            <MessageCircle size={24} />
            <span className="font-black uppercase text-[10px]">Escríbenos</span>
          </a>
          <button onClick={() => navigate('/login')} className="flex flex-col items-center gap-1 text-gray-400 transition-opacity hover:opacity-70">
            <Settings size={24} />
            <span className="font-black uppercase text-[10px]">Panel</span>
          </button>
        </div>
        <p className="text-[10px] text-gray-300 font-bold uppercase text-center tracking-widest">© 2026 EL REBAJÓN COLOMBIA</p>
      </footer>

    </div>
  );
};

export default AppContent;
