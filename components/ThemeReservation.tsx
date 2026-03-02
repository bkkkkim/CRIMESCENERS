
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, STORES } from '../constants';
import { ChevronRight, Users, Clock, MapPin } from 'lucide-react';
import { Theme, Store } from '../types';
import { dataService } from '../src/services/dataService';

const ThemeReservation = () => {
  const [themes, setThemes] = useState<Theme[]>(THEMES);
  const [stores, setStores] = useState<Store[]>(STORES);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="pt-32 text-center">Loading...</div>;

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="mb-16 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter">THEME EPISODES</h1>
        <p className="text-[#b3b3b3] text-lg">원하시는 에피소드를 선택하여 사건 현장으로 입장하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {themes.map((theme) => {
          const store = stores.find(s => s.id === theme.storeId);
          const now = new Date();
          const startDate = theme.startDate ? new Date(theme.startDate) : null;
          const endDate = theme.endDate ? new Date(theme.endDate) : null;
          
          now.setHours(0, 0, 0, 0);
          if (startDate) startDate.setHours(0, 0, 0, 0);
          if (endDate) endDate.setHours(0, 0, 0, 0);

          const isComingSoon = (startDate && now < startDate) || (endDate && now > endDate);

          return (
            <div key={theme.id} className={`group flex flex-col mb-16 md:mb-0 ${isComingSoon ? 'opacity-60' : ''}`}>
              <Link 
                to={isComingSoon ? '#' : `/theme/${theme.id}`} 
                className={`relative aspect-[3/4] overflow-hidden rounded-2xl mb-6 shadow-xl block ${isComingSoon ? 'cursor-default' : ''}`}
                onClick={(e) => isComingSoon && e.preventDefault()}
              >
                <img 
                  src={theme.posterUrl} 
                  alt={theme.title} 
                  className={`w-full h-full object-cover transition-transform duration-700 ${isComingSoon ? 'grayscale opacity-50' : 'group-hover:scale-110'}`}
                />
                {isComingSoon && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
                      <span className="text-xl font-black tracking-[0.2em] text-white">COMING SOON</span>
                    </div>
                  </div>
                )}
                {theme.storeId && store && (
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10">
                    <MapPin size={12} /> {store.name}
                  </div>
                )}
                {!isComingSoon && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                    <span className="text-white font-bold flex items-center gap-2">
                      예약하기 <ChevronRight size={18} />
                    </span>
                  </div>
                )}
              </Link>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-bold group-hover:text-white transition-colors">{theme.title}</h3>
                  <div className="flex items-center gap-2 text-white/60 text-sm font-bold">
                    <span>{theme.price.toLocaleString()}원</span>
                    <span className="text-white/20">|</span>
                    <span>1명</span>
                  </div>
                </div>
              
              <div className="flex flex-wrap gap-4 text-[10px] font-bold tracking-widest uppercase text-white/40">
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

              <p className="text-[#b3b3b3] text-sm line-clamp-2 leading-relaxed min-h-[2.8rem]">
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
                {!isComingSoon && (
                  <Link 
                    to={`/theme/${theme.id}`}
                    className="text-xs font-bold text-white hover:underline uppercase font-en tracking-tight"
                  >
                    예약하기
                  </Link>
                )}
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
