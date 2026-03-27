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
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const AppContent = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const slides = [
    {
      image: 'https://res.cloudinary.com/davidsanta88s/image/upload/v1774640924/banner_home_mixto_total_estufa_animales_final_1774640924220.png',
      title: 'PRODUCTOS NUEVOS Y USADOS',
      subtitle: 'DE LA MEJOR CALIDAD'
    },
    {
      image: 'https://res.cloudinary.com/davidsanta88s/image/upload/v1774640642/banner_home_alternativa_mobiliario_electro_1774640642696.png',
      title: 'TODO PARA TU HOGAR',
      subtitle: 'AL MEJOR PRECIO'
    },
    {
      image: 'https://res.cloudinary.com/davidsanta88s/image/upload/v1774640533/banner_home_el_rebajon_premium_final_1774640533505.png',
      title: 'LO QUE NECESITAS',
      subtitle: 'MUEBLES, ROPA Y MÁS'
    }
  ];

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

  const offers = products.filter(p => p.isOffer);
  const recent = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-brand-red text-white p-3 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-1">
              <Menu size={32} />
            </button>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">
              El Rebajón
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-brand-red border border-white/30 rounded-full px-3 py-1">
            <MessageCircle size={20} className="text-white" fill="white" />
            <span className="text-xs font-bold uppercase">Contáctanos</span>
          </div>
        </div>
      </header>

      {/* HERO CAROUSEL */}
      <section className="relative w-full aspect-[21/9] lg:aspect-[21/7] overflow-hidden bg-brand-red">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={true}
          loop={true}
          className="h-full w-full mySwiper"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-full">
                <img 
                  src={slide.image} 
                  alt={slide.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/5 flex flex-col items-center justify-center p-4">
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
                    <button className="bg-brand-yellow text-brand-red text-sm sm:text-lg font-black py-2.5 px-8 rounded-xl shadow-[0_4px_0_0_rgba(180,140,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all uppercase whitespace-nowrap">
                      Ver Productos
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* CUSTOM CSS FOR SWIPER HITS */}
        <style dangerouslySetInnerHTML={{ __html: `
          .swiper-pagination-bullet { background: white !important; opacity: 0.5; }
          .swiper-pagination-bullet-active { background: #fbbf24 !important; opacity: 1; transform: scale(1.2); }
          .swiper-button-next, .swiper-button-prev { color: rgba(255,255,255,0.7); transform: scale(0.6); }
          @media (max-width: 640px) { .swiper-button-next, .swiper-button-prev { display: none; } }
        `}} />
      </section>

      {/* SEARCH BAR */}
      <section className="px-4 -mt-6 relative z-20">
        <div className="max-w-md mx-auto flex bg-white rounded-full shadow-lg border-2 border-gray-100 overflow-hidden">
          <input 
            type="text" 
            placeholder="¿Qué estás buscando?" 
            className="flex-1 px-5 py-3 outline-none text-gray-700 font-bold"
          />
          <button className="bg-brand-red text-white p-3">
            <Search size={24} />
          </button>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-8 container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-[2px] w-12 bg-gray-200"></div>
          <h3 className="text-xl font-black uppercase text-gray-800 tracking-wide italic">Categorías</h3>
          <div className="h-[2px] w-12 bg-gray-200"></div>
        </div>
        
        <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
          {categories.map((cat, idx) => (
            <button key={cat._id || idx} className="flex flex-col items-center gap-2 hover:scale-110 transition-transform group">
              <div className="bg-brand-red border-2 border-red-600 text-white w-full aspect-square rounded-[2rem] flex items-center justify-center shadow-lg overflow-hidden p-0 group-hover:shadow-red-200 transition-shadow">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase text-gray-800 break-words w-full text-center leading-tight">
                {cat.name}
              </span>
            </button>
          ))}
          {categories.length === 0 && !loading && (
            <p className="col-span-4 text-center text-gray-400 text-xs font-bold uppercase italic">No hay categorías cargadas</p>
          )}
        </div>
      </section>

      {/* OFFERS */}
      <section className="bg-brand-yellow py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="text-brand-red fill-brand-red" />
            <h3 className="text-xl font-black uppercase text-brand-red italic">Ofertas de Hoy</h3>
            <Flame className="text-brand-red fill-brand-red" />
          </div>

          <div className="flex overflow-x-auto gap-4 pb-2 snap-x px-2 scrollbar-hide">
            {offers.length > 0 ? offers.map((prod) => (
              <div key={prod._id} className="min-w-[280px] bg-white rounded-2xl p-3 flex gap-3 shadow-md snap-center border border-yellow-200">
                <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  <img src={prod.image || `https://placehold.co/200x200?text=${prod.name}`} alt={prod.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-800 line-clamp-2 uppercase leading-tight">{prod.name}</h4>
                    <p className="text-brand-red font-black text-xl italic">${prod.price.toLocaleString()}</p>
                  </div>
                  <button className="bg-brand-red text-white text-[10px] font-black uppercase py-1.5 px-3 rounded-lg self-start shadow-sm">
                    Ver Oferta
                  </button>
                </div>
              </div>
            )) : (
              <p className="text-brand-red font-bold text-center w-full uppercase text-xs italic opacity-50">Cargando ofertas...</p>
            )}
          </div>
        </div>
      </section>

      {/* NEW PRODUCTS */}
      <section className="py-8 container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-[2px] w-12 bg-gray-200"></div>
          <div className="bg-brand-red rounded-full p-1 text-white text-[10px] font-black italic">NEW</div>
          <h3 className="text-xl font-black uppercase text-gray-800 tracking-wide italic">Recién Publicados</h3>
          <div className="h-[2px] w-12 bg-gray-200"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recent.map((prod) => (
            <div key={prod._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 relative">
                <img src={prod.image || `https://placehold.co/400x400?text=${prod.name}`} alt={prod.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded text-[8px] font-black text-brand-red uppercase">
                  {prod.category}
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1">
                <h4 className="text-xs font-black text-gray-700 uppercase line-clamp-1">{prod.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-brand-red font-black text-lg italic tracking-tighter">${prod.price.toLocaleString()}</span>
                  <button className="bg-brand-red text-white rounded-md px-3 py-1 font-black uppercase text-[10px] shadow-sm">
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
