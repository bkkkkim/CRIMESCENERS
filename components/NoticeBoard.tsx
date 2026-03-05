
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../src/services/dataService';
import { Notice, Store, AdminSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Clock, ChevronRight, Info, Gamepad2, X } from 'lucide-react';
import { DEFAULT_ADMIN_SETTINGS } from '../constants';
import LoadingScreen from './LoadingScreen';

const NoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [activeTab, setActiveTab] = useState<'method' | 'stores'>('method');
  const [expandedNotice, setExpandedNotice] = useState<string | null>('admin');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // If data is already in cache, this will be instant
        const [noticeList, storeList, savedSettings] = await Promise.all([
          dataService.getNotices(),
          dataService.getStores(),
          dataService.getSettings()
        ]);
        setNotices(noticeList);
        setStores(storeList);
        setSettings(savedSettings);
      } catch (error) {
        console.error("Failed to load info data:", error);
      }
    };
    loadData();
  }, []);

  // Remove full-screen loading to improve perceived speed
  // if (loading) return <LoadingScreen />;

  return (
    <div className={`pt-32 md:pt-40 pb-24 px-6 max-w-7xl mx-auto ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100 transition-opacity duration-500'}`}>
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 uppercase tracking-tighter font-en">Information</h1>
        <p className="text-[#d1d1d1] text-sm md:text-base opacity-60">크라임씬 이용 안내 및 매장 정보</p>
      </div>

      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('method')}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'method' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            <Gamepad2 size={16} /> 게임 방법
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stores' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            <MapPin size={16} /> 매장 안내
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'method' && (
          <motion.div
            key="method"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#1a1a1a] p-10 rounded-[40px] border border-white/5">
                <h3 className="text-2xl font-bold mb-8 uppercase tracking-tighter font-en">How to Play</h3>
                <div className="space-y-8">
                  {[
                    { step: '01', title: '역할 선정', desc: '각 플레이어는 용의자 또는 탐정 역할을 부여받습니다.' },
                    { step: '02', title: '현장 조사', desc: '사건 현장을 돌아다니며 단서를 수집하고 증거를 찾습니다.' },
                    { step: '03', title: '알리바이 확인', desc: '서로의 알리바이를 확인하고 모순점을 찾아냅니다.' },
                    { step: '04', title: '최종 투표', desc: '모든 증거를 종합하여 진범을 지목합니다.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6">
                      <span className="text-4xl font-bold text-white/10 font-en">{item.step}</span>
                      <div>
                        <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                        <p className="text-sm text-[#b3b3b3] opacity-60 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 p-10 rounded-[40px] border border-white/5 flex flex-col justify-center items-center text-center">
                <Gamepad2 size={64} className="text-white/20 mb-8" />
                <h3 className="text-2xl font-bold mb-4">준비되셨나요?</h3>
                <p className="text-[#d1d1d1] mb-10 opacity-60">지금 바로 사건 현장으로 떠나보세요.</p>
                <Link to="/reservation" className="px-12 py-5 bg-white text-black font-bold rounded-none hover:bg-neutral-200 transition-all tracking-normal uppercase text-sm font-en">
                  Book Now
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold flex items-center gap-3 px-4">
                <Info size={24} className="text-white/40" /> 이용 가이드 및 주의사항
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Admin Managed Notice */}
                {settings.noticeContent && (
                  <div className="bg-[#1a1a1a] rounded-[32px] border border-white/5 overflow-hidden">
                    <button 
                      onClick={() => setExpandedNotice(expandedNotice === 'admin' ? null : 'admin')}
                      className="w-full p-8 text-left flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-3 flex-1 pr-4">
                        <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase shrink-0">중요</span>
                        <h3 className="text-lg md:text-xl font-bold tracking-tight group-hover:text-white transition-colors line-clamp-2 md:line-clamp-none">{settings.noticeTitle.replace('[필독] ', '')}</h3>
                      </div>
                      <ChevronRight size={20} className={`text-white/20 transition-transform ${expandedNotice === 'admin' ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {expandedNotice === 'admin' && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-8 pb-8"
                        >
                          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap border-t border-white/5 pt-6">{settings.noticeContent}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {notices.filter(n => !n.title.includes('크라임씨너스 이용 가이드')).map((notice) => (
                  <div key={notice.id} className="bg-[#1a1a1a] rounded-[32px] border border-white/5 overflow-hidden">
                    <button 
                      onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}
                      className="w-full p-8 text-left flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-3 flex-1 pr-4">
                        {notice.isImportant && <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase shrink-0">중요</span>}
                        <h3 className="text-lg md:text-xl font-bold tracking-tight group-hover:text-white transition-colors line-clamp-2 md:line-clamp-none">{notice.title}</h3>
                      </div>
                      <ChevronRight size={20} className={`text-white/20 transition-transform ${expandedNotice === notice.id ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {expandedNotice === notice.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-8 pb-8"
                        >
                          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap border-t border-white/5 pt-6">{notice.content}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'stores' && (
          <motion.div
            key="stores"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`grid gap-8 ${
              stores.length === 1 ? 'max-w-xl mx-auto' : 
              'grid-cols-1 md:grid-cols-2'
            }`}
          >
            {stores.map((store) => (
              <div key={store.id} className="bg-[#1a1a1a] rounded-[40px] overflow-hidden border border-white/5 group">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={store.imageUrl || "https://picsum.photos/id/1031/800/600?grayscale"} 
                    alt={store.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-10">
                  <h3 className="text-3xl font-black mb-8 tracking-tighter">{store.name}</h3>
                  <div className="space-y-6 mb-10">
                    <div className="flex items-start gap-4">
                      <Clock size={18} className="text-white/40 mt-1" />
                      <div className="text-sm text-[#b3b3b3] opacity-60">
                        <p>평일: {store.weekdayHours}</p>
                        <p>주말: {store.weekendHours}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Phone size={18} className="text-white/40" />
                      <span className="text-sm text-[#b3b3b3] opacity-60 font-en">{store.phone}</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <MapPin size={18} className="text-white/40 mt-1" />
                      <span className="text-sm text-[#b3b3b3] opacity-60 leading-relaxed">{store.address}</span>
                    </div>
                  </div>
                  <Link 
                    to="/reservation" 
                    className="flex items-center justify-center gap-3 w-full py-5 border-2 border-white/10 text-white font-bold rounded-none hover:bg-white hover:text-black transition-all tracking-normal uppercase text-sm font-en"
                  >
                    Reservation <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NoticeBoard;
