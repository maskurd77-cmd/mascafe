import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Search, Coffee, ChevronDown, Star, LayoutGrid, List, ShoppingCart, Plus, Minus, X, Trash2, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { translations, Language } from '../i18n/translations';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FlagKU, FlagAR, FlagEN } from '../components/Flags';

export default function Menu() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { lang, setLang, categories, setCategories, menuItems, setMenuItems, banners, setBanners, settings, setSettings, lastFetch, setLastFetch, cart, addToCart, removeFromCart, updateQuantity, clearCart, tableNum, setTableNum } = useStore();
  const t = translations[lang];
  const isRTL = lang === 'ar' || lang === 'ku';

  useEffect(() => {
    const table = searchParams.get('table');
    if (table) {
      setTableNum(table);
    }
  }, [searchParams, setTableNum]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const CACHE_TIME = 60 * 60 * 1000; 
      if (Date.now() - lastFetch < CACHE_TIME && categories.length > 0) {
        return;
      }

      setLoading(true);
      try {
        const [catSnapshot, itemsSnapshot, bannersSnapshot, settingsSnapshot] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'items')),
          getDocs(collection(db, 'banners')),
          getDocs(collection(db, 'settings'))
        ]);

        const cats = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const fetchedBanners = bannersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        if (!settingsSnapshot.empty) {
          setSettings(settingsSnapshot.docs[0].data() as any);
        }

        setCategories(cats.sort((a, b) => a.order - b.order));
        setMenuItems(items.sort((a, b) => a.order - b.order));
        setBanners(fetchedBanners.sort((a, b) => a.order - b.order));
        setLastFetch(Date.now());
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lastFetch, categories.length, setCategories, setMenuItems, setBanners, setSettings, setLastFetch]);

  const filteredItems = menuItems.filter(item => {
    const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory;
    const matchesSearch = item.name[lang].toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description[lang].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeBanners = banners.filter(b => b.active);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US') + ' ' + t.iqd;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      await addDoc(collection(db, 'orders'), {
        table: tableNum || 'Takeaway',
        items: cart,
        total: cartTotal,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      showToast(t.orderPlaced);
      clearCart();
      setIsCartOpen(false);
    } catch (error) {
      console.error(error);
      showToast(t.error, 'error');
    }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-800 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(tableNum ? `/?table=${tableNum}` : '/')}
              className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors text-stone-600"
            >
              {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
            </button>
            
            <h1 className="text-lg font-serif font-bold text-stone-800 flex items-center gap-2 tracking-tight">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: settings.themeColor || '#f59e0b' }}>
                  <Coffee size={16} />
                </div>
              )}
              {settings.name[lang] || 'MasCafe'}
            </h1>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full transition-colors font-medium text-xs"
            >
              {lang === 'ku' ? <><FlagKU /> کوردی</> : lang === 'ar' ? <><FlagAR /> عربي</> : <><FlagEN /> EN</>}
              <ChevronDown size={14} className={`transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute top-full mt-2 w-40 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden z-50 ${isRTL ? 'left-0' : 'right-0'}`}
                >
                  <button onClick={() => { setLang('ku'); setLangDropdownOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-stone-50 transition-colors ${lang === 'ku' ? 'bg-amber-50 text-amber-600 font-bold' : 'text-stone-700'}`}>
                    <FlagKU /> کوردی
                  </button>
                  <button onClick={() => { setLang('ar'); setLangDropdownOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-stone-50 transition-colors ${lang === 'ar' ? 'bg-amber-50 text-amber-600 font-bold' : 'text-stone-700'}`}>
                    <FlagAR /> عربي
                  </button>
                  <button onClick={() => { setLang('en'); setLangDropdownOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-stone-50 transition-colors ${lang === 'en' ? 'bg-amber-50 text-amber-600 font-bold' : 'text-stone-700'}`}>
                    <FlagEN /> English
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & View Toggle */}
        <div className="flex items-center gap-3 mb-6 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-stone-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl shadow-sm focus:ring-2 outline-none transition-shadow text-sm"
              style={{ '--tw-ring-color': settings.themeColor || '#f59e0b' } as any}
            />
          </div>
          <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-stone-200 shrink-0">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              style={viewMode === 'grid' ? { backgroundColor: settings.themeColor || '#f59e0b' } : {}}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              style={viewMode === 'list' ? { backgroundColor: settings.themeColor || '#f59e0b' } : {}}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Categories - Sticky */}
        <div className="sticky top-16 z-40 bg-stone-50/90 backdrop-blur-xl py-3 -mx-4 px-4 mb-6 border-b border-stone-200/50">
          <div className="flex overflow-x-auto hide-scrollbar gap-2 max-w-7xl mx-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === 'all' 
                  ? 'text-white shadow-md' 
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
              style={activeCategory === 'all' ? { backgroundColor: settings.themeColor || '#f59e0b', borderColor: settings.themeColor || '#f59e0b' } : {}}
            >
              {t.all}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id 
                    ? 'text-white shadow-md' 
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
                style={activeCategory === cat.id ? { backgroundColor: settings.themeColor || '#f59e0b', borderColor: settings.themeColor || '#f59e0b' } : {}}
              >
                {cat.image && (
                  <img src={cat.image} alt={cat.name[lang]} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                )}
                {cat.name[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Promotional Banners */}
        {activeBanners.length > 0 && (
          <div className="flex overflow-x-auto hide-scrollbar gap-4 mb-8 snap-x snap-mandatory pb-2">
            {activeBanners.map(banner => (
              <a 
                key={banner.id} 
                href={banner.link || '#'} 
                target={banner.link ? "_blank" : "_self"}
                className="flex-shrink-0 w-full md:w-2/3 lg:w-1/2 h-40 md:h-56 rounded-2xl overflow-hidden snap-center relative group shadow-sm"
              >
                {banner.image ? (
                  <img src={banner.image} alt="Promotion" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400">
                    <span className="text-sm">Promotion</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            ))}
          </div>
        )}

        {/* Menu Items Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: settings.themeColor || '#f59e0b', borderTopColor: 'transparent' }}></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-stone-500">
            <Coffee size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">{t.noItems}</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8" : "flex flex-col gap-4"}>
            <AnimatePresence>
              {filteredItems.map(item => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={item.id}
                  className={`bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-stone-100 transition-all group relative ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-row h-32 md:h-40'} ${!item.isAvailable ? 'opacity-60 grayscale' : 'hover:shadow-xl hover:shadow-stone-200/50'}`}
                >
                  {!item.isAvailable && (
                    <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-stone-900 text-white px-3 py-1 md:px-6 md:py-2 text-xs md:text-base rounded-full font-bold tracking-widest uppercase shadow-xl">
                        {t.soldOut}
                      </span>
                    </div>
                  )}
                  
                  <div className={`relative overflow-hidden shrink-0 ${viewMode === 'grid' ? 'h-32 md:h-48' : 'w-28 md:w-40 h-full'}`}>
                    <img 
                      src={item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800'} 
                      alt={item.name[lang]} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    {viewMode === 'grid' && (
                      <div className="absolute top-2 right-2 md:top-3 md:right-3 flex flex-col gap-1.5 items-end">
                        <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full font-bold shadow-sm text-xs md:text-sm" style={{ color: settings.themeColor || '#f59e0b' }}>
                          {formatPrice(item.price)}
                        </div>
                        {item.isFeatured && (
                          <div className="text-white p-1.5 rounded-full shadow-sm" style={{ backgroundColor: settings.themeColor || '#f59e0b' }}>
                            <Star size={12} fill="currentColor" className="md:w-3.5 md:h-3.5" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={`flex-1 flex flex-col ${viewMode === 'grid' ? 'p-3 md:p-4' : 'p-3 md:p-4 justify-center'}`}>
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="font-bold text-stone-800 text-sm md:text-base leading-tight line-clamp-2">{item.name[lang]}</h3>
                      {viewMode === 'list' && (
                        <div className="flex flex-col items-end shrink-0 gap-1">
                          <span className="font-bold whitespace-nowrap text-sm md:text-base" style={{ color: settings.themeColor || '#f59e0b' }}>{formatPrice(item.price)}</span>
                          {item.isFeatured && <Star size={12} fill="currentColor" style={{ color: settings.themeColor || '#f59e0b' }} />}
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-stone-500 text-xs md:text-sm leading-relaxed line-clamp-2 ${viewMode === 'grid' ? 'mb-3 flex-1' : 'mb-2'}`}>
                      {item.description[lang]}
                    </p>

                    {item.isAvailable && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        className="mt-auto w-full py-2 md:py-2.5 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md active:scale-[0.98]"
                        style={{ backgroundColor: settings.themeColor || '#f59e0b' }}
                      >
                        <ShoppingCart size={16} /> {t.addToCart}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsCartOpen(true)}
          className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-40 flex items-center justify-center`}
          style={{ backgroundColor: settings.themeColor || '#f59e0b' }}
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
            {cartItemCount}
          </span>
        </motion.button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: isRTL ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-full md:w-[400px] bg-stone-50 z-50 shadow-2xl flex flex-col`}
            >
              <div className="p-5 border-b border-stone-200 bg-white flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <ShoppingCart style={{ color: settings.themeColor || '#f59e0b' }} /> {t.cart}
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center text-stone-400 py-12">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t.emptyCart}</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.cartItemId} className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-stone-100 shadow-sm">
                      <img src={item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800'} alt={item.name[lang]} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-bold text-stone-800 text-sm line-clamp-1">{item.name[lang]}</h4>
                        <div className="font-medium text-xs mt-0.5" style={{ color: settings.themeColor || '#f59e0b' }}>{formatPrice(item.price)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"><Minus size={12}/></button>
                          <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, 1)} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"><Plus size={12}/></button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.cartItemId)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 md:p-6 bg-white border-t border-stone-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-stone-500 font-medium">{t.total}</span>
                    <span className="text-xl font-bold text-stone-800">{formatPrice(cartTotal)}</span>
                  </div>
                  {tableNum && (
                    <div className="mb-4 text-sm text-stone-500 text-center bg-stone-50 py-2 rounded-xl border border-stone-200">
                      {t.table}: <span className="font-bold text-stone-800">{tableNum}</span>
                    </div>
                  )}
                  <button 
                    onClick={handleCheckout} 
                    className="w-full py-3.5 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-base flex items-center justify-center gap-2"
                    style={{ backgroundColor: settings.themeColor || '#f59e0b' }}
                  >
                    {t.checkout}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[70] animate-fade-in-up">
          <div className={`px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 text-white font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
