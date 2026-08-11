
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { THEMES, STORES } from '../constants';
import { ChevronRight, Users, Clock, MapPin, Filter, ArrowUpDown, Calendar as CalendarIcon, Search, X, Ticket, SearchCheck, ChevronDown } from 'lucide-react';
import { Theme, Store, ClosedSlot, BookingData } from '../types';
import { dataService } from '../src/services/dataService';
import { isWeekendOrHoliday } from '../src/utils/holiday';
import LoadingScreen from './LoadingScreen';

const ThemeReservation = () => {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<Theme[]>(THEMES);
  const [stores, setStores] = useState<Store[]>(STORES);
  const [closedSlots, setClosedSlots] = useState<ClosedSlot[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'book' | 'check'>('book');
  
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Check/Cancel state
  const [bookingNumber, setBookingNumber] = useState('');
  const [bookerName, setBookerName] = useState('');
  const [bookerPhone, setBookerPhone] = useState('');
  const [foundBooking, setFoundBooking] = useState<BookingData | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, st, cs, bk] = await Promise.all([
          dataService.getThemes(),
          dataService.getStores(),
          dataService.getClosedSlots(),
          dataService.getBookings()
        ]);
        setThemes(t);
        setStores(st);
        setClosedSlots(cs);
        setBookings(bk);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];

    const dateObj = new Date(selectedDate);
    dateObj.setHours(0, 0, 0, 0);
    const isWeekend = isWeekendOrHoliday(dateObj);

    const times = new Set<string>();

    themes.forEach(theme => {
      if (selectedStoreId !== 'all' && theme.storeId !== selectedStoreId) return;

      const start = theme.startDate ? new Date(theme.startDate) : null;
      const end = theme.endDate ? new Date(theme.endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(0, 0, 0, 0);
      
      if (start && dateObj < start) return;
      if (end && dateObj > end) return;

      let baseSlots: string[] = [];
      if (theme.useSeparateWeekdaySlots) {
        baseSlots = isWeekend ? (theme.customSlots || []) : (theme.weekdaySlots || []);
      } else {
        baseSlots = theme.customSlots || [];
      }

      baseSlots.forEach(time => {
        if (!time) return;
        
        // Check if theme is closed on this date/time
        const isClosed = closedSlots.some(cs => 
          cs.themeId === theme.id && 
          cs.date === selectedDate && 
          (cs.time === 'all' || cs.time === time)
        );
        if (isClosed) return;

        // Check availability
        const slotBookings = bookings.filter(b => 
          b.themeId === theme.id && 
          b.date === selectedDate && 
          b.time === time && 
          b.status !== 'cancelled'
        );
        const bookedPlayers = slotBookings.reduce((sum, b) => sum + b.participantCount, 0);
        const isCloseRequested = slotBookings.some(b => b.isCloseRequested);
        
        if (!isCloseRequested && bookedPlayers < theme.maxPlayers) {
          times.add(time);
        }
      });
    });

    return Array.from(times).sort();
  }, [themes, selectedStoreId, selectedDate, closedSlots, bookings]);

  useEffect(() => {
    if (selectedTime && !availableTimes.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [availableTimes, selectedTime]);

  const filteredAndSortedThemes = useMemo(() => {
    let result = [...themes];

    // Filter by store
    if (selectedStoreId !== 'all') {
      result = result.filter(t => t.storeId === selectedStoreId);
    }

    // Filter by date and time
    if (selectedDate && selectedTime) {
      result = result.filter(theme => {
        // Check if theme is within its start/end date
        const dateObj = new Date(selectedDate);
        dateObj.setHours(0, 0, 0, 0);
        
        if (theme.startDate) {
          const start = new Date(theme.startDate);
          start.setHours(0, 0, 0, 0);
          if (dateObj < start) return false;
        }
        if (theme.endDate) {
          const end = new Date(theme.endDate);
          end.setHours(0, 0, 0, 0);
          if (dateObj > end) return false;
        }

        // Check if theme has the selected time slot
        const isWeekend = isWeekendOrHoliday(new Date(selectedDate));
        let baseSlots: string[] = [];
        if (theme.useSeparateWeekdaySlots) {
          baseSlots = isWeekend ? (theme.customSlots || []) : (theme.weekdaySlots || []);
        } else {
          baseSlots = theme.customSlots || [];
        }
        if (!baseSlots.includes(selectedTime)) return false;
        
        // Check if theme is closed on this date/time
        const isClosed = closedSlots.some(cs => 
          cs.themeId === theme.id && 
          cs.date === selectedDate && 
          (cs.time === 'all' || cs.time === selectedTime)
        );
        if (isClosed) return false;

        // Check availability
        const slotBookings = bookings.filter(b => 
          b.themeId === theme.id && 
          b.date === selectedDate && 
          b.time === selectedTime && 
          b.status !== 'cancelled'
        );
        const bookedPlayers = slotBookings.reduce((sum, b) => sum + b.participantCount, 0);
        const isCloseRequested = slotBookings.some(b => b.isCloseRequested);
        
        if (isCloseRequested || bookedPlayers >= theme.maxPlayers) {
          return false;
        }

        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const getIsComingSoon = (theme: Theme) => {
        const start = theme.startDate ? new Date(theme.startDate) : null;
        const end = theme.endDate ? new Date(theme.endDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(0, 0, 0, 0);

        const mode = theme.futureDisplayMode || 'coming_soon';
        const isFuture = start && now < start;
        const isExpired = end && now > end;

        return isExpired || (isFuture && mode === 'coming_soon');
      };

      const aComing = getIsComingSoon(a);
      const bComing = getIsComingSoon(b);

      if (aComing !== bComing) {
        return aComing ? 1 : -1;
      }

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
          return themes.indexOf(b) - themes.indexOf(a);
      }
    });

    return result;
  }, [themes, selectedStoreId, sortBy, selectedDate, selectedTime, closedSlots, bookings]);

  const handleCheckBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const booking = bookings.find(b => 
      (b.bookingNumber === bookingNumber || b.id.toUpperCase().startsWith(bookingNumber.toUpperCase())) && 
      b.userName === bookerName && 
      b.userPhone === bookerPhone &&
      b.status !== 'cancelled'
    );
    
    if (booking) {
      setFoundBooking(booking);
      setShowNotFound(false);
    } else {
      setFoundBooking(null);
      setShowNotFound(true);
    }
  };

  const handleCancelBooking = async () => {
    if (!foundBooking) return;
    try {
      await dataService.updateBookingStatus(foundBooking.id, 'cancelled');
      setBookings(prev => prev.map(b => b.id === foundBooking.id ? { ...b, status: 'cancelled' } : b));
      setShowCancelConfirm(false);
      setFoundBooking(null);
      alert('예약이 취소되었습니다.');
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert('예약 취소 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="pt-32 md:pt-40 pb-24 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="mb-8 md:mb-10 text-center flex flex-col items-center gap-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase font-en">#RESERVATION</h1>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full max-w-md">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'book' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
          >
            <Ticket size={16} /> 예약하기
          </button>
          <button
            onClick={() => setActiveTab('check')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'check' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
          >
            <SearchCheck size={16} /> 예약확인/취소
          </button>
        </div>
      </div>

      {activeTab === 'book' ? (
        <>
          <div className="mb-6 flex flex-row items-center justify-between gap-2 w-full border-b border-white/10 pb-3">
            <div className="flex items-center justify-between md:justify-start gap-0 flex-1 whitespace-nowrap w-full">
              {/* Store Filter */}
              <div className="relative group flex-1 md:w-[150px] md:flex-none flex shrink-0 pr-2 md:pr-4">
                <div className="relative w-full flex items-center justify-between gap-1 md:gap-1.5 text-[12px] md:text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer">
                  <div className="flex items-center gap-1 md:gap-1.5 overflow-hidden">
                    <MapPin size={14} className="shrink-0" />
                    <span className="truncate">{selectedStoreId === 'all' ? '전체 매장' : stores.find(s => s.id === selectedStoreId)?.name}</span>
                  </div>
                  <div className="shrink-0 flex items-center justify-center w-4 h-4">
                    <ChevronDown size={12} className="opacity-50" />
                  </div>
                  <select 
                    value={selectedStoreId} 
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  >
                    <option value="all" className="bg-[#1a1a1a] text-white">전체 매장</option>
                    {stores.map((s, index) => (
                      <option key={`${s.id}-${index}`} value={s.id} className="bg-[#1a1a1a] text-white">{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="w-px h-3 bg-white/10 shrink-0" />

              {/* Date Filter */}
              <div className="relative group flex-1 md:w-[150px] md:flex-none flex shrink-0 px-2 md:px-4">
                <div className="relative w-full flex items-center justify-between gap-1 md:gap-1.5 text-[12px] md:text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer">
                  <div className="flex items-center gap-1 md:gap-1.5 overflow-hidden">
                    <CalendarIcon size={14} className="shrink-0" />
                    <span className="truncate">{selectedDate ? selectedDate.substring(2).replace(/-/g, '.') : '날짜 선택'}</span>
                  </div>
                  <div className="shrink-0 flex items-center justify-center w-4 h-4">
                    <ChevronDown size={12} className="opacity-50" />
                  </div>
                  <input 
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setSelectedDate(val);
                      } else {
                        const today = new Date();
                        const offset = today.getTimezoneOffset() * 60000;
                        setSelectedDate(new Date(today.getTime() - offset).toISOString().split('T')[0]);
                      }
                      setSelectedTime('');
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>

              <div className="w-px h-3 bg-white/10 shrink-0" />

              {/* Time Filter */}
              <div className="relative group flex-1 md:w-[150px] md:flex-none flex shrink-0 pl-2 md:pl-4">
                <div className="relative w-full flex items-center justify-between gap-1 md:gap-1.5 text-[12px] md:text-sm font-medium text-white/60 hover:text-white transition-colors cursor-pointer">
                  <div className="flex items-center gap-1 md:gap-1.5 overflow-hidden">
                    <Clock size={14} className="shrink-0" />
                    <span className="truncate">{selectedTime || '시간 선택'}</span>
                  </div>
                  <div className="shrink-0 flex items-center justify-center w-4 h-4">
                    <ChevronDown size={12} className="opacity-50" />
                  </div>
                  <select 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  >
                    {availableTimes.length === 0 ? (
                      <option value="" className="bg-[#1a1a1a] text-white">선택 가능한 시간 없음</option>
                    ) : (
                      <>
                        <option value="" className="bg-[#1a1a1a] text-white">시간 선택</option>
                        {availableTimes.map((time, index) => (
                          <option key={`${time}-${index}`} value={time} className="bg-[#1a1a1a] text-white">{time}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Sort Dropdown */}
            <div className="hidden md:block shrink-0 pl-6 border-l border-white/10">
              <div className="relative group flex items-center justify-end">
                <div className="relative flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/80 transition-colors cursor-pointer">
                  <ArrowUpDown size={12} />
                  <span>
                    {sortBy === 'latest' && '최신순'}
                    {sortBy === 'price' && '가격순'}
                    {sortBy === 'participants' && '참여인원순'}
                    {sortBy === 'duration' && '소요시간순'}
                    {sortBy === 'difficulty' && '난이도순'}
                    {sortBy === 'fear' && '공포도순'}
                  </span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value="latest" className="bg-[#1a1a1a] text-white">최신순</option>
                    <option value="price" className="bg-[#1a1a1a] text-white">가격순</option>
                    <option value="participants" className="bg-[#1a1a1a] text-white">참여인원순</option>
                    <option value="duration" className="bg-[#1a1a1a] text-white">소요시간순</option>
                    <option value="difficulty" className="bg-[#1a1a1a] text-white">난이도순</option>
                    <option value="fear" className="bg-[#1a1a1a] text-white">공포도순</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
            {filteredAndSortedThemes.length === 0 ? (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-32 text-center text-white/40 font-medium">
                테마 상품이 없습니다.
              </div>
            ) : (
              filteredAndSortedThemes.map((theme, index) => {
                const store = stores.find(s => s.id === theme.storeId);
              const now = new Date();
              const startDate = theme.startDate ? new Date(theme.startDate) : null;
              const endDate = theme.endDate ? new Date(theme.endDate) : null;
              
              now.setHours(0, 0, 0, 0);
              if (startDate) startDate.setHours(0, 0, 0, 0);
              if (endDate) endDate.setHours(0, 0, 0, 0);

              const mode = theme.futureDisplayMode || 'coming_soon';
              const isFuture = startDate && now < startDate;
              const isExpired = endDate && now > endDate;

              const isComingSoon = isExpired || (isFuture && mode === 'coming_soon');
              const isOpenFuture = isFuture && mode === 'open_calendar';

              const isDateAndTimeSelected = selectedDate && selectedTime;

              return (
                <div key={`${theme.id}-${index}`} className={`group flex flex-col mb-0 md:mb-0 ${isComingSoon ? 'opacity-60' : ''}`}>
                  <Link 
                    to={isComingSoon ? '#' : (isDateAndTimeSelected ? `/booking/${theme.id}/${selectedDate}/${selectedTime}` : `/theme/${theme.id}`)} 
                    className={`relative aspect-[2/3] overflow-hidden rounded-none md:rounded-2xl mb-0 md:mb-6 shadow-xl block ${isComingSoon ? 'cursor-default' : ''}`}
                    onClick={(e) => isComingSoon && e.preventDefault()}
                  >
                    <img 
                      src={(theme.posterUrl && !theme.posterUrl.startsWith('/theme')) ? theme.posterUrl : 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp'} 
                      alt={theme.title} 
                      className={`w-full h-full object-cover transition-transform duration-700 ${isComingSoon ? 'grayscale opacity-50' : 'group-hover:scale-110'}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp';
                        e.currentTarget.style.display = 'block';
                      }}
                    />
                    {isComingSoon && (
                      <div className="absolute inset-0 bg-black/20 z-10" />
                    )}
                    {isComingSoon && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <span className="text-2xl font-bold tracking-wider text-white font-en drop-shadow-lg">COMING SOON</span>
                      </div>
                    )}
                    {isOpenFuture && (
                      <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-[#dc2626] text-white font-extrabold text-[10px] md:text-xs px-2.5 py-1 rounded-md shadow-lg z-30 border border-red-500/30">
                        {theme.startDate} 오픈예정
                      </div>
                    )}
                    {!isComingSoon && (
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
                        <span className="text-white font-black text-xl tracking-normal uppercase font-en border-b-2 border-white pb-1">
                          {isDateAndTimeSelected ? '바로 예약' : '상세보기'}
                        </span>
                      </div>
                    )}
                  </Link>
                  
                  <div className="space-y-4 px-0 pb-6 pt-4 md:p-0">
                    <div className="flex flex-col gap-1">
                      {theme.storeId && store && (
                        <span className="text-white/40 text-xs font-medium uppercase tracking-normal">{store.name}</span>
                      )}
                      <h3 className="text-2xl font-bold group-hover:text-white transition-colors flex items-center gap-2">
                        {theme.title}
                      </h3>
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

                  <div className="pt-4 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center gap-1.5">
                        <Users size={14} /> {theme.minPlayers}-{theme.maxPlayers}명
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} /> {theme.duration}분
                      </span>
                    </div>
                    <Link 
                      to={isComingSoon ? '#' : `/theme/${theme.id}`} 
                      onClick={(e) => isComingSoon && e.preventDefault()}
                      className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all ${isComingSoon ? 'opacity-50 cursor-default' : 'group-hover:bg-white group-hover:text-black'}`}
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
              );
            }))}
          </div>
        </>
      ) : (
        <div className="max-w-xl mx-auto">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">예약 확인/취소</h2>
            
            <form onSubmit={handleCheckBooking} className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">예약 번호</label>
                <input
                  type="text"
                  required
                  value={bookingNumber}
                  onChange={(e) => setBookingNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="예약 번호를 입력해주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">예약자명</label>
                <input
                  type="text"
                  required
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="예약자명을 입력해주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">연락처</label>
                <input
                  type="tel"
                  required
                  value={bookerPhone}
                  onChange={(e) => setBookerPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="010-0000-0000"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 mt-6"
              >
                <Search size={18} />
                예약 조회하기
              </button>
            </form>

            {showNotFound && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm">예약된 내역이 없습니다. 예약정보를 확인하세요.</p>
              </div>
            )}

            {foundBooking && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-4">예약 상세 정보</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">테마명</span>
                    <span className="font-bold">{foundBooking.themeTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">예약일시</span>
                    <span className="font-bold">{foundBooking.date} {foundBooking.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">예약자명</span>
                    <span className="font-bold">{foundBooking.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">참여인원</span>
                    <span className="font-bold">{foundBooking.participantCount}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">결제금액</span>
                    <span className="font-bold">{foundBooking.totalPrice?.toLocaleString() || 0}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">예약상태</span>
                    <span className="font-bold text-emerald-400">예약완료</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full mt-6 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors"
                >
                  예약 취소/변경
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">예약 취소</h3>
              <button onClick={() => setShowCancelConfirm(false)} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-white/80 text-sm mb-6 leading-relaxed">
              예약을 취소하시겠습니까?<br/>
              예약 변경의 경우 취소 후 다시 예약하셔야 합니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 py-3 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-[#ef4444] transition-colors"
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeReservation;
