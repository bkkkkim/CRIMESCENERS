import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase, Calendar, ShieldAlert, Check } from 'lucide-react';
import { Suspect, Theme } from '../types';

interface SuspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

const SuspectModal: React.FC<SuspectModalProps> = ({ isOpen, onClose, theme }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const suspects = theme.suspects || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-3 sm:px-4 md:px-6 pt-[max(1rem,calc(env(safe-area-inset-top)+0.75rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] h-[100dvh] max-h-[100dvh] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl min-h-[340px] sm:min-h-[440px] max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] bg-[#161616] border border-white/15 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-10 my-auto"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1f1a1a] via-[#161616] to-[#161616] shrink-0 gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#dc2626] animate-pulse shrink-0" />
                  <h3 className="text-base sm:text-xl font-black text-white tracking-tight truncate">
                    사건 관계자 정보
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10 font-en shrink-0">
                    {suspects.length} CHARACTERS
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-white/50 pl-4 truncate">
                  ({theme.title})
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0 cursor-pointer active:scale-95"
                aria-label="닫기"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Sub-banner notice */}
            <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-red-950/30 border-b border-red-900/30 text-[11px] sm:text-xs text-red-300 flex items-center gap-2 shrink-0">
              <ShieldAlert size={13} className="shrink-0 text-red-400" />
              <span className="truncate sm:whitespace-normal">각 인물의 나이, 성별, 직업 및 특징을 확인하고 원하는 배역을 선택해 보세요.</span>
            </div>

            {/* Body / Suspect List */}
            <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 overscroll-contain space-y-3 sm:space-y-5 touch-pan-y">
              {suspects.length === 0 ? (
                <div className="py-12 sm:py-16 text-center text-white/40 space-y-2">
                  <User size={36} className="mx-auto opacity-30 mb-2" />
                  <p className="font-bold text-sm sm:text-base text-white/60">등록된 사건 관계자 정보가 없습니다.</p>
                  <p className="text-xs text-white/40">관리자 페이지에서 사건 관계자(등장인물) 정보를 등록해 주세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                  {suspects.map((suspect, index) => {
                    const ageGender = [suspect.age, suspect.gender].filter(Boolean).join(' · ');
                    return (
                      <div
                        key={suspect.id || `suspect-${index}`}
                        className="bg-[#1f1f1f] hover:bg-[#242424] transition-all rounded-xl sm:rounded-2xl border border-white/10 p-3.5 sm:p-5 flex gap-3.5 sm:gap-5 items-start shadow-md group"
                      >
                        {/* 1:1 Aspect Ratio Character Image */}
                        <div className="relative w-20 h-20 sm:w-28 sm:h-28 shrink-0 aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-inner">
                          {suspect.imageUrl ? (
                            <img
                              src={suspect.imageUrl}
                              alt={suspect.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('fallback-icon');
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-white/30 gap-1">
                              <User size={26} className="opacity-40" />
                              <span className="text-[8px] sm:text-[9px] font-medium tracking-tighter opacity-50">NO IMAGE</span>
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-[9px] sm:text-[10px] font-bold text-white/80 px-1.5 py-0.5 rounded border border-white/10 font-en">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Character Details */}
                        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-between">
                            <h4 className="text-sm sm:text-lg font-black text-white tracking-tight truncate">
                              {suspect.name || `인물 ${index + 1}`}
                            </h4>
                            {ageGender && (
                              <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/5 whitespace-nowrap">
                                {ageGender}
                              </span>
                            )}
                          </div>

                          {/* Job / Occupation badge */}
                          {suspect.job && (
                            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-[#dc2626]/15 border border-[#dc2626]/30 text-[11px] sm:text-xs font-bold text-red-300 max-w-full">
                              <Briefcase size={11} className="shrink-0" />
                              <span className="truncate">{suspect.job}</span>
                            </div>
                          )}

                          {/* Description / Story */}
                          {suspect.description && (
                            <p className="text-[11px] sm:text-xs text-[#b3b3b3] leading-relaxed line-clamp-3 md:line-clamp-4 break-keep">
                              {suspect.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#141414] flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={16} className="stroke-[2.5]" />
                확인 완료
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SuspectModal;
