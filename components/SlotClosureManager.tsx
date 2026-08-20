import React, { useState, useMemo, useEffect } from 'react';
import { Theme, ClosedSlot, BookingData, Store } from '../types';
import { isWeekendOrHoliday } from '../src/utils/holiday';
import { 
  Calendar, Clock, Lock, Unlock, ChevronLeft, ChevronRight, 
  AlertTriangle, CheckCircle2, XCircle, Info, Users, User, 
  Phone, Check, ShieldAlert, Sparkles, Filter
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
      // If no end date or invalid, provide up to 6 months from start
      end = new Date(start);
      end.setMonth(end.getMonth() + 6);
    } else {
      // Extend at least 3 months if range is too narrow
      const minEnd = new Date(today);
      minEnd.setMonth(minEnd.getMonth() + 3);
      if (end < minEnd) end = minEnd;
    }

    // Add all months between start and end
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
      const validSlots = slots.filter(Boolean);

      // Closed slots on this day
      const dayClosed = closedSlots.filter(
        cs => cs.themeId === currentTheme?.id && cs.date === dateStr && (cs.time === 'all' || validSlots.includes(cs.time))
      );

      // Active bookings on this day
      const dayBookings = bookings.filter(
        b => b.themeId === currentTheme?.id && b.date === dateStr && b.status !== 'cancelled'
      );

      const totalBookedPlayers = dayBookings.reduce((sum, b) => sum + b.participantCount, 0);
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
        validSlots
      });
    }

    return days;
  }, [selectedMonth, today, currentTheme, closedSlots, bookings, todayStr]);

  // Selected date info & slots
  const selectedDateData = useMemo(() => {
    if (!selectedDate || !currentTheme) return null;

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setHours(0, 0, 0, 0);
    const isWeekend = isWeekendOrHoliday(dateObj);

    let slots: string[] = [];
    if (currentTheme.useSeparateWeekdaySlots) {
      slots = isWeekend ? (currentTheme.customSlots || []) : (currentTheme.weekdaySlots || []);
    } else {
      slots = currentTheme.customSlots || [];
    }
    const validSlots = slots.filter(Boolean);

    const slotDetails = validSlots.map(time => {
      const isClosed = closedSlots.some(
        cs => cs.themeId === currentTheme.id && cs.date === selectedDate && (cs.time === 'all' || cs.time === time)
      );

      const activeBookings = bookings.filter(
        b => b.themeId === currentTheme.id && b.date === selectedDate && b.time === time && b.status !== 'cancelled'
      );

      const bookedPlayers = activeBookings.reduce((sum, b) => sum + b.participantCount, 0);
      const isCloseRequested = activeBookings.some(b => b.isCloseRequested);

      return {
        time,
        isClosed,
        hasBooking: activeBookings.length > 0,
        activeBookings,
        bookedPlayers,
        isCloseRequested,
        maxPlayers: currentTheme.maxPlayers
      };
    });

    return {
      dateStr: selectedDate,
      dateObj,
      isWeekend,
      slots: slotDetails,
      totalSlots: validSlots.length,
      closedCount: slotDetails.filter(s => s.isClosed).length,
      bookedCount: slotDetails.filter(s => s.hasBooking).length
    };
  }, [selectedDate, currentTheme, closedSlots, bookings]);

  // Handle slot click
  const handleSlotClick = (time: string, isClosed: boolean, activeBookings: BookingData[]) => {
    if (!currentTheme) return;

    // If attempting to close a slot that already has active bookings, block and show warning
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

  // Batch close all available slots (that do not have active bookings)
  const handleBatchClose = () => {
    if (!selectedDateData || !currentTheme || !onBatchCloseDate) return;

    const unbookedTimes = selectedDateData.slots
      .filter(s => !s.hasBooking)
      .map(s => s.time);

    if (unbookedTimes.length === 0) {
      alert("모든 타임에 고객 예약이 잡혀 있어 마감할 수 있는 빈 타임이 없습니다.");
      return;
    }

    const bookedCount = selectedDateData.slots.filter(s => s.hasBooking).length;
    if (bookedCount > 0) {
      if (!confirm(`이 날짜의 ${bookedCount}개 타임에는 고객 예약이 있어 제외하고, 나머지 ${unbookedTimes.length}개 빈 타임만 마감 처리합니다. 진행하시겠습니까?`)) {
        return;
      }
    }

    onBatchCloseDate(selectedDate, currentTheme.id, unbookedTimes);
  };

  // Batch open all slots for this day
  const handleBatchOpen = () => {
    if (!selectedDateData || !currentTheme || !onBatchOpenDate) return;
    onBatchOpenDate(selectedDate, currentTheme.id);
  };

  // Total closed slots count across selected month for badge
  const totalMonthClosedCount = useMemo(() => {
    return calendarDays.reduce((sum, d) => sum + (d.isEmpty ? 0 : (d.closedCount || 0)), 0);
  }, [calendarDays]);

  const totalMonthBookingsCount = useMemo(() => {
    return calendarDays.reduce((sum, d) => sum + (d.isEmpty ? 0 : (d.bookingCount || 0)), 0);
  }, [calendarDays]);

  return (
    <div className="space-y-8 pt-12 border-t border-white/5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="text-red-500" size={24} />
              특정 일자 / 시간 마감 설정
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
              실시간 예약 연동
            </span>
          </div>
          <p className="text-sm text-white/50 mt-1 flex items-center gap-1.5">
            <Info size={14} className="text-white/40" />
            테마 운영 기간 내에서 월·일별로 원하는 시간대를 마감(CLOSED)하거나 다시 오픈할 수 있습니다.
          </p>
        </div>

        {/* Global summary pill */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/10 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-white/60">이번달 마감:</span>
            <span className="font-bold text-white">{totalMonthClosedCount}건</span>
          </div>
          <div className="w-[1px] h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-white/60">이번달 예약:</span>
            <span className="font-bold text-white">{totalMonthBookingsCount}건</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 p-6 md:p-8 space-y-8 shadow-2xl">
        
        {/* 1. Theme Selector Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} /> 1. 테마 선택
            </label>
            {currentTheme && (
              <span className="text-xs text-white/40">
                운영 기간: {currentTheme.startDate || '상시'} ~ {currentTheme.endDate || '상시'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {themes.map((theme) => {
              const isSelected = theme.id === selectedThemeId;
              const store = stores.find(s => s.id === theme.storeId);
              const themeClosedCount = closedSlots.filter(cs => cs.themeId === theme.id).length;
              const themeBookingCount = bookings.filter(b => b.themeId === theme.id && b.status !== 'cancelled').length;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setSelectedThemeId(theme.id);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500 text-white shadow-lg shadow-red-950/30'
                      : 'bg-black/40 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
                  }`}
                >
                  {theme.posterUrl ? (
                    <img 
                      src={theme.posterUrl} 
                      alt={theme.title} 
                      className="w-12 h-14 object-cover rounded-lg border border-white/10 shrink-0" 
                    />
                  ) : (
                    <div className="w-12 h-14 bg-black rounded-lg border border-white/10 flex items-center justify-center text-[10px] text-white/30 shrink-0">
                      NO IMG
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm truncate">{theme.title}</span>
                    </div>
                    <div className="text-[11px] text-white/40 truncate">
                      {store ? store.name : '기본 매장'} · {theme.maxPlayers}인
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {themeClosedCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-semibold">
                          마감 {themeClosedCount}
                        </span>
                      )}
                      {themeBookingCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-semibold">
                          예약 {themeBookingCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Month Selector & Calendar Header */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} /> 2. 월 선택 및 일자별 마감 현황
              </label>
              <p className="text-xs text-white/40 mt-0.5">
                원하는 날짜를 클릭하면 해당 일자의 시간대별 상세 마감/오픈을 설정할 수 있습니다.
              </p>
            </div>

            {/* Month Quick Nav */}
            <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                title="이전 달"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="px-3 font-bold text-sm text-white tracking-wide">
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
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Quick Month Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {availableMonths.map((ym) => {
              const [y, m] = ym.split('-');
              const isSelected = ym === selectedMonth;
              const isCurrent = ym === currentMonthStr;

              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => setSelectedMonth(ym)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-black shadow-md scale-105'
                      : 'bg-black/40 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span>{y}.{m}월</span>
                  {isCurrent && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-normal ${isSelected ? 'bg-black/20 text-black' : 'bg-red-500/30 text-red-300'}`}>
                      현재
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Monthly Calendar Grid */}
          <div className="bg-black/50 rounded-2xl border border-white/10 p-4 overflow-hidden">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                <div 
                  key={w} 
                  className={`text-xs font-bold py-1.5 ${
                    idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-white/40'
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((d) => {
                if (d.isEmpty) {
                  return <div key={d.key} className="h-20 md:h-24 rounded-xl bg-transparent" />;
                }

                const isSelected = d.dateStr === selectedDate;
                const isSun = d.dayOfWeek === 0;
                const isSat = d.dayOfWeek === 6;

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr!)}
                    className={`h-20 md:h-24 p-1.5 md:p-2 rounded-xl border text-left flex flex-col justify-between transition-all relative group ${
                      isSelected
                        ? 'bg-red-950/50 border-red-500 ring-2 ring-red-500/50 z-10'
                        : d.isOutOfRange || d.isPast
                        ? 'bg-white/[0.02] border-white/5 opacity-50 hover:opacity-80'
                        : 'bg-[#1e1e1e] border-white/5 hover:border-white/20 hover:bg-[#252525]'
                    }`}
                  >
                    {/* Date Number and Badges */}
                    <div className="flex items-start justify-between w-full">
                      <span className={`text-xs md:text-sm font-bold ${
                        isSelected 
                          ? 'text-white' 
                          : isSun 
                          ? 'text-red-400' 
                          : isSat 
                          ? 'text-blue-400' 
                          : 'text-white/80'
                      }`}>
                        {d.dayNumber}
                      </span>

                      {d.isToday && (
                        <span className="text-[9px] px-1 py-0.2 bg-red-500 text-white rounded font-bold">
                          오늘
                        </span>
                      )}
                    </div>

                    {/* Status Info in Day Cell */}
                    <div className="space-y-0.5 w-full">
                      {d.isFullyClosed && (
                        <div className="text-[10px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-bold flex items-center justify-center gap-1 border border-red-500/30 truncate">
                          <Lock size={10} /> 전시간 마감
                        </div>
                      )}

                      {d.isPartiallyClosed && (
                        <div className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium flex items-center justify-center gap-0.5 border border-amber-500/30 truncate">
                          <Lock size={9} /> {d.closedCount}타임 마감
                        </div>
                      )}

                      {d.hasBookings && (
                        <div className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium flex items-center justify-center gap-0.5 border border-blue-500/30 truncate">
                          <Users size={9} /> 예약 {d.bookingCount}건 ({d.totalBookedPlayers}명)
                        </div>
                      )}

                      {!d.isFullyClosed && !d.isPartiallyClosed && !d.hasBookings && (
                        <div className="text-[9px] text-white/20 text-center truncate">
                          전체 오픈 ({d.totalSlots}T)
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Selected Date Time Slot Control Panel */}
        {selectedDateData && (
          <div className="space-y-5 pt-6 border-t border-white/10 bg-black/40 p-6 rounded-2xl border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white/80">
                    3. 타임별 마감 관리
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <Calendar size={18} className="text-red-500" />
                    {(() => {
                      const [y, m, d] = selectedDateData.dateStr.split('-');
                      const dayName = ['일', '월', '화', '수', '목', '금', '토'][selectedDateData.dateObj.getDay()];
                      return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일 (${dayName}요일)`;
                    })()}
                  </h3>
                  {selectedDateData.isWeekend ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                      주말/공휴일 타임
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-bold">
                      평일 타임
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1">
                  타임 카드를 클릭하여 <span className="text-red-400 font-bold">마감(CLOSED)</span> 또는 <span className="text-emerald-400 font-bold">오픈(OPEN)</span> 상태로 전환하세요.
                  (예약된 고객이 있는 타임은 마감할 수 없습니다)
                </p>
              </div>

              {/* Batch Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBatchClose}
                  className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Lock size={14} /> 예약 없는 타임 전체 마감
                </button>
                <button
                  type="button"
                  onClick={handleBatchOpen}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Unlock size={14} /> 전체 마감 해제 (오픈)
                </button>
              </div>
            </div>

            {/* Slots Grid */}
            {selectedDateData.slots.length === 0 ? (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 text-white/40 text-sm">
                설정된 시간표(타임 슬롯)가 없습니다. [테마 및 상품 관리]에서 슬롯을 등록해 주세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedDateData.slots.map((slot) => {
                  const { time, isClosed, hasBooking, activeBookings, bookedPlayers, isCloseRequested, maxPlayers } = slot;

                  return (
                    <div
                      key={time}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative ${
                        isClosed
                          ? 'bg-red-950/30 border-red-500/40 shadow-inner'
                          : hasBooking
                          ? 'bg-blue-950/30 border-blue-500/40'
                          : 'bg-[#1f1f1f] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Top Time and Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className={isClosed ? 'text-red-400' : hasBooking ? 'text-blue-400' : 'text-white/60'} />
                          <span className="text-lg font-black text-white">{time}</span>
                        </div>

                        {/* Status Label */}
                        {isClosed ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold flex items-center gap-1">
                            <Lock size={10} /> CLOSED (마감)
                          </span>
                        ) : hasBooking ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold flex items-center gap-1">
                            <Users size={10} /> 예약 진행중
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                            <CheckCircle2 size={10} /> OPEN (예약 가능)
                          </span>
                        )}
                      </div>

                      {/* Middle Info: Booking Details or Closure Notice */}
                      <div className="min-h-[52px] bg-black/40 p-2.5 rounded-xl border border-white/5 text-xs space-y-1">
                        {hasBooking ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-blue-300 font-bold">
                              <span>예약: {bookedPlayers}명 / 정원 {maxPlayers}명</span>
                              {isCloseRequested && (
                                <span className="text-[10px] px-1 bg-red-500 text-white rounded animate-pulse">마감 요청</span>
                              )}
                            </div>
                            <div className="text-white/60 text-[11px] space-y-0.5">
                              {activeBookings.map((b, idx) => (
                                <div key={b.id || idx} className="flex items-center justify-between truncate">
                                  <span className="truncate flex items-center gap-1">
                                    <User size={10} /> {b.userName} ({b.participantCount}명)
                                  </span>
                                  <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${b.status === 'paid' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
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
          <div className="bg-[#1f1f1f] border border-red-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">마감 처리 불가 안내</h3>
                <p className="text-xs text-red-400">이미 확정된 고객 예약이 있습니다.</p>
              </div>
            </div>

            <div className="space-y-3 bg-black/50 p-4 rounded-2xl border border-white/5 text-sm">
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
