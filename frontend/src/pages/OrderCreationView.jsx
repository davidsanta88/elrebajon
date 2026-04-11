import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Smartphone, 
  User, 
  Users,
  ShoppingBag, 
  CheckCircle,
  Grid3x3,
  Phone,
  MapPin,
  Mail,
  Trash2,
  ChevronRight,
  Clock
} from 'lucide-react';

const OrderCreationView = ({ onClose, formData, setFormData, onSearch, searchResults, onSearchCustomer, onCreateCustomer, customerSuggestions, onSave, isSubmitting, formatNum }) => {
  const cleanNum = (str) => {
    if (!str) return 0;
    const cleaned = String(str).replace(/\./g, '').replace(/,/g, '').replace(/\$/g, '');
    return parseInt(cleaned, 10) || 0;
  };
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [categories, setCategories] = useState(["Todos"]);
  const [isManualPrice, setIsManualPrice] = useState(false);
  
  const [showCartMobile, setShowCartMobile] = useState(false);
  
  // Custom Customer Modals State
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '', email: '' });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Initial products and categories load
  useEffect(() => {
    onSearch(""); 
    
    if (searchResults.length > 0) {
      const cats = ["Todos", ...new Set(searchResults.map(p => p.category))];
      setCategories(cats);
    }
  }, []);

  // Update categories when products change
  useEffect(() => {
    if (searchResults.length > 0) {
      const cats = ["Todos", ...new Set(searchResults.map(p => p.category))];
      setCategories(prev => {
        const combined = Array.from(new Set([...prev, ...cats]));
        return combined;
      });
    }
  }, [searchResults]);

  const calculatedTotal = formData.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  // Sync totalRevenue ONLY if not manual
  useEffect(() => {
    if (!isManualPrice) {
      setFormData(prev => ({ ...prev, totalRevenue: calculatedTotal }));
    }
  }, [calculatedTotal, isManualPrice]);

  const addItem = (product) => {
    const exists = formData.items.find(i => i.productId === product._id);
    if (exists) {
        setFormData({
            ...formData,
            items: formData.items.map(i => i.productId === product._id ? {...i, quantity: i.quantity + 1} : i)
        });
    } else {
        setFormData({
            ...formData,
            items: [...formData.items, {
                productId: product._id,
                name: product.name,
                price: product.price,
                purchasePrice: product.purchasePrice || 0,
                quantity: 1,
                category: product.category
            }]
        });
    }
  };

  const decrementItem = (id) => {
    const item = formData.items.find(i => i.productId === id);
    if (!item) return;
    if (item.quantity > 1) {
      setFormData({
        ...formData,
        items: formData.items.map(i => i.productId === id ? {...i, quantity: i.quantity - 1} : i)
      });
    } else {
      removeItem(id);
    }
  };

  const removeItem = (id) => {
    setFormData({
        ...formData,
        items: formData.items.filter(i => i.productId !== id)
    });
  };

  const filteredProducts = activeCategory === "Todos" 
    ? searchResults 
    : searchResults.filter(p => p.category === activeCategory);

  return (
    <div className="bg-gray-50 flex flex-col animate-in fade-in duration-300 overflow-hidden font-sans h-full">
      {/* COMPACT TOP BAR */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:py-2 flex justify-between items-center shadow-sm shrink-0 sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
            <X size={20} />
          </button>
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-tight text-gray-800 leading-none">Caja El Rebajón</h3>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Terminal de Ventas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Hoy</p>
                <p className="text-sm font-black italic text-brand-red leading-none mt-0.5">${formatNum(calculatedTotal)}</p>
            </div>
            <button 
                disabled={isSubmitting || formData.items.length === 0}
                onClick={onSave}
                className="hidden md:flex bg-brand-red text-white px-6 py-2 rounded-xl font-black uppercase italic tracking-tight text-xs shadow-lg shadow-red-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 items-center gap-2"
            >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Cobrar'}
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* LEFT: Product Catalog */}
        <div className="flex-1 min-h-0 flex flex-col p-3 bg-gray-50/50 pb-24 lg:pb-3">
           {/* CATEGORY & SEARCH BAR */}
           <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
              <div className="flex-1 flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 w-full">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all whitespace-nowrap ${
                        activeCategory === cat ? 'bg-brand-red text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="BUSCAR PRODUCTO..."
                  className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-black italic uppercase focus:ring-4 focus:ring-brand-red/5 outline-none shadow-sm transition-all"
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
           </div>

           {/* PRODUCT GRID */}
           <div className="flex-1 overflow-y-auto thin-scrollbar pr-1 pb-10 lg:pb-3">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50 space-y-3 py-20">
                    <Grid3x3 size={32} />
                    <p className="font-black uppercase italic text-xs">Sin resultados</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
                  {filteredProducts.map(p => {
                    const inCart = formData.items.find(i => i.productId === p._id);
                    return (
                      <div key={p._id} className="bg-white rounded-[1.5rem] border border-gray-100 p-2.5 shadow-sm hover:border-brand-red/30 transition-all group flex flex-col relative overflow-hidden">
                        {p.stock <= 0 && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]"><span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase rotate-12">AGOTADO</span></div>}
                        <div className="w-full aspect-square rounded-2xl bg-gray-50 overflow-hidden mb-2.5 border border-gray-50 shrink-0">
                          <img src={p.mainImage || 'https://placehold.co/150'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                        </div>
                        <div className="flex-1 min-w-0 px-1">
                          <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest leading-none mb-1 truncate">{p.category}</p>
                          <p className="text-[11px] font-black text-gray-800 uppercase italic truncate mb-1.5 leading-tight">{p.name}</p>
                          <div className="flex justify-between items-center mb-2">
                             <p className="text-sm font-black text-brand-red italic leading-none">${formatNum(p.price)}</p>
                             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg ${p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-brand-green'} uppercase`}>Stock: {p.stock}</span>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          {inCart ? (
                            <div className="flex items-center justify-between bg-brand-red text-white rounded-xl p-1 shadow-lg shadow-red-100">
                               <button onClick={() => decrementItem(p._id)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><div className="w-3 h-0.5 bg-white"></div></button>
                               <span className="text-sm font-black italic">{inCart.quantity}</span>
                               <button onClick={() => addItem(p)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><Plus size={16}/></button>
                            </div>
                          ) : (
                            <button 
                              disabled={p.stock <= 0}
                              onClick={() => addItem(p)}
                              className="w-full py-2.5 bg-white border border-gray-100 text-gray-800 rounded-xl text-[10px] font-black uppercase italic transition-all flex items-center justify-center gap-2 shadow-sm hover:bg-brand-red hover:text-white hover:border-brand-red disabled:opacity-30"
                            >
                               <Plus size={14} /> AGREGAR
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
           </div>
        </div>

        {/* FLOATING CART BUTTON (MOBILE) */}
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[150] animate-in slide-in-from-bottom-10 duration-500">
            <button 
              onClick={() => setShowCartMobile(true)}
              className="w-full bg-brand-red text-white p-4 rounded-[1.8rem] shadow-2xl shadow-red-200 flex items-center justify-between group active:scale-95 transition-all"
            >
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                    <ShoppingBag size={20} />
                    {formData.items.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-white text-brand-red text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-red">{formData.items.length}</span>
                    )}
                  </div>
                  <div className="text-left">
                     <p className="text-[14px] font-black italic leading-none">Ver Carrito</p>
                     <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">Finalizar Compra</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xl font-black italic leading-none">${formatNum(calculatedTotal)}</p>
               </div>
            </button>
        </div>

        {/* RIGHT: Cart Summary (DESKTOP OR MOBILE MODAL) */}
        <div className={`${showCartMobile ? 'fixed inset-0 z-[200] flex animate-in fade-in duration-300' : 'hidden lg:flex'} w-full lg:w-[400px] lg:border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden`}>
            {/* MOBILE ONLY: OVERLAY BACKGROUND */}
            {showCartMobile && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-1" onClick={() => setShowCartMobile(false)}></div>}
            
            <div className={`flex flex-col flex-1 bg-white relative ${showCartMobile ? 'mt-12 rounded-t-[2.5rem] shadow-2xl' : ''}`}>
               {/* MOBILE ONLY: CLOSE HANDLE */}
               {showCartMobile && (
                  <div className="w-full flex justify-center py-3" onClick={() => setShowCartMobile(false)}>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                  </div>
               )}
               <div className="p-4 bg-gray-50 border-b border-gray-100 pb-6">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                     <div className="w-7 h-7 bg-brand-red/10 rounded-lg flex items-center justify-center text-brand-red">
                        <User size={14}/>
                     </div>
                     <h4 className="text-[11px] font-black uppercase italic tracking-tight text-gray-800">Identificación Cliente</h4>
                   </div>
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={() => {
                         setShowCustomerList(true);
                         onSearchCustomer('', true);
                       }}
                       className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all border border-gray-200 bg-white shadow-sm"
                     >
                       <Users size={16} />
                     </button>
                     <button 
                       onClick={() => setShowNewCustomerModal(true)}
                       className="p-2 text-gray-500 hover:text-brand-green hover:bg-green-50 rounded-xl transition-all border border-gray-200 bg-white shadow-sm"
                     >
                       <Plus size={16} />
                     </button>
                   </div>
                </div>
                <div className="grid grid-cols-1 gap-2 relative">
                    <div className="relative group/field">
                        <input 
                          type="text" 
                          placeholder="NOMBRE DEL CLIENTE..."
                          className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-[10px] font-black italic uppercase focus:ring-4 focus:ring-brand-red/5 outline-none transition-all"
                          value={formData.customerName}
                          onFocus={() => onSearchCustomer(formData.customerName, true)}
                          onChange={(e) => {
                            setFormData({...formData, customerName: e.target.value});
                            onSearchCustomer(e.target.value);
                          }}
                        />
                    </div>
                    <div className="relative group/field">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          type="text" 
                          placeholder="WHATSAPP / TELÉFONO..."
                          className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-[10px] font-black italic uppercase focus:ring-4 focus:ring-brand-red/5 outline-none transition-all"
                          value={formData.customerPhone}
                          onFocus={() => onSearchCustomer(formData.customerPhone, true)}
                          onChange={(e) => {
                             setFormData({...formData, customerPhone: e.target.value});
                             onSearchCustomer(e.target.value);
                          }}
                        />
                    </div>

                    {customerSuggestions.length > 0 && (
                      <div className="absolute z-[160] left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 max-h-60 overflow-y-auto thin-scrollbar">
                          {customerSuggestions.map(cust => (
                            <button 
                              key={cust._id} 
                              type="button"
                              onClick={() => { 
                                setFormData({...formData, customerPhone: cust.phone, customerName: cust.name}); 
                                onSearchCustomer('', false); 
                              }} 
                              className="w-full px-4 py-3 hover:bg-brand-red/5 text-left flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors group"
                            >
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-gray-800 italic uppercase leading-none mb-1 group-hover:text-brand-red transition-colors">{cust.name}</span>
                                <span className="text-[9px] font-bold text-gray-400">{cust.phone}</span>
                              </div>
                              <ChevronRight size={14} className="text-gray-200 group-hover:text-brand-red transition-all" />
                            </button>
                          ))}
                      </div>
                    )}
                </div>
            </div>

            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-white">
                <h4 className="text-[10px] font-black uppercase italic tracking-tight text-gray-800 flex items-center gap-2">
                    <ShoppingBag className="text-brand-red opacity-30" size={14}/> Carrito de Compras
                </h4>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setFormData({...formData, items: []})}
                     className="text-[8px] font-black text-gray-300 hover:text-brand-red transition-colors uppercase italic"
                    >
                      Vaciar
                    </button>
                   <span className="text-[9px] font-black bg-brand-red text-white px-2.5 py-1 rounded-lg shadow-sm shadow-red-100">{formData.items.length} Ref</span>
                </div>
            </div>

            {/* CART LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 thin-scrollbar min-h-0 bg-gray-50/20">
               {formData.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale">
                      <ShoppingBag size={64} className="mb-4 animate-bounce duration-[2000ms]" />
                      <p className="text-xs font-black uppercase italic tracking-widest text-center">Comienza agregando<br/>algún producto</p>
                  </div>
               ) : (
                  formData.items.map(item => (
                    <div key={item.productId} className="flex justify-between items-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                       <div className="flex-1 min-w-0 pr-3">
                          <p className="text-[11px] font-black text-gray-800 uppercase italic truncate leading-none mb-1.5">{item.name}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] bg-brand-red/5 text-brand-red px-2 py-0.5 rounded-lg font-black italic">{item.quantity} UNID.</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase italic">${formatNum(item.price)} <span className="text-[7px]">c/u</span></span>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <p className="text-sm font-black italic text-gray-800 leading-none">${formatNum(item.price * item.quantity)}</p>
                          <button onClick={() => removeItem(item.productId)} className="p-2 bg-gray-50 text-gray-300 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all shadow-sm">
                            <Trash2 size={14}/>
                          </button>
                       </div>
                    </div>
                  ))
               )}
            </div>

            {/* TOTALS & FINANCES */}
            <div className="p-6 border-t border-gray-100 space-y-5 bg-white shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.04)] rounded-t-[2rem] lg:rounded-none">
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 italic">Subtotal Bruto</span>
                      <span className="text-xs font-bold text-gray-300 line-through italic">${formatNum(calculatedTotal)}</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-brand-red/5 p-3.5 rounded-2xl border border-brand-red/10 group focus-within:ring-4 focus-within:ring-brand-red/5 transition-all">
                        <label className="text-[8px] font-black uppercase text-brand-red/60 italic mb-1.5 block tracking-widest">Valor Venta Final</label>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-black text-brand-red italic">$</span>
                          <input 
                            type="text"
                            className="w-full bg-transparent border-none text-2xl font-black italic text-brand-red placeholder:text-red-200 outline-none p-0 tracking-tighter"
                            value={formatNum(formData.totalRevenue || 0)}
                            onChange={(e) => {
                                setIsManualPrice(true);
                                setFormData({...formData, totalRevenue: cleanNum(e.target.value)});
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="bg-brand-green/5 p-3.5 rounded-2xl border border-brand-green/10 group focus-within:ring-4 focus-within:ring-brand-green/5 transition-all">
                        <label className="text-[8px] font-black uppercase text-brand-green/60 italic mb-1.5 block tracking-widest">Abono Inicial</label>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-black text-brand-green italic">$</span>
                          <input 
                            type="text"
                            className="w-full bg-transparent border-none text-2xl font-black italic text-brand-green placeholder:text-green-200 outline-none p-0 tracking-tighter"
                            value={formatNum(formData.initialPayment || 0)}
                            onChange={(e) => {
                                const val = cleanNum(e.target.value);
                                const total = formData.totalRevenue || calculatedTotal;
                                setFormData({
                                  ...formData, 
                                  initialPayment: val, 
                                  isPlanSepare: val < total 
                                });
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                   </div>

                   <div className="flex justify-between items-center p-3 px-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-[10px] font-black uppercase text-gray-400 italic tracking-[0.05em]">Saldo Pendiente:</span>
                      <span className={`text-base font-black italic tracking-tighter ${((formData.totalRevenue || calculatedTotal) - (formData.initialPayment || 0)) > 0 ? 'text-brand-red' : 'text-brand-green'}`}>
                        ${formatNum(Math.max(0, (formData.totalRevenue || calculatedTotal) - (formData.initialPayment || 0)))}
                      </span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-300 uppercase px-1 italic tracking-widest">Método</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-[11px] font-black uppercase italic outline-none cursor-pointer hover:bg-gray-100 transition-all shadow-sm"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                       >
                        <option value="Efectivo">💵 Efectivo</option>
                        <option value="Transferencia">📱 Transf.</option>
                        <option value="Tarjeta">💳 Tarjeta</option>
                       </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-300 uppercase px-1 italic tracking-widest">Condición</label>
                       <div className={`w-full py-3 rounded-xl text-[11px] font-black uppercase italic transition-all text-center flex items-center justify-center gap-2 shadow-sm ${
                             formData.isPlanSepare ? 'bg-orange-500 text-white' : 'bg-brand-green text-white'
                          }`}>
                             {formData.isPlanSepare ? (<><Clock size={14}/> Separe</>) : (<><CheckCircle size={14}/> Contado</>)}
                          </div>
                   </div>
                </div>

                <div className="space-y-3 pt-2">
                   <button 
                     onClick={onSave}
                     disabled={isSubmitting || formData.items.length === 0}
                     className="w-full bg-brand-red text-white py-4.5 rounded-[1.5rem] font-black uppercase italic tracking-tight text-lg shadow-2xl shadow-red-200 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-4"
                   >
                     {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                        <span className="flex items-center gap-3"><ShoppingBag size={22}/> REGISTRAR VENTA</span>
                     )}
                   </button>
                   <button 
                     onClick={() => {
                        setFormData({...formData, items: [], totalRevenue: 0, initialPayment: 0, isPlanSepare: false, customerName: '', customerPhone: ''});
                        if (showCartMobile) setShowCartMobile(false);
                     }}
                     className="w-full text-[9px] font-black uppercase text-gray-300 hover:text-brand-red transition-all italic tracking-[0.2em] text-center py-2 active:scale-95"
                    >
                        CANCELAR OPERACIÓN
                    </button>
                 </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CUSTOMER LIST */}
      {showCustomerList && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tight text-gray-800">Directorio de Clientes</h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Selecciona un cliente para la venta</p>
                </div>
                <button onClick={() => setShowCustomerList(false)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-400">
                  <X size={20} />
                </button>
             </div>
             
             <div className="p-4 border-b border-gray-100 bg-white">
                <div className="relative">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                   <input 
                    type="text" 
                    placeholder="Buscar por nombre o teléfono..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-brand-red/10 outline-none uppercase"
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      onSearchCustomer(e.target.value, true);
                    }}
                   />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-2 space-y-1 thin-scrollbar">
                {customerSuggestions.length === 0 ? (
                  <div className="py-10 text-center text-gray-300 font-black uppercase italic text-[10px]">No se encontraron resultados</div>
                ) : (
                  customerSuggestions.map(cust => (
                    <button 
                      key={cust._id}
                      onClick={() => {
                        setFormData({...formData, customerPhone: cust.phone, customerName: cust.name});
                        setShowCustomerList(false);
                      }}
                      className="w-full p-3 hover:bg-brand-red/5 rounded-xl border border-transparent hover:border-brand-red/10 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-brand-red group-hover:text-white transition-colors">
                          <User size={14} />
                        </div>
                        <div className="text-left">
                          <p className="text-[11px] font-black text-gray-800 uppercase italic leading-none mb-1">{cust.name}</p>
                          <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1"><Smartphone size={8}/> {cust.phone}</p>
                        </div>
                      </div>
                      <CheckCircle size={16} className="text-gray-200 group-hover:text-brand-green" />
                    </button>
                  ))
                )}
             </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW CUSTOMER */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setIsCreatingCustomer(true);
              try {
                await onCreateCustomer(newCustomerForm);
                setShowNewCustomerModal(false);
                setNewCustomerForm({ name: '', phone: '', address: '', email: '' });
              } catch (err) {
                console.error(err);
              } finally {
                setIsCreatingCustomer(false);
              }
            }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-tight text-gray-800">Registrar Nuevo Cliente</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Añade un cliente a la base de datos</p>
              </div>
              <button type="button" onClick={() => setShowNewCustomerModal(false)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-1">Nombre Completo</label>
                <div className="relative">
                  <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="EJ: JUAN PEREZ"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-black italic text-gray-800 focus:ring-2 focus:ring-brand-red/10 transition-all outline-none uppercase"
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-1">Teléfono / WhatsApp</label>
                  <div className="relative">
                    <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="300 000 0000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-black italic text-gray-800 focus:ring-2 focus:ring-brand-red/10 transition-all outline-none uppercase"
                      value={newCustomerForm.phone}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-1">Email (Opcional)</label>
                  <div className="relative">
                    <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email" 
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-black italic text-gray-800 focus:ring-2 focus:ring-brand-red/10 transition-all outline-none lowercase"
                      value={newCustomerForm.email}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-1">Dirección de Entrega</label>
                <div className="relative">
                  <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="CALLE, BARRIO, CIUDAD..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-black italic text-gray-800 focus:ring-2 focus:ring-brand-red/10 transition-all outline-none uppercase"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-2">
              <button 
                type="button"
                onClick={() => setShowNewCustomerModal(false)}
                className="flex-1 bg-white border border-gray-200 text-gray-400 py-2.5 rounded-xl font-black uppercase italic tracking-tight text-[10px] hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isCreatingCustomer}
                className="flex-1 bg-brand-green text-white py-2.5 rounded-xl font-black uppercase italic tracking-tight text-[10px] shadow-md border border-brand-green/10 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreatingCustomer ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><CheckCircle size={14} /> CREAR Y SELECCIONAR</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrderCreationView;
