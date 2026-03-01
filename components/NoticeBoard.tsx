
import React, { useState, useEffect } from 'react';
import { INITIAL_NOTICES } from '../constants';
import { Notice } from '../types';
import { ChevronRight } from 'lucide-react';
import { dataService } from '../src/services/dataService';

const NoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const loadNotices = async () => {
      const n = await dataService.getNotices();
      setNotices(n);
    };
    loadNotices();
  }, []);

  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-12">공지사항</h1>
      
      {selectedNotice ? (
        <div className="animate-in fade-in duration-500">
          <button onClick={() => setSelectedNotice(null)} className="text-red-500 mb-8 hover:underline">← 목록으로</button>
          <div className="border-b border-white/10 pb-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">{selectedNotice.title}</h2>
            <span className="text-white/40">{selectedNotice.date}</span>
          </div>
          <div className="text-[#b3b3b3] leading-loose whitespace-pre-wrap min-h-[300px]">
            {selectedNotice.content}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <button
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className="w-full p-6 bg-[#1a1a1a] border border-white/5 rounded-2xl flex items-center justify-between hover:border-red-600/30 transition-all text-left"
            >
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  {notice.isImportant && <span className="bg-red-600 text-[10px] font-bold px-2 py-0.5 rounded">중요</span>}
                  <h3 className="text-lg font-bold">{notice.title}</h3>
                </div>
                <span className="text-sm text-white/40">{notice.date}</span>
              </div>
              <ChevronRight className="text-white/20" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
