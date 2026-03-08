
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, STORES } from '../constants';
import { ChevronRight, Users, Clock, MapPin, Filter, ArrowUpDown } from 'lucide-react';
import { Theme, Store } from '../types';
import { dataService } from '../src/services/dataService';
import LoadingScreen from './LoadingScreen';

const ThemeReservation = () => {
  const [themes, setThemes] = useState<Theme[]>(THEMES);
  const [stores, setStores] = useState<Store[]>(STORES);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, st] = await Promise.all([
          dataService.getThemes(),
          dataService.getStores()
        ]);
        setThemes(t);
        setStores(st);
      } catch (error) {
        console.error("Failed to load themes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredAndSortedThemes = useMemo(() => {
    let result = [...themes];

    // Filter by store
    if (selectedStoreId !== 'all') {
      result = result.filter(t => t.storeId === selectedStoreId);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'participants':
          return a.maxPlayers - b.maxPlayers;
        case 'duration':
          return a.duration - b.duration;
        case 'difficulty':
          return a.difficulty - b.difficulty;
        case 'fear':
          return a.fearLevel - b.fearLevel;
        case 'latest':
        default:
          // Assuming higher ID or reverse order for latest if no createdAt
          return themes.indexOf(b) - themes.indexOf(a);
      }
    });

    return result;
  }, [themes, selectedStoreId, sortBy]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="pt-32 md:pt-40 pb-24 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="mb-12 md:mb-16 text-center flex flex-col items-center gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter uppercase font-en">#SCENARIOS</h1>
          <p className="text-[#d1d1d1] text-sm md:text-base opacity-60">원하시는 시나리오를 선택하여 사건 현장으로 입장하세요.</p>
        </div>
        
        <div className="flex flex-row items-center justify-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <div className="flex items-center justify-center md:justify-start gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs md:text-sm font-medium text-white/60">
              <MapPin size={12} />
              <select 
                value={selectedStoreId} 
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-transparent outline-none cursor-pointer appearance-none pr-3 w-full md:w-auto text-center md:text-left"
              >
                <option value="all" className="bg-[#1a1a1a]">전체 매장</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#1a1a1a]">{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative group flex-1 md:flex-none">
            <div className="flex items-center justify-center md:justify-start gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs md:text-sm font-medium text-white/60">
              <ArrowUpDown size={12} />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent outline-none cursor-pointer appearance-none pr-3 w-full md:w-auto text-center md:text-left"
              >
                <option value="latest" className="bg-[#1a1a1a]">최신순</option>
                <option value="price" className="bg-[#1a1a1a]">가격순</option>
                <option value="participants" className="bg-[#1a1a1a]">참여인원순</option>
                <option value="duration" className="bg-[#1a1a1a]">소요시간순</option>
                <option value="difficulty" className="bg-[#1a1a1a]">난이도순</option>
                <option value="fear" className="bg-[#1a1a1a]">공포도순</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
        {filteredAndSortedThemes.map((theme) => {
          const store = stores.find(s => s.id === theme.storeId);
          const now = new Date();
          const startDate = theme.startDate ? new Date(theme.startDate) : null;
          const endDate = theme.endDate ? new Date(theme.endDate) : null;
          
          now.setHours(0, 0, 0, 0);
          if (startDate) startDate.setHours(0, 0, 0, 0);
          if (endDate) endDate.setHours(0, 0, 0, 0);

          const isComingSoon = (startDate && now < startDate) || (endDate && now > endDate);

          return (
            <div key={theme.id} className={`group flex flex-col mb-0 md:mb-0 ${isComingSoon ? 'opacity-60' : ''}`}>
              <Link 
                to={isComingSoon ? '#' : `/theme/${theme.id}`} 
                className={`relative aspect-[2/3] overflow-hidden rounded-none md:rounded-2xl mb-0 md:mb-6 shadow-xl block ${isComingSoon ? 'cursor-default' : ''}`}
                onClick={(e) => isComingSoon && e.preventDefault()}
              >
                <img 
                  src={theme.posterUrl} 
                  alt={theme.title} 
                  className={`w-full h-full object-cover transition-transform duration-700 ${isComingSoon ? 'grayscale opacity-50' : 'group-hover:scale-110'}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                {isComingSoon && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
                      <span className="text-xl font-black tracking-normal text-white">COMING SOON</span>
                    </div>
                  </div>
                )}
                {theme.storeId && store && (
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-medium text-white flex items-center gap-1.5 border border-white/10">
                    <MapPin size={12} /> {store.name}
                  </div>
                )}
                {!isComingSoon && (
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
                    <span className="text-white font-black text-xl tracking-normal uppercase font-en border-b-2 border-white pb-1">
                      예약하기
                    </span>
                  </div>
                )}
              </Link>
              
              <div className="space-y-4 px-0 pb-6 pt-4 md:p-0">
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-bold group-hover:text-white transition-colors">{theme.title}</h3>
                  <div className="flex items-center gap-2 text-white/60 text-sm font-bold">
                    <span>{theme.price.toLocaleString()}원</span>
                    <span className="text-white/20">|</span>
                    <span>1명</span>
                  </div>
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

              <p className="text-[#b3b3b3] text-sm md:line-clamp-2 leading-relaxed md:min-h-[2.8rem]">
                {theme.synopsis}
              </p>

              <div className="pt-4 flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-4 text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} /> {theme.minPlayers}-{theme.maxPlayers}명
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {theme.duration}분
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeReservation;
