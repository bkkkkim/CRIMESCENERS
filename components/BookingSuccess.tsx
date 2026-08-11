
import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, Users, ArrowRight, MessageSquare, CreditCard, FileText, AlertTriangle } from 'lucide-react';
import { dataService } from '../src/services/dataService';
import { AdminSettings } from '../types';

const BookingSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }
    dataService.getSettings().then(s => setSettings(s)).catch(err => console.error(err));
  }, [state, navigate]);

  if (!state || !state.booking) return null;

  const { theme, booking } = state;
  const { date, time, userName: name, userPhone: phone, participantCount: participants, paymentMethod, notes, isCloseRequested } = booking;

  return (
    <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">예약 신청이 완료되었습니다!</h1>
        <p className="text-[#b3b3b3] text-base leading-relaxed">
          {name}님의 소중한 예약이 정상적으로 접수되었습니다.<br />
          입력하신 번호({phone})로 예약 안내 메시지가 발송되었습니다.
        </p>
      </div>

      {/* PROMINENT DEPOSIT NOTICE FOR CONFIRMATION */}
      <div className="bg-[#dc2626]/10 border-2 border-[#dc2626] rounded-3xl p-6 md:p-8 mb-10 text-left space-y-3 shadow-2xl">
        <div className="flex items-center gap-2 text-[#dc2626] font-black text-base md:text-lg">
          <AlertTriangle size={22} className="shrink-0 text-[#dc2626]" />
          <span>[필독] 예약 확정을 위한 선입금 안내</span>
        </div>
        <p className="text-sm font-semibold text-white/95 leading-relaxed">
          예약 신청이 완료되었습니다. <span className="text-yellow-300 font-bold underline underline-offset-4">아래 계좌로 예약금을 입금해주셔야 최종 예약이 확정</span> 처리됩니다. (미입금 시 예약이 자동 취소될 수 있습니다)
        </p>
        {settings?.bankInfo && (settings.bankInfo.bankName || settings.bankInfo.accountNumber) && (
          <div className="bg-black/60 p-4 md:p-5 rounded-2xl border border-white/10 mt-4 space-y-1">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">입금 계좌 정보</p>
            <p className="text-base md:text-lg font-black text-white">
              {settings.bankInfo.bankName} <span className="text-yellow-400 font-mono tracking-wide">{settings.bankInfo.accountNumber}</span> (예금주: {settings.bankInfo.holderName})
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden mb-10 shadow-2xl shadow-black/50">
        <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold">예약 상세 내역</h2>
          <span className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full font-bold border border-blue-500/20">예약 완료</span>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <span className="text-[#b3b3b3]">선택 시나리오</span>
            <div className="text-right">
              <span className="font-bold text-white block">{theme.title}</span>
              {booking.storeName && (
                <span className="text-sm text-white/50">{booking.storeName}</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#b3b3b3]">예약 번호</span>
            <span className="font-bold text-emerald-400">{booking.bookingNumber || booking.id.split('-')[0].toUpperCase()}</span>
          </div>
          {booking.storeAddress && (
            <div className="flex justify-between items-start">
              <span className="text-[#b3b3b3]">매장 주소</span>
              <span className="font-bold text-white text-right text-sm max-w-[60%]">{booking.storeAddress}</span>
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
              <Calendar size={18} /> 예약 일자
            </div>
            <span className="font-bold text-white">{date}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b3b3b3]">
              <Clock size={18} /> 예약 시간
            </div>
            <span className="font-bold text-white">{time}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b3b3b3]">
              <Users size={18} /> 참여 인원
            </div>
            <span className="font-bold text-white">{participants}명 {isCloseRequested && <span className="text-red-500 text-xs ml-1">(마감 신청됨)</span>}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#b3b3b3]">
              <CreditCard size={18} /> 결제 방식
            </div>
            <span className="font-bold text-white">{(paymentMethod === 'bank-transfer' || paymentMethod === 'deposit') ? '계좌이체 (선입금)' : '현장 결제'}</span>
          </div>
          {notes && (
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-[#b3b3b3] mb-2">
                <FileText size={18} /> 요청 사항
              </div>
              <p className="text-sm text-white/60 bg-black/40 p-4 rounded-xl italic">"{notes}"</p>
            </div>
          )}
        </div>
        <div className="p-6 bg-black/40 text-center">
            <p className="text-xs text-[#b3b3b3] flex items-center justify-center gap-2">
                <MessageSquare size={14} className="text-green-500" /> 
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
