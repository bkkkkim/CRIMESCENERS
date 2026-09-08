
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../src/services/dataService';
import { Notice, Store, AdminSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Phone, Clock, ChevronRight, Info, Gamepad2, X, 
  FileText, Users, Target, Search, MessageSquare, KeyRound, 
  CheckCircle2, Vote, ExternalLink, ShieldCheck, UserCheck, 
  Fingerprint, AlertTriangle
} from 'lucide-react';
import { DEFAULT_ADMIN_SETTINGS } from '../constants';
import LoadingScreen from './LoadingScreen';

const NoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [activeTab, setActiveTab] = useState<'method' | 'stores'>('method');
  const [expandedNotice, setExpandedNotice] = useState<string | null>('admin');
  const [loading, setLoading] = useState(false);
  const [showStickyBanner, setShowStickyBanner] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBanner(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className={`pt-32 md:pt-40 pb-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100 transition-opacity duration-500'}`}>
      <div className="mb-8 md:mb-10 text-center flex flex-col items-center gap-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase font-en">Information</h1>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full max-w-md">
          <button
            onClick={() => setActiveTab('method')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'method' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <Gamepad2 size={16} /> 게임 방법
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'stores' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
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
            {/* Game Introduction Section */}
            <div className="bg-[#1a1a1a] p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 space-y-6">
              <div className="text-center md:text-left space-y-2 border-b border-white/5 pb-4 md:pb-5">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase font-en">ABOUT GAME</span>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter font-en text-white">크라임씬 게임이란?</h3>
                <p className="text-xs sm:text-sm md:text-base text-[#d1d1d1] font-medium opacity-90 leading-relaxed break-keep">
                  크라임씨너스는 참가자 전원이 가상의 살인 사건 속 <strong className="text-white">탐정 및 용의자가 되어 현장을 직접 수색하고 진범을 밝혀내는 롤플레잉 추리 게임</strong>입니다.
                </p>
              </div>

              {/* 3 Core Points */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                <div className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-white leading-snug">롤플레잉 몰입</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#b3b3b3] opacity-80 leading-relaxed break-keep">
                    각 플레이어에게 고유한 사연과 알리바이가 담긴 <strong>롤카드(Role Card)</strong>가 부여되어, 드라마 속 주인공처럼 사건 현장에 직접 몰입합니다.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-white leading-snug">리얼 현장 수색</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#b3b3b3] opacity-80 leading-relaxed break-keep">
                    실제 사건 현장처럼 디테일하게 구현된 세트장에서 흉기, 서류, 비밀 금고 등 사건의 결정적 단서를 직접 발굴합니다.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#dc2626] shrink-0">
                      <Target className="w-4 h-4 text-[#dc2626]" />
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-white leading-snug">추리와 심리전</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#b3b3b3] opacity-80 leading-relaxed break-keep">
                    수집한 단서로 치열한 난상토론을 거쳐 거짓말하는 범인의 알리바이를 무너뜨리고, 최종 투표를 통해 사건을 해결합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Roles Guide Section */}
            <div className="bg-[#1a1a1a] p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 space-y-6">
              <div className="text-center md:text-left space-y-2 border-b border-white/5 pb-4 md:pb-5">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase font-en">ROLES GUIDE</span>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter font-en text-white">역할별 게임 규칙</h3>
                <p className="text-xs sm:text-sm md:text-base text-[#d1d1d1] font-medium opacity-90 leading-relaxed">
                  크라임씨너스는 배정받은 역할에 따라 발언의 진실성 여부와 투표 권한이 엄격히 나뉩니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {/* 1. 탐정 */}
                <div className="bg-white/5 border border-white/5 hover:border-white/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all group">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-white/30 transition-colors">
                        <ShieldCheck className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-white/10 text-white border border-white/10 font-en tracking-wider">
                        DETECTIVE
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <h4 className="text-xl font-bold text-white">탐정</h4>
                        <span className="text-xs text-white/40 font-medium">수사 지휘관</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed break-keep">
                        범인이 아니며, 공정한 수사를 지휘하고 최종 결정을 이끕니다.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs">
                      <div className="flex items-start gap-2 text-[#d1d1d1]">
                        <span className="text-[#dc2626] font-bold shrink-0 mt-0.5">■</span>
                        <span className="leading-snug break-keep">
                          <strong className="text-white">투표 권한:</strong> 1차 투표와 최종 투표 권한을 모두 가짐.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[#d1d1d1]">
                        <span className="text-[#dc2626] font-bold shrink-0 mt-0.5">■</span>
                        <span className="leading-snug break-keep">
                          <strong className="text-white">특이사항:</strong> 탐정이 없는 팀의 경우, 가장 범인이 아닐 것 같은 용의자만 1차 투표 권한을 가짐.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[#d1d1d1]">
                        <span className="text-[#dc2626] font-bold shrink-0 mt-0.5">■</span>
                        <span className="leading-snug break-keep">
                          <strong className="text-white">플레이 팁:</strong> 용의자들의 증언 속 알리바이 모순과 숨겨진 단서를 추궁하세요.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white/40">발언 규칙</span>
                    <span className="text-white bg-white/10 px-2 py-0.5 rounded">거짓말 불가 (진실 규명)</span>
                  </div>
                </div>

                {/* 2. 용의자 */}
                <div className="bg-white/5 border border-white/5 hover:border-white/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all group">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-white/30 transition-colors">
                        <UserCheck className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-white/10 text-white border border-white/10 font-en tracking-wider">
                        SUSPECT
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <h4 className="text-xl font-bold text-white">용의자</h4>
                        <span className="text-xs text-white/40 font-medium">사건 관계자</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed break-keep">
                        사건 당일 알리바이와 저마다의 비밀을 가진 인물들입니다.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs">
                      <div className="flex items-start gap-2 text-[#d1d1d1]">
                        <span className="text-[#dc2626] font-bold shrink-0 mt-0.5">■</span>
                        <span className="leading-snug break-keep">
                          <strong className="text-white">진술 규칙:</strong> 사건 당일 알리바이가 있는 용의자. 거짓말을 할 수 없음.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[#d1d1d1]">
                        <span className="text-[#dc2626] font-bold shrink-0 mt-0.5">■</span>
                        <span className="leading-snug break-keep">
                          <strong className="text-white">투표 권한:</strong> 중간 투표권은 없으며, 모든 단서가 나온 후 최종 투표에 참여.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[#d1d1d1]">
                        <span className="text-[#dc2626] font-bold shrink-0 mt-0.5">■</span>
                        <span className="leading-snug break-keep">
                          <strong className="text-white">플레이 팁:</strong> 불리한 질문에도 거짓 진술은 불가하나, 질문받지 않은 비밀을 먼저 밝힐 필요는 없습니다.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white/40">발언 규칙</span>
                    <span className="text-white/80 bg-white/10 px-2 py-0.5 rounded">거짓말 절대 불가 (진실만)</span>
                  </div>
                </div>

                {/* 3. 범인 */}
                <div className="bg-white/5 border border-[#dc2626]/20 hover:border-[#dc2626]/40 rounded-xl sm:rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all group">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#dc2626]/10 border border-[#dc2626]/20 flex items-center justify-center text-[#dc2626] group-hover:border-[#dc2626]/50 transition-colors">
                        <Fingerprint className="w-6 h-6 text-[#dc2626] group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#dc2626]/15 text-[#dc2626] border border-[#dc2626]/30 font-en tracking-wider">
                        CULPRIT
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <h4 className="text-xl font-bold text-white">범인</h4>
                        <span className="text-xs text-[#dc2626] font-bold">용의자 속 위장자</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed break-keep">
                        용의자들 사이에 섞여 있으며 정체를 숨기고 있는 진범입니다.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs">
                      <div className="flex items-start gap-2 text-[#d1d1d1]">
                        <span className="text-[#dc2626] font-bold shrink-0 mt-0.5">■</span>
                        <span className="leading-snug break-keep">
                          <strong className="text-white">거짓말 허용:</strong> 용의자 중에 섞여있음. 범인은 유일하게 거짓말을 할 수 있음.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[#d1d1d1]">
                        <span className="text-[#dc2626] font-bold shrink-0 mt-0.5">■</span>
                        <span className="leading-snug break-keep">
                          <strong className="text-white">승리 조건:</strong> 최종 투표에서 최다 득표를 피하고 다른 용의자에게 혐의를 전가해야 승리.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[#d1d1d1]">
                        <span className="text-[#dc2626] font-bold shrink-0 mt-0.5">■</span>
                        <span className="leading-snug break-keep">
                          <strong className="text-white">플레이 팁:</strong> 알리바이를 조작하거나 다른 사람의 의심스러운 동기를 부각시켜 수사망을 교란하세요.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white/40">발언 규칙</span>
                    <span className="text-[#dc2626] bg-[#dc2626]/10 px-2 py-0.5 rounded border border-[#dc2626]/20">유일하게 거짓말 가능</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How To Play Section */}
            <div className="bg-[#1a1a1a] p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 space-y-5 md:space-y-6">
              <div className="text-center md:text-left space-y-2 border-b border-white/5 pb-4 md:pb-5">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase font-en">GAME GUIDE</span>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter font-en text-white">How to Play</h3>
                <p className="text-xs sm:text-sm md:text-base text-[#d1d1d1] font-medium opacity-90 leading-relaxed">
                  크라임 씨너스는 게임 몰입도를 위해, 충분한 역할 파악 기회와 플레이 시간을 제공합니다.
                </p>
              </div>

              {/* 8 Steps Grid - 2 columns on mobile */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {[
                  { step: '01', title: '사전 역할 파악', desc: '예약 인원 확정 시, 전달되는 롤카드를 게임 전 미리 숙지해주세요.', icon: FileText },
                  { step: '02', title: '역할 선정', desc: '플레이어는 용의자나 탐정을 맡으며, 전날 미리 상의해 정할 수 있습니다.', icon: Users },
                  { step: '03', title: '역할 숙지', desc: '당일 현장에서 각자 역할을 숙지하며, 범인만 거짓말할 수 있습니다.', icon: Target },
                  { step: '04', title: '자기소개 및 현장 조사', desc: '간단한 자기소개와 함께 1차 현장조사를 진행합니다.', icon: Search },
                  { step: '05', title: '회의 및 중간 투표', desc: '각자 찾은 단서에 대해 논의하고 중간 범인 투표를 진행합니다.', icon: MessageSquare },
                  { step: '06', title: '2차 현장 조사 및 회의', desc: '추가 현장 조사를 통해 좀 더 사건의 진실에 가까워집니다.', icon: KeyRound },
                  { step: '07', title: '최종 현장 검증', desc: '마지막으로 추가 현장을 검증합니다.', icon: CheckCircle2 },
                  { step: '08', title: '최종 투표', desc: '모든 증거와 정황을 종합하여 진범을 지목합니다.', icon: Vote, iconClass: 'scale-125' }
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div 
                      key={`step-${item.step}`} 
                      className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span className="text-xl sm:text-2xl font-black text-[#dc2626] font-en">{item.step}</span>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0">
                            <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 text-white/40 group-hover:text-[#dc2626] transition-colors ${item.iconClass || ''}`} />
                          </div>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2 text-white leading-snug break-keep">{item.title}</h4>
                        <p className="text-xs sm:text-xs md:text-sm text-[#b3b3b3] opacity-80 leading-snug sm:leading-relaxed break-keep">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold flex items-center gap-3 px-2 md:px-4">
                <Info size={24} className="text-white/40" /> 이용 가이드 및 주의사항
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Admin Managed Notice */}
                {settings.noticeContent && (
                  <div className="bg-[#1a1a1a] rounded-2xl md:rounded-3xl border border-white/5 overflow-hidden">
                    <button 
                      onClick={() => setExpandedNotice(expandedNotice === 'admin' ? null : 'admin')}
                      className="w-full p-6 md:p-8 text-left flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-3 flex-1 pr-4">
                        <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase shrink-0">중요</span>
                        <h3 className="text-base md:text-xl font-bold tracking-tight group-hover:text-white transition-colors line-clamp-2 md:line-clamp-none">{settings.noticeTitle.replace('[필독] ', '')}</h3>
                      </div>
                      <ChevronRight size={20} className={`text-white/20 transition-transform shrink-0 ${expandedNotice === 'admin' ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {expandedNotice === 'admin' && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 md:px-8 pb-6 md:pb-8"
                        >
                          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap border-t border-white/5 pt-6">{settings.noticeContent}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {notices.filter(n => !n.title.includes('크라임씨너스 이용 가이드')).map((notice, index) => (
                  <div key={`${notice.id}-${index}`} className="bg-[#1a1a1a] rounded-2xl md:rounded-3xl border border-white/5 overflow-hidden">
                    <button 
                      onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}
                      className="w-full p-6 md:p-8 text-left flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-3 flex-1 pr-4">
                        {notice.isImportant && <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase shrink-0">중요</span>}
                        <h3 className="text-base md:text-xl font-bold tracking-tight group-hover:text-white transition-colors line-clamp-2 md:line-clamp-none">{notice.title}</h3>
                      </div>
                      <ChevronRight size={20} className={`text-white/20 transition-transform shrink-0 ${expandedNotice === notice.id ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {expandedNotice === notice.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 md:px-8 pb-6 md:pb-8"
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
              <div key={`${store.id}-${index}`} className="bg-[#1a1a1a] rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 group">
                <div className="aspect-video overflow-hidden bg-[#1a1a1a] flex items-center justify-center relative">
                  {store.imageUrl ? (
                    <img 
                      src={store.imageUrl} 
                      alt={store.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                      loading="lazy"
                      decoding="async"
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
                      <MapPin size={18} className="text-white/40 mt-1 shrink-0" />
                      <div className="flex flex-col gap-2.5">
                        <span className="text-sm text-[#b3b3b3] opacity-60 leading-relaxed">{store.address}</span>
                        <a 
                          href={store.naverPlaceUrl || `https://map.naver.com/v5/search/${encodeURIComponent(store.address || store.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white text-white hover:text-black font-bold rounded-xl text-xs transition-all border border-white/15 w-fit cursor-pointer"
                        >
                          <ExternalLink size={13} />
                          네이버 지도 바로가기
                        </a>
                      </div>
                    </div>
                  </div>
                  <Link 
                    to={settings.reservationLandingUrl || '/theme/theme-1'} 
                    className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm uppercase tracking-tight shadow-md"
                  >
                    테마 예약하기 <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sticky Bottom Banner */}
      <AnimatePresence>
        {showStickyBanner && activeTab !== 'stores' && (
          <div className="fixed bottom-3 left-0 right-0 sm:bottom-4 md:bottom-8 z-50 flex justify-center px-3 sm:px-4 pointer-events-none">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-2xl pointer-events-auto"
            >
              <Link
                to={settings.reservationLandingUrl || '/theme/theme-1'}
                className="w-full bg-[#121212]/95 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black rounded-2xl md:rounded-full p-2.5 px-3.5 sm:px-6 md:px-8 md:py-4 flex items-center justify-between gap-2.5 sm:gap-3 hover:border-red-500/60 hover:bg-[#1a1a1a] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#dc2626] animate-pulse shrink-0 shadow-lg shadow-red-500/50" />
                  <p className="text-[13px] sm:text-base md:text-lg font-black text-white tracking-tight leading-none whitespace-nowrap">
                    지금 사건현장으로 떠나보세요!
                  </p>
                </div>
                <div className="shrink-0 px-3.5 sm:px-5 md:px-7 py-2 sm:py-2.5 md:py-3 bg-[#dc2626] text-white font-black rounded-xl md:rounded-full group-hover:bg-red-700 transition-all text-[12px] sm:text-sm md:text-base flex items-center gap-1 sm:gap-1.5 shadow-xl shadow-red-950/60 group-hover:scale-105 active:scale-95 uppercase tracking-wide font-en whitespace-nowrap">
                  예약하기 <ChevronRight size={15} className="stroke-[3] sm:w-5 sm:h-5" />
                </div>
              </Link>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NoticeBoard;
