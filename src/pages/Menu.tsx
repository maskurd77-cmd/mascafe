import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Search, Coffee, ChevronDown, Star, LayoutGrid, List, ShoppingCart, Plus, Minus, X, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { translations, Language } from '../i18n/translations';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FlagKU, FlagAR, FlagEN } from '../components/Flags';

export default function Menu() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableNum = searchParams.get('table');
  
  const { lang, setLang, categories, setCategories, menuItems, setMenuItems, banners, setBanners, settings, setSettings, lastFetch, setLastFetch, cart, addToCart, removeFromCart, updateQuantity, clearCart } = useStore();
  const t = translations[lang];
  const isRTL = lang === 'ar' || lang === 'ku';

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCartOpen, setIsCartOpen] = useState(false);
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
        const catSnapshot = await getDocs(collection(db, 'categories'));
        const cats = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        const itemsSnapshot = await getDocs(collection(db, 'items'));
        const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        const bannersSnapshot = await getDocs(collection(db, 'banners'));
        const fetchedBanners = bannersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        const settingsSnapshot = await getDocs(collection(db, 'settings'));
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
      alert(t.orderPlaced);
      clearCart();
      setIsCartOpen(false);
    } catch (error) {
      console.error(error);
      alert(t.error);
    }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-800 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="p-2.5 hover:bg-stone-100 rounded-full transition-colors text-stone-600"
          >
            {isRTL ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
          </button>
          
          <h1 className="text-2xl font-serif font-bold text-amber-600 flex items-center gap-2">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Coffee size={24} /> 
            )}
            {settings.name[lang] || 'MasCafe'}
          </h1>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-full transition-colors font-medium text-sm"
            >
              {lang === 'ku' ? <><FlagKU /> کوردی</> : lang === 'ar' ? <><FlagAR /> عربي</> : <><FlagEN /> English</>}
              <ChevronDown size={16} className={`transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & View Toggle */}
        <div className="flex items-center gap-4 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-stone-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
            />
          </div>
          <div className="flex items-center bg-white rounded-2xl p-1 shadow-sm border border-stone-200 shrink-0">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-3 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-amber-500 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-3 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Promotional Banners */}
        {activeBanners.length > 0 && (
          <div className="flex overflow-x-auto hide-scrollbar gap-6 mb-8 snap-x snap-mandatory">
            {activeBanners.map(banner => (
              <a 
                key={banner.id} 
                href={banner.link || '#'} 
                target={banner.link ? "_blank" : "_self"}
                className="flex-shrink-0 w-full md:w-2/3 lg:w-1/2 h-48 md:h-64 rounded-3xl overflow-hidden snap-center relative group"
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

        {/* Categories */}
        <div className="flex overflow-x-auto hide-scrollbar gap-4 mb-8 pb-4">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl font-medium transition-all ${
              activeCategory === 'all' 
                ? 'bg-stone-900 text-white shadow-md' 
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            {t.all}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-3 px-6 py-2 rounded-2xl font-medium transition-all ${
                activeCategory === cat.id 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat.image && (
                <img src={cat.image} alt={cat.name[lang]} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              )}
              {cat.name[lang]}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
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
                  
                  <div className={`relative overflow-hidden shrink-0 ${viewMode === 'grid' ? 'h-32 md:h-64' : 'w-32 md:w-48 h-full'}`}>
                    <img 
                      src={item.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800'} 
                      alt={item.name[lang]} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {viewMode === 'grid' && (
                      <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2 items-end">
                        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 md:px-4 md:py-2 rounded-full font-bold text-amber-600 shadow-sm text-xs md:text-base">
                          {formatPrice(item.price)}
                        </div>
                        {item.isFeatured && (
                          <div className="bg-amber-500 text-white p-1.5 md:p-2 rounded-full shadow-sm">
                            <Star size={14} fill="currentColor" className="md:w-4 md:h-4" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={`flex-1 flex flex-col ${viewMode === 'grid' ? 'p-3 md:p-6' : 'p-3 md:p-6 justify-center'}`}>
                    {viewMode === 'list' ? (
                      <div className="flex justify-between items-start mb-1 md:mb-2">
                        <h3 className="text-base md:text-xl font-bold font-serif line-clamp-1 pr-2">{item.name[lang]}</h3>
                        <div className="font-bold text-amber-600 whitespace-nowrap text-sm md:text-base">
                          {formatPrice(item.price)}
                        </div>
                      </div>
                    ) : (
                      <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2 font-serif line-clamp-1">{item.name[lang]}</h3>
                    )}
                    
                    <p className={`text-stone-500 text-xs md:text-sm leading-relaxed line-clamp-2 ${viewMode === 'grid' ? 'mb-2 flex-1' : ''}`}>
                      {item.description[lang]}
                    </p>

                    {item.isAvailable && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        className="mt-2 w-full py-2 bg-stone-100 hover:bg-amber-500 hover:text-white text-stone-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Plus size={16} /> {t.addToCart}
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
          className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} bg-amber-500 text-white p-4 rounded-full shadow-2xl hover:bg-amber-600 transition-colors z-40 flex items-center justify-center`}
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: isRTL ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-full md:w-96 bg-white z-50 shadow-2xl flex flex-col`}
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                  <ShoppingCart className="text-amber-500" /> {t.cart}
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-200 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center text-stone-400 py-12">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t.emptyCart}</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.cartItemId} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                      <img src={item.image} alt={item.name[lang]} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-bold text-stone-800 line-clamp-1">{item.name[lang]}</h4>
                        <div className="text-amber-600 font-medium text-sm">{formatPrice(item.price)}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"><Minus size={14}/></button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, 1)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"><Plus size={14}/></button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.cartItemId)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-stone-100 bg-stone-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-stone-500 font-medium">{t.total}</span>
                    <span className="text-2xl font-bold text-stone-800">{formatPrice(cartTotal)}</span>
                  </div>
                  {tableNum && (
                    <div className="mb-4 text-sm text-stone-500 text-center bg-white py-2 rounded-xl border border-stone-200">
                      {t.table}: <span className="font-bold text-stone-800">{tableNum}</span>
                    </div>
                  )}
                  <button onClick={handleCheckout} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20 text-lg">
                    {t.checkout}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
