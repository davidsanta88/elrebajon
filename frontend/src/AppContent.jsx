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
  ArrowDown,
  Clock,
  DollarSign,
  Share2,
  MapPin,
  User,
  Smartphone,
  CheckCircle,
  Grid3x3
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
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: localStorage.getItem('c_name') || '',
    phone: localStorage.getItem('c_phone') || ''
  });
  const [pendingLead, setPendingLead] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  
  const recordLead = async (product, referrer = 'Catalog', customerData = null) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.post(`${API_URL}/api/leads`, {
        productId: product?._id,
        productName: product?.name || 'Consulta General',
        price: product?.price || 0,
        category: product?.category || 'General',
        mainImage: product?.mainImage || '',
        referrer,
        customerName: customerData?.name || 'Anónimo',
        customerPhone: customerData?.phone || 'Sin número'
      });
    } catch (err) {
      console.error('Error recording lead:', err);
    }
  };

  const handleWhatsAppAction = (product, referrer) => {
    setPendingLead({ product, referrer });
    setShowLeadModal(true);
  };

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) return;

    // Guardar en localStorage para futuras compras
    localStorage.setItem('c_name', leadForm.name);
    localStorage.setItem('c_phone', leadForm.phone);

    const { product, referrer } = pendingLead;
    
    // Registrar Lead Real
    recordLead(product, referrer, leadForm);

    const message = product 
      ? `¡Hola! Me interesa este producto y el *PLAN SEPARE*:\n\n*${product.name}*\n💰 *Precio:* $${product.price.toLocaleString()}\n📝 *Descripción:* ${product.description || 'Sin descripción'} \n\nMi nombre es *${leadForm.name}*. ¡Espero su respuesta!`
      : `¡Hola! Me gustaría recibir información general sobre El Rebajón y el *PLAN SEPARE*. Mi nombre es *${leadForm.name}*.`;

    const waUrl = `https://wa.me/573114018724?text=${encodeURIComponent(message)}`;
    
    setShowLeadModal(false);
    window.open(waUrl, '_blank');
  };



  const handleShareApp = () => {
    const shareData = {
      title: 'El Rebajón Marketplace',
      text: '¡Mira los mejores precios en productos Nuevos y Usados en El Rebajón! 🛍️✨ Estamos en Fredonia y municipios cercanos, pero también despachamos ciertos productos a toda Colombia. ¡Compártenos para que la comunidad de EL REBAJÓN cada vez sea más grande!',
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

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesCategory && !p.isOffer;
  });

  const filteredOffers = selectedCategory
    ? offers.filter(p => p.category === selectedCategory)
    : offers;

  const ProductDetailModal = ({ product, onClose }) => {
    if (!product) return null;
    const images = (product.images && product.images.length > 0 ? product.images : [product.mainImage]).filter(Boolean);
    
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300">
        <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row relative flex-1 sm:max-h-[90vh]">
          {/* FLOATING TOP BUTTONS & TAGS */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-[120] bg-white/90 backdrop-blur-sm text-brand-red p-2 rounded-full shadow-lg hover:bg-brand-red hover:text-white transition-all active:scale-95 border border-brand-red/10"
            title="Cerrar"
          >
            <X size={20} strokeWidth={3} />
          </button>

          {/* FLOATING TOP TAGS */}
          <div className="absolute top-4 left-4 z-[120] flex flex-wrap gap-2 pr-16 pointer-events-none">
            {product.isOffer && (
              <div className="bg-brand-red text-white text-[10px] sm:text-[12px] font-black px-3 sm:px-4 py-1.5 rounded-full uppercase italic tracking-widest shadow-lg animate-pulse border border-brand-yellow/30 whitespace-nowrap pointer-events-auto">
                🔥 SÚPER OFERTA
              </div>
            )}
            <div className="bg-white/90 backdrop-blur-sm text-brand-red text-[8px] sm:text-[9px] font-black px-3 py-1.5 rounded-full uppercase shadow-md border border-brand-red/10 flex items-center gap-1 whitespace-nowrap pointer-events-auto">
              <MapPin size={10} /> {product.location || 'Bodega'}
            </div>
          </div>

          {/* GALLERY AREA */}
          <div className="w-full md:w-1/2 min-h-[35vh] md:min-h-0 bg-gray-50 border-r border-gray-100/50 relative group">
            <Swiper
              modules={[Pagination, Navigation, Autoplay]}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              speed={1200}
              pagination={{ clickable: true }}
              navigation={true}
              loop={images.length > 1}
              className="h-full w-full product-detail-swiper"
            >
              {images.map((img, idx) => {
                const finalSrc = img?.startsWith('http') ? img : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/${img}`;
                return (
                  <SwiperSlide key={idx}>
                    <img src={finalSrc} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* INFO AREA */}
          <div className="w-full md:w-1/2 p-5 sm:p-10 flex flex-col overflow-y-auto relative">
            {/* CATEGORY TAG (Offer badge moved to absolute top-left) */}
            <div className="mb-3">
              <span className="bg-gray-100 text-brand-red text-[8px] sm:text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-sm border border-brand-red/5">{product.category}</span>
            </div>
            <div className="mb-4">
              <p className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-1">{product.condition === 'Usado' ? '♻️ Usado Seleccionado' : '🔥 Nuevo de Paquete'}</p>
              <h2 className="text-xl sm:text-4xl font-black text-gray-800 uppercase italic tracking-tighter leading-none mb-2">{product.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-4xl font-black text-brand-red italic">${(product.isOffer && product.offerPrice ? product.offerPrice : product.price).toLocaleString()}</span>
                {product.isOffer && product.originalPrice && <span className="text-gray-300 line-through font-bold text-xs sm:text-lg">${product.originalPrice.toLocaleString()}</span>}
              </div>
            </div>

            <div className="space-y-6 mb-8 flex-1">
              <div>
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 flex items-center gap-1"><Package size={12}/> Descripción Técnica</h4>
                <p className="text-sm font-bold text-gray-600 leading-relaxed uppercase italic">{product.description || 'Sin descripción disponible para este artículo.'}</p>
              </div>
            </div>

            <button 
              onClick={() => handleWhatsAppAction(product, 'Modal')}
              className="group bg-brand-green text-white font-black text-sm py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 mt-auto w-full border-b-[3px] border-green-700"
            >
              <MessageCircle size={18} fill="white" className="group-hover:rotate-12 transition-transform" />
              COMPRAR POR WHATSAPP
            </button>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* SIDEBAR (MOBILE) */}
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 bg-brand-red text-white transition-transform duration-300 ease-in-out z-[110] flex flex-col shadow-2xl lg:hidden`}>
        <div className="p-6 flex flex-col items-center border-b border-white/10">
          <img src="/logo-rebajon.png" alt="El Rebajón" className="w-full max-w-[140px] h-auto mb-2 brightness-110" />
          <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[7px] font-black italic uppercase tracking-widest border border-white/10">CATÁLOGO DIGITAL</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto thin-scrollbar">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-white/50 mb-3 tracking-widest px-2">Categorías</p>
            <button 
              onClick={() => { setSelectedCategory(null); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedCategory === null ? 'bg-white text-brand-red shadow-lg' : 'hover:bg-white/10 text-white'}`}
            >
              <Grid3x3 size={18} />
              <span className="text-xs font-black uppercase tracking-wider">Todas</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => { setSelectedCategory(cat.name); setSidebarOpen(false); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedCategory === cat.name ? 'bg-white text-brand-red shadow-lg' : 'hover:bg-white/10 text-white'}`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-gray-800 shrink-0">
                  <img src={cat.image?.startsWith('http') ? cat.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/${cat.image}`} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">{cat.name}</span>
              </button>
            ))}
          </div>
          
          <div className="pt-4 space-y-1 border-t border-white/10">
            <p className="text-[10px] font-black uppercase text-white/50 mb-3 tracking-widest px-2">Contacto Directo</p>
            <a href="https://wa.me/573114018724" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white transition-all">
              <MessageCircle size={18} />
              <span className="text-xs font-black uppercase tracking-wider">WhatsApp</span>
            </a>
            <a href="tel:+573114018724" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white transition-all">
              <PhoneCall size={18} />
              <span className="text-xs font-black uppercase tracking-wider">Llamar Ahora</span>
            </a>
          </div>
        </nav>
        <div className="p-4 bg-black/10">
          <button onClick={() => navigate('/login')} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-[10px] font-black uppercase italic tracking-widest">
            <Settings size={14} /> Panel Administrador
          </button>
        </div>
      </aside>

      {/* OVERLAY FOR SIDEBAR */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300" onClick={() => setSidebarOpen(false)}></div>}

      {/* HEADER */}
      <header className="bg-brand-red text-white p-2 px-3 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* MOBILE MENU TOGGLE */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all active:scale-95 border border-white/10"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          {/* HEADER MESSAGE (NEW & USED) - Hidden on very small screens to avoid clutter */}
          <div className="flex-1 hidden md:flex flex-col justify-center items-center px-2 overflow-hidden">
            <h2 className="text-white font-black uppercase italic tracking-tighter text-[9px] sm:text-sm leading-tight text-center drop-shadow-md">
              ¡Productos <span className="text-brand-yellow underline">Nuevos</span> y <span className="text-brand-yellow underline">Usados</span>!
            </h2>
            <div 
               onClick={() => handleWhatsAppAction(null, 'Header-Badge')}
               className="flex items-center gap-2 bg-[#25D366] px-4 py-1.5 rounded-full shadow-xl cursor-pointer hover:bg-[#128C7E] active:scale-95 transition-all mt-1 group border-2 border-white/30"
            >
               <MessageCircle size={15} className="text-white" fill="white" />
               <span className="text-[11px] sm:text-[13px] font-black text-white uppercase tracking-wider whitespace-nowrap">WSP: 311 401 8724</span>
            </div>
          </div>

          {/* HEADER ACTIONS (RIGHT) + LOGO */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
             {/* Mobile WhatsApp Badge (compact) */}
            <div 
               onClick={() => handleWhatsAppAction(null, 'Header-Badge-Mobile')}
               className="md:hidden flex items-center justify-center bg-[#25D366] w-9 h-9 rounded-full shadow-lg border border-white/30 active:scale-95 transition-all"
            >
               <MessageCircle size={16} fill="white" />
            </div>

            <button 
              onClick={handleShareApp}
              className="group flex items-center justify-center bg-brand-yellow border border-white/40 rounded-full w-9 h-9 hover:bg-yellow-400 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Compartir App"
            >
              <Share2 size={16} className="text-brand-red animate-pulse group-hover:scale-110 transition-transform" />
            </button>

            {/* LOGO DIV ON THE RIGHT */}
            <div className="flex items-center gap-2 ml-1 sm:ml-2">
              <img src="/logo-rebajon.png" alt="El Rebajón" className="h-8 sm:h-10 w-auto brightness-110 drop-shadow-md select-none" />
              <h1 className="text-lg sm:text-2xl font-black uppercase italic tracking-tighter leading-none whitespace-nowrap text-brand-yellow drop-shadow-lg select-none hidden xs:block">
                EL REBAJÓN
              </h1>
            </div>
          </div>
        </div>
      </header>
      
      {/* MARQUEE / MULTI-MESSAGE BANNER */}
      <div className="bg-brand-yellow py-1.5 overflow-hidden whitespace-nowrap relative border-y border-black/5 shadow-inner">
        <div className="inline-block animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-4 text-[10px] font-black uppercase italic tracking-widest text-brand-red">
              📍 ESTAMOS UBICADOS EN FREDONIA Y SUS MUNICIPIOS CERCANOS | 📱 WHATSAPP: 311 401 8724 | 💥 ¡PREGUNTA POR EL <span className="underline decoration-brand-red/30">PLAN SEPARE</span>! 💳 | 🔍 ¿BUSCAS ALGO? ¡NOSOTROS LO CONSEGUIMOS! | 💰 ¡COMPRAMOS LO QUE YA NO USES! 🔥 |
            </span>
          ))}
        </div>
      </div>
      {/* SECCIÓN DE CATEGORÍAS — Efecto Marquee dinámico y rápido para móviles */}
      <section className="bg-brand-red border-t border-white/10 shadow-lg overflow-hidden relative">
        <div className="flex px-4 py-2.5 category-strip animate-marquee-fast hover:pause-marquee whitespace-nowrap">
          {/* Bucle para asegurar efecto infinito fluido */}
          {[...Array(4)].map((_, loopIndex) => (
            <div key={loopIndex} className="flex gap-3 px-3">
              {/* Botón TODOS */}
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
                    <img 
                      src={cat.image?.startsWith('http') ? cat.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/${cat.image}`} 
                      alt={cat.name} 
                      className="w-full h-full object-cover" 
                    />
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
                const cardImages = (prod.images && prod.images.length > 0 ? prod.images : [prod.mainImage]).filter(Boolean);
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
                          {cardImages.map((img, idx) => {
                            const finalSrc = img?.startsWith('http') ? img : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/${img}`;
                            return (
                              <SwiperSlide key={idx}>
                                <img src={finalSrc} alt={prod.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              </SwiperSlide>
                            );
                          })}
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
                          handleWhatsAppAction(prod, 'Offer');
                        }}
                        className="mt-2 bg-brand-green text-white rounded-xl py-2 font-black uppercase text-[10px] text-center shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5 w-full border-b-[3px] border-green-700 active:border-b-0 active:translate-y-0.5"
                      >
                        <MessageCircle size={14} fill="white" />
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
            const cardImages = (prod.images && prod.images.length > 0 ? prod.images : [prod.mainImage]).filter(Boolean);
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
                    {cardImages.map((img, idx) => {
                      const finalSrc = img?.startsWith('http') ? img : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/${img}`;
                      return (
                        <SwiperSlide key={idx}>
                          <img src={finalSrc} alt={prod.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </SwiperSlide>
                      );
                    })}
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
                          handleWhatsAppAction(prod, 'Catalog');
                        }}
                        className="bg-brand-green text-white rounded-xl py-2 font-black uppercase text-[9px] sm:text-[10px] flex items-center justify-center gap-1.5 shadow-lg hover:brightness-110 transition-all border-b-[3px] border-green-700 active:border-b-0 active:translate-y-0.5 w-full"
                      >
                        <MessageCircle size={14} fill="white" />
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
        
        <button 
          onClick={() => handleWhatsAppAction(null, 'Footer')}
          className="w-full max-w-sm mx-auto bg-brand-green text-white font-black py-4 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform active:scale-95 shadow-green-200 inline-flex"
        >
          <div className="flex items-center gap-3">
            <MessageCircle size={32} fill="white" />
            <span className="text-xl">Hablar por WhatsApp</span>
          </div>

        </button>
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
          animation: marquee 220s linear infinite;
          white-space: nowrap;
        }
        .animate-marquee-fast {
          display: flex;
          animation: marquee 30s linear infinite;
          white-space: nowrap;
          width: max-content;
        }
        .pause-marquee:hover {
          animation-play-state: paused;
        }

      `}} />

      {/* LEAD CAPTURE MODAL */}
      {showLeadModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative border-t-8 border-brand-red">
            <button 
              onClick={() => setShowLeadModal(false)}
              className="absolute top-4 right-4 z-10 bg-gray-100 text-gray-400 p-2 rounded-full shadow-md hover:bg-brand-red hover:text-white transition-all active:scale-95 border border-white"
              title="Cerrar"
            >
              <X size={20} strokeWidth={3} />
            </button>

            <div className="p-8">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <MessageCircle size={32} className="text-brand-red" fill="currentColor" />
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-none mb-2">¡Casi listo!</h3>
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Completa tus datos para contactarte</p>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      required
                      type="text"
                      placeholder="Ej: Pepito perez"
                      value={leadForm.name}
                      onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-gray-700 focus:border-brand-red/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Tu WhatsApp</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      required
                      type="tel"
                      placeholder="Ej: 300 123 4567"
                      value={leadForm.phone}
                      onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-gray-700 focus:border-brand-red/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-green text-white font-black py-4 rounded-2xl shadow-xl shadow-green-200 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all mt-4 border-b-[4px] border-green-700"
                >
                  CONTINUAR A WHATSAPP
                  <CheckCircle size={18} fill="white" />
                </button>

                <p className="text-[9px] text-gray-300 font-bold text-center uppercase tracking-widest mt-4">
                  🔒 Tus datos están protegidos en El Rebajón
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppContent;
