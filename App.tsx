
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Youtube, Settings, Globe } from 'lucide-react';
import { DEFAULT_ADMIN_SETTINGS } from './constants';
import { AdminSettings } from './types';
import { dataService } from './src/services/dataService';
import Home from './components/Home';
import ThemeReservation from './components/ThemeReservation';
import ThemeDetail from './components/ThemeDetail';
import BookingForm from './components/BookingForm';
import BookingSuccess from './components/BookingSuccess';
import ContactForm from './components/ContactForm';
import AdminDashboard from './components/AdminDashboard';
import NoticeBoard from './components/NoticeBoard';

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
    ? (isScrolled ? 'bg-[#121212]/95 border-b border-white/10' : 'bg-transparent')
    : 'bg-[#121212] border-b border-white/10';

  const navItems = [
    { name: '홈', path: '/' },
    { name: '이용안내', path: '/info' },
    { name: '테마예약', path: '/reservation' },
    { name: '문의하기', path: '/contact' }
  ];

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="h-12 flex items-center">
          <img src={settings.logoUrl || "https://i.imgur.com/G5ZkX1n.png"} alt="CRIME SCENERS" className="h-full w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex space-x-10">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="text-sm font-medium hover:text-white transition-colors">
              {item.name}
            </Link>
          ))}
        </nav>
        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-20 bg-[#121212] z-40 p-6 flex flex-col space-y-6">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="text-xl font-bold border-b border-white/5 pb-4" onClick={() => setIsMenuOpen(false)}>
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

const Footer = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
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
    <footer className="bg-black border-t border-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-8 max-w-md">
          <div className="font-bold text-white uppercase tracking-[0.2em] text-lg">
            CRIME SCENERS
          </div>
          <div className="text-sm text-[#b3b3b3] space-y-3 leading-relaxed">
            <div className="space-y-1">
              <p>대표자: {settings.businessInfo.representativeName}</p>
              <p>사업자등록번호: {settings.businessInfo.registrationNumber}</p>
              <p>연락처: {settings.managerPhone}</p>
              <p>이메일: {settings.managerEmail}</p>
            </div>
            <p className="pt-4 opacity-50 text-[10px] tracking-widest uppercase">© 2024 CRIME SCENERS. ALL RIGHTS RESERVED.</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-8">
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
            <Link to="/admin" className="text-white/20 hover:text-white/60 transition-colors flex items-center gap-1 text-xs">
              <Settings size={14} />
              <span>ADMIN</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-[#121212]">
        <Header />
        <main className="flex-grow">
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
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
