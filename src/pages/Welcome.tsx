import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Calendar, MessageSquare, MapPin, Phone, Mail, X, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { translations, Language } from '../i18n/translations';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { FlagKU, FlagAR, FlagEN } from '../components/Flags';

export default function Welcome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, setLang, settings, setSettings, tableNum, setTableNum } = useStore();
  const t = translations[lang];
  const isRTL = lang === 'ar' || lang === 'ku';

  useEffect(() => {
    const table = searchParams.get('table');
    if (table) {
      setTableNum(table);
    }
  }, [searchParams, setTableNum]);

  const [activeModal, setActiveModal] = useState<'reservation' | 'feedback' | 'contact' | null>(null);
  const [resData, setResData] = useState({ name: '', phone: '', date: '', time: '', guests: '2' });
  const [feedData, setFeedData] = useState({ name: '', email: '', rating: '5', message: '' });
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        if (!settingsSnapshot.empty) {
          setSettings(settingsSnapshot.docs[0].data() as any);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    if (!settings.name.en) {
      fetchSettings();
    }
  }, [setSettings, settings.name.en]);

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'reservations'), { ...resData, createdAt: new Date() });
      showToast(t.success);
      setResData({ name: '', phone: '', date: '', time: '', guests: '2' });
      setActiveModal(null);
    } catch (error) {
      console.error(error);
      showToast(t.error, 'error');
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'feedback'), { ...feedData, createdAt: new Date() });
      showToast(t.success);
      setFeedData({ name: '', email: '', rating: '5', message: '' });
      setActiveModal(null);
    } catch (error) {
      console.error(error);
      showToast(t.error, 'error');
    }
  };

  return (
    <div className={`relative min-h-screen bg-stone-900 text-stone-50 overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop" 
          alt="Cafe Background" 
          className="w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/40 to-stone-900/90"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center">
        
        {/* Logo & Title */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center mb-10"
        >
          <div className="p-4 rounded-full backdrop-blur-sm border mb-6" style={{ backgroundColor: `${settings.themeColor || '#f59e0b'}1a`, borderColor: `${settings.themeColor || '#f59e0b'}33` }}>
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Coffee size={48} style={{ color: settings.themeColor || '#f59e0b' }} />
            )}
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tight text-white drop-shadow-2xl">
            {settings.name[lang] || 'MasCafe'}
          </h1>
          <p className="mt-4 text-stone-300 text-lg md:text-xl tracking-[0.2em] uppercase font-light">
            Premium Experience
          </p>
        </motion.div>

        {/* Language Switcher */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 mb-12 shadow-2xl"
        >
          <button
            onClick={() => setLang('ku')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              lang === 'ku' ? 'text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            style={lang === 'ku' ? { backgroundColor: settings.themeColor || '#f59e0b', boxShadow: `0 10px 15px -3px ${settings.themeColor || '#f59e0b'}4d, 0 4px 6px -4px ${settings.themeColor || '#f59e0b'}4d` } : {}}
          >
            <FlagKU /> کوردی
          </button>
          <button
            onClick={() => setLang('ar')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              lang === 'ar' ? 'text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            style={lang === 'ar' ? { backgroundColor: settings.themeColor || '#f59e0b', boxShadow: `0 10px 15px -3px ${settings.themeColor || '#f59e0b'}4d, 0 4px 6px -4px ${settings.themeColor || '#f59e0b'}4d` } : {}}
          >
            <FlagAR /> عربي
          </button>
          <button
            onClick={() => setLang('en')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              lang === 'en' ? 'text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            style={lang === 'en' ? { backgroundColor: settings.themeColor || '#f59e0b', boxShadow: `0 10px 15px -3px ${settings.themeColor || '#f59e0b'}4d, 0 4px 6px -4px ${settings.themeColor || '#f59e0b'}4d` } : {}}
          >
            <FlagEN /> English
          </button>
        </motion.div>

        {/* Primary Action */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={() => navigate(tableNum ? `/menu?table=${tableNum}` : '/menu')}
          className="px-12 py-5 text-white rounded-full font-bold text-xl transition-all duration-300 hover:scale-105 mb-8"
          style={{ backgroundColor: settings.themeColor || '#f59e0b', boxShadow: `0 0 40px ${settings.themeColor || '#f59e0b'}4d` }}
        >
          {t.viewMenu}
        </motion.button>

        {/* Secondary Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-4 max-w-2xl"
        >
          <button 
            onClick={() => setActiveModal('reservation')} 
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/10 text-stone-200 hover:text-white rounded-full font-medium transition-all duration-300"
          >
            <Calendar size={18} style={{ color: settings.themeColor || '#f59e0b' }} /> {t.reservation}
          </button>
          <button 
            onClick={() => setActiveModal('feedback')} 
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/10 text-stone-200 hover:text-white rounded-full font-medium transition-all duration-300"
          >
            <MessageSquare size={18} style={{ color: settings.themeColor || '#f59e0b' }} /> {t.feedback}
          </button>
          <button 
            onClick={() => setActiveModal('contact')} 
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/15 backdrop-blur-md border border-white/10 text-stone-200 hover:text-white rounded-full font-medium transition-all duration-300"
          >
            <Phone size={18} style={{ color: settings.themeColor || '#f59e0b' }} /> {t.contact}
          </button>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg bg-white text-stone-800 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
                <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-3">
                  {activeModal === 'reservation' && <Calendar style={{ color: settings.themeColor || '#f59e0b' }} />}
                  {activeModal === 'feedback' && <MessageSquare style={{ color: settings.themeColor || '#f59e0b' }} />}
                  {activeModal === 'contact' && <Phone style={{ color: settings.themeColor || '#f59e0b' }} />}
                  {activeModal === 'reservation' ? t.reservation : activeModal === 'feedback' ? t.feedback : t.contact}
                </h2>
                <button 
                  onClick={() => setActiveModal(null)} 
                  className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-8">
                {activeModal === 'reservation' && (
                  <form onSubmit={handleReservation} className="space-y-5 text-start">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-stone-500 mb-1.5">{t.name}</label>
                        <input required type="text" value={resData.name} onChange={e => setResData({...resData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 outline-none transition-all" style={{ '--tw-ring-color': settings.themeColor || '#f59e0b' } as any} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-500 mb-1.5">{t.phone}</label>
                        <input required type="tel" value={resData.phone} onChange={e => setResData({...resData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 outline-none transition-all" style={{ '--tw-ring-color': settings.themeColor || '#f59e0b' } as any} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-500 mb-1.5">{t.date}</label>
                        <input required type="date" value={resData.date} onChange={e => setResData({...resData, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 outline-none transition-all" style={{ '--tw-ring-color': settings.themeColor || '#f59e0b' } as any} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-500 mb-1.5">{t.time}</label>
                        <input required type="time" value={resData.time} onChange={e => setResData({...resData, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 outline-none transition-all" style={{ '--tw-ring-color': settings.themeColor || '#f59e0b' } as any} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-stone-500 mb-1.5">{t.guests}</label>
                        <select value={resData.guests} onChange={e => setResData({...resData, guests: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 outline-none transition-all" style={{ '--tw-ring-color': settings.themeColor || '#f59e0b' } as any}>
                          {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-4 mt-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium transition-colors shadow-lg shadow-stone-900/20">
                      {t.bookTable}
                    </button>
                  </form>
                )}

                {activeModal === 'feedback' && (
                  <form onSubmit={handleFeedback} className="space-y-5 text-start">
                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-1.5">{t.name}</label>
                      <input required type="text" value={feedData.name} onChange={e => setFeedData({...feedData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 outline-none transition-all" style={{ '--tw-ring-color': settings.themeColor || '#f59e0b' } as any} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-1.5">{t.email}</label>
                      <input type="email" value={feedData.email} onChange={e => setFeedData({...feedData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 outline-none transition-all" style={{ '--tw-ring-color': settings.themeColor || '#f59e0b' } as any} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-2">{t.rating}</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(star => (
                          <button 
                            key={star} 
                            type="button"
                            onClick={() => setFeedData({...feedData, rating: star.toString()})}
                            className={`text-3xl transition-colors ${parseInt(feedData.rating) >= star ? '' : 'text-stone-200 hover:text-stone-300'}`}
                            style={parseInt(feedData.rating) >= star ? { color: settings.themeColor || '#f59e0b' } : {}}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-500 mb-1.5">{t.message}</label>
                      <textarea required rows={4} value={feedData.message} onChange={e => setFeedData({...feedData, message: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 outline-none resize-none transition-all" style={{ '--tw-ring-color': settings.themeColor || '#f59e0b' } as any}></textarea>
                    </div>
                    <button type="submit" className="w-full py-4 mt-2 text-white rounded-xl font-medium transition-colors shadow-lg" style={{ backgroundColor: settings.themeColor || '#f59e0b', boxShadow: `0 10px 15px -3px ${settings.themeColor || '#f59e0b'}33` }}>
                      {t.sendFeedback}
                    </button>
                  </form>
                )}

                {activeModal === 'contact' && (
                  <div className="space-y-8 text-stone-600 py-4">
                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-800 mb-1">{t.address}</h3>
                        <p className="text-stone-500">123 Coffee Street, City Center</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Phone size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-800 mb-1">{t.phone}</h3>
                        <p className="text-stone-500" dir="ltr">+1 234 567 8900</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Mail size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-800 mb-1">{t.email}</h3>
                        <p className="text-stone-500">hello@mascafe.com</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
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
