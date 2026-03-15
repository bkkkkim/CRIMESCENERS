
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { THEMES, DEFAULT_ADMIN_SETTINGS, STORES } from '../constants';
import { isWeekendOrHoliday } from '../src/utils/holiday';
import { Calendar as CalendarIcon, Clock, Users, ArrowLeft, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { AdminSettings, Theme, ClosedSlot, BookingData, Store } from '../types';
import { dataService } from '../src/services/dataService';
import LoadingScreen from './LoadingScreen';
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
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);

  const calendarRef = useRef<HTMLDivElement>(null);
  const timeSlotsRef = useRef<HTMLDivElement>(null);
  const [showFloatingBtn, setShowFloatingBtn] = useState(true);

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
        const y = timeSlotsRef.current.getBoundingClientRect().top + window.scrollY - 90;
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
        if (found) setTheme(found);
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
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-4" />);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isPast = date < new Date(new Date().setHours(0,0,0,0));
      
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
          key={d}
          disabled={isPast}
          onClick={() => handleDateSelect(date)}
          className={`aspect-square rounded-xl border transition-all flex flex-col items-center justify-center relative group ${
            isPast ? 'opacity-20 cursor-not-allowed' :
            isSelected ? 'bg-white border-white text-black font-bold shadow-xl scale-105' : 
            isAllFull ? 'bg-[#2a2a2a] border-white/5 text-white/20' : 'hover:border-white/40 border-white/5 bg-white/5'
          }`}
        >
          <div className="flex flex-col items-center justify-center h-full py-1">
            <span className={`text-lg font-en leading-none ${isAllFull && !isPast ? 'line-through decoration-white/40' : ''}`}>{d}</span>
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

  return (
    <div className="pt-24 md:pt-32 pb-0 px-0 md:px-6 max-w-7xl mx-auto">
      <div className="px-6 md:px-0">
        <Link to="/reservation" className="inline-flex items-center text-[#b3b3b3] hover:text-white mb-4 md:mb-8 gap-2 text-sm font-bold tracking-normal uppercase font-en">
          <ArrowLeft size={16} /> Back to Scenarios
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[500px_450px] gap-0 md:gap-8 lg:gap-16 justify-center">
        <div className="px-6 md:px-0 mb-0 lg:mb-0 w-full">
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-3 md:mb-6">
                <span className="bg-[#dc2626] text-[10px] font-bold px-2 py-1 rounded tracking-widest uppercase font-en">TOP RATED</span>
                {store && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowStoreInfo(!showStoreInfo)}
                      className="text-white text-sm font-bold uppercase flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full hover:bg-white hover:text-black transition-all border border-white/10"
                    >
                      <MapPin size={14} /> {store.name}
                    </button>
                    <AnimatePresence>
                      {showStoreInfo && (
                        <>
                          {/* Desktop Tooltip */}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="hidden md:block absolute left-0 top-full mt-3 w-72 p-6 bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-white tracking-tight">{store.name} 상세 정보</h4>
                              <button onClick={() => setShowStoreInfo(false)} className="text-white/20 hover:text-white">
                                <X size={16} />
                              </button>
                            </div>
                            <div className="space-y-4 text-xs text-[#b3b3b3] leading-relaxed">
                              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                <p className="text-white/40 mb-1 uppercase tracking-normal text-[8px] font-medium">Address</p>
                                <p>{store.address}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                  <p className="text-white/40 mb-1 uppercase tracking-normal text-[8px] font-medium">Weekday</p>
                                  <p>{store.weekdayHours}</p>
                                </div>
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                  <p className="text-white/40 mb-1 uppercase tracking-normal text-[8px] font-medium">Weekend</p>
                                  <p>{store.weekendHours}</p>
                                </div>
                              </div>
                              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                <p className="text-white/40 mb-1 uppercase tracking-normal text-[8px] font-medium">Contact</p>
                                <p className="font-en">{store.phone}</p>
                              </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5">
                              <a 
                                href={`https://map.naver.com/v5/search/${encodeURIComponent(store.address)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full text-center py-2.5 bg-white text-black text-[10px] font-medium rounded-xl hover:bg-neutral-200 transition-colors uppercase tracking-normal font-en"
                              >
                                Naver Maps
                              </a>
                            </div>
                          </motion.div>

                          {/* Mobile Modal */}
                          <div className="md:hidden fixed inset-0 z-[200] flex items-center justify-center p-6">
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                              onClick={() => setShowStoreInfo(false)}
                            />
                            <motion.div 
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[40px] p-8 shadow-2xl"
                            >
                              <div className="flex items-center justify-between mb-6">
                                <h4 className="text-xl font-bold text-white tracking-tight">{store.name}</h4>
                                <button onClick={() => setShowStoreInfo(false)} className="p-2 hover:bg-white/5 rounded-full">
                                  <X size={24} />
                                </button>
                              </div>
                              <div className="space-y-4 text-sm text-[#b3b3b3] leading-relaxed">
                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                  <p className="text-white/40 mb-1 uppercase tracking-normal text-[10px] font-medium">Address</p>
                                  <p>{store.address}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                    <p className="text-white/40 mb-1 uppercase tracking-normal text-[10px] font-medium">Business Hours</p>
                                    <div className="flex flex-col gap-1">
                                      <p>평일: {store.weekdayHours}</p>
                                      <p>주말: {store.weekendHours}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                  <p className="text-white/40 mb-1 uppercase tracking-normal text-[10px] font-bold">Contact</p>
                                  <p className="font-en">{store.phone}</p>
                                </div>
                              </div>
                              <div className="mt-8">
                                <a 
                                  href={`https://map.naver.com/v5/search/${encodeURIComponent(store.address)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block w-full text-center py-4 bg-white text-black font-bold rounded-2xl hover:bg-neutral-200 transition-colors uppercase tracking-normal font-en text-sm"
                                >
                                  Naver Maps
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
              <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 tracking-tighter">{theme.title}</h1>
              <p className="text-[#b3b3b3] text-sm md:text-base leading-relaxed max-w-2xl opacity-80">{theme.synopsis}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-y-6 md:gap-y-8 gap-x-4 py-8 md:py-10 border-y border-white/5">
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase">난이도</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-4 h-1 rounded-full ${i < theme.difficulty ? 'bg-white' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase">공포도</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-4 h-1 rounded-full ${i < theme.fearLevel ? 'bg-[#dc2626]' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase">소요시간</p>
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Clock size={14} className="text-white/40" />
                  <span>{theme.duration}분</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase">참여인원</p>
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Users size={14} className="text-white/40" />
                  <span>{theme.minPlayers}-{theme.maxPlayers}명</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-white/40 tracking-normal uppercase">1인</p>
                <p className="text-white font-bold text-sm">{theme.price.toLocaleString()}원</p>
              </div>
            </div>
          </div>

          <div className="relative aspect-[2/3] overflow-hidden rounded-none md:rounded-[40px] shadow-2xl mt-6 md:mt-12 mb-12 border border-white/5">
            <img src={theme.posterUrl} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent md:hidden" />
          </div>
        </div>

        <div ref={calendarRef} className="bg-[#1a1a1a] p-6 md:p-10 rounded-none md:rounded-[40px] border-t md:border border-white/5 shadow-2xl lg:h-[calc(100%-3rem)]">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight"><CalendarIcon size={20}/> 날짜 선택</h2>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <ChevronLeft size={20}/>
              </button>
              <span className="font-bold text-sm tracking-normal uppercase font-en">{currentMonth.getFullYear()}. {currentMonth.getMonth() + 1}</span>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <ChevronRight size={20}/>
              </button>
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
                {getSlots().map(slotInfo => {
                  const dateStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');
                  return (
                    <button
                      key={slotInfo.time}
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
      </AnimatePresence>
    </div>
  );
};

export default ThemeDetail;
