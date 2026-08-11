
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
      <div className="mb-8 md:mb-10 text-center flex flex-col items-center gap-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase font-en">Information</h1>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full max-w-md">
          <button
            onClick={() => setActiveTab('method')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'method' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            <Gamepad2 size={16} /> 게임 방법
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
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
            {/* How To Play Section */}
            <div className="bg-[#1a1a1a] p-4 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] border border-white/5 space-y-5 md:space-y-6">
              <div className="text-center md:text-left space-y-2 border-b border-white/5 pb-4 md:pb-5">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase font-en">GAME GUIDE</span>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter font-en text-white">How to Play</h3>
                <p className="text-xs sm:text-sm md:text-base text-[#d1d1d1] font-medium opacity-90 leading-relaxed">
                  크라임 씨너스는 게임 몰입도를 위해, 충분한 사전 정보와 역할 숙지 시간을 제공합니다.
                </p>
              </div>

              {/* 8 Steps Grid - 2 columns on mobile */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {[
                  { step: '01', title: '사전 역할 파악', desc: '예약 인원 확정 시, 전달되는 롤카드를 게임 전 미리 숙지해주세요.' },
                  { step: '02', title: '역할 선정', desc: '플레이어는 용의자나 탐정을 맡으며, 전날 미리 상의해 정할 수 있습니다.' },
                  { step: '03', title: '역할 숙지', desc: '이용 당일, 현장에서 각자의 역할을 이해하는 시간을 갖습니다.' },
                  { step: '04', title: '자기소개 및 현장 조사', desc: '간단한 자기소개와 함께 1차 현장조사를 진행합니다.' },
                  { step: '05', title: '회의 및 중간 투표', desc: '각자 찾은 단서에 대해 논의하고 중간 범인 투표를 진행합니다.' },
                  { step: '06', title: '2차 현장 조사 및 회의', desc: '추가 현장 조사를 통해 좀 더 사건의 진실에 가까워집니다.' },
                  { step: '07', title: '최종 현장 검증', desc: '마지막으로 추가 현장을 검증합니다.' },
                  { step: '08', title: '최종 투표', desc: '모든 증거와 정황을 종합하여 진범을 지목합니다.' }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-5 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg sm:text-2xl font-black text-[#dc2626] font-en">{item.step}</span>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/20 group-hover:bg-[#dc2626] transition-colors" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm md:text-base mb-1 sm:mb-1.5 text-white leading-snug break-keep">{item.title}</h4>
                      <p className="text-[11px] sm:text-xs md:text-sm text-[#b3b3b3] opacity-80 leading-snug sm:leading-relaxed break-keep">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Standalone CTA Banner Section */}
            <div className="bg-gradient-to-r from-[#1a1a1a] via-[#222222] to-[#1a1a1a] p-6 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[32px] md:rounded-[40px] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left shadow-2xl">
              <div className="space-y-1.5">
                <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">준비되셨나요?</h4>
                <p className="text-[#d1d1d1] text-xs sm:text-sm md:text-base opacity-85">지금 바로 사건 현장으로 떠나보세요!</p>
              </div>
              <Link 
                to="/reservation" 
                className="w-full sm:w-auto text-center px-8 md:px-10 py-3.5 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-all tracking-normal uppercase text-xs md:text-sm font-en shrink-0 shadow-lg hover:scale-105"
              >
                Book Now
              </Link>
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

                {notices.filter(n => !n.title.includes('크라임씨너스 이용 가이드')).map((notice, index) => (
                  <div key={`${notice.id}-${index}`} className="bg-[#1a1a1a] rounded-[32px] border border-white/5 overflow-hidden">
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
            {stores.map((store, index) => (
              <div key={`${store.id}-${index}`} className="bg-[#1a1a1a] rounded-[40px] overflow-hidden border border-white/5 group">
                <div className="aspect-video overflow-hidden bg-[#1a1a1a] flex items-center justify-center relative">
                  {store.imageUrl ? (
                    <img 
                      src={store.imageUrl} 
                      alt={store.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-white/30 space-y-2">
                      <MapPin size={48} className="text-white/20" />
                      <span className="text-sm font-bold">{store.name}</span>
                    </div>
                  )}
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
