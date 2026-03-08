
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, INTRO_POINTS, STORE_INFO, DEFAULT_ADMIN_SETTINGS, STORES } from '../constants';
import { Clock, Phone, MapPin, ChevronRight, Users, ChevronDown } from 'lucide-react';
import { Theme, AdminSettings, Store } from '../types';
import { motion } from 'framer-motion';
import { dataService } from '../src/services/dataService';
import LoadingScreen from './LoadingScreen';

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
    <h2 className="text-3xl md:text-5xl font-bold mb-2 md:mb-3 text-center tracking-tighter h-10 md:h-14 font-en uppercase">
      {displayText}
      <span className="animate-pulse">|</span>
    </h2>
  );
};

const HeroBanner = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div className="relative w-full h-[600px] md:h-[800px] overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <motion.img 
          initial={{ scale: 1, x: 0, y: 0 }}
          animate={{ 
            scale: [1, 1.1, 1.15, 1],
            x: [0, 20, -20, 0],
            y: [0, -10, 10, 0]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          src={imageUrl || "/hero.jpg"}
          alt="Hero"
          className="w-full h-full object-cover"
          loading="eager"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#121212]" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 text-center px-12 md:px-6">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-8xl font-bold mb-2 md:mb-6 leading-tight tracking-tighter uppercase font-en"
        >
          Crime <span className="text-white">Sceners</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-base md:text-2xl text-[#d1d1d1] font-light max-w-4xl mx-auto mb-10 md:mb-12 whitespace-nowrap"
        >
          사건 현장에 있는 우리 모두 <span className="text-white font-medium">SCENERS</span> 입니다.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
              <Link 
                to="/reservation" 
                className="inline-block px-10 md:px-12 py-4 md:py-5 border border-white/40 text-white font-bold rounded-none hover:bg-white hover:text-black transition-all transform hover:scale-105 tracking-normal uppercase text-sm font-en"
              >
                지금 예약하기
              </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          <ChevronDown size={48} strokeWidth={1} className="text-white/40" />
        </motion.div>
      </div>
    </div>
  );
};

const IntroSection = ({ images }: { images: string[] }) => (
  <section className="py-16 md:py-24 px-4 md:px-6 bg-[#121212]">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8 md:mb-12">
        <TypingTitle />
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 0.6, y: 0 }}
          viewport={{ once: true }}
          className="text-[#d1d1d1] text-sm md:text-base leading-relaxed"
        >
          스릴러 매니아들이 설계한 몰입형 추리 게임 카페<br className="md:hidden" /> '크라임 씨너스' 에 오신것을 환영합니다!
        </motion.p>
      </div>
      <div className="mobile-snap-container hide-scrollbar md:grid md:grid-cols-3 md:gap-8 items-start">
        {INTRO_POINTS.map((point, i) => (
          <div key={i} className="mobile-snap-item-2-5 group flex-shrink-0 flex flex-col">
            <div className="overflow-hidden rounded-[24px] md:rounded-[32px] mb-4 md:mb-6 aspect-square md:aspect-[4/5] border border-white/5 shrink-0">
              <img 
                src={images[i] || point.img} 
                alt={point.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left flex-grow">
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 tracking-tight whitespace-nowrap md:whitespace-normal">{point.title}</h3>
              <p className="text-[#d1d1d1] text-xs md:text-sm leading-relaxed opacity-60">
                {point.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const PopularThemes = ({ themes, stores }: { themes: Theme[], stores: Store[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const displayThemes = themes.filter(t => t.showOnMain !== false);
  
  const itemsPerView = displayThemes.length === 2 ? 2 : (displayThemes.length === 1 ? 1 : 3);
  const showArrows = displayThemes.length > itemsPerView;

  const nextSlide = () => {
    if (currentIndex < displayThemes.length - itemsPerView) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <section className="relative py-16 md:py-24 bg-black/30 overflow-hidden">
      {/* Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[150%] h-[140%] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-2 md:mb-3 uppercase tracking-tighter font-en">BEST SCENARIOS</h2>
          <p className="text-[#d1d1d1] text-sm md:text-base opacity-60">지금 가장 핫한 시나리오</p>
        </div>

        <div className="relative">
          {/* PC Navigation Arrows */}
          {showArrows && (
            <>
              <button 
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className={`hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-sm transition-all ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-white hover:text-black'}`}
              >
                <ChevronDown className="rotate-90" size={24} />
              </button>
              <button 
                onClick={nextSlide}
                disabled={currentIndex >= displayThemes.length - itemsPerView}
                className={`hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-sm transition-all ${currentIndex >= displayThemes.length - itemsPerView ? 'opacity-0 pointer-events-none' : 'hover:bg-white hover:text-black'}`}
              >
                <ChevronDown className="-rotate-90" size={24} />
              </button>
            </>
          )}

          <div className={`mobile-snap-container hide-scrollbar ${displayThemes.length < itemsPerView + 1 ? 'flex justify-center' : 'md:overflow-hidden'}`}>
            <motion.div 
              className={`flex gap-6 md:gap-8 ${displayThemes.length === 1 ? 'justify-center' : ''}`}
              animate={showArrows || (displayThemes.length > itemsPerView) ? { x: `calc(-${currentIndex * (100 / itemsPerView)}% - ${currentIndex * (32 / itemsPerView)}px)` } : {}}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ 
                width: displayThemes.length === 1 ? 'auto' : '100%',
                display: 'flex',
              }}
            >
              {displayThemes.map((theme) => {
                const store = stores.find(s => s.id === theme.storeId);
                const now = new Date();
                const startDate = theme.startDate ? new Date(theme.startDate) : null;
                const endDate = theme.endDate ? new Date(theme.endDate) : null;
                
                now.setHours(0, 0, 0, 0);
                if (startDate) startDate.setHours(0, 0, 0, 0);
                if (endDate) endDate.setHours(0, 0, 0, 0);

                const isComingSoon = (startDate && now < startDate) || (endDate && now > endDate);

                return (
                  <Link 
                    key={theme.id} 
                    to={isComingSoon ? '#' : `/theme/${theme.id}`}
                    className={`
                      ${displayThemes.length === 1 
                        ? 'w-[85%] md:w-[450px] mx-auto' 
                        : (itemsPerView === 2 
                            ? 'mobile-snap-item-1-5 md:w-[calc(50%-16px)]' 
                            : 'mobile-snap-item-1-5 md:w-[calc(33.333%-21.333px)]')}
                      group block shrink-0 ${isComingSoon ? 'cursor-default' : ''}
                    `}
                    onClick={(e) => isComingSoon && e.preventDefault()}
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl mb-3 md:mb-8 shadow-2xl border border-white/5">
                      <img 
                        src={theme.posterUrl} 
                        alt={theme.title} 
                        className={`w-full h-full object-cover transition-transform duration-1000 ${isComingSoon ? 'grayscale opacity-50' : 'group-hover:scale-110'}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      {isComingSoon && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
                            <span className="text-xl font-medium tracking-normal text-white font-en">COMING SOON</span>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    </div>
                    
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <span className="bg-[#dc2626] text-[10px] font-medium px-2 py-1 rounded tracking-normal uppercase font-en">BEST</span>
                        {theme.storeId && store && (
                          <span className="text-white/40 text-xs font-medium uppercase tracking-normal">{store.name}</span>
                        )}
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mb-1.5 md:mb-2 tracking-tight line-clamp-1">{theme.title}</h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-white/60 text-sm font-bold">
                          <span>{theme.price.toLocaleString()}원</span>
                          <span className="text-white/20">|</span>
                          <span>1명</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-[10px] font-medium tracking-normal uppercase text-white/40">
                          <div className="flex items-center gap-1.5">
                            <span>난이도</span>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i < theme.difficulty ? 'bg-white' : 'bg-white/10'}`} />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>공포도</span>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i < theme.fearLevel ? 'bg-[#dc2626]' : 'bg-white/10'}`} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs md:text-sm text-white/60 font-medium pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-white/20" />
                            <span className="font-bold">{theme.duration}분</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-white/20" />
                            <span className="font-bold">{theme.minPlayers}-{theme.maxPlayers}명</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col items-center mt-12 md:mt-20 gap-8">
          {/* Pagination Line (PC only) */}
          {showArrows && (
            <div className="hidden md:flex w-48 h-[2px] bg-white/10 relative overflow-hidden rounded-full">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-white"
                initial={false}
                animate={{ 
                  width: `${100 / (displayThemes.length - itemsPerView + 1)}%`,
                  left: `${currentIndex * (100 / (displayThemes.length - itemsPerView + 1))}%`
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          )}
          
          <Link to="/reservation" className="group text-white font-bold flex items-center gap-3 hover:bg-white hover:text-black transition-all border border-white/40 px-10 md:px-14 py-4 md:py-6 rounded-full text-sm md:text-base tracking-normal font-en">
            VIEW ALL SCENARIOS <ChevronRight size={22} className="group-hover:translate-x-2 transition-transform" />
          </Link>
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
    <section className="py-16 md:py-24 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter font-en mb-2 md:mb-3">Find Us</h2>
        <p className="text-[#d1d1d1] text-sm md:text-base opacity-60">가까운 매장을 선택하여 정보를 확인하세요.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 md:mb-12">
        {stores.map(store => (
          <button
            key={store.id}
            onClick={() => setSelectedStoreId(store.id)}
            className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all tracking-tight ${
              selectedStoreId === store.id 
              ? 'bg-white text-black shadow-xl shadow-white/10' 
              : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {store.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
        <div className="rounded-[32px] md:rounded-[40px] overflow-hidden aspect-video shadow-2xl border border-white/5">
          <img 
            src={selectedStore.imageUrl || "https://picsum.photos/id/1031/800/600?grayscale"} 
            alt={selectedStore.name} 
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col items-start text-left">
          <div className="space-y-6 md:space-y-8 w-full">
            <div className="flex flex-row items-start gap-4 md:gap-6 border-b border-white/5 pb-6 md:pb-8">
              <div className="flex items-center gap-3 md:gap-6 shrink-0 w-[100px] md:w-[140px]">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <Clock className="text-white/40" size={16} />
                </div>
                <p className="font-bold text-white text-sm md:text-lg">운영시간</p>
              </div>
              <div className="text-[#b3b3b3] text-xs md:text-sm space-y-1 opacity-60 flex-grow pt-2 md:pt-3.5 pl-2">
                <p>평일: {selectedStore.weekdayHours}</p>
                <p>주말: {selectedStore.weekendHours}</p>
              </div>
            </div>

            <div className="flex flex-row items-center gap-4 md:gap-6 border-b border-white/5 pb-6 md:pb-8">
              <div className="flex items-center gap-3 md:gap-6 shrink-0 w-[100px] md:w-[140px]">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <Phone className="text-white/40" size={16} />
                </div>
                <p className="font-bold text-white text-sm md:text-lg">연락처</p>
              </div>
              <a href={`tel:${selectedStore.phone}`} className="text-[#b3b3b3] text-xs md:text-sm opacity-60 font-en flex-grow hover:text-white transition-colors pl-2">{selectedStore.phone}</a>
            </div>

            <div className="flex flex-row items-start gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-6 shrink-0 w-[100px] md:w-[140px]">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                  <MapPin className="text-white/40" size={16} />
                </div>
                <p className="font-bold text-white text-sm md:text-lg whitespace-nowrap">위치 정보</p>
              </div>
              <div className="flex flex-col gap-3 flex-grow w-full pt-2 md:pt-3.5 pl-2">
                <p className="text-[#b3b3b3] text-xs md:text-sm opacity-60 leading-relaxed text-left">{selectedStore.address}</p>
                <a 
                  href={`https://map.naver.com/v5/search/${encodeURIComponent(selectedStore.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 border border-white/20 text-white font-medium rounded-none hover:bg-white hover:text-black transition-all tracking-tight uppercase text-[9px] w-fit shrink-0"
                >
                  네이버 지도로 보기
                </a>
              </div>
            </div>
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
        // Parallel fetch for home data - will hit cache from App.tsx init
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

  // Remove full-screen loading to improve perceived speed
  // if (loading) return <LoadingScreen />;

  return (
    <div className={loading ? 'opacity-50 pointer-events-none' : 'opacity-100 transition-opacity duration-500'}>
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
