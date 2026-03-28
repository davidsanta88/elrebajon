import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Menu, 
  Search, 
  MessageCircle, 
  PhoneCall, 
  Flame,
  Settings,
  X,
  Package,
  ShieldCheck,
  Tag
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
  const [selectedProduct, setSelectedProduct] = useState(null);
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

  const ProductDetailModal = ({ product, onClose }) => {
    if (!product) return null;
    const images = product.images && product.images.length > 0 ? product.images : [product.mainImage];
    
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300">
        <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row relative flex-1 sm:max-h-[90vh]">
          
          {/* CLOSE BUTTON */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-[110] bg-white/20 hover:bg-white text-white hover:text-brand-red p-2 rounded-full backdrop-blur-md transition-all sm:text-gray-400 sm:hover:bg-gray-100"
          >
            <X size={24} />
          </button>

          {/* GALLERY AREA */}
          <div className="w-full md:w-1/2 h-[50vh] md:h-full bg-gray-50 relative group">
            <Swiper
              modules={[Pagination, Navigation]}
              pagination={{ clickable: true }}
              navigation={true}
              loop={images.length > 1}
              className="h-full w-full product-detail-swiper"
            >
              {images.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                </SwiperSlide>
              ))}
            </Swiper>
            
            {/* BADGES ON IMAGE */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
               {product.isOffer && (
                 <span className="bg-brand-red text-white text-[10px] font-black px-3 py-1 rounded-full uppercase italic tracking-widest shadow-lg animate-pulse">🔥 Oferta</span>
               )}
               <span className="bg-white/90 text-brand-red text-[8px] font-black px-3 py-1 rounded-full uppercase shadow-sm border border-gray-100">{product.category}</span>
            </div>
          </div>

          {/* INFO AREA */}
          <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col overflow-y-auto">
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-1">{product.condition === 'Usado' ? '♻️ Usado Seleccionado' : '🔥 Nuevo de Paquete'}</p>
              <h2 className="text-2xl sm:text-4xl font-black text-gray-800 uppercase italic tracking-tighter leading-none mb-2">{product.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-black text-brand-red italic">${product.price.toLocaleString()}</span>
                {product.isOffer && <span className="text-gray-300 line-through font-bold text-sm sm:text-lg">${(product.price * 1.2).toLocaleString()}</span>}
              </div>
            </div>

            <div className="space-y-6 mb-8 flex-1">
              <div>
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 flex items-center gap-1"><Package size={12}/> Descripción Técnica</h4>
                <p className="text-sm font-bold text-gray-600 leading-relaxed uppercase italic">{product.description || 'Sin descripción disponible para este artículo.'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3 border border-gray-100">
                  <ShieldCheck className="text-brand-green" size={20}/>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Garantía</p>
                    <p className="text-[10px] font-black text-gray-800 uppercase italic">Calidad 100%</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3 border border-gray-100">
                  <Tag className="text-brand-red" size={20}/>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Estado</p>
                    <p className="text-[10px] font-black text-gray-800 uppercase italic">{product.condition}</p>
                  </div>
                </div>
              </div>
            </div>

            <a 
              href={`https://wa.me/573114018724?text=Hola!%20Me%20interesa%20este%20producto:%20${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-green text-white font-black text-xl py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 shadow-green-200 mt-auto"
            >
              <MessageCircle size={28} fill="white" />
              COMPRAR POR WHATSAPP
            </a>
          </div>
        </div>

        {/* SWIPER CUSTOM STYLES */}
        <style dangerouslySetInnerHTML={{ __html: `
          .product-detail-swiper .swiper-pagination-bullet { background: #ff0000 !important; }
          .product-detail-swiper .swiper-button-next, .product-detail-swiper .swiper-button-prev { color: #ff0000 !important; transform: scale(0.6); }
          .card-inner-swiper .swiper-pagination-bullet { width: 4px; height: 4px; background: white !important; opacity: 0.7; }
          .card-inner-swiper .swiper-pagination-bullet-active { background: #fbbf24 !important; opacity: 1; transform: scale(1.5); }
          
          /* Linear Marquee Effect */
          .categories-marquee-main .swiper-wrapper {
            transition-timing-function: linear !important;
          }

          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); } /* Since we use 3 copies */
          }
          .animate-marquee {
            display: flex;
            animation: marquee 30s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}} />
      </div>
    );
  };

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
          
          {/* HEADER MESSAGE (NEW & USED) - More compact for Row 1 */}
          <div className="flex-1 flex justify-center items-center px-4 overflow-hidden">
            <h2 className="text-white font-black uppercase italic tracking-tighter text-[10px] sm:text-sm leading-tight text-center drop-shadow-md">
              ¡Productos <span className="text-brand-yellow underline decoration-brand-yellow/30">Nuevos</span> y <span className="text-brand-yellow underline decoration-brand-yellow/30">Usados</span>!
            </h2>
          </div>

            {/* CONTACT BUTTON (WHATSAPP) */}
            <a 
              href="https://wa.me/573114018724" 
              target="_blank" 
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 bg-brand-green border border-white/20 rounded-full px-3 py-1.5 hover:bg-green-600 transition-colors cursor-pointer shadow-lg"
            >
              <MessageCircle size={14} className="text-white" fill="white" />
              <span className="text-[10px] font-black uppercase inline">Chat</span>
            </a>
        </div>
      </header>
      {/* FULL WIDTH CATEGORY MARQUEE (Below Header) - Custom CSS Marquee for 100% Reliability */}
      <section className="bg-brand-red border-t border-white/10 py-3 overflow-hidden shadow-lg relative h-14 flex items-center">
        <div className="marquee-wrapper flex whitespace-nowrap">
          <div className="marquee-content flex gap-4 px-4 animate-marquee">
            {[...categories, ...categories, ...categories].map((cat, idx) => (
              <button 
                key={`${cat._id}-${idx}`}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full border border-white/10 transition-all active:scale-95 group shrink-0"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-yellow/50 bg-gray-800">
                  <img src={cat.image || `https://placehold.co/100x100?text=${cat.name[0]}`} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                  {cat.name}
                </span>
              </button>
            ))}
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
          {allProducts.map((prod) => {
            const cardImages = prod.images && prod.images.length > 0 ? prod.images : [prod.mainImage];
            return (
              <div 
                key={prod._id} 
                onClick={(e) => {
                  // Prevenir que el click en los botones de navegación del swiper abra el modal
                  if (e.target.closest('.swiper-button-next') || e.target.closest('.swiper-button-prev') || e.target.closest('.swiper-pagination')) return;
                  setSelectedProduct(prod);
                }}
                className={`group bg-white rounded-[2rem] overflow-hidden shadow-sm flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative cursor-pointer border-2 ${
                  prod.isOffer ? 'border-brand-yellow bg-amber-50/50 scale-[1.02]' : 'border-gray-50'
                }`}
              >
                {/* DYNAMIC CARD CAROUSEL */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <Swiper
                    modules={[Autoplay, Pagination]}
                    autoplay={{ delay: 3000 + Math.random() * 2000, disableOnInteraction: false }}
                    pagination={{ clickable: true, dynamicBullets: true }}
                    loop={cardImages.length > 1}
                    className="h-full w-full card-inner-swiper"
                  >
                    {cardImages.map((img, idx) => (
                      <SwiperSlide key={idx}>
                        <img src={img} alt={prod.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {/* OFFER BADGE/RIBON */}
                  {prod.isOffer && (
                    <div className="absolute top-4 left-[-10px] z-20 bg-brand-red text-white font-black px-4 py-1.5 rounded-r-full shadow-lg text-[10px] uppercase italic tracking-widest animate-pulse border-y-2 border-brand-yellow">
                      🔥 ¡SÚPER OFERTA!
                    </div>
                  )}

                  {/* CATEGORY TAG */}
                  <div className="absolute top-4 right-4 z-20">
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-brand-red uppercase shadow-md border border-white/50">
                      {prod.category}
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-1 grow">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{prod.condition}</p>
                  <h4 className="text-sm font-black text-gray-800 uppercase line-clamp-1 italic tracking-tight mb-2 group-hover:text-brand-red transition-colors">{prod.name}</h4>
                  
                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col">
                      {prod.isOffer && (
                        <span className="text-[10px] text-gray-400 line-through font-bold">
                          ANTES: ${(prod.price * 1.3).toLocaleString()}
                        </span>
                      )}
                      <span className="text-brand-red font-black text-2xl italic tracking-tighter leading-none">
                        ${prod.price.toLocaleString()}
                      </span>
                    </div>
                    <button className="bg-brand-red text-white rounded-xl px-5 py-2.5 font-black uppercase text-[10px] shadow-lg hover:bg-brand-yellow hover:text-brand-red transition-all transform active:scale-90">
                      DETALLES
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA WHATSAPP */}
      <section className="py-8 container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-[1px] w-12 bg-gray-200"></div>
          <h3 className="text-sm font-black uppercase text-gray-400 tracking-[0.2em]">¿Te interesa algo?</h3>
          <div className="h-[1px] w-12 bg-gray-200"></div>
        </div>
        
        <a 
          href="https://wa.me/573114018724"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm mx-auto bg-brand-green text-white font-black text-xl py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform active:scale-95 shadow-green-200 inline-flex"
        >
          <MessageCircle size={32} fill="white" />
          Hablar por WhatsApp
        </a>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-white border-t border-gray-100 py-8 px-4">
        <p className="text-gray-400 text-xs font-bold italic tracking-wider mb-6 text-center uppercase">Compra fácil y seguro en tu pueblo</p>
        <div className="flex justify-center gap-12 mb-8">
          <a href="tel:+573114018724" className="flex flex-col items-center gap-1 text-brand-red transition-opacity hover:opacity-70">
            <PhoneCall size={24} />
            <span className="font-black uppercase text-[10px]">Llámanos</span>
          </a>
          <a href="https://wa.me/573114018724" className="flex flex-col items-center gap-1 text-brand-green transition-opacity hover:opacity-70">
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

      {/* PRODUCT DETAIL MODAL */}
      <ProductDetailModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

    </div>
  );
};

export default AppContent;
