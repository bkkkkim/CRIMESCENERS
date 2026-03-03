
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Youtube, Settings, Globe, Shield, FileText } from 'lucide-react';
import { DEFAULT_ADMIN_SETTINGS } from './constants';
import { AdminSettings } from './types';
import { dataService } from './src/services/dataService';
import { AnimatePresence, motion } from 'framer-motion';
import LoadingScreen from './components/LoadingScreen';

// Lazy load components
const Home = lazy(() => import('./components/Home'));
const ThemeReservation = lazy(() => import('./components/ThemeReservation'));
const ThemeDetail = lazy(() => import('./components/ThemeDetail'));
const BookingForm = lazy(() => import('./components/BookingForm'));
const BookingSuccess = lazy(() => import('./components/BookingSuccess'));
const ContactForm = lazy(() => import('./components/ContactForm'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const NoticeBoard = lazy(() => import('./components/NoticeBoard'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Header = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const loadSettings = async () => {
      const saved = await dataService.getSettings();
      setSettings(saved);
    };
    loadSettings();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const isHome = location.pathname === '/';
  const headerBg = isHome 
    ? (isScrolled || isMenuOpen ? 'bg-[#121212] border-b border-white/10' : 'bg-transparent')
    : 'bg-[#121212] border-b border-white/10';

  const navItems = [
    { name: '홈', path: '/' },
    { name: '이용안내', path: '/info' },
    { name: '예약하기', path: '/reservation' },
    { name: '문의하기', path: '/contact' }
  ];

  return (
    <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-[101]">
        <Link to="/" className="h-10 flex items-center">
          {settings.logoUrl && settings.logoUrl !== '/logo.jpg' ? (
            <img src={settings.logoUrl} alt="CRIME SCENERS" className="h-full w-auto object-contain" />
          ) : (
            <span className="text-xl font-black tracking-tighter text-white font-en uppercase">
              Crime Sceners
            </span>
          )}
        </Link>
        <nav className="hidden md:flex space-x-10">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="text-sm font-bold hover:text-white transition-colors tracking-tight">
              {item.name}
            </Link>
          ))}
        </nav>
        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 bg-[#121212] z-[100] pt-24 p-6 flex flex-col space-y-6"
          >
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="text-2xl font-black border-b border-white/5 pb-6 flex justify-between items-center" onClick={() => setIsMenuOpen(false)}>
                <span>{item.name}</span>
                <span className="text-white/20 font-en text-xs tracking-widest uppercase">{item.path.replace('/', '') || 'HOME'}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Footer = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await dataService.getSettings();
      setSettings(saved);

      // Update Favicon
      if (saved.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = saved.faviconUrl;
      }

      // Update OG Image
      if (saved.thumbnailUrl) {
        let meta = document.querySelector("meta[property='og:image']") as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', 'og:image');
          document.getElementsByTagName('head')[0].appendChild(meta);
        }
        meta.content = saved.thumbnailUrl;
      }
    };
    loadSettings();
  }, [location]);

  if (isAdminPage) return null;

  return (
    <footer className="bg-black border-t border-white/5 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          <div className="space-y-8 max-w-md">
            <div className="font-bold text-white uppercase tracking-tight text-xl font-en">
              CRIME SCENERS
            </div>
            <div className="text-sm text-[#b3b3b3] space-y-3 leading-relaxed">
              <div className="space-y-1">
                <p>대표자: {settings.businessInfo.representativeName}</p>
                <p>사업자등록번호: {settings.businessInfo.registrationNumber}</p>
                <p>연락처: {settings.managerPhone}</p>
                <p>이메일: {settings.managerEmail}</p>
              </div>
              <p className="pt-4 opacity-30 text-[10px] tracking-widest uppercase font-en">© 2026 CRIME SCENERS. ALL RIGHTS RESERVED.</p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-8">
            <div className="flex items-center space-x-6">
              {settings.businessInfo.instagramUrl && (
                <a href={settings.businessInfo.instagramUrl} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors">
                  <Instagram size={24} />
                </a>
              )}
              {settings.businessInfo.naverUrl && (
                <a href={settings.businessInfo.naverUrl} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors">
                  <Globe size={24} />
                </a>
              )}
              <Link to="/admin" className="text-white/20 hover:text-white/60 transition-colors flex items-center gap-1 text-xs font-en">
                <Settings size={14} />
                <span>ADMIN</span>
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-6 text-[10px] font-bold tracking-widest uppercase text-white/40">
              <button onClick={() => setShowTerms(true)} className="hover:text-white transition-colors flex items-center gap-1.5">
                <FileText size={12} /> 이용약관
              </button>
              <button onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors flex items-center gap-1.5">
                <Shield size={12} /> 개인정보처리방침
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showTerms || showPrivacy) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => { setShowTerms(false); setShowPrivacy(false); }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[40px] p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold tracking-tighter">
                  {showTerms ? '이용약관' : '개인정보처리방침'}
                </h3>
                <button onClick={() => { setShowTerms(false); setShowPrivacy(false); }} className="p-2 hover:bg-white/5 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="text-[#b3b3b3] text-sm leading-loose whitespace-pre-wrap">
                {showTerms ? settings.termsContent : settings.privacyContent}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
};

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load - reduced delay
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <HashRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-[#121212]">
        <AnimatePresence mode="wait">
          {loading && <LoadingScreen key="loading" />}
        </AnimatePresence>
        
        <Header />
        <Suspense fallback={<LoadingScreen />}>
          <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex-grow"
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/reservation" element={<ThemeReservation />} />
              <Route path="/theme/:id" element={<ThemeDetail />} />
              <Route path="/booking/:themeId/:date/:time" element={<BookingForm />} />
              <Route path="/success" element={<BookingSuccess />} />
              <Route path="/contact" element={<ContactForm />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/info" element={<NoticeBoard />} />
            </Routes>
          </motion.main>
        </Suspense>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
