
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, INTRO_POINTS, STORE_INFO, DEFAULT_ADMIN_SETTINGS, STORES } from '../constants';
import { Clock, Phone, MapPin, ChevronRight, Users } from 'lucide-react';
import { Theme, AdminSettings, Store } from '../types';
import { motion } from 'framer-motion';
import { dataService } from '../src/services/dataService';

const TypingTitle = () => {
  const text = "CRIME SCENERS?";
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (!isDeleting && index < text.length) {
      timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 150);
    } else if (isDeleting && index > 0) {
      timeout = setTimeout(() => {
        setDisplayText(prev => prev.slice(0, -1));
        setIndex(prev => prev - 1);
      }, 50);
    } else if (index === text.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (index === 0 && isDeleting) {
      setIsDeleting(false);
    }

    return () => clearTimeout(timeout);
  }, [index, isDeleting]);

  return (
    <h2 className="text-3xl md:text-4xl font-black mb-16 text-center tracking-tighter h-10">
      {displayText}
      <span className="animate-pulse">|</span>
    </h2>
  );
};

const HeroBanner = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div className="relative w-full h-[600px] md:h-[700px] overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={{ scale: 1.1, x: -20, y: -20 }}
          animate={{ 
            scale: [1.1, 1.2, 1.1],
            x: [-20, 20, -20],
            y: [-20, 0, -20]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#121212]/20 to-[#121212]" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight uppercase">
          Crime <span className="text-white">Sceners</span>
        </h1>
        <p className="text-xl md:text-2xl text-[#b3b3b3] font-light max-w-2xl mx-auto">
          사건 현장에 있는 우리 모두 <span className="text-white font-medium">SCENERS</span> 입니다.
        </p>
        <div className="mt-12">
            <Link 
              to="/reservation" 
              className="inline-block px-10 py-4 bg-white text-black font-bold rounded hover:bg-neutral-200 transition-all transform hover:scale-105"
            >
              지금 예약하기
            </Link>
        </div>
      </div>
    </div>
  );
};

const IntroSection = ({ images }: { images: string[] }) => (
  <section className="py-24 px-6 bg-[#121212]">
    <div className="max-w-7xl mx-auto">
      <TypingTitle />
      <div className="flex gap-4 md:gap-12 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3">
        {INTRO_POINTS.map((point, i) => (
          <div key={i} className="min-w-[38%] md:min-w-0 snap-center md:snap-start group flex-shrink-0">
            <div className="overflow-hidden rounded-lg mb-4 aspect-square md:aspect-[4/3]">
              <img 
                src={images[i] || point.img} 
                alt={point.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            </div>
            <h3 className="text-sm md:text-xl font-bold mb-2 md:mb-3 truncate">{point.title}</h3>
            <p className="text-[#b3b3b3] text-[10px] md:text-base leading-relaxed line-clamp-2 md:line-clamp-none">
              {point.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const PopularThemes = ({ themes, stores }: { themes: Theme[], stores: Store[] }) => {
  const displayThemes = themes.slice(0, 2);
  return (
    <section className="py-32 bg-black/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-4xl font-bold mb-4 uppercase tracking-tighter">Featured Themes</h2>
            <p className="text-[#b3b3b3] text-lg">지금 가장 핫한 시나리오</p>
          </div>
          <Link to="/reservation" className="text-white font-bold flex items-center hover:opacity-70 transition-opacity border-b-2 border-white pb-1">
            VIEW ALL THEMES <ChevronRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-12">
          {displayThemes.map((theme) => {
            const store = stores.find(s => s.id === theme.storeId);
            const now = new Date();
            const startDate = theme.startDate ? new Date(theme.startDate) : null;
            const endDate = theme.endDate ? new Date(theme.endDate) : null;
            
            // Set hours to 0 to compare dates only
            now.setHours(0, 0, 0, 0);
            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(0, 0, 0, 0);

            const isComingSoon = (startDate && now < startDate) || (endDate && now > endDate);

            return (
              <Link 
                key={theme.id} 
                to={isComingSoon ? '#' : `/theme/${theme.id}`}
                className={`group block ${isComingSoon ? 'cursor-default' : ''}`}
                onClick={(e) => isComingSoon && e.preventDefault()}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl mb-6 shadow-2xl">
                  <img 
                    src={theme.posterUrl} 
                    alt={theme.title} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${isComingSoon ? 'grayscale opacity-50' : 'group-hover:scale-110'}`}
                  />
                  {isComingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="bg-black/80 backdrop-blur-md px-8 py-4 rounded-xl border border-white/20">
                        <span className="text-2xl font-black tracking-[0.2em] text-white">COMING SOON</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 md:opacity-80" />
                </div>
                
                <div className="px-2 md:px-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-1 rounded">BEST</span>
                    {theme.storeId && store && (
                      <span className="text-white/60 text-xs font-mono uppercase">{store.name}</span>
                    )}
                  </div>
                  <h3 className="text-2xl md:text-4xl font-bold mb-4">{theme.title}</h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-4 text-sm text-white/80 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">난이도</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-3 h-1 rounded-full ${i < theme.difficulty ? 'bg-white' : 'bg-white/20'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">공포도</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-3 h-1 rounded-full ${i < theme.fearLevel ? 'bg-[#dc2626]' : 'bg-white/20'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-white/40" />
                      <span>{theme.duration}분</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-white/40" />
                      <span>{theme.minPlayers}-{theme.maxPlayers}명</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{theme.price.toLocaleString()}원 / 1인</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const StoreSection = ({ stores }: { stores: Store[] }) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const selectedStore = stores.find(s => s.id === selectedStoreId) || stores[0];

  if (!selectedStore) return null;

  return (
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-bold italic uppercase tracking-widest border-l-0 md:border-l-8 border-white md:pl-6">Find Us</h2>
          <p className="text-[#b3b3b3] mt-4">가까운 매장을 선택하여 정보를 확인하세요.</p>
        </div>
        <div className="flex flex-wrap justify-center md:justify-start gap-2">
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => setSelectedStoreId(store.id)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                selectedStoreId === store.id 
                ? 'bg-white text-black' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {store.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div className="rounded-3xl overflow-hidden aspect-square md:aspect-video shadow-2xl border border-white/5 order-1 md:order-1">
          <img 
            src={selectedStore.imageUrl || "https://picsum.photos/id/1031/800/600?grayscale"} 
            alt={selectedStore.name} 
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="order-2 md:order-2 flex flex-col items-start text-left">
          <div className="space-y-6 w-full">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Clock className="text-white" size={20} />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-grow">
                <p className="font-bold text-white text-sm md:text-lg shrink-0">운영시간</p>
                <div className="text-[#b3b3b3] text-xs md:text-base flex flex-col md:flex-row md:gap-4">
                  <p>평일: {selectedStore.weekdayHours}</p>
                  <p>주말: {selectedStore.weekendHours}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Phone className="text-white" size={20} />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-grow">
                <p className="font-bold text-white text-sm md:text-lg shrink-0">연락처</p>
                <p className="text-[#b3b3b3] text-xs md:text-base">{selectedStore.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <MapPin className="text-white" size={20} />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-grow">
                <p className="font-bold text-white text-sm md:text-lg shrink-0">위치 정보</p>
                <p className="text-[#b3b3b3] text-xs md:text-base">{selectedStore.address}</p>
              </div>
            </div>
          </div>
          <div className="mt-12 w-full">
            <a 
              href={`https://map.naver.com/v5/search/${encodeURIComponent(selectedStore.address)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block w-full md:w-auto text-center px-10 py-4 bg-white text-black font-bold rounded hover:bg-neutral-200 transition-all transform hover:scale-105"
            >
              네이버 지도로 보기
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [themes, setThemes] = useState<Theme[]>(THEMES);
  const [stores, setStores] = useState<Store[]>(STORES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, t, st] = await Promise.all([
          dataService.getSettings(),
          dataService.getThemes(),
          dataService.getStores()
        ]);
        setSettings(s);
        setThemes(t);
        setStores(st);
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="pt-32 text-center">Loading...</div>;

  return (
    <div>
      <HeroBanner imageUrl={settings.homeConfig.heroImageUrl} />
      <IntroSection images={settings.homeConfig.introImages} />
      <PopularThemes themes={themes} stores={stores} />
      <StoreSection stores={stores} />
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Home;
