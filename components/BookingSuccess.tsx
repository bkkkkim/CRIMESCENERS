
import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, Users, MessageSquare, CreditCard, FileText, Copy, Check } from 'lucide-react';
import { dataService } from '../src/services/dataService';
import { DEFAULT_ADMIN_SETTINGS } from '../constants';
import { AdminSettings } from '../types';

const BookingSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings>(state?.settings || DEFAULT_ADMIN_SETTINGS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }
    dataService.getSettings().then(s => {
      if (s) setSettings(s);
    }).catch(err => console.error(err));
  }, [state, navigate]);

  if (!state || !state.booking) return null;

  const { theme, booking } = state;
  const { date, time, userName: name, userPhone: phone, participantCount: participants, paymentMethod, notes, isCloseRequested } = booking;

  const handleCopyAccount = () => {
    if (settings?.bankInfo?.accountNumber) {
      navigator.clipboard.writeText(settings.bankInfo.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 border border-white/15 rounded-full mb-4 shadow-lg shadow-black/40">
          <CheckCircle2 size={36} className="text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mb-2.5">예약 확인되었습니다!</h1>
        <p className="text-[#b3b3b3] text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
          {name}님의 예약이 정상 접수되었으며,<br className="sm:hidden" />
          입력하신 번호({phone})로 안내 메시지가 발송되었습니다.
        </p>
      </div>

      {/* PROMINENT DEPOSIT NOTICE FOR CONFIRMATION */}
      <div className="bg-[#dc2626]/10 border border-[#dc2626]/40 rounded-3xl p-5 sm:p-7 mb-8 text-left space-y-3 shadow-2xl">
        <div className="flex items-center gap-2 text-[#dc2626] font-bold text-base sm:text-lg">
          <span>📢 예약 확정 안내 (선입금 필수)</span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-white/90 leading-relaxed">
          <span className="text-white font-bold underline underline-offset-4">아래 계좌로 예약금을 입금해주셔야 최종 예약이 확정</span> 처리됩니다. (미입금 시 예약이 자동 취소될 수 있습니다)
        </p>
        {settings?.bankInfo && (settings.bankInfo.bankName || settings.bankInfo.accountNumber) && (
          <div className="bg-black/60 p-4 sm:p-5 rounded-2xl border border-white/10 mt-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider block">입금 계좌 정보</span>
                <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span className="text-white">{settings.bankInfo.bankName}</span>
                  <span className="font-mono text-white/95">{settings.bankInfo.accountNumber}</span>
                  <span className="text-xs text-white/60 font-normal">({settings.bankInfo.holderName})</span>
                </div>
              </div>
              <button
                onClick={handleCopyAccount}
                type="button"
                className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 border border-white/10 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-green-400" />
                    <span>복사완료</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>계좌 복사</span>
                  </>
                )}
              </button>
            </div>

            {/* 입금 금액 안내 */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-xs text-white/70 font-bold">입금하실 총 금액</span>
              <div className="text-right flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-white">
                  {(booking.totalPrice || (theme.price * participants)).toLocaleString()}원
                </span>
                <span className="text-xs text-white/50 font-normal">
                  ({participants}명)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden mb-10 shadow-2xl shadow-black/50">
        <div className="p-6 sm:p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold">예약 상세 내역</h2>
          <span className="text-xs px-3 py-1 bg-white/10 text-white rounded-full font-bold border border-white/20">예약 접수완료</span>
        </div>
        <div className="p-6 sm:p-8 space-y-5 sm:space-y-6 text-sm">
          <div className="flex justify-between items-start">
            <span className="text-[#b3b3b3]">선택 시나리오</span>
            <div className="text-right">
              <span className="font-bold text-white block">{theme.title}</span>
              {booking.storeName && (
                <span className="text-xs text-white/50">{booking.storeName}</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#b3b3b3]">예약 번호</span>
            <span className="font-mono font-bold text-white">{booking.bookingNumber || booking.id.split('-')[0].toUpperCase()}</span>
          </div>
          {booking.storeAddress && (
            <div className="flex justify-between items-start">
              <span className="text-[#b3b3b3]">매장 주소</span>
              <span className="font-bold text-white text-right text-xs sm:text-sm max-w-[60%]">{booking.storeAddress}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-[#b3b3b3]">예약자 성함</span>
            <span className="font-bold text-white">{name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#b3b3b3]">연락처</span>
            <span className="font-bold text-white">{phone}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b3b3b3]">
              <Calendar size={16} /> 예약 일자
            </div>
            <span className="font-bold text-white">{date}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b3b3b3]">
              <Clock size={16} /> 예약 시간
            </div>
            <span className="font-bold text-white">{time}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b3b3b3]">
              <Users size={16} /> 참여 인원
            </div>
            <span className="font-bold text-white">{participants}명 {isCloseRequested && <span className="text-[#dc2626] text-xs ml-1">(마감 신청됨)</span>}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b3b3b3]">
              <CreditCard size={16} /> 총 결제 금액
            </div>
            <span className="font-bold text-white">
              {(booking.totalPrice || (theme.price * participants)).toLocaleString()}원
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b3b3b3]">
              <CreditCard size={16} /> 결제 방식
            </div>
            <span className="font-bold text-white">{(paymentMethod === 'bank-transfer' || paymentMethod === 'deposit') ? '계좌이체 (선입금)' : '현장 결제'}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b3b3b3]">
              <FileText size={16} /> 사전 롤카드 발송
            </div>
            <span className={`font-bold ${booking.requestPreRoleCard ? 'text-white' : 'text-white/40'}`}>
              {booking.requestPreRoleCard ? '신청' : '미신청'}
            </span>
          </div>
          {notes && (
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-[#b3b3b3] mb-2">
                <FileText size={16} /> 요청 사항
              </div>
              <p className="text-xs sm:text-sm text-white/70 bg-black/40 p-3.5 rounded-xl whitespace-pre-wrap">"{notes}"</p>
            </div>
          )}
        </div>
        <div className="p-4 sm:p-5 bg-black/40 text-center">
            <p className="text-xs text-[#b3b3b3] flex items-center justify-center gap-2">
                <MessageSquare size={14} className="text-white/60" /> 
                방문 1일 전 안내 메시지가 추가로 발송됩니다.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link 
            to="/" 
            className="flex items-center justify-center py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all text-white text-sm md:text-base whitespace-nowrap px-4"
        >
            홈으로 이동
        </Link>
        <Link 
            to="/reservation" 
            className="flex items-center justify-center py-4 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-all text-sm md:text-base whitespace-nowrap px-4"
        >
            추가 예약하기
        </Link>
      </div>
    </div>
  );
};

export default BookingSuccess;
