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
  Tag,
  Percent,
  Clock,
  DollarSign,
  Share2,
  MapPin
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
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = todas
  const navigate = useNavigate();

  // Carousel slides removed for space optimization

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchOffers();
    trackVisit();
  }, []);

  const trackVisit = async () => {
    try {
      // Evitar tracks múltiples en la misma sesión del navegador
      const hasTracked = sessionStorage.getItem('v_tracked');
      if (hasTracked) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.post(`${API_URL}/api/analytics/track`);
      sessionStorage.setItem('v_tracked', 'true');
    } catch (err) {
      // Fallo silencioso para no afectar la experiencia del usuario
      console.error('Analytics error:', err);
    }
  };

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

  const fetchOffers = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.get(`${API_URL}/api/offers`);
      setOffers(res.data);
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };
  
  const recordLead = async (product, referrer = 'Catalog') => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.post(`${API_URL}/api/leads`, {
        productId: product?._id,
        productName: product?.name || 'Consulta General',
        price: product?.price || 0,
        category: product?.category || 'General',
        mainImage: product?.mainImage || '',
        referrer
      });
    } catch (err) {
      console.error('Error recording lead:', err);
    }
  };

  const handleShareApp = () => {
    const shareData = {
      title: 'El Rebajón Marketplace',
      text: '¡Mira los mejores precios en productos Nuevos y Usados en El Rebajón! 🛍️✨ Estamos para Fredonia y municipios cercanos.',
      url: 'https://elrebajon.com.co/'
    };

    if (navigator.share) {
      navigator.share(shareData).catch(err => {
        if (err.name !== 'AbortError') console.error('Error sharing:', err);
      });
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(
        `${shareData.text} Visítanos aquí: ${shareData.url}`
      )}`;
      window.open(waUrl, '_blank');
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const filteredOffers = selectedCategory
    ? offers.filter(p => p.category === selectedCategory)
    : offers;

  const ProductDetailModal = ({ product, onClose }) => {
    if (!product) return null;
    const images = product.images && product.images.length > 0 ? product.images : [product.mainImage];
    
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300">
        <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row relative flex-1 sm:max-h-[90vh]">
          
          {/* CLOSE BUTTON (ENHANCED VISIBILITY) */}
          <button 
            onClick={onClose}
            className="group absolute top-4 right-4 z-[110] bg-white text-brand-red p-2.5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-brand-red/10"
            title="Cerrar"
          >
            <X size={28} strokeWidth={3} />
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
                <span className="text-3xl sm:text-4xl font-black text-brand-red italic">${(product.isOffer && product.offerPrice ? product.offerPrice : product.price).toLocaleString()}</span>
                {product.isOffer && product.originalPrice && <span className="text-gray-300 line-through font-bold text-sm sm:text-lg">${product.originalPrice.toLocaleString()}</span>}
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
                <div className="bg-brand-red/5 p-3 rounded-2xl flex items-center gap-3 border border-brand-red/10">
                  <MapPin className="text-brand-red" size={20}/>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase">Ubicación</p>
                    <p className="text-[10px] font-black text-gray-800 uppercase italic">{product.location || 'Bodega'}</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                recordLead(product, 'Modal');
                window.open(`https://wa.me/573114018724?text=${encodeURIComponent(
                  `¡Hola! Me interesa este producto y preguntar por el *PLAN SEPARE*:\n\n*${product.name}*\n💰 *Precio:* $${product.price.toLocaleString()}\n📝 *Descripción:* ${product.description || 'Sin descripción'}\n\n*Foto del Producto:* ${images[0]}`
                )}`, '_blank');
              }}
              className="bg-brand-green text-white font-black text-base sm:text-lg py-3 sm:py-4 rounded-xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 border-b-4 border-green-700 mt-auto w-full"
            >
              <MessageCircle size={22} fill="white" />
              COMPRAR POR WHATSAPP
            </button>
          </div>
        </div>

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
          <div className="flex items-center gap-2 shrink-0">
            {/* SHARE BUTTON (ICON ONLY FOR CLEANER LOOK) */}
            <button 
              onClick={handleShareApp}
              className="group flex items-center justify-center bg-brand-yellow border border-white/40 rounded-full w-9 h-9 hover:bg-yellow-400 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Compartir App"
            >
              <Share2 size={16} className="text-brand-red animate-pulse group-hover:scale-110 transition-transform" />
            </button>

            {/* CONTACT BUTTON (WHATSAPP) */}
            <button 
              onClick={() => {
                recordLead(null, 'Header');
                window.open("https://wa.me/573114018724", "_blank");
              }}
              className="flex items-center gap-1.5 bg-brand-green border-2 border-white/40 rounded-full px-3.5 py-2 hover:bg-green-600 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <MessageCircle size={16} className="text-white" fill="white" />
              <span className="text-[10px] sm:text-xs font-black uppercase text-white">Chat</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* MARQUEE / MULTI-MESSAGE BANNER */}
      <div className="bg-brand-yellow py-1.5 overflow-hidden whitespace-nowrap relative border-y border-black/5 shadow-inner">
        <div className="inline-block animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-4 text-[10px] font-black uppercase italic tracking-widest text-brand-red">
              📍 ESTAMOS UBICADOS EN FREDONIA Y SUS MUNICIPIOS CERCANOS | 💥 ¡PREGUNTA POR EL <span className="underline decoration-brand-red/30">PLAN SEPARE</span>! 💳 | 🔍 ¿BUSCAS ALGO? ¡NOSOTROS LO CONSEGUIMOS! | 💰 ¡COMPRAMOS LO QUE YA NO USES! 🔥 |
            </span>
          ))}
        </div>
      </div>

      {/* CATEGORY STRIP — infinite slow marquee with hover pause */}
      <section className="bg-brand-red border-t border-white/10 shadow-lg overflow-hidden relative">
        <div className="flex px-4 py-2.5 category-strip animate-marquee-slow hover:pause-marquee whitespace-nowrap">
          {/* Loop many times to ensure a seamless infinite effect */}
          {[...Array(6)].map((_, loopIndex) => (
            <div key={loopIndex} className="flex gap-3 px-3">
              {/* TODOS button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all active:scale-95 shrink-0 font-black text-[11px] uppercase tracking-widest ${
                  selectedCategory === null
                    ? 'bg-brand-yellow text-gray-900 border-brand-yellow shadow-lg scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                ★ Todos
              </button>

              {categories.map((cat) => (
                <button
                  key={`${loopIndex}-${cat._id}`}
                  onClick={() => {
                    const newCat = cat.name === selectedCategory ? null : cat.name;
                    setSelectedCategory(newCat);
                    if (newCat) {
                      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all active:scale-95 shrink-0 ${
                    selectedCategory === cat.name
                      ? 'bg-brand-yellow text-gray-900 border-brand-yellow shadow-lg scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-yellow/50 bg-gray-800 shrink-0">
                    <img src={cat.image || `https://placehold.co/100x100?text=${cat.name[0]}`} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* SEARCH BAR SECTION REMOVED (NOW IN HEADER) */}
      
      {/* SEARCH BAR SECTION REMOVED (NOW IN HEADER) */}
      


      {/* HERO BANNERS ARE REMOVED ACCORDING TO USER REQUEST */}

      {/* 🔥 SUPER OFERTAS SECTION */}
      {filteredOffers.length > 0 && (
        <section className="py-10 px-4 relative overflow-hidden" id="ofertas"
          style={{ background: 'linear-gradient(135deg, #1a0000 0%, #3d0000 40%, #1a0000 100%)' }}
        >
          {/* ANIMATED BACKGROUND PARTICLES */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-4 left-1/4 w-2 h-2 bg-brand-yellow rounded-full opacity-60 animate-ping" style={{animationDelay:'0s'}}></div>
            <div className="absolute top-12 right-1/3 w-1.5 h-1.5 bg-orange-400 rounded-full opacity-50 animate-ping" style={{animationDelay:'0.5s'}}></div>
            <div className="absolute bottom-8 left-1/3 w-2 h-2 bg-brand-red rounded-full opacity-40 animate-ping" style={{animationDelay:'1s'}}></div>
            <div className="absolute bottom-4 right-1/4 w-1 h-1 bg-brand-yellow rounded-full opacity-60 animate-ping" style={{animationDelay:'1.5s'}}></div>
          </div>

          <div className="container mx-auto relative z-10">
            {/* SECTION HEADER */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-3">
                <span className="text-3xl animate-bounce" style={{animationDelay:'0s'}}>🔥</span>
                <h3 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-white leading-none"
                  style={{ textShadow: '0 0 30px rgba(239,68,68,0.8), 0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  SUPER OFERTAS
                </h3>
                <span className="text-3xl animate-bounce" style={{animationDelay:'0.3s'}}>🔥</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-brand-yellow opacity-60"></div>
                <p className="text-brand-yellow font-black text-[10px] uppercase tracking-[0.3em]">¡Precios que no puedes dejar pasar!</p>
                <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-brand-yellow opacity-60"></div>
              </div>
            </div>

            {/* OFFERS GRID */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredOffers.map((prod, index) => {
                const displayPrice = prod.offerPrice || prod.price;
                const originalPrice = prod.originalPrice || prod.price;
                const discount = originalPrice > 0
                  ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
                  : 0;
                const cardImages = prod.images && prod.images.length > 0 ? prod.images : [prod.mainImage].filter(Boolean);
                const hasImage = cardImages.length > 0 && cardImages[0];

                return (
                  <div
                    key={prod._id}
                    onClick={() => setSelectedProduct(prod)}
                    className="group relative cursor-pointer rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]"
                    style={{
                      background: 'white',
                      boxShadow: '0 0 0 2px #fbbf24, 0 0 20px rgba(251,191,36,0.3), 0 8px 32px rgba(0,0,0,0.4)',
                      animation: `offerGlow ${2 + index * 0.3}s ease-in-out infinite alternate`
                    }}
                  >
                    {/* SHIMMER OVERLAY on hover */}
                    <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 0.8s ease-in-out'
                      }}
                    ></div>

                    {/* IMAGE */}
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {hasImage ? (
                        <Swiper
                          modules={[Autoplay, Pagination]}
                          autoplay={{ delay: 2500 + Math.random() * 1000, disableOnInteraction: false }}
                          speed={1200}
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
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-50"><Package size={48} className="text-gray-200" /></div>
                      )}

                      {/* TOP RIBBON */}
                      <div className="absolute top-0 left-0 right-0 z-20"
                        style={{ background: 'linear-gradient(90deg, #dc2626, #ef4444, #dc2626)', backgroundSize: '200% auto', animation: 'gradientMove 2s linear infinite' }}
                      >
                        <p className="text-white text-center text-[9px] font-black uppercase tracking-[0.2em] py-1.5">🔥 OFERTA ESPECIAL 🔥</p>
                      </div>

                      {/* DISCOUNT BADGE — large & animated */}
                      {discount > 0 && (
                        <div className="absolute bottom-2 left-2 z-20">
                          <div className="relative">
                            <div className="absolute inset-0 bg-brand-yellow rounded-full animate-ping opacity-40"></div>
                            <div className="relative bg-brand-yellow text-gray-900 rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-xl border-2 border-white">
                              <span className="text-[11px] font-black leading-none">-{discount}</span>
                              <span className="text-[10px] font-black leading-none">%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CATEGORY TAG & LOCATION */}
                      <div className="absolute top-9 right-2 z-20 flex flex-col items-end gap-1.5">
                        <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-black text-brand-red uppercase shadow-sm border border-white/20">
                          {prod.category}
                        </div>
                        <div className="bg-brand-red text-white px-2 py-0.5 rounded-lg text-[7px] font-black uppercase italic shadow-sm flex items-center gap-1 border border-white/20">
                          <MapPin size={8}/> {prod.location || 'Bodega'}
                        </div>
                      </div>
                    </div>

                    {/* INFO */}
                    <div className="p-4 flex flex-col gap-1 bg-white">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{prod.condition}</p>
                      <h4 className="text-sm font-black text-gray-800 uppercase line-clamp-1 italic tracking-tight group-hover:text-brand-red transition-colors">{prod.name}</h4>

                      {/* PRICES */}
                      <div className="flex items-end gap-2 mt-1">
                        <div className="flex flex-col">
                          {originalPrice !== displayPrice && (
                            <span className="text-[11px] text-gray-400 line-through font-bold">${originalPrice.toLocaleString('es-CO')}</span>
                          )}
                          <span className="text-brand-red font-black text-2xl italic tracking-tighter leading-none"
                            style={{ textShadow: '0 2px 8px rgba(239,68,68,0.3)' }}
                          >${displayPrice.toLocaleString('es-CO')}</span>
                        </div>
                        {discount > 0 && (
                          <span className="text-brand-green font-black text-[11px] bg-green-50 border border-green-100 px-3 py-1 rounded-full mb-0.5">Ahorras ${(originalPrice - displayPrice).toLocaleString('es-CO')}</span>
                        )}
                      </div>

                      {/* DATE */}
                      {prod.offerEndDate && (
                        <p className="text-[8px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={8} />
                          Hasta: {new Date(prod.offerEndDate).toLocaleDateString('es-CO')}
                        </p>
                      )}

                      {/* CTA (ENHANCED FOR RURAL USERS) */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          recordLead(prod, 'Offer');
                          window.open(`https://wa.me/573114018724?text=${encodeURIComponent(
                            `¡Hola! Vi esta *OFERTA* y me interesa el *PLAN SEPARE* en El Rebajón:\n\n*${prod.name}*\n🔥 *Precio Oferta:* $${displayPrice.toLocaleString()}\n~~Antes: $${originalPrice.toLocaleString()}~~\n📝 ${prod.description || 'Sin descripción'}\n\n*Foto de la Oferta:* ${cardImages[0] || ''}`
                          )}`, '_blank');
                        }}
                        className="mt-2 bg-brand-green text-white rounded-xl py-2.5 font-black uppercase text-[11px] text-center shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-1.5 w-full border-b-[3px] border-green-700 active:border-b-0 active:translate-y-1"
                      >
                        <MessageCircle size={16} fill="white" />
                        COMPRAR POR WHATSAPP
                      </button>

                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(prod); }}
                        className="bg-gray-100 text-gray-500 rounded-2xl py-3 font-black uppercase text-[9px] hover:bg-gray-200 transition-all border-b-2 border-gray-300 active:border-b-0 active:translate-y-0.5 mt-1"
                      >
                        Más información y fotos
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CSS ANIMATIONS */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes offerGlow {
              0% { box-shadow: 0 0 0 2px #fbbf24, 0 0 15px rgba(251,191,36,0.2), 0 8px 32px rgba(0,0,0,0.4); }
              100% { box-shadow: 0 0 0 2px #fbbf24, 0 0 35px rgba(251,191,36,0.5), 0 12px 40px rgba(239,68,68,0.3); }
            }
            @keyframes gradientMove {
              0% { background-position: 0% center; }
              100% { background-position: 200% center; }
            }
            @keyframes shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
          ` }} />
        </section>
      )}

      {/* CATALOGO COMPLETO */}
      <section className="py-8 container mx-auto px-4" id="catalogo">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-[3px] w-16 bg-brand-red rounded-full"></div>
          <h3 className="text-2xl sm:text-3xl font-black uppercase text-gray-800 tracking-tight italic">
            {selectedCategory ? selectedCategory : 'Nuestros Productos'}
          </h3>
          <div className="h-[3px] w-16 bg-brand-red rounded-full"></div>
        </div>

        {/* ACTIVE FILTER CHIP */}
        {selectedCategory && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 bg-brand-red text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase shadow-md hover:bg-red-700 transition-all"
            >
              <span>×</span> Quitar filtro: {selectedCategory}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400 font-black uppercase italic">
              No hay productos en "{selectedCategory}"
            </div>
          ) : filteredProducts.map((prod) => {
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
                    autoplay={{ delay: 2500 + Math.random() * 1000, disableOnInteraction: false }}
                    speed={1200}
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
                  <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-brand-red uppercase shadow-md border border-white/50">
                      {prod.category}
                    </div>
                    <div className="bg-brand-red text-white px-2 py-0.5 rounded-lg text-[7px] font-black uppercase italic shadow-sm flex items-center gap-1 border border-white/20">
                      <MapPin size={8}/> {prod.location || 'Bodega'}
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
                          ANTES: ${(prod.originalPrice || (prod.price * 1.3)).toLocaleString()}
                        </span>
                      )}
                      <span className="text-brand-red font-black text-2xl italic tracking-tighter leading-none">
                        ${(prod.isOffer && prod.offerPrice ? prod.offerPrice : prod.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col w-full gap-2 mt-4">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          recordLead(prod, 'Catalog');
                          window.open(`https://wa.me/573114018724?text=${encodeURIComponent(
                            `¡Hola! Me interesa este producto y el *PLAN SEPARE*:\n\n*${prod.name}*\n💰 *Precio:* $${prod.price.toLocaleString()}\n📝 *Descripción:* ${prod.description || 'Sin descripción'}\n\n*Foto del Producto:* ${cardImages[0]}`
                          )}`, '_blank');
                        }}
                        className="bg-brand-green text-white rounded-xl py-2 sm:py-3 font-black uppercase text-[9px] sm:text-[11px] flex items-center justify-center gap-1.5 shadow-xl hover:bg-green-600 transition-all border-b-[3px] border-green-700 active:border-b-0 active:translate-y-1 w-full"
                      >
                        <MessageCircle size={16} fill="white" />
                        COMPRAR POR WHATSAPP
                      </button>
                      
                      <button 
                        onClick={() => setSelectedProduct(prod)}
                        className="bg-gray-100 text-gray-500 rounded-2xl py-3 font-black uppercase text-[9px] hover:bg-gray-200 transition-all border-b-2 border-gray-300 active:border-b-0 active:translate-y-0.5"
                      >
                        Más información y fotos
                      </button>
                    </div>
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
          className="w-full max-w-sm mx-auto bg-brand-green text-white font-black py-4 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform active:scale-95 shadow-green-200 inline-flex"
        >
          <div className="flex items-center gap-3">
            <MessageCircle size={32} fill="white" />
            <span className="text-xl">Hablar por WhatsApp</span>
          </div>

        </a>
      </section>

       {/* FOOTER */}
      <footer className="mt-auto bg-white border-t border-gray-100 py-8 px-4">
        <p className="text-gray-400 text-xs font-bold italic tracking-wider mb-6 text-center uppercase">Compra fácil y seguro en tu pueblo</p>
        <div className="flex justify-center gap-8 sm:gap-12 mb-8">
          <a href="tel:+573114018724" className="flex flex-col items-center gap-1 text-brand-red transition-opacity hover:opacity-70">
            <PhoneCall size={24} />
            <span className="font-black uppercase text-[10px]">Llamar</span>

          </a>
          <a href="https://wa.me/573114018724" className="flex flex-col items-center gap-1 text-brand-green transition-opacity hover:opacity-70">
            <MessageCircle size={24} />
            <span className="font-black uppercase text-[10px]">WhatsApp</span>

          </a>
          <button onClick={() => navigate('/login')} className="flex flex-col items-center gap-1 text-gray-400 transition-opacity hover:opacity-70">
            <Settings size={24} />
            <span className="font-black uppercase text-[10px]">Panel</span>
            <span className="text-[9px] font-bold">Admin</span>
          </button>
        </div>
        <p className="text-[10px] text-gray-300 font-bold uppercase text-center tracking-widest">© 2026 EL REBAJÓN COLOMBIA</p>
      </footer>

      {/* PRODUCT DETAIL MODAL */}
      <ProductDetailModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

      {/* SWIPER CUSTOM STYLES & ANIMATIONS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .product-detail-swiper .swiper-pagination-bullet { background: #ff0000 !important; }
        .product-detail-swiper .swiper-button-next, .product-detail-swiper .swiper-button-prev { color: #ff0000 !important; transform: scale(0.6); }
        .card-inner-swiper .swiper-pagination-bullet { width: 4px; height: 4px; background: white !important; opacity: 0.7; }
        .card-inner-swiper .swiper-pagination-bullet-active { background: #fbbf24 !important; opacity: 1; transform: scale(1.5); }

        /* Hide scrollbar on category strip */
        .category-strip::-webkit-scrollbar { display: none; }
        .category-strip { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-marquee {
          display: inline-block;
          animation: marquee 160s linear infinite;
          white-space: nowrap;
        }
        .animate-marquee-slow {
          display: flex;
          animation: marquee 240s linear infinite;
          white-space: nowrap;
          width: max-content;
        }
        .pause-marquee:hover {
          animation-play-state: paused;
        }
      `}} />

    </div>
  );
};

export default AppContent;
