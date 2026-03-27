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
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const slides = [
    {
      image: 'https://res.cloudinary.com/dtab1b41r/image/upload/v1/elrebajon/banners/banner_home_mixto_total_estufa_animales_final_1774640924220.png',
      title: 'PRODUCTOS NUEVOS Y USADOS',
      subtitle: 'DE LA MEJOR CALIDAD'
    },
    {
      image: 'https://res.cloudinary.com/dtab1b41r/image/upload/v1/elrebajon/banners/banner_home_alternativa_mobiliario_electro_1774640642696.png',
      title: 'TODO PARA TU HOGAR',
      subtitle: 'AL MEJOR PRECIO'
    },
    {
      image: 'https://res.cloudinary.com/dtab1b41r/image/upload/v1/elrebajon/banners/banner_home_el_rebajon_premium_final_1774640533505.png',
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

  const matchesSearch = (p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase());

  const offers = products.filter(p => p.isOffer && matchesSearch(p));
  const allProducts = products.filter(matchesSearch);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-brand-red text-white p-2 px-3 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto">
          {/* TOP ROW: Logo, Categories, Contact */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2">
            
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

          {/* BOTTOM ROW: SEARCH BAR */}
          <div className="max-w-xl mx-auto flex bg-white/10 rounded-full border border-white/20 overflow-hidden mb-1 focus-within:bg-white/20 focus-within:border-white transition-all group">
            <input 
              type="text" 
              placeholder="¿Qué estás buscando en El Rebajón?" 
              className="flex-1 bg-transparent px-5 py-2 outline-none text-white placeholder:text-white/60 font-bold text-xs sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="bg-white/20 text-white px-4 hover:bg-white hover:text-brand-red transition-all flex items-center justify-center">
              <Search size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO CAROUSEL */}
      <section className="relative w-full aspect-[4/3] sm:aspect-[21/9] lg:aspect-[21/7] overflow-hidden bg-brand-red">
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
                  <div className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 z-20">
                    <button className="bg-brand-yellow text-brand-red text-[10px] sm:text-lg font-black py-2 px-6 sm:py-2.5 sm:px-8 rounded-xl shadow-[0_4px_0_0_rgba(180,140,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all uppercase whitespace-nowrap">
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
          
          /* MARQUEE LINEAR TRANSITION */
          .categories-marquee .swiper-wrapper {
            transition-timing-function: linear !important;
          }
        `}} />
      </section>

      {/* SEARCH BAR SECTION REMOVED (NOW IN HEADER) */}
      <div className="h-6"></div>


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
                  <img src={prod.mainImage || `https://placehold.co/200x200?text=${prod.name}`} alt={prod.name} className="w-full h-full object-cover" />
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

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allProducts.map((prod) => (
            <div key={prod._id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="aspect-square bg-gray-100 relative">
                <img src={prod.mainImage || `https://placehold.co/400x400?text=${prod.name}`} alt={prod.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <div className="bg-white/90 px-2 py-0.5 rounded text-[8px] font-black text-brand-red uppercase shadow-sm">
                    {prod.category}
                  </div>
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
