
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { THEMES, DEFAULT_ADMIN_SETTINGS, STORES } from '../constants';
import { isWeekendOrHoliday } from '../src/utils/holiday';
import { Calendar as CalendarIcon, Clock, Users, ArrowLeft, ChevronLeft, ChevronRight, MapPin, X, Info, UserCheck, ExternalLink } from 'lucide-react';
import { AdminSettings, Theme, ClosedSlot, BookingData, Store } from '../types';
import { dataService } from '../src/services/dataService';
import LoadingScreen from './LoadingScreen';
import SuspectModal from './SuspectModal';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [closedSlots, setClosedSlots] = useState<ClosedSlot[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [stores, setStores] = useState<Store[]>(STORES);
  const [loading, setLoading] = useState(true);
  
  const [showStoreInfo, setShowStoreInfo] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showSuspectModal, setShowSuspectModal] = useState(false);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);

  const calendarRef = useRef<HTMLDivElement>(null);
  const timeSlotsRef = useRef<HTMLDivElement>(null);
  const storeInfoRef = useRef<HTMLDivElement>(null);
  const [showFloatingBtn, setShowFloatingBtn] = useState(true);

  // Close store info popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (storeInfoRef.current && !storeInfoRef.current.contains(event.target as Node)) {
        setShowStoreInfo(false);
      }
    };

    if (showStoreInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showStoreInfo]);

  useEffect(() => {
    const handleScroll = () => {
      if (calendarRef.current) {
        const rect = calendarRef.current.getBoundingClientRect();
        // Hide the button when the top of the calendar is within 150px of the bottom of the viewport
        setShowFloatingBtn(rect.top > window.innerHeight - 150);
      } else {
        setShowFloatingBtn(window.scrollY < 500);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCalendar = () => {
    if (calendarRef.current) {
      const y = calendarRef.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setTimeout(() => {
      if (timeSlotsRef.current) {
        const offset = window.innerWidth < 768 ? 90 : 120;
        const y = timeSlotsRef.current.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedSettings, savedClosed, savedBookings, themeList, storeList] = await Promise.all([
          dataService.getSettings(),
          dataService.getClosedSlots(),
          dataService.getBookings(),
          dataService.getThemes(),
          dataService.getStores()
        ]);

        setSettings(savedSettings);
        setClosedSlots(savedClosed);
        setBookings(savedBookings);
        setStores(storeList);
        
        const found = themeList.find((t: Theme) => t.id === id);
        if (found) {
          setTheme(found);
          
          const now = new Date();
          now.setHours(0,0,0,0);
          let isBeforeStartDate = false;

          if (found.startDate) {
            const start = new Date(found.startDate);
            start.setHours(0,0,0,0);
            if (now < start) {
              isBeforeStartDate = true;
              setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1));
            }
          }

          // Check if coming soon modal should be displayed:
          // 1) explicitly marked as isComingSoon
          // 2) startDate is in the future AND futureDisplayMode is not 'open_calendar'
          const isComingSoonMode = found.isComingSoon || (isBeforeStartDate && (!found.futureDisplayMode || found.futureDisplayMode === 'coming_soon'));

          if (isComingSoonMode) {
            setShowComingSoonModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to load theme detail data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!theme) return null;

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${year}-${month}-${i}`} className="p-4" />);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isPast = date < new Date(new Date().setHours(0,0,0,0));
      
      let isOutsideRange = false;
      if (theme.startDate) {
        const start = new Date(theme.startDate);
        start.setHours(0,0,0,0);
        if (date < start) isOutsideRange = true;
      }
      if (theme.endDate) {
        const end = new Date(theme.endDate);
        end.setHours(0,0,0,0);
        if (date > end) isOutsideRange = true;
      }
      
      const isDisabled = isPast || isOutsideRange;
      
      const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      const isWeekend = isWeekendOrHoliday(date);
      let baseSlots: string[] = [];
      if (theme.useSeparateWeekdaySlots) {
        baseSlots = isWeekend ? (theme.customSlots || []) : (theme.weekdaySlots || []);
      } else {
        baseSlots = theme.customSlots || [];
      }
      
      const daySlots = baseSlots.filter(s => s).map(slot => {
        const slotBookings = bookings.filter(b => b.themeId === theme.id && b.date === dateStr && b.time === slot && b.status !== 'cancelled');
        const currentParticipants = slotBookings.reduce((sum, b) => sum + b.participantCount, 0);
        const isClosedByAdmin = closedSlots.some(cs => cs.themeId === theme.id && cs.date === dateStr && cs.time === slot);
        const isClosedByRequest = slotBookings.some(b => b.isCloseRequested);
        const isFull = currentParticipants >= theme.maxPlayers;
        return { isAvailable: !isClosedByAdmin && !isClosedByRequest && !isFull };
      });

      const isAllFull = daySlots.length > 0 && daySlots.every(s => !s.isAvailable);
      
      days.push(
        <button
          key={`day-${year}-${month}-${d}`}
          disabled={isDisabled}
          onClick={() => handleDateSelect(date)}
          className={`aspect-square rounded-xl border transition-all flex flex-col items-center justify-center relative group ${
            isDisabled ? 'opacity-20 cursor-not-allowed' :
            isSelected ? 'bg-white border-white text-black font-bold shadow-xl scale-105' : 
            isAllFull ? 'bg-[#2a2a2a] border-white/5 text-white/20' : 'hover:border-white/40 border-white/5 bg-white/5'
          }`}
        >
          <div className="flex flex-col items-center justify-center h-full py-1">
            <span className={`text-lg font-en leading-none ${isAllFull && !isDisabled ? 'line-through decoration-white/40' : ''}`}>{d}</span>
          </div>
        </button>
      );
    }
    return days;
  };

  const getSlots = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');
    const isWeekend = isWeekendOrHoliday(selectedDate);
    
    let baseSlots: string[] = [];
    if (theme.useSeparateWeekdaySlots) {
      baseSlots = isWeekend ? (theme.customSlots || []) : (theme.weekdaySlots || []);
    } else {
      baseSlots = theme.customSlots || [];
    }
    
    return baseSlots.filter(s => s).map(slot => {
      const slotBookings = bookings.filter(b => b.themeId === theme.id && b.date === dateStr && b.time === slot && b.status !== 'cancelled');
      const currentParticipants = slotBookings.reduce((sum, b) => sum + b.participantCount, 0);
      const isClosedByAdmin = closedSlots.some(cs => cs.themeId === theme.id && cs.date === dateStr && cs.time === slot);
      const isClosedByRequest = slotBookings.some(b => b.isCloseRequested);
      const isFull = currentParticipants >= theme.maxPlayers;
      
      const isAvailable = !isClosedByAdmin && !isClosedByRequest && !isFull;
      
      return { 
        time: slot, 
        isAvailable, 
        currentParticipants, 
        isClosedByAdmin, 
        isClosedByRequest,
        isFull
      };
    });
  };

  const store = theme.storeId ? stores.find(s => s.id === theme.storeId) : null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startDate = theme.startDate ? new Date(theme.startDate) : null;
  const endDate = theme.endDate ? new Date(theme.endDate) : null;
  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (endDate) endDate.setHours(0, 0, 0, 0);

  const mode = theme.futureDisplayMode || 'coming_soon';
  const isFuture = startDate && now < startDate;
  const isExpired = endDate && now > endDate;

  const isComingSoon = isExpired || (isFuture && mode === 'coming_soon');
  let dDayText = '';
  if (!isComingSoon && endDate && now <= endDate) {
    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    dDayText = diffDays === 0 ? 'D-DAY' : `D-${diffDays}`;
  }

  return (
    <div className="pt-24 md:pt-32 pb-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <div className="mb-4 md:mb-8">
        <Link to="/reservation" className="inline-flex items-center text-[#b3b3b3] hover:text-white gap-2 text-sm font-bold tracking-normal uppercase font-en">
          <ArrowLeft size={16} /> Back to Scenarios
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[500px_450px] gap-8 lg:gap-10 xl:gap-16 justify-center items-start">
        <div className="w-full mb-0 lg:mb-0">
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-3 md:mb-6">
                <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-1 rounded tracking-widest uppercase font-en">BEST</span>
                {store && (
                  <div className="relative" ref={storeInfoRef}>
                    <button 
                      onClick={() => setShowStoreInfo(!showStoreInfo)}
                      className="text-white text-sm font-bold uppercase flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full hover:bg-white hover:text-black transition-all border border-white/10"
                    >
                      <MapPin size={14} /> {store.name}
                    </button>
                    <AnimatePresence>
                      {showStoreInfo && (
                        <>
                          {/* Desktop Backdrop for outside click */}
                          <div 
                            className="hidden md:block fixed inset-0 z-40 bg-transparent" 
                            onClick={() => setShowStoreInfo(false)}
                          />

                          {/* Desktop Tooltip */}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="hidden md:block absolute left-0 top-full mt-3 w-80 p-5 bg-[#161616] border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50"
                          >
                            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/10">
                              <h4 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                                <MapPin size={15} className="text-red-500" />
                                {store.name} 상세 정보
                              </h4>
                              <button 
                                onClick={() => setShowStoreInfo(false)} 
                                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="space-y-2.5 text-xs text-[#b3b3b3] leading-relaxed">
                              <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                                <p className="text-white/40 mb-1 text-[10px] font-bold">주소</p>
                                <p className="text-white/90">{store.address}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                                  <p className="text-white/40 mb-1 text-[10px] font-bold">평일 영업</p>
                                  <p className="text-white/90">{store.weekdayHours}</p>
                                </div>
                                <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                                  <p className="text-white/40 mb-1 text-[10px] font-bold">주말 영업</p>
                                  <p className="text-white/90">{store.weekendHours}</p>
                                </div>
                              </div>
                              <div className="p-3 bg-black/50 rounded-xl border border-white/5">
                                <p className="text-white/40 mb-1 text-[10px] font-bold">전화번호</p>
                                <p className="font-en text-white/90">{store.phone}</p>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10">
                              <a 
                                href={store.naverPlaceUrl && store.naverPlaceUrl.trim() ? store.naverPlaceUrl.trim() : `https://map.naver.com/v5/search/${encodeURIComponent(store.address)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 px-4 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <ExternalLink size={14} />
                                네이버 지도 바로가기
                              </a>
                            </div>
                          </motion.div>

                          {/* Mobile Modal */}
                          <div className="md:hidden fixed inset-0 z-[200] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] h-[100dvh]">
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                              onClick={() => setShowStoreInfo(false)}
                            />
                            <motion.div 
                              initial={{ scale: 0.95, opacity: 0, y: 10 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 0.95, opacity: 0, y: 10 }}
                              className="relative w-full max-w-sm max-h-[calc(100dvh-2.5rem)] overflow-y-auto bg-[#161616] border border-white/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 my-auto"
                            >
                              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                <h4 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                                  <MapPin size={18} className="text-red-500 shrink-0" />
                                  {store.name}
                                </h4>
                                <button 
                                  onClick={() => setShowStoreInfo(false)} 
                                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer active:scale-95"
                                  aria-label="닫기"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="space-y-3 text-xs sm:text-sm text-[#b3b3b3] leading-relaxed">
                                <div className="p-3.5 bg-black/50 rounded-xl border border-white/5">
                                  <p className="text-white/40 mb-1 text-[10px] sm:text-xs font-bold">매장 주소</p>
                                  <p className="text-white/90">{store.address}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-2.5">
                                  <div className="p-3.5 bg-black/50 rounded-xl border border-white/5">
                                    <p className="text-white/40 mb-1 text-[10px] sm:text-xs font-bold">운영 시간</p>
                                    <div className="flex flex-col gap-1 text-white/90">
                                      <p>평일: {store.weekdayHours}</p>
                                      <p>주말: {store.weekendHours}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3.5 bg-black/50 rounded-xl border border-white/5">
                                  <p className="text-white/40 mb-1 text-[10px] sm:text-xs font-bold">전화번호</p>
                                  <p className="font-en text-white/90">{store.phone}</p>
                                </div>
                              </div>
                              <div className="mt-5 pt-3 border-t border-white/10">
                                <a 
                                  href={store.naverPlaceUrl && store.naverPlaceUrl.trim() ? store.naverPlaceUrl.trim() : `https://map.naver.com/v5/search/${encodeURIComponent(store.address)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full py-3 px-6 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <ExternalLink size={16} />
                                  네이버 지도 바로가기
                                </a>
                              </div>
                            </motion.div>
                          </div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 tracking-tighter flex items-center gap-3">
                {theme.title}
              </h1>
              <p className="text-[#b3b3b3] text-sm md:text-base leading-relaxed max-w-2xl opacity-80 mb-4">{theme.synopsis}</p>
              
              {/* 사건 관계자 정보 (등장인물) 확인 버튼 */}
              {(theme.useSuspects ?? true) && (
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setShowSuspectModal(true)}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-white/20 hover:border-white/40 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md group active:scale-95 cursor-pointer"
                  >
                    <Users size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white">사건 관계자 정보</span>
                    {theme.suspects && theme.suspects.length > 0 && (
                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/90 border border-white/10 ml-0.5">
                        {theme.suspects.length}명
                      </span>
                    )}
                  </button>
                </div>
              )}

              {dDayText && (theme.showDDay ?? true) && (
                <div className="flex items-center gap-2 mb-8">
                  <span className="text-sm md:text-base font-medium text-white/80">
                    시나리오 운영 기한 : <span className="text-[#dc2626] font-black">{dDayText}</span>
                  </span>
                  <div 
                    className="relative flex items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (window.innerWidth < 768) {
                        setShowInfoModal(true);
                      }
                    }}
                  >
                    <Info size={16} className="text-white/40 cursor-help peer hover:text-white transition-colors" />
                    <div className="hidden md:block absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] p-3 bg-black/90 backdrop-blur-md text-white text-xs leading-relaxed rounded-xl border border-white/10 opacity-0 invisible peer-hover:opacity-100 peer-hover:visible hover:opacity-100 hover:visible transition-all z-[100] shadow-xl whitespace-normal break-keep">
                      예약하실 수 있는 테마 운영 기한입니다.<br />
                      늘 새로운 경험을 제공하기 위해 재미있는 테마로 업데이트 하겠습니다.<br />
                      영업 상황에 따라 기한은 상시 변동될 수 있습니다.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-6 md:gap-y-8 gap-x-3 sm:gap-x-4 py-8 md:py-10 border-y border-white/5">
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase whitespace-nowrap">난이도</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={`tdiff-${i}`} className={`w-3 h-3 rounded-full ${i < theme.difficulty ? 'bg-white' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase whitespace-nowrap">공포도</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={`tfear-${i}`} className={`w-3 h-3 rounded-full ${i < theme.fearLevel ? 'bg-[#dc2626]' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase whitespace-nowrap">소요시간</p>
                <div className="flex items-center gap-1.5 sm:gap-2 text-white font-bold text-sm whitespace-nowrap">
                  <Clock size={14} className="text-white/40 shrink-0" />
                  <span>{theme.duration}분</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase whitespace-nowrap">참여인원</p>
                <div className="flex items-center gap-1.5 sm:gap-2 text-white font-bold text-sm whitespace-nowrap">
                  <Users size={14} className="text-white/40 shrink-0" />
                  <span>{theme.minPlayers}-{theme.maxPlayers}명</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase shrink-0">1인 가격</p>
                  {settings?.advanceDepositDiscount?.enabled && (
                    <span className="text-[9px] font-bold bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 px-1 py-0.5 rounded uppercase tracking-wider leading-none shrink-0 whitespace-nowrap">
                      선입금가
                    </span>
                  )}
                </div>
                {settings?.advanceDepositDiscount?.enabled ? (
                  <div className="flex flex-row md:flex-col items-baseline md:items-start gap-1.5 md:gap-0.5 whitespace-nowrap">
                    <p className="text-white/40 text-xs font-medium line-through decoration-white/30 leading-none">{theme.price.toLocaleString()}원</p>
                    <p className="text-white font-bold text-sm leading-tight">
                      {(theme.price - settings.advanceDepositDiscount.discountAmount).toLocaleString()}원
                    </p>
                  </div>
                ) : (
                  <p className="text-white font-bold text-sm whitespace-nowrap leading-tight">{theme.price.toLocaleString()}원</p>
                )}
              </div>
            </div>
          </div>

          <div className="relative aspect-[2/3] overflow-hidden rounded-xl md:rounded-2xl shadow-2xl mt-6 md:mt-12 mb-8 md:mb-12 border border-white/5 bg-[#1a1a1a] flex items-center justify-center">
            {(() => {
              const rawPoster = (theme.posterUrl && !theme.posterUrl.startsWith('/theme')) ? theme.posterUrl : 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp';
              const isBrandFallback = !theme.posterUrl || rawPoster.includes('1772555492065') || rawPoster.includes('brand/');
              return (
                <img 
                  src={rawPoster} 
                  alt={theme.title} 
                  className={`w-full h-full ${isBrandFallback ? 'object-contain p-12 opacity-40' : 'object-cover'}`} 
                  onError={(e) => {
                    e.currentTarget.src = 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp';
                    e.currentTarget.className = 'w-full h-full object-contain p-12 bg-[#1a1a1a] opacity-40';
                  }}
                />
              );
            })()}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent md:hidden" />
          </div>
        </div>

        <div ref={calendarRef} className="bg-[#1a1a1a] p-6 md:p-8 lg:p-10 rounded-xl md:rounded-2xl border border-white/5 shadow-2xl w-full">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight"><CalendarIcon size={20}/> 날짜 선택</h2>
            <div className="flex items-center gap-6">
              {(() => {
                const now = new Date();
                const minDate = theme.startDate ? new Date(Math.max(now.getTime(), new Date(theme.startDate).getTime())) : now;
                const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
                const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                const canGoPrev = prevMonth >= minMonth;

                const maxDate = theme.endDate ? new Date(theme.endDate) : null;
                const maxMonth = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null;
                const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                const canGoNext = maxMonth ? nextMonth <= maxMonth : true;

                return (
                  <>
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                      className={`p-2 rounded-full transition-colors ${canGoPrev ? 'hover:bg-white/5' : 'opacity-0 pointer-events-none'}`}
                    >
                      <ChevronLeft size={20}/>
                    </button>
                    <span className="font-bold text-sm tracking-normal uppercase font-en">{currentMonth.getFullYear()}. {currentMonth.getMonth() + 1}</span>
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                      className={`p-2 rounded-full transition-colors ${canGoNext ? 'hover:bg-white/5' : 'opacity-0 pointer-events-none'}`}
                    >
                      <ChevronRight size={20}/>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-white/20 mb-6 font-medium tracking-normal uppercase font-en">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2 mb-12">
            {renderCalendar()}
          </div>

          {selectedDate && (
            <div ref={timeSlotsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Clock size={18} /> 시간 선택
                </h3>
                <span className="text-xs text-white/40 font-en">{selectedDate.toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {getSlots().map((slotInfo, index) => {
                  const dateStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');
                  return (
                    <button
                      key={`slot-${dateStr}-${slotInfo.time}-${index}`}
                      disabled={!slotInfo.isAvailable}
                      onClick={() => navigate(`/booking/${theme.id}/${dateStr}/${slotInfo.time}`)}
                      className={`w-full p-6 border rounded-2xl transition-all flex justify-between items-center group ${
                        slotInfo.isAvailable 
                        ? 'border-white/10 hover:border-white hover:bg-white/5 cursor-pointer' 
                        : 'border-white/5 opacity-20 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className={`text-2xl font-bold font-en ${slotInfo.isAvailable ? 'group-hover:translate-x-2 transition-transform' : ''}`}>{slotInfo.time}</span>
                        {slotInfo.isAvailable && slotInfo.currentParticipants > 0 && (
                          <span className="text-[10px] font-medium text-[#dc2626] tracking-normal uppercase font-en bg-[#dc2626]/10 px-2 py-0.5 rounded">
                            {slotInfo.currentParticipants}/{theme.maxPlayers}명 Booked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium tracking-normal uppercase font-en">
                          {slotInfo.isAvailable ? 'Available' : (slotInfo.isFull ? 'Full' : 'Closed')}
                        </span>
                        {slotInfo.isAvailable && <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Button */}
      <AnimatePresence>
        {showFloatingBtn && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="md:hidden fixed bottom-6 left-6 right-6 z-40"
          >
            <button 
              onClick={scrollToCalendar}
              className="w-full py-4 bg-white text-black font-bold rounded-full shadow-2xl flex items-center justify-center gap-2 text-sm"
            >
              <CalendarIcon size={18} /> 예약 날짜 선택하기
            </button>
          </motion.div>
        )}

        {showInfoModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowInfoModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#161616] border border-white/15 rounded-2xl p-5 w-full max-w-sm shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Info size={16} className="text-[#dc2626]" />
                  시나리오 운영 기한 안내
                </h3>
                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
                  aria-label="닫기"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed break-keep">
                예약하실 수 있는 테마 운영 기한입니다.<br /><br />
                늘 새로운 경험을 제공하기 위해 재미있는 테마로 업데이트 하겠습니다.<br /><br />
                영업 상황에 따라 기한은 상시 변동될 수 있습니다.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="w-full py-3 px-6 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer"
                >
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Coming Soon Modal */}
        {showComingSoonModal && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#161616] border border-white/15 p-6 sm:p-8 rounded-2xl sm:rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-[#dc2626]">
                <Clock size={28} />
              </div>
              
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#dc2626] tracking-widest uppercase font-en block">
                  COMING SOON
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  곧 오픈예정입니다
                </h3>
                <p className="text-white/60 text-xs sm:text-sm pt-1 leading-relaxed whitespace-pre-line break-keep">
                  {theme?.startDate 
                    ? `'${theme.title}' 테마는 ${theme.startDate}에 오픈 예정입니다.\n조금만 기다려 주세요!`
                    : `'${theme.title}' 테마는 현재 오픈 준비 중입니다.\n빠른 시일 내에 찾아뵙겠습니다.`}
                </p>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => {
                    setShowComingSoonModal(false);
                    if (window.history.length > 2) {
                      navigate(-1);
                    } else {
                      navigate('/');
                    }
                  }}
                  className="w-full py-3.5 px-6 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm shadow-md cursor-pointer"
                >
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Suspect Info Layer Popup */}
      <SuspectModal
        isOpen={showSuspectModal}
        onClose={() => setShowSuspectModal(false)}
        theme={theme}
      />
    </div>
  );
};

export default ThemeDetail;
