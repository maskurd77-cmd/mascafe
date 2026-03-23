import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useStore } from '../store/useStore';
import { translations, Language } from '../i18n/translations';
import { uploadImage } from '../utils/uploadImage';
import { QRCodeSVG } from 'qrcode.react';
import { LogOut, Plus, Edit2, Trash2, Image as ImageIcon, LayoutDashboard, Coffee, Settings, ImagePlus, Star, Inbox, Eye, X, CheckCircle, Smartphone, Calendar, MessageSquare, QrCode, Printer, ShoppingBag, Clock, Check, Download } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const { lang, setLang, categories, setCategories, menuItems, setMenuItems, banners, setBanners, settings, setSettings, setLastFetch } = useStore();
  const t = translations[lang];
  const isRTL = lang === 'ar' || lang === 'ku';

  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'items' | 'banners' | 'orders' | 'inbox' | 'settings' | 'qr'>('dashboard');

  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  
  const [editingCat, setEditingCat] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  // Form states
  const [catForm, setCatForm] = useState({ name: { en: '', ar: '', ku: '' }, image: '', order: 0 });
  const [itemForm, setItemForm] = useState({ 
    categoryId: '', 
    name: { en: '', ar: '', ku: '' }, 
    description: { en: '', ar: '', ku: '' }, 
    price: 0, 
    image: '', 
    order: 0,
    isAvailable: true,
    isFeatured: false
  });
  const [bannerForm, setBannerForm] = useState({ image: '', link: '', active: true, order: 0 });
  const [settingsForm, setSettingsForm] = useState({ name: { en: '', ar: '', ku: '' }, logo: '', themeColor: '#f59e0b', baseUrl: 'https://melt.masmenu.workers.dev/', tableCount: 15 });

  // Inbox data
  const [reservations, setReservations] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);

  // Uploading state
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchData();
        fetchInbox();
        setupRealtimeListeners();
      }
    });
    return () => unsubscribe();
  }, []);

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio play failed', e));
  };

  const setupRealtimeListeners = () => {
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setOrders(fetchedOrders);
      
      // Check if there's a new order (not on initial load)
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !initialLoad) {
          playNotificationSound();
          if (Notification.permission === 'granted') {
            new Notification(t.newOrder + ' ' + change.doc.data().table);
          }
        }
      });
    });

    const qRes = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      const fetchedRes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setReservations(fetchedRes);
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !initialLoad) {
          playNotificationSound();
          if (Notification.permission === 'granted') {
            new Notification(t.newReservation);
          }
        }
      });
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    setTimeout(() => setInitialLoad(false), 2000);

    return () => {
      unsubOrders();
      unsubRes();
    };
  };

  const fetchData = async () => {
    try {
      const catSnapshot = await getDocs(collection(db, 'categories'));
      const cats = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const itemsSnapshot = await getDocs(collection(db, 'items'));
      const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const bannersSnapshot = await getDocs(collection(db, 'banners'));
      const fetchedBanners = bannersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      if (!settingsSnapshot.empty) {
        const s = settingsSnapshot.docs[0].data() as any;
        setSettings(s);
        setSettingsForm(s);
      }

      setCategories(cats.sort((a, b) => a.order - b.order));
      setMenuItems(items.sort((a, b) => a.order - b.order));
      setBanners(fetchedBanners.sort((a, b) => a.order - b.order));
      setLastFetch(Date.now());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchInbox = async () => {
    try {
      const feedSnapshot = await getDocs(collection(db, 'feedback'));
      setFeedbacks(feedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    } catch (error) {
      console.error("Error fetching inbox:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(t.error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const url = await uploadImage(e.target.files[0]);
      setter(url);
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // CRUD Operations
  const saveCategory = async () => {
    try {
      if (editingCat) {
        await updateDoc(doc(db, 'categories', editingCat.id), catForm);
      } else {
        await addDoc(collection(db, 'categories'), catForm);
      }
      setIsCatModalOpen(false);
      fetchData();
    } catch (error) {
      alert(t.error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        fetchData();
      } catch (error) {
        alert(t.error);
      }
    }
  };

  const saveItem = async () => {
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'items', editingItem.id), itemForm);
      } else {
        await addDoc(collection(db, 'items'), itemForm);
      }
      setIsItemModalOpen(false);
      fetchData();
    } catch (error) {
      alert(t.error);
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteDoc(doc(db, 'items', id));
        fetchData();
      } catch (error) {
        alert(t.error);
      }
    }
  };

  const saveBanner = async () => {
    try {
      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), bannerForm);
      } else {
        await addDoc(collection(db, 'banners'), bannerForm);
      }
      setIsBannerModalOpen(false);
      fetchData();
    } catch (error) {
      alert(t.error);
    }
  };

  const deleteBanner = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteDoc(doc(db, 'banners', id));
        fetchData();
      } catch (error) {
        alert(t.error);
      }
    }
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'main'), settingsForm);
      alert(t.success);
      fetchData();
    } catch (error) {
      alert(t.error);
    }
  };

  const downloadQRCode = (tableNum: number) => {
    const svg = document.getElementById(`qr-table-${tableNum}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `table-${tableNum}-qr.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) {
    return (
      <div className={`min-h-screen bg-stone-50 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-stone-100">
          <div className="text-center mb-8">
            <Coffee className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-stone-800">{t.admin}</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-2">{t.email}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-2">{t.password}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors">
              {t.login}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Mobile App-like Bottom Navigation
  const NavItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'categories', icon: LayoutDashboard, label: t.categories },
    { id: 'items', icon: Coffee, label: 'Items' },
    { id: 'orders', icon: ShoppingBag, label: t.orders },
    { id: 'banners', icon: ImagePlus, label: t.banners },
    { id: 'inbox', icon: Inbox, label: t.inbox },
    { id: 'qr', icon: QrCode, label: t.qrCodes },
    { id: 'settings', icon: Settings, label: t.settings },
  ];

  return (
    <div className={`min-h-screen bg-stone-50 flex flex-col md:flex-row ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-stone-900 text-stone-300 flex-col h-screen sticky top-0 print:hidden">
        <div className="p-6 border-b border-stone-800 flex items-center gap-3">
          {settings.logo ? <img src={settings.logo} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" /> : <Coffee className="text-amber-500" />}
          <h2 className="text-white font-serif font-bold text-xl line-clamp-1">{settings.name.en || 'Admin'}</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NavItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === item.id ? 'bg-amber-500 text-white' : 'hover:bg-stone-800'}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-stone-800 transition-colors">
            <LogOut size={20} />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8 print:p-0 print:m-0 print:overflow-visible">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-serif font-bold text-stone-800 mb-8">{t.dashboard}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 text-center">
                <Coffee className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <h3 className="text-3xl font-bold text-stone-800">{menuItems.length}</h3>
                <p className="text-stone-500 text-sm">{t.totalItems}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 text-center">
                <LayoutDashboard className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <h3 className="text-3xl font-bold text-stone-800">{categories.length}</h3>
                <p className="text-stone-500 text-sm">{t.totalCategories}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <h3 className="text-3xl font-bold text-stone-800">{orders.length}</h3>
                <p className="text-stone-500 text-sm">{t.orders}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 text-center">
                <Calendar className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <h3 className="text-3xl font-bold text-stone-800">{reservations.length}</h3>
                <p className="text-stone-500 text-sm">{t.totalReservations}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 text-center">
                <MessageSquare className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <h3 className="text-3xl font-bold text-stone-800">{feedbacks.length}</h3>
                <p className="text-stone-500 text-sm">{t.totalFeedbacks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-serif font-bold text-stone-800">{t.categories}</h1>
              <button onClick={() => { setEditingCat(null); setCatForm({ name: { en: '', ar: '', ku: '' }, image: '', order: categories.length }); setIsCatModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium shadow-sm">
                <Plus size={20} /> <span className="hidden sm:inline">{t.addCategory}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    {cat.image ? <img src={cat.image} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" /> : <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400"><ImageIcon size={24} /></div>}
                    <div>
                      <h3 className="font-bold text-stone-800">{cat.name.en}</h3>
                      <p className="text-sm text-stone-500">{cat.name.ku}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCat(cat); setCatForm(cat); setIsCatModalOpen(true); }} className="p-2 text-stone-400 hover:text-amber-500 bg-stone-50 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-stone-400 hover:text-red-500 bg-stone-50 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-serif font-bold text-stone-800">Menu Items</h1>
              <button onClick={() => { setEditingItem(null); setItemForm({ categoryId: categories[0]?.id || '', name: { en: '', ar: '', ku: '' }, description: { en: '', ar: '', ku: '' }, price: 0, image: '', order: menuItems.length, isAvailable: true, isFeatured: false }); setIsItemModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium shadow-sm">
                <Plus size={20} /> <span className="hidden sm:inline">{t.addItem}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems.map(item => (
                <div key={item.id} className={`bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden relative ${!item.isAvailable ? 'opacity-60' : ''}`}>
                  <div className="h-48 relative">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400"><ImageIcon size={32} /></div>}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button onClick={() => { setEditingItem(item); setItemForm(item); setIsItemModalOpen(true); }} className="p-2 text-stone-700 bg-white/90 backdrop-blur-sm rounded-lg hover:text-amber-500 shadow-sm"><Edit2 size={18} /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-2 text-stone-700 bg-white/90 backdrop-blur-sm rounded-lg hover:text-red-500 shadow-sm"><Trash2 size={18} /></button>
                    </div>
                    {item.isFeatured && <div className="absolute top-2 left-2 bg-amber-500 text-white p-1.5 rounded-full shadow-sm"><Star size={16} fill="currentColor" /></div>}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-stone-800 line-clamp-1">{item.name.en}</h3>
                      <span className="font-bold text-amber-500">{item.price.toLocaleString('en-US')} {t.iqd}</span>
                    </div>
                    <p className="text-sm text-stone-500 line-clamp-2">{item.description.en}</p>
                    {!item.isAvailable && <span className="inline-block mt-2 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">{t.soldOut}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-800 mb-8">{t.orders}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
                  <div className={`p-4 border-b flex justify-between items-center ${order.status === 'pending' ? 'bg-amber-50 border-amber-100' : order.status === 'preparing' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-stone-800">{t.table} {order.table}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'pending' ? 'bg-amber-200 text-amber-800' : order.status === 'preparing' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                      {order.status === 'pending' ? t.pending : order.status === 'preparing' ? t.preparing : t.completed}
                    </span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto max-h-60">
                    <ul className="space-y-3">
                      {order.items.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800">{item.quantity}x</span>
                            <span className="text-stone-600">{item.name[lang]}</span>
                          </div>
                          <span className="text-stone-500">{(item.price * item.quantity).toLocaleString()} {t.iqd}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 border-t border-stone-100 bg-stone-50 flex flex-col gap-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>{t.total}</span>
                      <span className="text-amber-600">{order.total.toLocaleString()} {t.iqd}</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button onClick={() => updateDoc(doc(db, 'orders', order.id), { status: 'preparing' })} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                          <Clock size={16} /> {t.preparing}
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateDoc(doc(db, 'orders', order.id), { status: 'completed' })} className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                          <Check size={16} /> {t.completed}
                        </button>
                      )}
                      <button onClick={() => deleteDoc(doc(db, 'orders', order.id))} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="col-span-full py-12 text-center text-stone-500">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No orders yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Banners Tab */}
        {activeTab === 'banners' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-serif font-bold text-stone-800">{t.banners}</h1>
              <button onClick={() => { setEditingBanner(null); setBannerForm({ image: '', link: '', active: true, order: banners.length }); setIsBannerModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium shadow-sm">
                <Plus size={20} /> <span className="hidden sm:inline">{t.addBanner}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map(banner => (
                <div key={banner.id} className={`bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden relative ${!banner.active ? 'opacity-50' : ''}`}>
                  <div className="h-48 relative">
                    {banner.image ? <img src={banner.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400"><ImageIcon size={32} /></div>}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button onClick={() => { setEditingBanner(banner); setBannerForm(banner); setIsBannerModalOpen(true); }} className="p-2 text-stone-700 bg-white/90 backdrop-blur-sm rounded-lg hover:text-amber-500 shadow-sm"><Edit2 size={18} /></button>
                      <button onClick={() => deleteBanner(banner.id)} className="p-2 text-stone-700 bg-white/90 backdrop-blur-sm rounded-lg hover:text-red-500 shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-sm text-stone-500 truncate max-w-[200px]">{banner.link || 'No Link'}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${banner.active ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-500'}`}>{banner.active ? t.active : 'Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div className="space-y-12">
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800 mb-6">{t.reservations}</h1>
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 text-sm">
                        <th className="p-4 font-medium">{t.name}</th>
                        <th className="p-4 font-medium">{t.phone}</th>
                        <th className="p-4 font-medium">{t.date}</th>
                        <th className="p-4 font-medium">{t.time}</th>
                        <th className="p-4 font-medium">{t.guests}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map(res => (
                        <tr key={res.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                          <td className="p-4 font-medium text-stone-800">{res.name}</td>
                          <td className="p-4 text-stone-600">{res.phone}</td>
                          <td className="p-4 text-stone-600">{res.date}</td>
                          <td className="p-4 text-stone-600">{res.time}</td>
                          <td className="p-4 text-stone-600">{res.guests}</td>
                        </tr>
                      ))}
                      {reservations.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-stone-500">No reservations</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800 mb-6">{t.feedbacks}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedbacks.map(feed => (
                  <div key={feed.id} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-stone-800">{feed.name}</h3>
                        {feed.email && <p className="text-sm text-stone-500">{feed.email}</p>}
                      </div>
                      <div className="flex text-amber-500 text-sm">
                        {Array.from({length: parseInt(feed.rating)}).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                      </div>
                    </div>
                    <p className="text-stone-600 text-sm italic mb-4 flex-1">"{feed.message}"</p>
                    {feed.email && (
                      <div className="pt-4 border-t border-stone-100 mt-auto">
                        <a href={`mailto:${feed.email}?subject=Reply from MasCafe`} className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 justify-center py-2 bg-amber-50 rounded-xl transition-colors">
                          <MessageSquare size={16} /> Reply to Customer
                        </a>
                      </div>
                    )}
                  </div>
                ))}
                {feedbacks.length === 0 && <div className="col-span-full p-8 text-center text-stone-500 bg-white rounded-3xl border border-stone-100">No feedbacks</div>}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl print:hidden">
            <h1 className="text-3xl font-serif font-bold text-stone-800 mb-8">{t.settings}</h1>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  {settingsForm.logo ? <img src={settingsForm.logo} className="w-24 h-24 rounded-full object-cover border-4 border-stone-50" referrerPolicy="no-referrer" /> : <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center text-stone-400"><Coffee size={32} /></div>}
                  <label className="absolute bottom-0 right-0 p-2 bg-amber-500 text-white rounded-full cursor-pointer shadow-lg hover:bg-amber-600 transition-colors">
                    <ImagePlus size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => setSettingsForm({...settingsForm, logo: url}))} />
                  </label>
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 text-lg">{t.cafeLogo}</h3>
                  <p className="text-sm text-stone-500">Upload a square image for best results.</p>
                  {uploading && <span className="text-xs text-amber-500 font-bold animate-pulse">Uploading...</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">{t.cafeName} (English)</label>
                <input type="text" value={settingsForm.name.en} onChange={e => setSettingsForm({...settingsForm, name: {...settingsForm.name, en: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">{t.cafeName} (Arabic)</label>
                <input type="text" value={settingsForm.name.ar} onChange={e => setSettingsForm({...settingsForm, name: {...settingsForm.name, ar: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">{t.cafeName} (Kurdish)</label>
                <input type="text" value={settingsForm.name.ku} onChange={e => setSettingsForm({...settingsForm, name: {...settingsForm.name, ku: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none" dir="rtl" />
              </div>

              <button onClick={saveSettings} className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium transition-colors shadow-lg">
                {t.save}
              </button>
            </div>
          </div>
        )}

        {/* QR Codes Tab */}
        {activeTab === 'qr' && (
          <div className="max-w-5xl print:max-w-none">
            <div className="flex justify-between items-center mb-8 print:hidden">
              <h1 className="text-3xl font-serif font-bold text-stone-800">{t.qrCodes}</h1>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium shadow-sm">
                <Printer size={20} /> <span className="hidden sm:inline">{t.print}</span>
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 mb-8 print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">{t.baseUrl}</label>
                  <input type="text" value={settingsForm.baseUrl || ''} onChange={e => setSettingsForm({...settingsForm, baseUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">{t.numberOfTables}</label>
                  <input type="number" min="1" max="200" value={settingsForm.tableCount || 15} onChange={e => setSettingsForm({...settingsForm, tableCount: parseInt(e.target.value) || 1})} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
              <button onClick={saveSettings} className="w-full py-4 mt-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors shadow-lg">
                {t.save}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 print:grid-cols-3 print:gap-8 print:w-full">
              {Array.from({ length: settings.tableCount || 15 }).map((_, i) => {
                const tableNum = i + 1;
                const url = `${settings.baseUrl || 'https://melt.masmenu.workers.dev/'}?table=${tableNum}`;
                return (
                  <div key={tableNum} className="bg-white p-8 rounded-[2rem] shadow-sm border-2 border-amber-500 flex flex-col items-center text-center print:shadow-none print:break-inside-avoid relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-16 bg-amber-500 flex items-center justify-center">
                      <h3 className="text-2xl font-bold text-white font-serif">{t.table} {tableNum}</h3>
                    </div>
                    <div className="mt-16 mb-6">
                      {settings.logo ? <img src={settings.logo} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md -mt-8 relative z-10" referrerPolicy="no-referrer" /> : <Coffee className="w-12 h-12 text-amber-500" />}
                    </div>
                    <h4 className="text-lg font-bold text-stone-800 mb-2">{settings.name[lang] || 'MasCafe'}</h4>
                    <p className="text-sm text-stone-500 mb-6 font-medium">{t.scanToOrder}</p>
                    <div className="bg-white p-3 rounded-2xl border-2 border-stone-100 mb-4 shadow-sm">
                      <QRCodeSVG id={`qr-table-${tableNum}`} value={url} size={140} level="H" includeMargin={false} />
                    </div>
                    <p className="text-[10px] text-stone-400 break-all w-full mt-auto mb-4" dir="ltr">{url}</p>
                    <button onClick={() => downloadQRCode(tableNum)} className="print:hidden w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                      <Download size={16} /> Download
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-safe z-40 print:hidden">
        <div className="flex justify-around items-center h-16">
          {NavItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === item.id ? 'text-amber-500' : 'text-stone-400'}`}
            >
              <item.icon size={20} className="mb-1" />
              <span className="text-[10px] font-medium truncate w-full text-center px-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Item Modal with Live Preview */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[2rem] max-w-5xl w-full shadow-2xl my-8 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Form Side */}
            <div className="flex-1 p-8 lg:border-r border-stone-100 overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingItem ? t.edit : t.addItem}</h2>
                <button onClick={() => setIsItemModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-800 bg-stone-100 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="space-y-5">
                {/* Image Upload */}
                <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="w-20 h-20 rounded-xl bg-stone-200 overflow-hidden shrink-0">
                    {itemForm.image ? <img src={itemForm.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <ImageIcon className="w-full h-full p-6 text-stone-400" />}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium cursor-pointer hover:bg-stone-50 transition-colors">
                      <ImagePlus size={18} /> {uploading ? 'Uploading...' : t.uploadImage}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => setItemForm({...itemForm, image: url}))} disabled={uploading} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-600 mb-1">Category</label>
                    <select value={itemForm.categoryId} onChange={e => setItemForm({...itemForm, categoryId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none bg-stone-50">
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name.en}</option>)}
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="col-span-2 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={itemForm.isAvailable} onChange={e => setItemForm({...itemForm, isAvailable: e.target.checked})} className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500" />
                      <span className="text-sm font-medium text-stone-700">{t.available}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={itemForm.isFeatured} onChange={e => setItemForm({...itemForm, isFeatured: e.target.checked})} className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500" />
                      <span className="text-sm font-medium text-stone-700">{t.featured}</span>
                    </label>
                  </div>
                  
                  <div className="col-span-2"><label className="block text-sm font-medium text-stone-600 mb-1">Name (EN)</label><input type="text" value={itemForm.name.en} onChange={e => setItemForm({...itemForm, name: {...itemForm.name, en: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none" /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-stone-600 mb-1">Name (AR)</label><input type="text" value={itemForm.name.ar} onChange={e => setItemForm({...itemForm, name: {...itemForm.name, ar: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none" dir="rtl" /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-stone-600 mb-1">Name (KU)</label><input type="text" value={itemForm.name.ku} onChange={e => setItemForm({...itemForm, name: {...itemForm.name, ku: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none" dir="rtl" /></div>

                  <div className="col-span-2"><label className="block text-sm font-medium text-stone-600 mb-1">Description (EN)</label><textarea rows={2} value={itemForm.description.en} onChange={e => setItemForm({...itemForm, description: {...itemForm.description, en: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none resize-none" /></div>
                  
                  <div className="col-span-2"><label className="block text-sm font-medium text-stone-600 mb-1">Price ({t.iqd})</label><input type="number" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: parseFloat(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none" /></div>
                </div>

                <button onClick={saveItem} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20 mt-4">{t.save}</button>
              </div>
            </div>

            {/* Live Preview Side */}
            <div className="hidden lg:block w-96 bg-stone-100 p-8 relative">
              <div className="sticky top-8">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Smartphone size={16}/> {t.preview}</h3>
                
                {/* Preview Card */}
                <div className={`bg-white rounded-3xl overflow-hidden shadow-xl border border-stone-200 transition-all relative ${!itemForm.isAvailable ? 'opacity-60' : ''}`}>
                  {!itemForm.isAvailable && (
                    <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-stone-900 text-white px-4 py-1.5 text-sm rounded-full font-bold tracking-widest uppercase shadow-xl">{t.soldOut}</span>
                    </div>
                  )}
                  <div className="h-48 relative">
                    {itemForm.image ? <img src={itemForm.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300"><ImageIcon size={48} /></div>}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-amber-600 shadow-sm text-sm">
                        {itemForm.price.toLocaleString('en-US')} {t.iqd}
                      </div>
                      {itemForm.isFeatured && <div className="bg-amber-500 text-white p-2 rounded-full shadow-sm"><Star size={14} fill="currentColor" /></div>}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 font-serif">{itemForm.name[lang] || 'Item Name'}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed line-clamp-2">{itemForm.description[lang] || 'Item description will appear here...'}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingCat ? t.edit : t.addCategory}</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-800 bg-stone-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="w-16 h-16 rounded-xl bg-stone-200 overflow-hidden shrink-0">
                  {catForm.image ? <img src={catForm.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <ImageIcon className="w-full h-full p-4 text-stone-400" />}
                </div>
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium cursor-pointer hover:bg-stone-50 transition-colors text-sm">
                    <ImagePlus size={16} /> {uploading ? '...' : t.uploadImage}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => setCatForm({...catForm, image: url}))} disabled={uploading} />
                  </label>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-stone-600 mb-1">Name (EN)</label><input type="text" value={catForm.name.en} onChange={e => setCatForm({...catForm, name: {...catForm.name, en: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-stone-600 mb-1">Name (AR)</label><input type="text" value={catForm.name.ar} onChange={e => setCatForm({...catForm, name: {...catForm.name, ar: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none" dir="rtl" /></div>
              <div><label className="block text-sm font-medium text-stone-600 mb-1">Name (KU)</label><input type="text" value={catForm.name.ku} onChange={e => setCatForm({...catForm, name: {...catForm.name, ku: e.target.value}})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none" dir="rtl" /></div>
              <button onClick={saveCategory} className="w-full py-4 mt-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors shadow-lg">{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingBanner ? t.edit : t.addBanner}</h2>
              <button onClick={() => setIsBannerModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-800 bg-stone-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="w-full h-40 bg-stone-100 rounded-2xl overflow-hidden relative border border-stone-200 mb-4">
                {bannerForm.image ? <img src={bannerForm.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex flex-col items-center justify-center text-stone-400"><ImageIcon size={32} className="mb-2"/><span className="text-sm">16:9 aspect ratio recommended</span></div>}
                <label className="absolute bottom-2 right-2 p-2 bg-white text-stone-800 rounded-full cursor-pointer shadow-lg hover:bg-stone-50 transition-colors">
                  <ImagePlus size={18} />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => setBannerForm({...bannerForm, image: url}))} disabled={uploading} />
                </label>
              </div>
              
              <div><label className="block text-sm font-medium text-stone-600 mb-1">{t.link}</label><input type="text" value={bannerForm.link} onChange={e => setBannerForm({...bannerForm, link: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none" placeholder="https://" /></div>
              
              <label className="flex items-center gap-2 cursor-pointer mt-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                <input type="checkbox" checked={bannerForm.active} onChange={e => setBannerForm({...bannerForm, active: e.target.checked})} className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500" />
                <span className="text-sm font-medium text-stone-700">{t.active}</span>
              </label>

              <button onClick={saveBanner} className="w-full py-4 mt-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors shadow-lg">{t.save}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
