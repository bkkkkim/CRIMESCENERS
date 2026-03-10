
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { dataService } from '../src/services/dataService';

const ContactForm = () => {
  const [form, setForm] = useState({
    title: '',
    email: '',
    phone: '',
    content: '',
    agreed: false
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreed) return alert('개인정보 수집 동의가 필요합니다.');
    
    // Email validation: @ and . in domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return alert('올바른 이메일 주소를 입력해주세요. (예: example@domain.com)');
    }

    // Phone validation: digits only, minimum 11 characters
    const phoneDigits = form.phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 11) {
      return alert('휴대폰 번호를 정확히 입력해주세요. (최소 11자리 숫자가 필요합니다)');
    }
    
    try {
      const settings = await dataService.getSettings();
      const inquiryData = {
        author: `${form.title} (${form.email} / ${phoneDigits})`,
        content: form.content
      };
      
      await dataService.addInquiry(inquiryData);
      
      // Send notification via Aligo API
      try {
        await dataService.sendNotification('contact', inquiryData, settings);
      } catch (notifyErr) {
        console.error("Notification failed", notifyErr);
      }
      
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit inquiry:", error);
      alert("문의 제출에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  if (submitted) return (
    <div className="pt-40 pb-24 text-center px-6">
        <h2 className="text-3xl font-bold mb-4">문의가 접수되었습니다.</h2>
        <p className="text-[#b3b3b3] text-sm md:text-base mb-8">빠른 시일 내에 기입하신 연락처로 답변 드리겠습니다.</p>
        <button onClick={() => setSubmitted(false)} className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors">확인</button>
    </div>
  );

  return (
    <div className="pt-32 md:pt-40 pb-24 px-6 max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 uppercase tracking-tighter font-en">Contact Us</h1>
        <p className="text-[#d1d1d1] text-sm md:text-base opacity-60">궁금하신 사항을 남겨주시면 관리자가 확인 후 연락드립니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        <div className="space-y-2">
          <label className="text-sm font-medium">제목</label>
          <input required className="w-full bg-[#1a1a1a] border border-white/10 p-4 rounded-xl focus:border-white outline-none" 
            value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">답변받을 이메일</label>
            <input type="email" required className="w-full bg-[#1a1a1a] border border-white/10 p-4 rounded-xl focus:border-white outline-none" 
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">휴대폰 번호</label>
            <input required className="w-full bg-[#1a1a1a] border border-white/10 p-4 rounded-xl focus:border-white outline-none" 
              value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">문의 내용</label>
          <textarea required rows={6} className="w-full bg-[#1a1a1a] border border-white/10 p-4 rounded-xl focus:border-white outline-none resize-none" 
            value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
        </div>

        <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <input type="checkbox" id="agree" required checked={form.agreed} onChange={e => setForm({...form, agreed: e.target.checked})} className="mt-1 accent-white w-4 h-4" />
            <label htmlFor="agree" className="text-xs text-[#b3b3b3] leading-relaxed cursor-pointer">
              개인정보 수집 및 이용 동의 (필수)<br />
              수집항목: 제목, 이메일, 휴대폰 번호, 문의내용<br />
              수집목적: 고객 문의에 대한 답변 및 본인 확인
            </label>
          </div>
        </div>

        <button type="submit" className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all">
          <Send size={20} /> 문의 제출하기
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
