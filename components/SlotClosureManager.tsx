import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Theme, ClosedSlot, BookingData, Store } from '../types';
import { isWeekendOrHoliday } from '../src/utils/holiday';
import { 
  Calendar, Clock, Lock, Unlock, ChevronLeft, ChevronRight, 
  AlertTriangle, CheckCircle2, Info, Users, User, 
  ShieldAlert, List, Grid, Check
} from 'lucide-react';

interface SlotClosureManagerProps {
  themes: Theme[];
  stores: Store[];
  bookings: BookingData[];
  closedSlots: ClosedSlot[];
  onToggleClosure: (date: string, themeId: string, time: string) => void;
  onBatchCloseDate?: (date: string, themeId: string, timesToClose: string[]) => void;
  onBatchOpenDate?: (date: string, themeId: string) => void;
}

// Normalizes date string to YYYY-MM-DD format
const normalizeDate = (d?: string): string => {
  if (!d) return '';
  const clean = String(d).trim().replace(/[\.\/]/g, '-');
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return clean;
};

// Normalizes time string to HH:mm format
const normalizeTime = (t?: string): string => {
  if (!t) return '';
  const clean = String(t).trim();
  const parts = clean.split(':');
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    return `${h}:${m}`;
  }
  return clean;
};

// Helper to strictly check if a booking is cancelled
const isCancelledBooking = (b: BookingData): boolean => {
  if (!b) return false;
  if ((b as any).isCancelled === true || (b as any).is_cancelled === true || (b as any).deleted === true || (b as any).isDeleted === true) return true;
  const s = String(b.status || '').trim().toLowerCase();
  if (!s) return false;
  return (
    s === 'cancelled' || 
    s === 'canceled' || 
    s === 'cancel' || 
    s === 'refunded' || 
    s === 'refund' ||
    s === 'deleted' ||
    s.includes('취소') ||
    s.includes('환불')
  );
};

const isActiveBooking = (b: BookingData): boolean => {
  return !isCancelledBooking(b);
};

// Safely extract numeric participant count
const getPlayerCount = (b: BookingData): number => {
  if (!b) return 0;
  if (typeof b.participantCount === 'number') {
    return isNaN(b.participantCount) ? 0 : b.participantCount;
  }
  const clean = String(b.participantCount || '').replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
};

// Check if booking belongs to theme strictly
const isBookingForTheme = (b: BookingData, themeId?: string, themeTitle?: string): boolean => {
  if (!b) return false;
  // If b has themeId, match strictly by themeId
  if (b.themeId && themeId) {
    return String(b.themeId).trim() === String(themeId).trim();
  }
  // If b has no themeId, fallback to themeTitle
  if (b.themeTitle && themeTitle) {
    return b.themeTitle.trim().toLowerCase() === themeTitle.trim().toLowerCase();
  }
  return false;
};

export const SlotClosureManager: React.FC<SlotClosureManagerProps> = ({
  themes,
  stores,
  bookings,
  closedSlots,
  onToggleClosure,
  onBatchCloseDate,
  onBatchOpenDate
}) => {
  // Currently selected theme
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => themes[0]?.id || '');
  
  // Format today as YYYY-MM and YYYY-MM-DD
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  // Selected Month (YYYY-MM) and Selected Date (YYYY-MM-DD)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const slotSectionRef = useRef<HTMLDivElement>(null);

  // Warning Modal for when user tries to close a slot that has active bookings
  const [blockedModalInfo, setBlockedModalInfo] = useState<{
    time: string;
    date: string;
    themeTitle: string;
    bookings: BookingData[];
  } | null>(null);

  // Selected Theme object
  const currentTheme = useMemo(() => {
    return themes.find(t => t.id === selectedThemeId) || themes[0];
  }, [themes, selectedThemeId]);

  // Deduplicate and filter active bookings across the entire dataset
  const uniqueActiveBookings = useMemo(() => {
    const map = new Map<string, BookingData>();
    for (const b of bookings) {
      if (isActiveBooking(b)) {
        const key = b.id || `${b.userName}-${b.userPhone}-${normalizeDate(b.date)}-${normalizeTime(b.time)}`;
        map.set(key, b);
      }
    }
    return Array.from(map.values());
  }, [bookings]);

  // Available months based on current theme's operation period
  const availableMonths = useMemo(() => {
    if (!currentTheme) return [currentMonthStr];

    const monthsSet = new Set<string>();
    
    // Always include current month
    monthsSet.add(currentMonthStr);

    let start = currentTheme.startDate ? new Date(currentTheme.startDate) : new Date(today);
    let end = currentTheme.endDate ? new Date(currentTheme.endDate) : new Date(today);
    
    if (isNaN(start.getTime())) start = new Date(today);
    if (isNaN(end.getTime()) || end < start) {
      end = new Date(start);
      end.setMonth(end.getMonth() + 6);
    } else {
      const minEnd = new Date(today);
      minEnd.setMonth(minEnd.getMonth() + 3);
      if (end < minEnd) end = minEnd;
    }

    const iter = new Date(start.getFullYear(), start.getMonth(), 1);
    const endIter = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    while (iter <= endIter) {
      const ym = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(ym);
      iter.setMonth(iter.getMonth() + 1);
    }

    return Array.from(monthsSet).sort();
  }, [currentTheme, currentMonthStr, today]);

  // Ensure selectedMonth is valid when theme changes
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      if (availableMonths.includes(currentMonthStr)) {
        setSelectedMonth(currentMonthStr);
      } else {
        setSelectedMonth(availableMonths[0]);
      }
    }
  }, [availableMonths, currentMonthStr, selectedMonth]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const ym = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(ym);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const ym = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(ym);
  };

  // Days for the selected month
  const calendarDays = useMemo(() => {
    if (!selectedMonth) return [];
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0: Sunday, 1: Monday...
    const daysInMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Empty lead slots for aligning with Sunday
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ isEmpty: true, key: `empty-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      dateObj.setHours(0, 0, 0, 0);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = dateObj < today;
      const isWeekend = isWeekendOrHoliday(dateObj);

      // Check if date is within theme's operation period
      let isOutOfRange = false;
      if (currentTheme?.startDate) {
        const start = new Date(currentTheme.startDate);
        start.setHours(0, 0, 0, 0);
        if (dateObj < start) isOutOfRange = true;
      }
      if (currentTheme?.endDate) {
        const end = new Date(currentTheme.endDate);
        end.setHours(0, 0, 0, 0);
        if (dateObj > end) isOutOfRange = true;
      }

      // Determine time slots for this date
      let slots: string[] = [];
      if (currentTheme) {
        if (currentTheme.useSeparateWeekdaySlots) {
          slots = isWeekend ? (currentTheme.customSlots || []) : (currentTheme.weekdaySlots || []);
        } else {
          slots = currentTheme.customSlots || [];
        }
      }
      const validSlots = slots.map(normalizeTime).filter(Boolean);

      // Closed slots on this day
      const dayClosed = closedSlots.filter(
        cs => cs.themeId === currentTheme?.id && cs.date === dateStr && (cs.time === 'all' || validSlots.includes(normalizeTime(cs.time)))
      );

      // Active bookings on this day (strictly exclude cancelled bookings & normalize dates)
      const dayBookings = uniqueActiveBookings.filter(
        b => isBookingForTheme(b, currentTheme?.id, currentTheme?.title) && normalizeDate(b.date) === dateStr
      );

      const totalBookedPlayers = dayBookings.reduce((sum, b) => sum + getPlayerCount(b), 0);
      const isFullyClosed = validSlots.length > 0 && dayClosed.length >= validSlots.length;
      const isPartiallyClosed = dayClosed.length > 0 && !isFullyClosed;

      days.push({
        isEmpty: false,
        key: dateStr,
        dayNumber: d,
        dateStr,
        dateObj,
        isToday: dateStr === todayStr,
        isPast,
        isWeekend,
        dayOfWeek: dateObj.getDay(), // 0: Sun, 6: Sat
        isOutOfRange,
        totalSlots: validSlots.length,
        closedCount: dayClosed.length,
        isFullyClosed,
        isPartiallyClosed,
        hasBookings: dayBookings.length > 0,
        bookingCount: dayBookings.length,
        totalBookedPlayers,
        validSlots,
        dayBookings
      });
    }

    return days;
  }, [selectedMonth, today, currentTheme, closedSlots, uniqueActiveBookings, todayStr]);

  // Selected date info & slots
  const selectedDateData = useMemo(() => {
    if (!selectedDate || !currentTheme) return null;

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setHours(0, 0, 0, 0);
    const isWeekend = isWeekendOrHoliday(dateObj);

    let baseSlots: string[] = [];
    if (currentTheme.useSeparateWeekdaySlots) {
      baseSlots = isWeekend ? (currentTheme.customSlots || []) : (currentTheme.weekdaySlots || []);
    } else {
      baseSlots = currentTheme.customSlots || [];
    }
    const validSlots = Array.from(new Set(baseSlots.map(normalizeTime).filter(Boolean)));

    // Find all active bookings for this specific date and theme
    const dayAllBookings = uniqueActiveBookings.filter(
      b => isBookingForTheme(b, currentTheme.id, currentTheme.title) && 
           normalizeDate(b.date) === selectedDate
    );

    // Also detect any bookings on non-standard time slots so nothing is hidden
    const extraTimes = dayAllBookings
      .map(b => normalizeTime(b.time))
      .filter(t => t && !validSlots.includes(t));
    const allSlotTimes = Array.from(new Set([...validSlots, ...extraTimes])).sort();

    const slotDetails = allSlotTimes.map(time => {
      const isClosed = closedSlots.some(
        cs => cs.themeId === currentTheme.id && cs.date === selectedDate && (cs.time === 'all' || normalizeTime(cs.time) === time)
      );

      const activeBookings = dayAllBookings.filter(
        b => normalizeTime(b.time) === time
      );

      const bookedPlayers = activeBookings.reduce((sum, b) => sum + getPlayerCount(b), 0);
      const isCloseRequested = activeBookings.some(b => b.isCloseRequested);
      const isExtraSlot = !validSlots.includes(time);

      return {
        time,
        isClosed,
        hasBooking: activeBookings.length > 0,
        activeBookings,
        bookedPlayers,
        isCloseRequested,
        isExtraSlot,
        maxPlayers: currentTheme.maxPlayers || 6
      };
    });

    const totalDayBookings = dayAllBookings.length;
    const totalDayPlayers = dayAllBookings.reduce((sum, b) => sum + getPlayerCount(b), 0);

    return {
      dateStr: selectedDate,
      dateObj,
      isWeekend,
      slots: slotDetails,
      dayAllBookings,
      totalDayBookings,
      totalDayPlayers
    };
  }, [selectedDate, currentTheme, closedSlots, uniqueActiveBookings]);

  // Handle slot single click toggle
  const handleSlotClick = (time: string, isClosed: boolean, activeBookings: BookingData[]) => {
    if (!currentTheme) return;

    // Safety guard: if slot has active bookings and user tries to close it
    if (!isClosed && activeBookings.length > 0) {
      setBlockedModalInfo({
        time,
        date: selectedDate,
        themeTitle: currentTheme.title,
        bookings: activeBookings
      });
      return;
    }

    onToggleClosure(selectedDate, currentTheme.id, time);
  };

  // Batch Close empty slots on selected date
  const handleBatchClose = () => {
    if (!selectedDateData || !currentTheme) return;

    const emptySlotsToClose = selectedDateData.slots
      .filter(s => !s.isClosed && !s.hasBooking)
      .map(s => s.time);

    if (emptySlotsToClose.length === 0) {
      alert('마감할 수 있는 비어있는(예약 없는) 타임이 없습니다.');
      return;
    }

    if (onBatchCloseDate) {
      onBatchCloseDate(selectedDate, currentTheme.id, emptySlotsToClose);
    } else {
      emptySlotsToClose.forEach(time => {
        onToggleClosure(selectedDate, currentTheme.id, time);
      });
    }
  };

  // Batch Open all slots on selected date
  const handleBatchOpen = () => {
    if (!selectedDateData || !currentTheme) return;

    const closedSlotsToOpen = selectedDateData.slots
      .filter(s => s.isClosed)
      .map(s => s.time);

    if (closedSlotsToOpen.length === 0) {
      alert('마감 처리된 타임이 없습니다.');
      return;
    }

    if (onBatchOpenDate) {
      onBatchOpenDate(selectedDate, currentTheme.id);
    } else {
      closedSlotsToOpen.forEach(time => {
        onToggleClosure(selectedDate, currentTheme.id, time);
      });
    }
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (window.innerWidth < 768 && slotSectionRef.current) {
      setTimeout(() => {
        slotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Total summary for current month
  const totalMonthBookingsCount = useMemo(() => {
    return calendarDays.reduce((sum, d) => sum + (d.isEmpty ? 0 : (d.bookingCount || 0)), 0);
  }, [calendarDays]);

  const totalMonthPlayersCount = useMemo(() => {
    return calendarDays.reduce((sum, d) => sum + (d.isEmpty ? 0 : (d.totalBookedPlayers || 0)), 0);
  }, [calendarDays]);

  return (
    <div className="space-y-6 pt-8 border-t border-white/5">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
              Operation Control
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              특정 일자 / 시간 마감 설정
            </h2>
          </div>
          <p className="text-xs md:text-sm text-white/50 mt-1 flex items-center gap-1.5">
            <Info size={14} className="text-white/40 shrink-0" />
            선택한 테마의 월·일별 시간대를 마감(CLOSED)하거나 다시 오픈할 수 있습니다.
          </p>
        </div>

        {/* Total Month Summary Badge */}
        <div className="flex items-center gap-3 bg-white/5 px-3.5 py-2 rounded-2xl border border-white/10 text-xs self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-white/60">이번달 유효 예약:</span>
            <span className="font-bold text-white">{totalMonthBookingsCount}건 ({totalMonthPlayersCount}명)</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-[#141414] p-4 sm:p-6 rounded-3xl border border-white/10 space-y-6">
        
        {/* 1. Theme Selector */}
        <div>
          <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2.5">
            1. 마감 관리할 테마 선택
          </label>

          {/* Theme Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {themes.map((theme) => {
              const isSelected = theme.id === selectedThemeId;
              const store = stores.find(s => s.id === theme.storeId);
              const themeClosedCount = closedSlots.filter(cs => cs.themeId === theme.id).length;
              const themeActiveBookings = uniqueActiveBookings.filter(b => isBookingForTheme(b, theme.id, theme.title));
              const themeBookingCount = themeActiveBookings.length;
              const themePlayersCount = themeActiveBookings.reduce((sum, b) => sum + (Number(b.participantCount) || 0), 0);

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500/50 text-white shadow-lg'
                      : 'bg-black/40 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm truncate">
                      {theme.title}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-white/40 truncate mt-0.5">
                      {store ? store.name : '기본 매장'} · 정원 {theme.maxPlayers}명
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                    {themeClosedCount > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold leading-none">
                        마감 {themeClosedCount}
                      </span>
                    )}
                    {themeBookingCount > 0 ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold leading-none">
                        예약 {themeBookingCount}건 ({themePlayersCount}명)
                      </span>
                    ) : (
                      <span className="text-[9px] text-white/30 leading-none">예약 없음</span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Month Selector & View Controls */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} /> 2. 월 선택 및 일자별 마감 현황
              </label>
              <p className="text-xs text-white/40 mt-0.5">
                날짜를 클릭하면 하단에서 시간대별 상세 마감/오픈을 설정할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              {/* View Switcher on Mobile/Desktop */}
              <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'calendar' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                  }`}
                  title="달력 뷰"
                >
                  <Grid size={14} />
                  <span className="hidden sm:inline">달력</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'list' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                  }`}
                  title="목록 뷰"
                >
                  <List size={14} />
                  <span className="hidden sm:inline">목록</span>
                </button>
              </div>

              {/* Month Quick Nav */}
              <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                  title="이전 달"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-2 font-bold text-xs sm:text-sm text-white tracking-wide whitespace-nowrap">
                  {(() => {
                    const [y, m] = selectedMonth.split('-');
                    return `${y}년 ${parseInt(m)}월`;
                  })()}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                  title="다음 달"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Month Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1 overflow-x-auto pb-1">
            {availableMonths.map((ym) => {
              const [y, m] = ym.split('-');
              const isSelected = ym === selectedMonth;
              const isCurrent = ym === currentMonthStr;

              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => setSelectedMonth(ym)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-black shadow-md'
                      : 'bg-black/40 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span>{y}.{m}월</span>
                  {isCurrent && (
                    <span className={`text-[8px] px-1 py-0.2 rounded font-normal ${isSelected ? 'bg-black/20 text-black' : 'bg-red-500/30 text-red-300'}`}>
                      현재
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <div className="bg-black/50 rounded-2xl border border-white/10 p-2 sm:p-4 overflow-hidden">
              {/* Weekdays Header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                  <div 
                    key={w} 
                    className={`text-[11px] sm:text-xs font-bold py-1 ${
                      idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-white/40'
                    }`}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarDays.map((d) => {
                  if (d.isEmpty) {
                    return <div key={d.key} className="h-16 sm:h-20 md:h-24 rounded-xl bg-transparent" />;
                  }

                  const isSelected = d.dateStr === selectedDate;
                  const isSun = d.dayOfWeek === 0;
                  const isSat = d.dayOfWeek === 6;

                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => handleSelectDate(d.dateStr!)}
                      className={`h-16 sm:h-20 md:h-24 p-1 sm:p-1.5 md:p-2 rounded-xl border text-left flex flex-col justify-between transition-all relative group ${
                        isSelected
                          ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/50 z-10 shadow-lg'
                          : d.isOutOfRange || d.isPast
                          ? 'bg-white/[0.02] border-white/5 opacity-50 hover:opacity-80'
                          : 'bg-[#1e1e1e] border-white/5 hover:border-white/20 hover:bg-[#252525]'
                      }`}
                    >
                      {/* Date Number and Today Badge */}
                      <div className="flex items-start justify-between w-full">
                        <span className={`text-xs sm:text-sm font-bold leading-none ${
                          isSelected 
                            ? 'text-white font-extrabold' 
                            : isSun 
                            ? 'text-red-400' 
                            : isSat 
                            ? 'text-blue-400' 
                            : 'text-white/80'
                        }`}>
                          {d.dayNumber}
                        </span>

                        {d.isToday && (
                          <span className="text-[8px] sm:text-[9px] px-1 py-0.2 bg-red-500 text-white rounded font-bold leading-none">
                            오늘
                          </span>
                        )}
                      </div>

                      {/* Status Info in Day Cell */}
                      <div className="space-y-0.5 w-full">
                        {/* Fully Closed */}
                        {d.isFullyClosed && (
                          <div className="text-[8px] sm:text-[10px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-bold flex items-center justify-center gap-0.5 border border-red-500/30 leading-tight">
                            <Lock size={8} className="shrink-0" />
                            <span className="hidden sm:inline">전시간 마감</span>
                            <span className="sm:hidden">전마감</span>
                          </div>
                        )}

                        {/* Partially Closed */}
                        {d.isPartiallyClosed && (
                          <div className="text-[8px] sm:text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium flex items-center justify-center gap-0.5 border border-amber-500/30 leading-tight">
                            <Lock size={8} className="shrink-0" />
                            <span className="hidden sm:inline">{d.closedCount}타임 마감</span>
                            <span className="sm:hidden">{d.closedCount}T 마감</span>
                          </div>
                        )}

                        {/* Active Bookings badge: clear on mobile with clean wrap and desktop */}
                        {d.hasBookings && (
                          <div className="text-[8px] sm:text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold flex flex-col sm:flex-row items-center justify-center sm:gap-1 border border-blue-500/30 leading-tight">
                            <div className="flex items-center gap-0.5">
                              <Users size={8} className="shrink-0 text-blue-400 hidden sm:inline" />
                              <span>{d.bookingCount}건</span>
                            </div>
                            <span className="text-[7.5px] sm:text-[9px] text-blue-300 sm:text-blue-300">
                              ({d.totalBookedPlayers}명)
                            </span>
                          </div>
                        )}

                        {!d.isFullyClosed && !d.isPartiallyClosed && !d.hasBookings && (
                          <div className="hidden sm:block text-[8px] md:text-[9px] text-white/20 text-center truncate">
                            오픈({d.totalSlots}T)
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIST VIEW (Especially great on mobile for rapid scanning) */}
          {viewMode === 'list' && (
            <div className="bg-black/50 rounded-2xl border border-white/10 p-3 space-y-2 max-h-[480px] overflow-y-auto">
              {calendarDays.filter(d => !d.isEmpty).map(d => {
                const isSelected = d.dateStr === selectedDate;
                const isSun = d.dayOfWeek === 0;
                const isSat = d.dayOfWeek === 6;
                const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.dayOfWeek || 0];

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => handleSelectDate(d.dateStr!)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? 'bg-red-950/50 border-red-500 ring-1 ring-red-500 text-white'
                        : 'bg-[#1a1a1a] border-white/5 hover:border-white/20 text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-12 ${isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-white'}`}>
                        {d.dayNumber}일 ({dayName})
                      </span>
                      {d.isToday && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-500 text-white rounded font-bold">
                          오늘
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {d.isFullyClosed ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30 flex items-center gap-1">
                          <Lock size={10} /> 전시간 마감
                        </span>
                      ) : d.isPartiallyClosed ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 flex items-center gap-1">
                          <Lock size={10} /> {d.closedCount}타임 마감
                        </span>
                      ) : null}

                      {d.hasBookings ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 flex items-center gap-1">
                          <Users size={10} /> {d.bookingCount}건 ({d.totalBookedPlayers}명)
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/30">예약 없음</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Selected Date Time Slot Control Panel */}
        {selectedDateData && (
          <div ref={slotSectionRef} className="space-y-4 pt-6 border-t border-white/10 bg-black/40 p-4 sm:p-6 rounded-2xl border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white/80">
                    3. 타임별 마감 관리
                  </span>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-1.5">
                    <Calendar size={16} className="text-red-500 shrink-0" />
                    {(() => {
                      const [y, m, d] = selectedDateData.dateStr.split('-');
                      const dayName = ['일', '월', '화', '수', '목', '금', '토'][selectedDateData.dateObj.getDay()];
                      return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일 (${dayName}요일)`;
                    })()}
                  </h3>
                  {selectedDateData.isWeekend ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                      주말/공휴일
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-bold">
                      평일
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-white/60 flex-wrap">
                  <span>총 슬롯: <strong>{selectedDateData.slots.length}개</strong></span>
                  <span>·</span>
                  <span className="text-blue-400 font-bold">
                    실제 예약: {selectedDateData.totalDayBookings}건 ({selectedDateData.totalDayPlayers}명)
                  </span>
                  <span>·</span>
                  <span className="text-red-400 font-bold">
                    마감 슬롯: {selectedDateData.slots.filter(s => s.isClosed).length}개
                  </span>
                </div>
              </div>

              {/* Batch Actions */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleBatchClose}
                  className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Lock size={13} /> 빈 타임 전체 마감
                </button>
                <button
                  type="button"
                  onClick={handleBatchOpen}
                  className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Unlock size={13} /> 전체 마감 해제
                </button>
              </div>
            </div>

            {/* Slots Grid */}
            {selectedDateData.slots.length === 0 ? (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 text-white/40 text-sm">
                설정된 시간표(타임 슬롯)가 없습니다. [테마 및 상품 관리]에서 슬롯을 등록해 주세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedDateData.slots.map((slot) => {
                  const { time, isClosed, hasBooking, activeBookings, bookedPlayers, isCloseRequested, isExtraSlot, maxPlayers } = slot;

                  return (
                    <div
                      key={time}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 relative ${
                        isClosed
                          ? 'bg-red-950/30 border-red-500/40 shadow-inner'
                          : hasBooking
                          ? 'bg-blue-950/30 border-blue-500/40'
                          : 'bg-[#1f1f1f] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Top Time */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className={isClosed ? 'text-red-400' : hasBooking ? 'text-blue-400' : 'text-white/60'} />
                          <span className="text-base sm:text-lg font-black text-white">{time}</span>
                          {isExtraSlot && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                              별도 시간대
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Info: Booking Details or Closure Notice */}
                      <div className="min-h-[50px] bg-black/40 p-2.5 rounded-xl border border-white/5 text-xs space-y-1.5">
                        {hasBooking ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-blue-300 font-bold">
                              <span>예약 {bookedPlayers}명 / 정원 {maxPlayers}명</span>
                              {isCloseRequested && (
                                <span className="text-[9px] px-1 bg-red-500 text-white rounded font-bold animate-pulse">마감 요청</span>
                              )}
                            </div>
                            <div className="text-white/70 text-[11px] space-y-1 pt-1 border-t border-white/5">
                              {activeBookings.map((b, idx) => (
                                <div key={b.id || idx} className="flex items-center justify-between gap-1">
                                  <span className="truncate flex items-center gap-1 text-white font-medium">
                                    <User size={10} className="text-white/40" /> {b.userName} ({getPlayerCount(b)}명)
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${b.status === 'paid' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                    {b.status === 'paid' ? '결제완료' : '예약완료'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : isClosed ? (
                          <div className="text-red-400/80 text-[11px] flex items-center gap-1.5 h-full py-1">
                            <Lock size={12} className="shrink-0" />
                            <span>관리자에 의해 마감 처리된 슬롯입니다.</span>
                          </div>
                        ) : (
                          <div className="text-white/40 text-[11px] flex items-center gap-1.5 h-full py-1">
                            <Check size={12} className="text-emerald-400 shrink-0" />
                            <span>현재 고객이 예약 신청할 수 있습니다.</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div>
                        {hasBooking ? (
                          <button
                            type="button"
                            onClick={() => handleSlotClick(time, isClosed, activeBookings)}
                            className="w-full py-2.5 rounded-xl bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90"
                            title="고객 예약이 존재하므로 마감할 수 없습니다"
                          >
                            <ShieldAlert size={14} className="text-blue-400" />
                            <span>예약 있음 (마감 불가)</span>
                          </button>
                        ) : isClosed ? (
                          <button
                            type="button"
                            onClick={() => handleSlotClick(time, isClosed, activeBookings)}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                          >
                            <Unlock size={14} />
                            <span>마감 해제하기 (오픈)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSlotClick(time, isClosed, activeBookings)}
                            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                          >
                            <Lock size={14} />
                            <span>이 타임 마감하기</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Safety Modal: When user tries to close an actively booked slot */}
      {blockedModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1f1f1f] border border-red-500/40 rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">마감 처리 불가 안내</h3>
                <p className="text-xs text-red-400">이미 확정된 고객 예약이 있습니다.</p>
              </div>
            </div>

            <div className="space-y-3 bg-black/50 p-3.5 rounded-2xl border border-white/5 text-sm">
              <div className="flex justify-between text-xs text-white/50 pb-2 border-b border-white/5">
                <span>테마 / 일시</span>
                <span className="font-bold text-white">{blockedModalInfo.themeTitle} · {blockedModalInfo.date} {blockedModalInfo.time}</span>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-blue-400 block">현재 예약자 정보</span>
                {blockedModalInfo.bookings.map((b, i) => (
                  <div key={b.id || i} className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{b.userName} ({b.participantCount}명)</p>
                      <p className="text-white/40 text-[11px]">{b.userPhone}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${b.status === 'paid' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                      {b.status === 'paid' ? '결제 완료' : '예약 완료'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              ⚠️ 고객 예약이 존재하는 타임은 고객 피해 방지를 위해 즉시 마감할 수 없습니다. 
              마감이 꼭 필요한 경우, 상단 <strong>[예약 현황]</strong> 탭에서 먼저 고객에게 연락 후 예약을 취소하거나 일정을 변경해 주세요.
            </p>

            <button
              type="button"
              onClick={() => setBlockedModalInfo(null)}
              className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-all shadow-lg"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
