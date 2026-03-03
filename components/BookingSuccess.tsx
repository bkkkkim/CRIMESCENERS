
import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, Users, ArrowRight, MessageSquare, CreditCard, FileText } from 'lucide-react';
import { dataService } from '../src/services/dataService';

const BookingSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }
  }, [state, navigate]);

  if (!state || !state.booking) return null;

  const { theme, booking } = state;
  const { date, time, userName: name, userPhone: phone, participantCount: participants, paymentMethod, notes, isCloseRequested } = booking;

  return (
    <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">예약이 완료되었습니다!</h1>
        <p className="text-[#b3b3b3] text-base leading-relaxed">
          {name}님의 소중한 예약이 정상적으로 접수되었습니다.<br />
          입력하신 번호({phone})로 예약 확정 메시지가 발송되었습니다.
        </p>
      </div>

      <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden mb-10 shadow-2xl shadow-black/50">
        <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold">예약 상세 내역</h2>
          <span className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full font-bold border border-blue-500/20">예약 완료</span>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <span className="text-[#b3b3b3]">선택 시나리오</span>
            <span className="font-bold text-white text-right">{theme.title}</span>
          </div>
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
            <span className="font-bold text-white">{paymentMethod === 'bank-transfer' ? '계좌이체 (선입금)' : '현장 결제'}</span>
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
            className="flex items-center justify-center py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all text-white"
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
