
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { THEMES, DEFAULT_ADMIN_SETTINGS } from '../constants';
import { ChevronLeft, CheckCircle2, Copy, Check, AlertTriangle, Users } from 'lucide-react';
import { Theme, AdminSettings, BookingData, Store } from '../types';
import { dataService } from '../src/services/dataService';
import LoadingScreen from './LoadingScreen';
import SuspectModal from './SuspectModal';

const BookingForm = () => {
  const { themeId, date, time } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [stores, setStores] = useState<Store[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [copied, setCopied] = useState(false);
  const [showSuspectModal, setShowSuspectModal] = useState(false);

  const nameRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const participantsRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    participants: 2,
    paymentMethod: 'bank-transfer' as 'on-site' | 'bank-transfer',
    isCloseRequested: false,
    requestPreRoleCard: false,
    notes: ''
  });

  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch settings, bookings, stores in parallel
        const [savedSettings, savedBookings, savedStores] = await Promise.all([
          dataService.getSettings(),
          dataService.getBookingsBySlot(themeId!, date!, time!),
          dataService.getStores()
        ]);

        setSettings(savedSettings);
        setBookings(savedBookings);
        setStores(savedStores);

        // Get theme from local THEMES (very fast)
        const themeList = await dataService.getThemes();
        const found = themeList.find((t: Theme) => t.id === themeId);
        
        if (found) {
          setTheme(found);
          const booked = savedBookings.reduce((sum, b) => sum + b.participantCount, 0);
          
          setFormData(prev => ({ ...prev, participants: 0 }));
        }
      } catch (error) {
        console.error("Failed to load booking form data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  }, [themeId, date, time]);

  if (isInitialLoading) return <LoadingScreen />;
  if (!theme) return null;

  const matchedStore = stores.find(s => s.id === theme.storeId);
  const contactPhone = matchedStore?.phone || settings.managerPhone || '';

  const existingBookings = bookings.filter(b => b.themeId === themeId && b.date === date && b.time === time && b.status !== 'cancelled');
  const bookedCount = existingBookings.reduce((sum, b) => sum + b.participantCount, 0);
  const remainingCapacity = theme.maxPlayers - bookedCount;

  const isDiscountEnabled = settings?.advanceDepositDiscount?.enabled;
  const discountAmount = isDiscountEnabled ? (settings.advanceDepositDiscount?.discountAmount || 0) : 0;
  const effectivePerPersonPrice = Math.max(0, theme.price - discountAmount);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '예약자 성함을 입력해주세요.';
    if (!formData.phone.trim()) newErrors.phone = '휴대폰 번호를 입력해주세요.';
    if (!agreed) newErrors.agreed = '개인정보 수집 및 유의사항에 동의해주세요.';
    
    if (formData.participants === 0) {
      newErrors.participants = '참여 인원을 선택해주세요.';
    } else {
      if (formData.participants > remainingCapacity) {
        newErrors.participants = `현재 예약 가능한 인원은 최대 ${remainingCapacity}명입니다.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validate(); // Set inline errors
    if (!handleValidationAlert()) {
      return;
    }
    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      const isDiscountApplicable = settings?.advanceDepositDiscount?.enabled && formData.paymentMethod === 'bank-transfer';
      const perPersonDiscount = isDiscountApplicable ? (settings.advanceDepositDiscount?.discountAmount || 0) : 0;
      const unitPrice = Math.max(0, theme.price - perPersonDiscount);
      const calculatedTotalPrice = unitPrice * formData.participants;

      const bookingData: Omit<BookingData, 'id' | 'createdAt' | 'themeTitle' | 'themePoster'> = {
        themeId: themeId!,
        date: date!,
        time: time!,
        userName: formData.name,
        userPhone: formData.phone,
        participantCount: formData.participants,
        totalPrice: calculatedTotalPrice,
        paymentMethod: formData.paymentMethod,
        status: 'confirmed',
        isCloseRequested: formData.isCloseRequested,
        requestPreRoleCard: formData.requestPreRoleCard,
        notes: formData.notes
      };

      const result = await dataService.createBooking(bookingData);
      if (result) {
        // Send notification via Aligo API
        try {
          await dataService.sendNotification('booking', result, settings);
        } catch (notifyErr) {
          console.error("Notification failed", notifyErr);
          // Don't block the user if notification fails
        }
        
        navigate('/success', { state: { booking: result, theme, settings } });
      }
    } catch (err) {
      console.error(err);
      alert('예약 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBank = () => {
    navigator.clipboard.writeText(settings.bankInfo.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showCloseOption = (bookedCount + formData.participants) >= theme.minPlayers;
  const isFormValid = formData.name.trim() && formData.phone.trim() && agreed && formData.participants > 0;

  const handleValidationAlert = () => {
    const missing = [];
    let firstMissingRef: React.RefObject<HTMLDivElement> | null = null;

    if (!formData.name.trim()) {
      missing.push('예약자 성함');
      if (!firstMissingRef) firstMissingRef = nameRef;
    }
    if (!formData.phone.trim()) {
      missing.push('휴대폰 번호');
      if (!firstMissingRef) firstMissingRef = phoneRef;
    }
    if (formData.participants === 0) {
      missing.push('참여 인원');
      if (!firstMissingRef) firstMissingRef = participantsRef;
    }
    if (!agreed) {
      missing.push('개인정보 수집 및 유의사항 확인 동의');
      if (!firstMissingRef) firstMissingRef = privacyRef;
    }

    if (missing.length > 0) {
      alert(`예약 신청 정보를 확인해주세요\n\n필수 입력 항목: ${missing.join(', ')}`);
      if (firstMissingRef?.current) {
        const y = firstMissingRef.current.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return false;
    }

    // Phone validation: minimum 11 digits
    const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 11) {
      alert('휴대폰 번호를 정확히 입력해주세요. (최소 11자리 숫자가 필요합니다)');
      if (phoneRef.current) {
        const y = phoneRef.current.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return false;
    }

    return true;
  };

  return (
    <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto">
      <div>
        <Link to={`/theme/${themeId}`} className="inline-flex items-center text-[#b3b3b3] hover:text-white mb-4 md:mb-8 gap-1 text-sm font-bold tracking-normal uppercase">
          <ChevronLeft size={16} /> Back to Scenarios
        </Link>
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl md:rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 sm:p-8 md:p-12 border-b border-white/5 bg-white/5">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tighter">RESERVATION</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#b3b3b3] font-medium">
              <span className="text-white">{theme.title}</span>
              <span>{date}</span>
              <span>{time}</span>
            </div>
        </div>

        {/* 상단 통합 예약 확정 안내 배너 */}
        <div className="px-6 sm:px-8 md:px-12 py-5 bg-[#dc2626]/10 border-b border-[#dc2626]/25 space-y-1.5">
          <div className="flex items-center gap-2 text-[#dc2626] text-sm md:text-base font-black">
            <span>📢 예약 확정 안내 (선입금 필수)</span>
          </div>
          <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
            예약 신청 후 <span className="text-[#dc2626] font-bold underline underline-offset-4">예약금을 선입금(계좌이체)하셔야 예약이 최종 확정</span>됩니다. (미입금 시 예약이 자동 취소될 수 있습니다)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 md:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div ref={nameRef} className="space-y-3">
              <label className="text-sm font-bold text-white tracking-normal uppercase">예약자 성함</label>
              {errors.name && <p className="text-[10px] text-red-500 font-bold animate-pulse">{errors.name}</p>}
              <input 
                type="text" 
                placeholder="성함을 입력해주세요"
                className={`w-full bg-black/40 border rounded-xl p-4 focus:outline-none transition-colors text-white placeholder:text-white/40 text-base ${errors.name ? 'border-red-500' : 'border-white/20 focus:border-white'}`}
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value});
                  if (errors.name) setErrors(prev => { const {name, ...rest} = prev; return rest; });
                }}
              />
            </div>
            <div ref={phoneRef} className="space-y-3">
              <label className="text-sm font-bold text-white tracking-normal uppercase">휴대폰 번호</label>
              {errors.phone && <p className="text-[10px] text-red-500 font-bold animate-pulse">{errors.phone}</p>}
                <input 
                  type="tel" 
                  placeholder="숫자만 입력해주세요 (하이픈 제외)"
                  className={`w-full bg-black/40 border rounded-xl p-4 focus:outline-none transition-colors text-white placeholder:text-white/40 text-base ${errors.phone ? 'border-red-500' : 'border-white/20 focus:border-white'}`}
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({...formData, phone: value});
                    if (errors.phone) setErrors(prev => { const {phone, ...rest} = prev; return rest; });
                  }}
                />
            </div>
          </div>

          <div ref={participantsRef} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white tracking-normal uppercase">참여 인원 선택</label>
              <span className="text-xs font-semibold text-white/70">
                <span className="text-[#dc2626] font-bold">{remainingCapacity}</span> / {theme.maxPlayers}명 가능
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 sm:gap-3 pt-1">
              {Array.from({ length: theme.maxPlayers }, (_, i) => i + 1).map(num => {
                const isPossible = num <= remainingCapacity;
                const isSelectable = isPossible;
                
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={!isSelectable}
                    onClick={() => {
                      setFormData({...formData, participants: num});
                      if (errors.participants) setErrors(prev => { const {participants, ...rest} = prev; return rest; });
                    }}
                    className={`aspect-square rounded-2xl border font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      formData.participants === num 
                          ? 'bg-white border-white text-black shadow-xl shadow-white/10 scale-105' 
                          : isSelectable 
                            ? 'bg-white/5 border-white/10 text-[#b3b3b3] hover:border-white/30'
                            : 'bg-white/[0.02] border-white/5 text-white/10 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-lg font-en leading-none">{num}</span>
                    <span className="text-[8px] opacity-40 leading-none">명</span>
                  </button>
                );
              })}
            </div>
            {errors.participants && <p className="text-xs text-red-500 font-bold mt-2">{errors.participants}</p>}
            {!remainingCapacity && (
              <p className="text-xs text-red-500 font-bold">⚠️ 이 슬롯은 이미 예약이 가득 찼습니다.</p>
            )}
          </div>

          {/* 기존 참여자들의 전달 사항 / 메모 (오픈 예약인 경우) */}
          {existingBookings.some(b => b.notes && b.notes.trim()) && (
            <div className="p-4 sm:p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Users size={16} className="text-red-400" />
                <span>함께하는 플레이어의 참고 메시지</span>
              </div>
              <div className="space-y-2">
                {existingBookings.filter(b => b.notes && b.notes.trim()).map((b, idx) => (
                  <div key={idx} className="bg-black/30 p-3 rounded-xl border border-white/5 text-xs sm:text-sm text-white/80 leading-relaxed">
                    <span className="text-white/40 font-bold mr-1.5">참여자 {idx + 1} ({b.participantCount}명):</span>
                    <span className="text-white/90 whitespace-pre-wrap">{b.notes}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRE-ROLECARD OPTION */}
          <div className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
            <label htmlFor="requestPreRoleCard" className="flex items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                id="requestPreRoleCard"
                className="w-5 h-5 accent-[#dc2626] rounded cursor-pointer"
                checked={formData.requestPreRoleCard}
                onChange={(e) => setFormData({...formData, requestPreRoleCard: e.target.checked})}
              />
              <span className="text-sm font-bold text-white tracking-normal uppercase">사전 롤카드 받기 (선택)</span>
            </label>

            <div className="pl-8 space-y-2.5">
              <p className="text-xs text-white/80 font-medium leading-relaxed break-keep">
                원활한 플레이를 위해 예약 전날 사전 롤카드를 발송해 드립니다.<br className="hidden sm:block" />
                <button
                  type="button"
                  onClick={() => setShowSuspectModal(true)}
                  className="text-white underline underline-offset-4 hover:text-red-400 font-bold cursor-pointer inline-flex items-center gap-0.5 mr-1"
                >
                  사건 관계자 정보
                </button>
                확인 후, 전날 안내 문자에 배역과 이메일 주소를 회신해 주세요.
              </p>

              {(theme.useSuspects ?? true) && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowSuspectModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-white/20 hover:border-white/40 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Users size={13} className="text-red-400" />
                    <span className="text-white">사건 관계자 정보</span>
                    {theme.suspects && theme.suspects.length > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/90 border border-white/10">
                        {theme.suspects.length}명
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 결제 방식 및 계좌 정보 영역 (일체형 단일 패널) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-white tracking-normal uppercase whitespace-nowrap">결제 방식</label>
                <span className="text-xs font-semibold text-white/70 bg-white/10 px-2 py-0.5 rounded-md whitespace-nowrap">계좌이체</span>
              </div>
              {settings?.advanceDepositDiscount?.enabled && (
                <span className="text-xs font-bold text-white bg-[#dc2626] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  인당 {settings.advanceDepositDiscount.discountAmount.toLocaleString()}원 할인
                </span>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-white/[0.04] rounded-2xl border border-white/10 divide-y divide-white/10 space-y-4">
              {/* 1. 총 결제 금액 */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-white/80 block whitespace-nowrap">총 결제 금액</span>
                  {formData.participants > 0 && (
                    <span className="text-xs text-white/50 font-medium whitespace-nowrap block mt-0.5">
                      {(isDiscountEnabled ? effectivePerPersonPrice : theme.price).toLocaleString()}원 × {formData.participants}명
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {formData.participants > 0 ? (
                    <div className="flex items-baseline justify-end gap-1.5 sm:gap-2">
                      {isDiscountEnabled && discountAmount > 0 && (
                        <span className="text-xs sm:text-sm text-white/40 line-through whitespace-nowrap">
                          {(theme.price * formData.participants).toLocaleString()}원
                        </span>
                      )}
                      <span className="text-xl sm:text-2xl font-black text-white tracking-tight whitespace-nowrap">
                        {(isDiscountEnabled ? effectivePerPersonPrice * formData.participants : theme.price * formData.participants).toLocaleString()}원
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-white/40 font-medium whitespace-nowrap">인원을 선택해주세요</span>
                  )}
                </div>
              </div>

              {/* 2. 입금 계좌 정보 (단일 열/행 반응형 배치) */}
              {settings?.bankInfo && (settings.bankInfo.bankName || settings.bankInfo.accountNumber) && (
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase block">입금 계좌</span>
                    <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span className="text-white">{settings.bankInfo.bankName}</span>
                      <span className="font-mono text-white/95">{settings.bankInfo.accountNumber}</span>
                      <span className="text-xs text-white/60 font-normal">({settings.bankInfo.holderName})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyBank}
                    className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl text-xs font-bold transition-all text-white border border-white/10 flex items-center justify-center gap-1.5 shrink-0 self-stretch sm:self-center cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    <span>{copied ? '복사완료' : '계좌 복사'}</span>
                  </button>
                </div>
              )}

              {/* 3. 선입금 계좌이체 유의사항 */}
              <div className="pt-4 space-y-1.5 text-xs text-white/70">
                <p className="text-[#dc2626] font-bold tracking-wide flex items-center gap-1.5 mb-1">
                  ⚠️ 선입금 계좌이체 유의사항
                </p>
                <ul className="space-y-1 list-none pl-0 leading-relaxed text-white/75">
                  <li>• 예약자명과 입금자명이 동일해야 예약확인이 가능합니다.</li>
                  <li>• 당일 취소 시 환불이 불가합니다.</li>
                  <li>
                    • 당일 예약은{' '}
                    <a 
                      href={contactPhone ? `tel:${contactPhone.replace(/[^0-9]/g, '')}` : '#'} 
                      className="underline font-bold text-white hover:text-white/80 underline-offset-4 transition-colors"
                    >
                      매장으로 연락
                    </a>
                    바랍니다. {contactPhone && <span className="text-white/50">({contactPhone})</span>}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {showCloseOption && (
            <div className="p-8 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-[32px] flex items-start gap-6">
              <div className="pt-1">
                <input 
                  type="checkbox" 
                  id="closeBooking"
                  className="w-5 h-5 accent-[#dc2626]"
                  checked={formData.isCloseRequested}
                  onChange={(e) => setFormData({...formData, isCloseRequested: e.target.checked})}
                />
              </div>
              <label htmlFor="closeBooking" className="cursor-pointer">
                <p className="font-bold text-[#dc2626] text-sm mb-1">예약 마감 신청 (Private Play)</p>
                <p className="text-sm text-[#b3b3b3] leading-relaxed opacity-90">
                  최소 인원 조건이 충족되었습니다. 모르는 사람과 함께 플레이하는 것을 원치 않으시면 체크해주세요. 체크 시 해당 시간대는 즉시 예약 마감 처리됩니다.
                </p>
              </label>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-white tracking-normal uppercase block">전달사항 (선택)</label>
            <p className="text-xs text-white/40">오픈 예약 시 다른 참여자도 확인 가능</p>
            <textarea 
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-white transition-colors resize-none text-white placeholder:text-white/30 text-sm mt-1"
              placeholder="함께 하실 분들이나 매장에 전달하실 사항을 남겨주세요. (예: 크라임씬 처음인 초보입니다! 편하게 즐겨요 등)"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="space-y-8 pt-8 border-t border-white/5">
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-white tracking-normal uppercase">예약 유의사항</h4>
                {settings.bookingNotice ? (
                  <div className="text-xs sm:text-sm text-white/70 space-y-2 leading-relaxed whitespace-pre-wrap font-medium">
                    {settings.bookingNotice}
                  </div>
                ) : (
                  <ul className="text-xs sm:text-sm text-white/70 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
                      <li>예약 완료 즉시 입력하신 연락처로 안내해 드리며, 만약 연락처 정보를 잘못 입력하시거나 연락을 못받으신 경우 매장으로 연락해주세요.</li>
                      <li>예약일 전날 밤 10시까지 입금안내와 매장 이용 안내 전달할 예정입니다. 당일 예약 후 반복하여 취소하시는 경우 향후 매장 이용에 제한이 생길 수 있습니다.</li>
                  </ul>
                )}
            </div>

            <div ref={privacyRef} className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/10">
                <div className="pt-0.5">
                    <input 
                        type="checkbox" 
                        id="privacyAgree"
                        className="w-5 h-5 accent-white"
                        checked={agreed}
                        onChange={(e) => {
                            setAgreed(e.target.checked);
                            if (errors.agreed) setErrors(prev => { const {agreed, ...rest} = prev; return rest; });
                        }}
                    />
                </div>
                <label htmlFor="privacyAgree" className="cursor-pointer">
                    <p className={`text-sm font-bold transition-colors ${errors.agreed ? 'text-red-500' : 'text-white'}`}>
                        개인정보수집 동의하며 유의사항 확인하였습니다 (필수)
                    </p>
                    {errors.agreed && <p className="text-[10px] text-red-500 mt-1">{errors.agreed}</p>}
                </label>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#161616]/95 backdrop-blur-md border-t border-white/10 z-50 md:relative md:p-0 md:bg-transparent md:border-none">
              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-4 font-bold rounded-xl text-sm md:text-base transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  isFormValid && !loading
                      ? 'bg-white text-black hover:bg-neutral-200 active:scale-[0.99] shadow-black/50' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed shadow-none'
                }`}
              >
                {loading ? '예약 처리 중...' : <><CheckCircle2 size={20} /> 예약 완료하기</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Suspect Info Layer Popup */}
      <SuspectModal
        isOpen={showSuspectModal}
        onClose={() => setShowSuspectModal(false)}
        theme={theme}
      />
    </div>
  );
};

export default BookingForm;
