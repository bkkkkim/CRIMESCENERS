
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { THEMES, DEFAULT_ADMIN_SETTINGS } from '../constants';
import { ChevronLeft, CheckCircle2, Copy, Check } from 'lucide-react';
import { Theme, AdminSettings, BookingData } from '../types';
import { dataService } from '../src/services/dataService';

const BookingForm = () => {
  const { themeId, date, time } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    participants: 2,
    paymentMethod: 'on-site' as 'on-site' | 'bank-transfer',
    isCloseRequested: false,
    notes: ''
  });

  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedSettings, themeList, savedBookings] = await Promise.all([
          dataService.getSettings(),
          dataService.getThemes(),
          dataService.getBookings()
        ]);

        setSettings(savedSettings);
        setBookings(savedBookings);

        const found = themeList.find((t: Theme) => t.id === themeId);
        if (found) {
          setTheme(found);
          setFormData(prev => ({ ...prev, participants: found.minPlayers }));
        }
      } catch (error) {
        console.error("Failed to load booking form data:", error);
      }
    };
    loadData();
  }, [themeId]);

  if (!theme) return null;

  // Calculate available participants
  const existingBookings = bookings.filter(b => b.themeId === themeId && b.date === date && b.time === time && b.status !== 'cancelled');
  const bookedCount = existingBookings.reduce((sum, b) => sum + b.participantCount, 0);
  const remainingCapacity = theme.maxPlayers - bookedCount;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '예약자 성함을 입력해주세요.';
    if (!formData.phone.trim()) newErrors.phone = '휴대폰 번호를 입력해주세요.';
    if (!agreed) newErrors.agreed = '개인정보 수집 및 유의사항에 동의해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      navigate('/success', { state: { theme, date, time, ...formData } });
    }
  };

  const handleCopyBank = () => {
    navigator.clipboard.writeText(settings.bankInfo.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showCloseOption = formData.participants >= theme.minPlayers;
  const isFormValid = formData.name.trim() && formData.phone.trim() && agreed;

  return (
    <div className="pt-24 md:pt-32 pb-24 px-0 md:px-6 max-w-3xl mx-auto">
      <div className="px-6 md:px-0">
        <Link to={`/theme/${themeId}`} className="inline-flex items-center text-[#b3b3b3] hover:text-white mb-8 gap-1 text-sm font-bold tracking-widest uppercase">
          <ChevronLeft size={16} /> Back to Episode
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/40 tracking-widest uppercase">예약자 성함</label>
              {errors.name && <p className="text-[10px] text-red-500 font-bold animate-pulse">{errors.name}</p>}
              <input 
                type="text" 
                placeholder="성함을 입력해주세요"
                className={`w-full bg-black/40 border rounded-xl p-4 focus:outline-none transition-colors text-white ${errors.name ? 'border-red-500' : 'border-white/10 focus:border-white'}`}
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value});
                  if (errors.name) setErrors(prev => { const {name, ...rest} = prev; return rest; });
                }}
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-white/40 tracking-widest uppercase">휴대폰 번호</label>
              {errors.phone && <p className="text-[10px] text-red-500 font-bold animate-pulse">{errors.phone}</p>}
              <input 
                type="tel" 
                placeholder="010-0000-0000"
                className={`w-full bg-black/40 border rounded-xl p-4 focus:outline-none transition-colors text-white ${errors.phone ? 'border-red-500' : 'border-white/10 focus:border-white'}`}
                value={formData.phone}
                onChange={(e) => {
                  setFormData({...formData, phone: e.target.value});
                  if (errors.phone) setErrors(prev => { const {phone, ...rest} = prev; return rest; });
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-white/40 tracking-widest uppercase">참여 인원 선택</label>
              <span className="text-[10px] text-white/20">잔여: {remainingCapacity}명 / 최대: {theme.maxPlayers}명</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: theme.maxPlayers }, (_, i) => i + 1).map(num => {
                const isPossible = num <= remainingCapacity;
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={!isPossible}
                    onClick={() => setFormData({...formData, participants: num})}
                    className={`w-16 h-16 rounded-2xl border font-bold transition-all ${
                      formData.participants === num 
                          ? 'bg-white border-white text-black shadow-xl shadow-white/10 scale-110' 
                          : isPossible 
                            ? 'bg-transparent border-white/10 text-[#b3b3b3] hover:border-white/30'
                            : 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            {!remainingCapacity && (
              <p className="text-xs text-red-500 font-bold">⚠️ 이 슬롯은 이미 예약이 가득 찼습니다.</p>
            )}
          </div>

          <div className="space-y-6">
            <label className="text-xs font-bold text-white/40 tracking-widest uppercase">결제 방식</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({...formData, paymentMethod: 'on-site'})}
                className={`py-5 rounded-2xl border font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.paymentMethod === 'on-site'
                    ? 'bg-white border-white text-black shadow-xl'
                    : 'bg-transparent border-white/10 text-[#b3b3b3] hover:border-white/30'
                }`}
              >
                현장 결제
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, paymentMethod: 'bank-transfer'})}
                className={`py-5 rounded-2xl border font-bold transition-all flex items-center justify-center gap-2 ${
                  formData.paymentMethod === 'bank-transfer'
                    ? 'bg-white border-white text-black shadow-xl'
                    : 'bg-transparent border-white/10 text-[#b3b3b3] hover:border-white/30'
                }`}
              >
                계좌이체
              </button>
            </div>

            {formData.paymentMethod === 'bank-transfer' && (
              <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase mb-2">Deposit Account</p>
                    <div className="text-xl font-bold tracking-tight">
                      {settings.bankInfo.bankName} {settings.bankInfo.accountNumber}
                    </div>
                    <p className="text-sm text-white/60">예금주: {settings.bankInfo.holderName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyBank}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {showCloseOption && (
            <div className="p-8 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-[32px] flex items-start gap-6">
              <div className="pt-1">
                <input 
                  type="checkbox" 
                  id="closeBooking"
                  className="w-6 h-6 accent-[#dc2626]"
                  checked={formData.isCloseRequested}
                  onChange={(e) => setFormData({...formData, isCloseRequested: e.target.checked})}
                />
              </div>
              <label htmlFor="closeBooking" className="cursor-pointer">
                <p className="font-bold text-[#dc2626] text-lg mb-2">예약 마감 신청 (Private Play)</p>
                <p className="text-sm text-[#b3b3b3] leading-relaxed">
                  최소 인원 조건이 충족되었습니다. 모르는 사람과 함께 플레이하는 것을 원치 않으시면 체크해주세요. 체크 시 해당 시간대는 즉시 예약 마감 처리됩니다.
                </p>
              </label>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-bold text-white/40 tracking-widest uppercase">매장 전달 사항 (선택)</label>
            <textarea 
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-white transition-colors resize-none text-white"
              placeholder="함께 하실 분들이나 매장에 전달하실 사항을 남겨주세요."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="space-y-8 pt-8 border-t border-white/5">
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-white/60">예약 유의사항</h4>
                <ul className="text-xs text-[#b3b3b3] space-y-2 list-disc pl-4 leading-relaxed">
                    <li>예약 완료 즉시 입력하신 연락처로 안내해 드리며, 만약 연락처 정보를 잘못 입력하시거나 연락을 못받으신 경우 매장으로 연락해주세요.</li>
                    <li>예약일 전날 밤 10시까지 입금안내와 매장 이용 안내 전달할 예정입니다. 당일 예약 후 반복하여 취소하시는 경우 향후 매장 이용에 제한이 생길 수 있습니다.</li>
                </ul>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/5">
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

            <button 
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-6 font-bold rounded-2xl text-xl transition-all shadow-2xl flex items-center justify-center gap-3 ${
                isFormValid 
                    ? 'bg-white text-black hover:bg-neutral-200 shadow-black/50' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 size={24} /> CONFIRM RESERVATION
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
