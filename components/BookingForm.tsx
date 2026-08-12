
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { THEMES, DEFAULT_ADMIN_SETTINGS } from '../constants';
import { ChevronLeft, CheckCircle2, Copy, Check, AlertTriangle } from 'lucide-react';
import { Theme, AdminSettings, BookingData, Store } from '../types';
import { dataService } from '../src/services/dataService';
import LoadingScreen from './LoadingScreen';

const BookingForm = () => {
  const { themeId, date, time } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [stores, setStores] = useState<Store[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [copied, setCopied] = useState(false);

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
      const bookingData: Omit<BookingData, 'id' | 'createdAt' | 'themeTitle' | 'themePoster'> = {
        themeId: themeId!,
        date: date!,
        time: time!,
        userName: formData.name,
        userPhone: formData.phone,
        participantCount: formData.participants,
        totalPrice: theme.price * formData.participants,
        paymentMethod: formData.paymentMethod,
        status: 'pending',
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
        
        navigate('/success', { state: { booking: result, theme } });
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
    <div className="pt-24 md:pt-32 pb-0 md:pb-24 px-0 md:px-6 max-w-3xl mx-auto">
      <div className="px-6 md:px-0">
        <Link to={`/theme/${themeId}`} className="inline-flex items-center text-[#b3b3b3] hover:text-white mb-4 md:mb-8 gap-1 text-sm font-bold tracking-normal uppercase">
          <ChevronLeft size={16} /> Back to Scenarios
        </Link>
      </div>

      <div className="bg-[#1a1a1a] md:rounded-3xl border-y md:border border-white/5 overflow-hidden">
        <div className="p-8 md:p-12 border-b border-white/5 bg-white/5">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tighter">RESERVATION</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#b3b3b3] font-medium">
              <span className="text-white">{theme.title}</span>
              <span>{date}</span>
              <span>{time}</span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
          {/* PROMINENT DEPOSIT NOTICE BANNER */}
          <div className="p-6 bg-[#dc2626]/10 border-2 border-[#dc2626] rounded-2xl space-y-2 shadow-xl">
            <div className="flex items-center gap-2 text-[#dc2626] text-base md:text-lg font-black">
              <span className="text-[#dc2626]">📢 예약 확정 안내 (선입금 필수)</span>
            </div>
            <p className="text-sm text-white/95 font-semibold leading-relaxed">
              예약 신청 후 <span className="text-[#dc2626] font-black underline underline-offset-4">예약금을 선입금(계좌이체)하셔야 예약이 최종 확정</span>됩니다.<br />
              미입금 시 예약이 자동 취소될 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div ref={nameRef} className="space-y-3">
              <label className="text-sm font-bold text-white/80 tracking-normal uppercase">예약자 성함</label>
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
              <label className="text-sm font-bold text-white/80 tracking-normal uppercase">휴대폰 번호</label>
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

          <div ref={participantsRef} className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/25">
              <label className="text-sm font-bold text-white/80 tracking-normal uppercase">참여 인원 선택</label>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-white">
                  <span className="text-[#dc2626]">{remainingCapacity}</span> / {theme.maxPlayers}명 가능
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {Array.from({ length: theme.maxPlayers }, (_, i) => i + 1).map(num => {
                const isPossible = num <= remainingCapacity;
                // Allow any number up to remaining capacity to be selected
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
                          ? 'bg-white border-white text-black shadow-xl shadow-white/10 scale-110' 
                          : isSelectable 
                            ? 'bg-transparent border-white/10 text-[#b3b3b3] hover:border-white/30'
                            : 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed'
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

          {/* PRE-ROLECARD OPTION */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3 shadow-lg">
            <label htmlFor="requestPreRoleCard" className="flex items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                id="requestPreRoleCard"
                className="w-5 h-5 accent-[#dc2626] rounded cursor-pointer"
                checked={formData.requestPreRoleCard}
                onChange={(e) => setFormData({...formData, requestPreRoleCard: e.target.checked})}
              />
              <span className="text-base font-black text-white tracking-tight">사전 롤카드 받기</span>
            </label>
            <p className="text-xs text-white/70 font-medium leading-relaxed pl-8">
              크라임 씨너스는 게임 몰입을 위해 롤카드에 크게 의존하지 않도록, 예약 인원 충족 시 사전 역할 숙지를 위한 롤카드를 발송해 드립니다.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center relative">
              <label className="text-sm font-bold text-white/80 tracking-normal uppercase">결제 방식</label>
            </div>
            
            <div className="w-full">
              <div className="relative">
                {/* ADVANCE DEPOSIT TOOLTIP / SPEECH BUBBLE */}
                {settings?.advanceDepositDiscount?.enabled && (
                  <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                    <div className="relative bg-[#dc2626] text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap border border-white/15">
                      인당 {settings.advanceDepositDiscount.discountAmount.toLocaleString()}원 할인!
                      {/* speech bubble triangle */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#dc2626] rotate-45 border-r border-b border-white/10"></div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setFormData({...formData, paymentMethod: 'bank-transfer'})}
                  className="w-full py-5 rounded-2xl border border-white font-bold transition-all flex items-center justify-center gap-2 bg-white text-black shadow-xl"
                >
                  선입금 (계좌이체)
                </button>
              </div>
            </div>

            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-8 bg-white/5 rounded-[32px] border border-white/20 shadow-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/55 tracking-normal uppercase mb-2">Deposit Account</p>
                    <div className="text-xl font-bold tracking-tight text-white mb-1">
                      {settings.bankInfo.bankName} {settings.bankInfo.accountNumber}
                    </div>
                    <p className="text-sm font-semibold text-white/80">예금주: {settings.bankInfo.holderName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyBank}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all text-white border border-white/10"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>

              {/* ADVANCE DEPOSIT PRECAUTION NOTICE */}
              <div className="p-6 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-2xl space-y-3 shadow-md">
                <p className="text-xs text-[#dc2626] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  ⚠️ 선입금 계좌이체 유의사항
                </p>
                <ul className="text-sm text-white/95 font-semibold space-y-2 list-none pl-0 leading-relaxed">
                  <li>1) 예약자명과 입금자명이 동일해야 예약확인이 가능합니다.</li>
                  <li>2) 당일 환불은 불가합니다.</li>
                  <li>
                    3) 당일 예약은{' '}
                    <a 
                      href={contactPhone ? `tel:${contactPhone.replace(/[^0-9]/g, '')}` : '#'} 
                      className="underline font-black text-yellow-300 hover:text-yellow-200 underline-offset-4 transition-colors"
                    >
                      매장으로 연락
                    </a>
                    바랍니다. {contactPhone && <span className="text-xs text-white/70">({contactPhone})</span>}
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

          <div className="space-y-3">
            <label className="text-xs font-medium text-white/40 tracking-normal uppercase">매장 전달 사항 (선택)</label>
            <textarea 
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-white transition-colors resize-none text-white placeholder:text-white/20"
              placeholder="함께 하실 분들이나 매장에 전달하실 사항을 남겨주세요."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="space-y-8 pt-8 border-t border-white/5">
            <div className="space-y-4">
                <h4 className="text-base font-extrabold text-white">예약 유의사항</h4>
                {settings.bookingNotice ? (
                  <div className="text-sm text-white/80 space-y-2 leading-relaxed whitespace-pre-wrap font-medium">
                    {settings.bookingNotice}
                  </div>
                ) : (
                  <ul className="text-sm text-white/80 space-y-2 list-disc pl-4 leading-relaxed font-medium">
                      <li>예약 완료 즉시 입력하신 연락처로 안내해 드리며, 만약 연락처 정보를 잘못 입력하시거나 연락을 못받으신 경우 매장으로 연락해주세요.</li>
                      <li>예약일 전날 밤 10시까지 입금안내와 매장 이용 안내 전달할 예정입니다. 당일 예약 후 반복하여 취소하시는 경우 향후 매장 이용에 제한이 생길 수 있습니다.</li>
                  </ul>
                )}
            </div>

            <div ref={privacyRef} className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
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
                    <p className={`text-sm font-extrabold transition-colors ${errors.agreed ? 'text-red-500' : 'text-white'}`}>
                        개인정보수집 동의하며 유의사항 확인하였습니다 (필수)
                    </p>
                    {errors.agreed && <p className="text-[10px] text-red-500 mt-1">{errors.agreed}</p>}
                </label>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1a1a1a] border-t border-white/10 z-50 md:relative md:p-0 md:bg-transparent md:border-none">
              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-4 md:py-6 font-bold rounded-full md:rounded-none text-sm md:text-base transition-all shadow-2xl flex items-center justify-center gap-3 tracking-normal uppercase font-en ${
                  isFormValid && !loading
                      ? 'bg-white text-black hover:bg-neutral-200 shadow-black/50' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed shadow-none'
                }`}
              >
                {loading ? 'PROCESSING...' : <><CheckCircle2 size={20} /> CONFIRM RESERVATION</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
