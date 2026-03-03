
import React, { useState, useEffect } from 'react';
import { DEFAULT_ADMIN_SETTINGS, THEMES, STORES } from '../constants';
import { AdminSettings, Theme, BookingData, ClosedSlot, Store, Inquiry } from '../types';
import { dataService } from '../src/services/dataService';
import { isWeekendOrHoliday } from '../src/utils/holiday';
import { 
  Save, Plus, Trash2, LayoutDashboard, Calendar, FileText, Settings, 
  User, Phone, Users, Clock, MessageSquare, XCircle, Home as HomeIcon, 
  CalendarX, CheckCircle, AlertCircle, Upload, CreditCard, Copy, Check,
  Store as StoreIcon, Globe, MapPin, Send, Mail
} from 'lucide-react';

import { compressImage } from '../src/utils/imageUtils';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'themes' | 'stores' | 'site' | 'inquiries'>('bookings');
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [themes, setThemes] = useState<Theme[]>(THEMES);
  const [stores, setStores] = useState<Store[]>(STORES);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [closedSlots, setClosedSlots] = useState<ClosedSlot[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [searchTheme, setSearchTheme] = useState('');
  const [sortOrder, setSortOrder] = useState<'createdAt' | 'gameDate'>('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, t, b, c, i, st] = await Promise.all([
          dataService.getSettings(),
          dataService.getThemes(),
          dataService.getBookings(),
          dataService.getClosedSlots(),
          dataService.getInquiries(),
          dataService.getStores()
        ]);
        
        setSettings(s);
        setThemes(t);
        setBookings(b);
        setClosedSlots(c);
        setInquiries(i);
        setStores(st);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePublish = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      await Promise.all([
        dataService.saveSettings(settings),
        dataService.saveThemes(themes),
        dataService.saveClosedSlots(closedSlots),
        dataService.saveStores(stores),
      ]);
      setIsDirty(false);
      alert('모든 변경사항이 Supabase DB에 즉시 반영되었습니다.');
    } catch (error: any) {
      console.error("Failed to publish changes:", error);
      const msg = error.message || "";
      if (msg.includes('row-level security policy')) {
        alert("오류: Supabase DB 테이블(site_contents) 권한(RLS) 설정이 필요합니다.\n\n해결 방법:\n1. Supabase 대시보드 -> Table Editor -> site_contents 선택\n2. 상단 'RLS is enabled' 옆의 'Add policy' 클릭\n3. 'Enable read/write access for all' 또는 'Full access' 템플릿 선택\n4. Target Roles: 'anon' 선택\n5. Review -> Save 클릭 후 다시 시도해 주세요.");
      } else {
        alert("변경사항 반영에 실패했습니다. 네트워크 상태를 확인해 주세요.\n오류 내용: " + msg);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: BookingData['status']) => {
    try {
      await dataService.updateBookingStatus(bookingId, status);
      const updated = bookings.map(b => b.id === bookingId ? { ...b, status } : b);
      setBookings(updated);
    } catch (error) {
      console.error("Failed to update booking status:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, path: string, oldUrl: string | undefined, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image to WebP with 0.8 quality
        const compressedBlob = await compressImage(file, 0.8);
        
        // Delete old image if exists
        if (oldUrl) {
          await dataService.deleteImage(oldUrl);
        }

        // Upload new image
        const publicUrl = await dataService.uploadImage(compressedBlob, path);
        callback(publicUrl);
        setIsDirty(true);
      } catch (error: any) {
        console.error("Image upload failed:", error);
        const msg = error.message || "";
        
        if (msg.includes('Bucket not found')) {
          alert("오류: Supabase Storage에 'images' 버킷이 없습니다.\n\n해결 방법:\n1. Supabase 대시보드 -> Storage 이동\n2. 'images'라는 이름의 New Bucket 생성\n3. 'Public bucket' 체크 활성화\n4. 저장 후 다시 시도해 주세요.");
        } else if (msg.includes('row-level security policy')) {
          alert("오류: Supabase Storage 권한(RLS) 설정이 필요합니다.\n\n해결 방법:\n1. Supabase 대시보드 -> Storage -> Policies 이동\n2. 'images' 버킷의 'Storage policies'에서 'New Policy' 클릭\n3. 'For full customization' 선택\n4. Policy Name: 'Allow Public Access'\n5. Allowed Operations: 'INSERT', 'SELECT', 'DELETE' 모두 체크\n6. Target Roles: 'anon' 선택\n7. Policy Definition: 입력창의 기존 내용을 모두 지우고 'true' 라고만 입력\n8. Review -> Save 클릭 후 다시 시도해 주세요.");
        } else {
          alert("이미지 업로드에 실패했습니다. 네트워크 상태나 파일 용량을 확인해 주세요.\n오류 내용: " + msg);
        }
      }
    }
  };

  const toggleClosure = (date: string, themeId: string, time: string) => {
    const exists = closedSlots.find(c => c.date === date && c.themeId === themeId && c.time === time);
    let updated;
    if (exists) {
      updated = closedSlots.filter(c => !(c.date === date && c.themeId === themeId && c.time === time));
    } else {
      updated = [...closedSlots, { date, themeId, time }];
    }
    setClosedSlots(updated);
    setIsDirty(true);
  };

  const NavButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 transition-all rounded-lg text-sm w-full text-left ${
        activeTab === id ? 'bg-white text-black font-bold shadow-lg' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Nav */}
        <div className="lg:w-64 space-y-2 shrink-0">
          <h1 className="text-xl font-bold mb-8 px-4">CONTROL CENTER</h1>
          <NavButton id="bookings" icon={Calendar} label="예약 현황" />
          <NavButton id="inquiries" icon={Mail} label="문의 내역" />
          <NavButton id="themes" icon={LayoutDashboard} label="테마상품 설정" />
          <NavButton id="stores" icon={StoreIcon} label="매장 등록/관리" />
          <NavButton id="site" icon={Settings} label="사이트 설정" />
          
          <div className="pt-8 px-4">
            <button 
              onClick={handlePublish}
              disabled={!isDirty || isPublishing}
              className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                (isDirty && !isPublishing)
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {isPublishing ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span>{isPublishing ? '적용 중...' : '홈페이지 적용하기'}</span>
            </button>
            <p className="text-[10px] text-white/20 mt-2 text-center">
              {isDirty ? '수정된 내용이 있습니다. 적용해주세요.' : '현재 모든 내용이 적용된 상태입니다.'}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* 1. 예약 현황 */}
          {activeTab === 'bookings' && (
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <h2 className="text-2xl font-bold">실시간 예약 현황</h2>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2">
                      <span className="text-[10px] text-white/40 uppercase font-bold">기간</span>
                      <input 
                        type="date" 
                        value={searchDate}
                        onChange={(e) => { setSearchDate(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent text-white text-xs p-2 outline-none focus:text-white"
                      />
                      <span className="text-white/20">~</span>
                      <input 
                        type="date" 
                        value={searchEndDate}
                        onChange={(e) => { setSearchEndDate(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent text-white text-xs p-2 outline-none focus:text-white"
                      />
                    </div>
                    <select 
                      value={sortOrder}
                      onChange={(e) => { setSortOrder(e.target.value as any); setCurrentPage(1); }}
                      className="bg-white/5 border border-white/10 text-white text-xs rounded-lg p-2 outline-none focus:border-white/30"
                    >
                      <option value="createdAt">신청일순</option>
                      <option value="gameDate">게임일순</option>
                    </select>
                    <select 
                      value={searchTheme}
                      onChange={(e) => { setSearchTheme(e.target.value); setCurrentPage(1); }}
                      className="bg-white/5 border border-white/10 text-white text-xs rounded-lg p-2 outline-none focus:border-white/30"
                    >
                      <option value="">모든 테마</option>
                      {themes.map(t => (
                        <option key={t.id} value={t.title}>{t.title}</option>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      placeholder="예약자명/연락처 검색"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="bg-white/5 border border-white/10 text-white text-xs rounded-lg p-2 outline-none focus:border-white/30 flex-grow md:w-48"
                    />
                  </div>
                </div>
                {bookings.length === 0 ? (
                  <div className="p-20 text-center bg-white/5 rounded-3xl border border-white/5 text-white/40 italic">
                    접수된 예약 내역이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {(() => {
                        const filtered = bookings.filter(b => {
                          const matchesSearch = b.userName.includes(searchTerm) || b.userPhone.includes(searchTerm);
                          const matchesStartDate = searchDate ? b.date >= searchDate : true;
                          const matchesEndDate = searchEndDate ? b.date <= searchEndDate : true;
                          const matchesTheme = searchTheme ? b.themeTitle === searchTheme : true;
                          return matchesSearch && matchesStartDate && matchesEndDate && matchesTheme;
                        });

                        const sorted = [...filtered].sort((a, b) => {
                          if (sortOrder === 'createdAt') {
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                          } else {
                            const dateA = new Date(`${a.date} ${a.time}`).getTime();
                            const dateB = new Date(`${b.date} ${b.time}`).getTime();
                            return dateB - dateA;
                          }
                        });

                        const totalPages = Math.ceil(sorted.length / itemsPerPage);
                        const paged = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                        return (
                          <>
                            {paged.map((booking) => (
                              <div key={booking.id} className={`bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 flex flex-col gap-6 transition-opacity ${booking.status === 'cancelled' ? 'opacity-40 grayscale' : ''}`}>
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                  <div className="flex gap-6">
                                    <div className="w-20 h-24 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                      <img src={booking.themePoster} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-white/60">{booking.date} {booking.time}</span>
                                        {booking.status === 'cancelled' && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded">예약 취소</span>}
                                        {booking.status === 'paid' && <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded">결제 완료</span>}
                                        {booking.status === 'confirmed' && <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded">예약 완료</span>}
                                        {booking.isCloseRequested && <span className="bg-[#dc2626] text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">마감 요청됨</span>}
                                      </div>
                                      <h3 className="text-xl font-bold mb-2">{booking.themeTitle}</h3>
                                      <div className="flex flex-wrap gap-4 text-sm text-white/40">
                                        <span className="flex items-center gap-1"><User size={14}/> {booking.userName}</span>
                                        <span className="flex items-center gap-1"><Phone size={14}/> {booking.userPhone}</span>
                                        <span className="flex items-center gap-1"><Users size={14}/> {booking.participantCount}명</span>
                                        <span className="flex items-center gap-1"><CreditCard size={14}/> {booking.paymentMethod === 'bank-transfer' ? '계좌이체' : '현장결제'}</span>
                                      </div>
                                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-widest font-mono">
                                        <Clock size={10} /> 신청일시: {new Date(booking.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <select 
                                      value={booking.status}
                                      onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value as any)}
                                      className="bg-black border border-white/10 text-white text-sm rounded-lg p-2 outline-none"
                                    >
                                      <option value="confirmed">예약 완료</option>
                                      <option value="paid">결제 완료</option>
                                      <option value="cancelled">예약 취소</option>
                                    </select>
                                  </div>
                                </div>
                                {(booking.notes || booking.isCloseRequested) && (
                                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                    {booking.isCloseRequested && <p className="text-xs text-red-500 font-bold mb-2">⚠️ 마감 요청: 이 팀 외 추가 인원을 받지 않기를 원함</p>}
                                    {booking.notes && <p className="text-sm text-white/60 italic">"{booking.notes}"</p>}
                                  </div>
                                )}
                              </div>
                            ))}

                            {totalPages > 1 && (
                              <div className="flex justify-center gap-2 pt-8">
                                {[...Array(totalPages)].map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                      currentPage === i + 1 ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'
                                    }`}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8 pt-12 border-t border-white/5">
                <h2 className="text-2xl font-bold">특정 일자/시간 마감 설정</h2>
                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5">
                  <p className="text-sm text-white/40 mb-8 flex items-center gap-2"><AlertCircle size={16} /> 예약이 이미 찬 슬롯 외에, 매장 사정으로 닫아야 하는 슬롯을 클릭하여 마감하세요.</p>
                  <div className="space-y-10">
                    {themes.map(t => (
                      <div key={t.id} className="space-y-4">
                        <h3 className="font-bold text-lg text-white/80">{t.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-8 gap-3">
                          {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                            const date = new Date();
                            // Fix: Ensure we start from today correctly in local time
                            date.setHours(0, 0, 0, 0);
                            date.setDate(date.getDate() + dayOffset);
                            const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
                            const isWeekend = isWeekendOrHoliday(date);
                            let slots: string[] = [];
                            if (t.useSeparateWeekdaySlots) {
                              slots = isWeekend ? (t.customSlots || []) : (t.weekdaySlots || []);
                            } else {
                              slots = t.customSlots || [];
                            }
                            
                            return slots.filter(s => s).map(time => {
                              const isClosed = closedSlots.some(cs => cs.date === dateStr && cs.themeId === t.id && cs.time === time);
                              return (
                                <button 
                                  key={`${dateStr}-${time}`}
                                  onClick={() => toggleClosure(dateStr, t.id, time)}
                                  className={`text-[10px] p-2 rounded-lg border transition-all flex flex-col items-center ${
                                    isClosed 
                                    ? 'bg-[#dc2626] border-[#dc2626] text-white font-bold' 
                                    : 'border-white/10 hover:border-white/30 text-white/40'
                                  }`}
                                >
                                  <span>{dateStr.slice(5)}</span>
                                  <span className="text-sm">{time}</span>
                                  <span className="mt-1">{isClosed ? 'CLOSED' : 'OPEN'}</span>
                                </button>
                              );
                            });
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 문의 내역 */}
          {activeTab === 'inquiries' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold">고객 문의 내역</h2>
              {inquiries.length === 0 ? (
                <div className="p-20 text-center bg-white/5 rounded-3xl border border-white/5 text-white/40 italic">
                  접수된 문의 내역이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-white/60 mb-1">{inquiry.author}</p>
                          <p className="text-[10px] text-white/20 uppercase tracking-widest">{new Date(inquiry.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{inquiry.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. 테마/슬롯 관리 */}
          {activeTab === 'themes' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">테마 및 상품 관리</h2>
                <button 
                  onClick={() => {
                    const newTheme: Theme = { 
                      id: `theme-${Date.now()}`, 
                      title: '새 테마', 
                      posterUrl: '', 
                      synopsis: '', 
                      minPlayers: 2, 
                      maxPlayers: 6, 
                      duration: 60, 
                      difficulty: 3, 
                      fearLevel: 0, 
                      price: 20000,
                      startDate: '',
                      endDate: ''
                    };
                    setThemes(prev => [...prev, newTheme]);
                    setIsDirty(true);
                  }}
                  className="px-4 py-2 bg-white text-black font-bold rounded-lg text-sm flex items-center gap-2"
                >
                  <Plus size={18} /> 새 테마 등록
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {themes.map((theme, idx) => (
                  <div key={theme.id} className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
                    <div className="space-y-4">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center relative group">
                        {theme.posterUrl ? (
                          <img src={theme.posterUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-white/20 text-xs">이미지 없음</div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                          <Upload size={24} className="mb-2" />
                          <span className="text-[10px]">이미지 업로드</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            handleFileUpload(e, 'themes', theme.posterUrl, (url) => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], posterUrl: url };
                                return updated;
                              });
                            });
                          }} />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">테마 명</label>
                          <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                            value={theme.title} onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                setIsDirty(true);
                                return updated;
                              });
                            }} />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">소속 매장</label>
                          <select className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white text-sm"
                            value={theme.storeId || ''}
                            onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], storeId: e.target.value };
                                setIsDirty(true);
                                return updated;
                              });
                            }}
                          >
                            <option value="">매장 선택 없음</option>
                            {stores.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">가격 (1인당)</label>
                          <input type="number" className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                            value={theme.price} onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], price: parseInt(e.target.value) || 0 };
                                setIsDirty(true);
                                return updated;
                              });
                            }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">최소 인원</label>
                          <input type="number" className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                            value={theme.minPlayers} onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], minPlayers: parseInt(e.target.value) || 0 };
                                setIsDirty(true);
                                return updated;
                              });
                            }} />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">최대 인원</label>
                          <input type="number" className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                            value={theme.maxPlayers} onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], maxPlayers: parseInt(e.target.value) || 0 };
                                setIsDirty(true);
                                return updated;
                              });
                            }} />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">난이도 (1-5)</label>
                          <input type="number" min="1" max="5" className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                            value={theme.difficulty} onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], difficulty: parseInt(e.target.value) || 0 };
                                setIsDirty(true);
                                return updated;
                              });
                            }} />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">공포도 (0-5)</label>
                          <input type="number" min="0" max="5" className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                            value={theme.fearLevel} onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], fearLevel: parseInt(e.target.value) || 0 };
                                setIsDirty(true);
                                return updated;
                              });
                            }} />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">소요시간 (분)</label>
                          <input type="number" className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                            value={theme.duration} onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], duration: parseInt(e.target.value) || 0 };
                                setIsDirty(true);
                                return updated;
                              });
                            }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">노출 시작일 (Coming Soon 해제)</label>
                          <input type="date" className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white text-sm" 
                            value={theme.startDate || ''} onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], startDate: e.target.value };
                                setIsDirty(true);
                                return updated;
                              });
                            }} />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 mb-1 block">노출 종료일 (이후 Coming Soon)</label>
                          <input type="date" className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white text-sm" 
                            value={theme.endDate || ''} onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], endDate: e.target.value };
                                setIsDirty(true);
                                return updated;
                              });
                            }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                        <input 
                          type="checkbox" 
                          id={`showOnMain-${theme.id}`}
                          className="w-5 h-5 rounded border-white/10 bg-black text-white focus:ring-0"
                          checked={theme.showOnMain ?? true}
                          onChange={e => {
                            setThemes(prev => {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], showOnMain: e.target.checked };
                              setIsDirty(true);
                              return updated;
                            });
                          }}
                        />
                        <label htmlFor={`showOnMain-${theme.id}`} className="text-sm font-bold cursor-pointer">
                          메인 페이지에 진열 (체크 시 메인 화면 테마 리스트에 노출됩니다)
                        </label>
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">시간 슬롯 설정 (쉼표 구분)</label>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <input 
                            type="checkbox" 
                            id={`separate-${theme.id}`}
                            checked={theme.useSeparateWeekdaySlots || false}
                            onChange={e => {
                              setThemes(prev => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], useSeparateWeekdaySlots: e.target.checked };
                                setIsDirty(true);
                                return updated;
                              });
                            }}
                            className="w-4 h-4 accent-white"
                          />
                          <label htmlFor={`separate-${theme.id}`} className="text-xs text-white/60 cursor-pointer">[평일 시간대 별도 설정하기]</label>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                {theme.useSeparateWeekdaySlots ? '주말/공통 시간 슬롯' : '기본 시간 슬롯'}
                              </label>
                              <button 
                                onClick={() => {
                                  const start = 10 * 60; // 10:00
                                  const end = 23 * 60; // 23:00
                                  const interval = theme.duration || 150; 
                                  const newSlots = [];
                                  for (let t = start; t <= end; t += interval) {
                                    const h = Math.floor(t / 60);
                                    const m = t % 60;
                                    newSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                  }
                                  setThemes(prev => {
                                    const updated = [...prev];
                                    updated[idx] = { ...updated[idx], customSlots: newSlots };
                                    setIsDirty(true);
                                    return updated;
                                  });
                                }}
                                className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] hover:bg-white/10 transition-colors"
                              >
                                {theme.duration || 150}분 간격 자동 생성
                              </button>
                            </div>
                            <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white font-mono text-sm" 
                              placeholder="12:00, 14:00, 16:00..."
                              value={theme.customSlots?.join(', ') || ''} 
                              onChange={e => {
                                const val = e.target.value;
                                setThemes(prev => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], customSlots: val.split(',').map(s => s.trim()) };
                                  setIsDirty(true);
                                  return updated;
                                });
                              }} />
                          </div>

                          {theme.useSeparateWeekdaySlots && (
                            <div className="p-4 bg-black/40 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest">평일 전용 시간 슬롯</label>
                                <button 
                                  onClick={() => {
                                    const start = 10 * 60; // 10:00
                                    const end = 23 * 60; // 23:00
                                    const interval = theme.duration || 150; 
                                    const newSlots = [];
                                    for (let t = start; t <= end; t += interval) {
                                      const h = Math.floor(t / 60);
                                      const m = t % 60;
                                      newSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                    }
                                    setThemes(prev => {
                                      const updated = [...prev];
                                      updated[idx] = { ...updated[idx], weekdaySlots: newSlots };
                                      setIsDirty(true);
                                      return updated;
                                    });
                                  }}
                                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] hover:bg-white/10 transition-colors"
                                >
                                  {theme.duration || 150}분 간격 자동 생성
                                </button>
                              </div>
                              <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white font-mono text-sm" 
                                placeholder="19:00, 21:00..."
                                value={theme.weekdaySlots?.join(', ') || ''} 
                                onChange={e => {
                                  const val = e.target.value;
                                  setThemes(prev => {
                                    const updated = [...prev];
                                    updated[idx] = { ...updated[idx], weekdaySlots: val.split(',').map(s => s.trim()) };
                                    setIsDirty(true);
                                    return updated;
                                  });
                                }} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">소개글 (시놉시스)</label>
                        <textarea rows={3} className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white resize-none text-sm" 
                          value={theme.synopsis} onChange={e => {
                            setThemes(prev => {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], synopsis: e.target.value };
                              setIsDirty(true);
                              return updated;
                            });
                          }} />
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          if (window.confirm(`정말 '${theme.title}' 테마를 삭제하시겠습니까?`)) {
                            setThemes(prev => prev.filter(t => t.id !== theme.id));
                            setIsDirty(true);
                          }
                        }} 
                        className="w-full mt-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Trash2 size={14} /> 이 테마 삭제하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 매장 관리 */}
          {activeTab === 'stores' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">매장 등록 및 관리</h2>
                <button 
                  onClick={() => {
                    const newStore: Store = { 
                      id: `store-${Date.now()}`, 
                      name: '새 매장', 
                      phone: '', 
                      weekdayHours: '10:00~22:00', 
                      weekendHours: '10:00~23:00', 
                      address: '' 
                    };
                    setStores([...stores, newStore]);
                    setIsDirty(true);
                  }}
                  className="px-4 py-2 bg-white text-black font-bold rounded-lg text-sm flex items-center gap-2"
                >
                  <Plus size={18} /> 새 매장 추가
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {stores.map((store, idx) => (
                  <div key={store.id} className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">매장 명</label>
                        <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                          value={store.name} onChange={e => {
                            const updated = [...stores];
                            updated[idx].name = e.target.value;
                            setStores(updated);
                            setIsDirty(true);
                          }} />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">매장 연락처</label>
                        <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                          value={store.phone} onChange={e => {
                            const updated = [...stores];
                            updated[idx].phone = e.target.value;
                            setStores(updated);
                            setIsDirty(true);
                          }} />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">평일 운영시간</label>
                        <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                          value={store.weekdayHours} onChange={e => {
                            const updated = [...stores];
                            updated[idx].weekdayHours = e.target.value;
                            setStores(updated);
                            setIsDirty(true);
                          }} />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">주말 운영시간</label>
                        <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                          value={store.weekendHours} onChange={e => {
                            const updated = [...stores];
                            updated[idx].weekendHours = e.target.value;
                            setStores(updated);
                            setIsDirty(true);
                          }} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-white/40 mb-1 block">매장 이미지 (Find Us 섹션 노출)</label>
                        <div className="h-32 bg-black rounded-xl border border-white/10 flex items-center justify-center relative group overflow-hidden">
                          {store.imageUrl ? <img src={store.imageUrl} className="w-full h-full object-cover" /> : <span className="text-white/20 text-xs">이미지 없음</span>}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                            <Upload size={24} className="mb-2" />
                            <span className="text-[10px]">이미지 업로드</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              handleFileUpload(e, 'stores', store.imageUrl, (url) => {
                                const updated = [...stores];
                                updated[idx].imageUrl = url;
                                setStores(updated);
                              });
                            }} />
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-white/40 mb-1 block">매장 주소</label>
                        <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                          value={store.address} onChange={e => {
                            const updated = [...stores];
                            updated[idx].address = e.target.value;
                            setStores(updated);
                            setIsDirty(true);
                          }} />
                      </div>
                    </div>
                    <button onClick={() => {
                      if (window.confirm('매장을 삭제하시겠습니까?')) {
                        setStores(stores.filter(s => s.id !== store.id));
                        setIsDirty(true);
                      }
                    }} className="text-[#dc2626] text-xs font-bold flex items-center gap-1 hover:underline">
                      <Trash2 size={14} /> 이 매장 삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. 사이트 설정 */}
          {activeTab === 'site' && (
            <div className="space-y-12">
              <div className="space-y-8">
                <h2 className="text-2xl font-bold">사이트 설정 및 브랜드 관리</h2>
                
                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-8">
                  <h3 className="text-lg font-bold border-b border-white/5 pb-4">브랜드 이미지 (파일 업로드)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-4">
                      <label className="text-sm font-bold block">로고 (Logo)</label>
                      <div className="h-20 bg-black rounded-xl border border-white/10 flex items-center justify-center relative group overflow-hidden">
                        {settings.logoUrl ? <img src={settings.logoUrl} className="h-full object-contain p-2" /> : <span className="text-white/20 text-xs">로고 없음</span>}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Upload size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            handleFileUpload(e, 'brand', settings.logoUrl, (url) => {
                              setSettings(prev => ({ ...prev, logoUrl: url }));
                            });
                          }} />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold block">파비콘 (Favicon)</label>
                      <div className="h-20 bg-black rounded-xl border border-white/10 flex items-center justify-center relative group overflow-hidden">
                        {settings.faviconUrl ? <img src={settings.faviconUrl} className="w-10 h-10 object-contain" /> : <span className="text-white/20 text-xs">파비콘 없음</span>}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Upload size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            handleFileUpload(e, 'brand', settings.faviconUrl, (url) => {
                              setSettings(prev => ({ ...prev, faviconUrl: url }));
                            });
                          }} />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold block">링크 썸네일 (OG Image)</label>
                      <div className="h-20 bg-black rounded-xl border border-white/10 flex items-center justify-center relative group overflow-hidden">
                        {settings.thumbnailUrl ? <img src={settings.thumbnailUrl} className="w-full h-full object-cover" /> : <span className="text-white/20 text-xs">썸네일 없음</span>}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Upload size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            handleFileUpload(e, 'brand', settings.thumbnailUrl, (url) => {
                              setSettings(prev => ({ ...prev, thumbnailUrl: url }));
                            });
                          }} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-8">
                  <h3 className="text-lg font-bold border-b border-white/5 pb-4">메인 화면 이미지 (파일 업로드)</h3>
                  <div>
                    <label className="text-sm font-bold mb-4 block">메인 히어로 배경 이미지</label>
                    <div className="h-48 bg-black rounded-xl border border-white/10 flex items-center justify-center relative group overflow-hidden">
                      {settings.homeConfig.heroImageUrl ? <img src={settings.homeConfig.heroImageUrl} className="w-full h-full object-cover" /> : <span className="text-white/20 text-xs">이미지 없음</span>}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                        <Upload size={32} className="mb-2" />
                        <span>히어로 이미지 업로드</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          handleFileUpload(e, 'home', settings.homeConfig.heroImageUrl, (url) => {
                            setSettings(prev => ({ ...prev, homeConfig: { ...prev.homeConfig, heroImageUrl: url } }));
                          });
                        }} />
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {settings.homeConfig.introImages.map((url, i) => (
                      <div key={i} className="space-y-2">
                        <label className="text-xs text-white/40">인트로 포인트 {i+1} 이미지</label>
                        <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/10 relative group">
                          {url ? <img src={url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center text-white/20 text-xs">이미지 없음</div>}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Upload size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              handleFileUpload(e, 'home', url, (newUrl) => {
                                setSettings(prev => {
                                  const updatedImages = [...prev.homeConfig.introImages];
                                  updatedImages[i] = newUrl;
                                  return { ...prev, homeConfig: { ...prev.homeConfig, introImages: updatedImages } };
                                });
                              });
                            }} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <section className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-6">
                  <h2 className="text-xl font-bold border-l-4 border-white pl-3 flex items-center gap-2"><CreditCard size={20}/> 계좌 정보 설정</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">은행명</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none" 
                        value={settings.bankInfo.bankName} onChange={e => {
                          setSettings(prev => ({...prev, bankInfo: {...prev.bankInfo, bankName: e.target.value}}));
                          setIsDirty(true);
                        }} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">계좌번호</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none" 
                        value={settings.bankInfo.accountNumber} onChange={e => {
                          setSettings(prev => ({...prev, bankInfo: {...prev.bankInfo, accountNumber: e.target.value}}));
                          setIsDirty(true);
                        }} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">예금주</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none" 
                        value={settings.bankInfo.holderName} onChange={e => {
                          setSettings(prev => ({...prev, bankInfo: {...prev.bankInfo, holderName: e.target.value}}));
                          setIsDirty(true);
                        }} />
                    </div>
                  </div>
                </section>

                <section className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-6">
                  <h2 className="text-xl font-bold border-l-4 border-white pl-3 flex items-center gap-2"><Globe size={20}/> 이용약관 및 공지사항 설정</h2>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 p-6 bg-black/40 rounded-2xl border border-white/5">
                      <h3 className="font-bold text-white/60 text-sm uppercase tracking-widest">공지사항 및 주의사항 (Information 페이지)</h3>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">공지사항 제목</label>
                        <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none focus:border-white" 
                          value={settings.noticeTitle} onChange={e => {
                            setSettings({...settings, noticeTitle: e.target.value});
                            setIsDirty(true);
                          }} />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">공지사항 내용</label>
                        <textarea className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-white" rows={6}
                          value={settings.noticeContent} onChange={e => {
                            setSettings({...settings, noticeContent: e.target.value});
                            setIsDirty(true);
                          }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 p-6 bg-black/40 rounded-2xl border border-white/5">
                      <h3 className="font-bold text-white/60 text-sm uppercase tracking-widest">이용약관 및 개인정보처리방침</h3>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">이용약관</label>
                        <textarea className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-white" rows={6}
                          value={settings.termsContent} onChange={e => {
                            setSettings({...settings, termsContent: e.target.value});
                            setIsDirty(true);
                          }} />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">개인정보처리방침</label>
                        <textarea className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-white" rows={6}
                          value={settings.privacyContent} onChange={e => {
                            setSettings({...settings, privacyContent: e.target.value});
                            setIsDirty(true);
                          }} />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-6">
                  <h2 className="text-xl font-bold border-l-4 border-white pl-3 flex items-center gap-2"><Globe size={20}/> 기본 정보 및 SNS 설정</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">사업자 등록번호</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none" 
                        value={settings.businessInfo.registrationNumber} onChange={e => {
                          setSettings({...settings, businessInfo: {...settings.businessInfo, registrationNumber: e.target.value}});
                          setIsDirty(true);
                        }} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">대표자명</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none" 
                        value={settings.businessInfo.representativeName} onChange={e => {
                          setSettings({...settings, businessInfo: {...settings.businessInfo, representativeName: e.target.value}});
                          setIsDirty(true);
                        }} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">INSTAGRAM 링크</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none" 
                        value={settings.businessInfo.instagramUrl} onChange={e => {
                          setSettings({...settings, businessInfo: {...settings.businessInfo, instagramUrl: e.target.value}});
                          setIsDirty(true);
                        }} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">NAVER 링크</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none" 
                        value={settings.businessInfo.naverUrl} onChange={e => {
                          setSettings({...settings, businessInfo: {...settings.businessInfo, naverUrl: e.target.value}});
                          setIsDirty(true);
                        }} />
                    </div>
                  </div>
                </section>

                <section className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-6">
                  <h2 className="text-xl font-bold border-l-4 border-white pl-3 flex items-center gap-2"><MessageSquare size={20}/> SMS 자동 발송 설정</h2>
                  <div className="space-y-8">
                    <div className="p-6 bg-black rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold">예약 완료 즉시 발송</h3>
                        <input type="checkbox" checked={settings.smsTemplates.onBooking.enabled} 
                          onChange={e => {
                            setSettings({...settings, smsTemplates: {...settings.smsTemplates, onBooking: {...settings.smsTemplates.onBooking, enabled: e.target.checked}}});
                            setIsDirty(true);
                          }} className="accent-white w-5 h-5"/>
                      </div>
                      <p className="text-[10px] text-white/30 italic">변수: {'{name}, {theme}, {date}, {time}'}</p>
                      <textarea className="w-full bg-[#121212] border border-white/10 p-4 rounded-xl text-sm outline-none" rows={3}
                        value={settings.smsTemplates.onBooking.content}
                        onChange={e => {
                          setSettings({...settings, smsTemplates: {...settings.smsTemplates, onBooking: {...settings.smsTemplates.onBooking, content: e.target.value}}});
                          setIsDirty(true);
                        }} />
                    </div>
                    <div className="p-6 bg-black rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold">방문 1일 전 안내 발송</h3>
                        <div className="flex items-center gap-4">
                          <input type="time" className="bg-[#121212] border border-white/10 text-xs p-1 rounded" 
                            value={settings.smsTemplates.dayBefore.time}
                            onChange={e => {
                              setSettings({...settings, smsTemplates: {...settings.smsTemplates, dayBefore: {...settings.smsTemplates.dayBefore, time: e.target.value}}});
                              setIsDirty(true);
                            }} />
                          <input type="checkbox" checked={settings.smsTemplates.dayBefore.enabled} 
                            onChange={e => {
                              setSettings({...settings, smsTemplates: {...settings.smsTemplates, dayBefore: {...settings.smsTemplates.dayBefore, enabled: e.target.checked}}});
                              setIsDirty(true);
                            }} className="accent-white w-5 h-5"/>
                        </div>
                      </div>
                      <textarea className="w-full bg-[#121212] border border-white/10 p-4 rounded-xl text-sm outline-none" rows={3}
                        value={settings.smsTemplates.dayBefore.content}
                        onChange={e => {
                          setSettings({...settings, smsTemplates: {...settings.smsTemplates, dayBefore: {...settings.smsTemplates.dayBefore, content: e.target.value}}});
                          setIsDirty(true);
                        }} />
                    </div>
                  </div>
                </section>

                <section className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 space-y-6">
                  <h2 className="text-xl font-bold border-l-4 border-white pl-3">기본 연락처 및 슬롯 설정</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">관리자 휴대폰 (문의 알림 수신)</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none" 
                        value={settings.managerPhone} onChange={e => {
                          setSettings({...settings, managerPhone: e.target.value});
                          setIsDirty(true);
                        }} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">관리자 이메일 (문의 수신용)</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none" 
                        value={settings.managerEmail} onChange={e => {
                          setSettings({...settings, managerEmail: e.target.value});
                          setIsDirty(true);
                        }} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">기본 평일 운영시간 (표시용)</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none font-mono text-sm" 
                        placeholder="예: 평일 17:00~24:00"
                        value={settings.weekdaySlots} onChange={e => {
                          setSettings({...settings, weekdaySlots: e.target.value});
                          setIsDirty(true);
                        }} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">기본 주말 운영시간 (표시용)</label>
                      <input className="w-full bg-black border border-white/10 p-3 rounded-lg outline-none font-mono text-sm" 
                        placeholder="예: 주말 10:00~24:00"
                        value={settings.weekendSlots} onChange={e => {
                          setSettings({...settings, weekendSlots: e.target.value});
                          setIsDirty(true);
                        }} />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
