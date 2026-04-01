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
  Mail
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
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="lg:hidden p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-gray-600">
            <X size={16} />
          </button>
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-tight text-gray-800 leading-none">Registrar Venta / POS</h3>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Terminal Punto de Venta</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Subtotal</p>
                <p className="text-base font-black italic text-brand-red leading-none mt-0.5">${formatNum(calculatedTotal)}</p>
            </div>
            <button 
                disabled={isSubmitting || formData.items.length === 0}
                onClick={onSave}
                className="bg-brand-red text-white px-6 py-2 rounded-lg font-black uppercase italic tracking-tight text-xs shadow-md shadow-red-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Finalizar Venta'}
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* LEFT: Product Catalog */}
        <div className="flex-1 min-h-0 flex flex-col p-3 bg-gray-50/50">
           {/* CATEGORY & SEARCH BAR */}
           <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
              <div className="flex-1 flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-white rounded-lg shadow-sm border border-gray-100 w-full">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase italic transition-all whitespace-nowrap ${
                        activeCategory === cat ? 'bg-brand-red text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50 uppercase'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
              </div>
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar producto..."
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-xs font-bold focus:ring-2 focus:ring-brand-red/10 outline-none"
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
           </div>

           {/* PRODUCT GRID */}
           <div className="flex-1 overflow-y-auto thin-scrollbar pr-1 pb-3">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50 space-y-3 py-10">
                    <Grid3x3 size={32} />
                    <p className="font-black uppercase italic text-xs">Sin resultados</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2.5">
                  {filteredProducts.map(p => {
                    const inCart = formData.items.find(i => i.productId === p._id);
                    return (
                      <div key={p._id} className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm hover:border-brand-red/30 transition-all group flex flex-col relative overflow-hidden">
                        {p.stock <= 0 && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]"><span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase rotate-12">AGOTADO</span></div>}
                        <div className="w-full aspect-square rounded-lg bg-gray-50 overflow-hidden mb-2 border border-gray-50 shrink-0">
                          <img src={p.mainImage || 'https://placehold.co/150'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        </div>
                        <div className="flex-1 min-w-0 px-1">
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-0.5 truncate">{p.category}</p>
                          <p className="text-[11px] font-black text-gray-800 uppercase italic truncate mb-1 leading-tight">{p.name}</p>
                          <div className="flex justify-between items-center mt-1">
                             <p className="text-[13px] font-black text-brand-red italic leading-none">${formatNum(p.price)}</p>
                             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${p.stock < 5 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-brand-green'} uppercase`}>Stock: {p.stock}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-center">
                          {inCart ? (
                            <div className="flex items-center justify-between bg-brand-red text-white rounded-lg p-0.5">
                               <button onClick={() => decrementItem(p._id)} className="p-1 hover:bg-white/20 rounded transition-colors"><div className="w-2.5 h-0.5 bg-white"></div></button>
                               <span className="text-[11px] font-black">{inCart.quantity}</span>
                               <button onClick={() => addItem(p)} className="p-1 hover:bg-white/20 rounded transition-colors"><Plus size={12}/></button>
                            </div>
                          ) : (
                            <button 
                              disabled={p.stock <= 0}
                              onClick={() => addItem(p)}
                              className="w-full py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase italic transition-all flex items-center justify-center gap-1 shadow-sm hover:brightness-110 disabled:opacity-30"
                            >
                               <Plus size={12} /> AGREGAR
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

        {/* RIGHT: Cart Summary */}
        <div className="w-full lg:w-[380px] border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
            {/* CUSTOMER INFO - IMPROVED */}
            <div className="p-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                     <User className="text-brand-red" size={14}/>
                     <h4 className="text-[11px] font-black uppercase italic tracking-tight text-gray-800">Identificación Cliente</h4>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <button 
                       onClick={() => {
                         setShowCustomerList(true);
                         onSearchCustomer('', true); // Fetch all customers
                       }}
                       className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"
                       title="Listar Clientes"
                     >
                       <Users size={14} />
                     </button>
                     <button 
                       onClick={() => setShowNewCustomerModal(true)}
                       className="p-1 text-gray-400 hover:text-brand-green hover:bg-green-50 rounded transition-all"
                       title="Nuevo Cliente"
                     >
                       <Plus size={14} />
                     </button>
                     {(formData.customerName || formData.customerPhone) && (
                       <button 
                         onClick={() => setFormData({...formData, customerName: '', customerPhone: ''})}
                         className="p-1 text-brand-red hover:bg-red-50 rounded transition-all"
                         title="Limpiar"
                       >
                         <X size={14} />
                       </button>
                     )}
                   </div>
                </div>
                <div className="grid grid-cols-1 gap-2 relative">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 lg:opacity-100" size={12} />
                        <input 
                          type="text" 
                          placeholder="Nombre Completo..."
                          className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-[10px] font-bold focus:ring-1 focus:ring-brand-red/30 outline-none"
                          value={formData.customerName}
                          onFocus={() => onSearchCustomer(formData.customerName, true)}
                          onChange={(e) => {
                            setFormData({...formData, customerName: e.target.value});
                            onSearchCustomer(e.target.value);
                          }}
                        />
                    </div>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                        <input 
                          type="text" 
                          placeholder="Teléfono Celular..."
                          className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-[10px] font-bold focus:ring-1 focus:ring-brand-red/30 outline-none"
                          value={formData.customerPhone}
                          onFocus={() => onSearchCustomer(formData.customerPhone, true)}
                          onChange={(e) => {
                             setFormData({...formData, customerPhone: e.target.value});
                             onSearchCustomer(e.target.value);
                          }}
                        />
                    </div>

                    {(customerSuggestions.length > 0 || (formData.customerPhone === '' && !formData.customerName)) && (
                      <div className="absolute z-[160] left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto thin-scrollbar">
                          <div className="px-3 py-1.5 bg-gray-50 text-[8px] font-black text-gray-400 uppercase border-b border-gray-100">
                            {formData.customerPhone || formData.customerName ? 'Resultados Sugeridos' : 'Seleccionar Cliente (Recientes)'}
                          </div>
                          {customerSuggestions.map(cust => (
                            <button 
                              key={cust._id} 
                              type="button"
                              onClick={() => { 
                                setFormData({...formData, customerPhone: cust.phone, customerName: cust.name}); 
                                onSearchCustomer('', false); 
                              }} 
                              className="w-full px-3 py-2 hover:bg-brand-red/5 text-left flex flex-col border-b border-gray-50 last:border-0 transition-colors"
                            >
                              <span className="text-[10px] font-black text-gray-800 italic uppercase">{cust.name}</span>
                              <span className="text-[8px] font-bold text-gray-400">{cust.phone}</span>
                            </button>
                          ))}
                      </div>
                    )}
                </div>
            </div>

            <div className="p-3 border-b border-gray-50 flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase italic tracking-tight text-gray-800 flex items-center gap-2">
                    <ShoppingBag className="text-gray-400" size={14}/> Detalle de Compra
                </h4>
                <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">{formData.items.length} Refs</span>
            </div>

            {/* CART LIST */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 thin-scrollbar min-h-0 bg-gray-50/20">
               {formData.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-10">
                      <ShoppingBag size={48} />
                      <p className="text-[10px] font-black uppercase mt-3 italic">Carrito Vacío</p>
                  </div>
               ) : (
                  formData.items.map(item => (
                    <div key={item.productId} className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex-1 min-w-0 pr-3">
                          <p className="text-[10px] font-black text-gray-800 uppercase italic truncate leading-none mb-1">{item.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded font-black italic">{item.quantity} Uni.</span>
                            <span className="text-[9px] text-gray-400 font-bold">${formatNum(item.price)} C/U</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <p className="text-xs font-black italic text-gray-800 leading-none">${formatNum(item.price * item.quantity)}</p>
                          <button onClick={() => removeItem(item.productId)} className="p-1 hover:bg-red-50 text-gray-300 hover:text-brand-red rounded-md transition-colors"><X size={12}/></button>
                       </div>
                    </div>
                  ))
               )}
            </div>

            {/* TOTALS & FINANCES - ENHANCED FOR PAYMENTS */}
            <div className="p-4 border-t border-gray-100 space-y-4 bg-white shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 italic">Precio de Lista</span>
                      <span className="text-xs font-bold text-gray-400 line-through italic decoration-brand-red/30">${formatNum(calculatedTotal)}</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-brand-red/5 p-2.5 px-3 rounded-xl border border-brand-red/10 group focus-within:ring-2 focus-within:ring-brand-red/10 transition-all">
                        <label className="text-[9px] font-black uppercase text-brand-red italic mb-1 block">Valor Final Venta</label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-brand-red italic">$</span>
                          <input 
                            type="text"
                            className="w-full bg-transparent border-none text-xl font-black italic text-brand-red placeholder:text-red-200 outline-none p-0 tracking-tighter"
                            value={formatNum(formData.totalRevenue || 0)}
                            onChange={(e) => {
                                setIsManualPrice(true);
                                setFormData({...formData, totalRevenue: cleanNum(e.target.value)});
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="bg-brand-green/5 p-2.5 px-3 rounded-xl border border-brand-green/10 group focus-within:ring-2 focus-within:ring-brand-green/10 transition-all">
                        <label className="text-[9px] font-black uppercase text-brand-green italic mb-1 block">Abono / Pago Hoy</label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-brand-green italic">$</span>
                          <input 
                            type="text"
                            className="w-full bg-transparent border-none text-xl font-black italic text-brand-green placeholder:text-green-200 outline-none p-0 tracking-tighter"
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

                   <div className="flex justify-between items-center p-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-[10px] font-black uppercase text-gray-500 italic">Saldo Pendiente:</span>
                      <span className={`text-sm font-black italic ${((formData.totalRevenue || calculatedTotal) - (formData.initialPayment || 0)) > 0 ? 'text-brand-red' : 'text-brand-green'}`}>
                        ${formatNum(Math.max(0, (formData.totalRevenue || calculatedTotal) - (formData.initialPayment || 0)))}
                      </span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase px-1 italic">Medio de Pago</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-[10px] font-black uppercase italic outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                       >
                        <option value="Efectivo">💵 Efectivo</option>
                        <option value="Transferencia">📱 Transferencia</option>
                       </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase px-1 italic">Tipo Venta</label>
                       <div className={`w-full py-2 rounded-lg text-[10px] font-black uppercase italic transition-all text-center ${
                             formData.isPlanSepare ? 'bg-orange-500 text-white shadow-md' : 'bg-brand-green text-white shadow-md'
                          }`}>
                             {formData.isPlanSepare ? 'Crédito / Separe' : 'Venta de Contado'}
                          </div>
                   </div>
                </div>

                <div className="space-y-2 pt-2">
                   <button 
                     onClick={onSave}
                     disabled={isSubmitting || formData.items.length === 0}
                     className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black uppercase italic tracking-tight text-base shadow-xl shadow-blue-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                   >
                     {isSubmitting ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                        <span className="flex items-center gap-2"><CheckCircle size={20}/> REGISTRAR Y FINALIZAR</span>
                     )}
                   </button>
                   {onClose && (
                     <button onClick={() => setFormData({...formData, items: [], totalRevenue: 0, initialPayment: 0, isPlanSepare: false, customerName: '', customerPhone: ''})} className="w-full text-[9px] font-black uppercase text-gray-300 hover:text-brand-red transition-colors italic tracking-widest text-center py-1">
                        ANULAR VENTA ACTUAL
                     </button>
                   )}
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
