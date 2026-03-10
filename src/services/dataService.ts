
import { createClient } from '@supabase/supabase-js';
import { Theme, AdminSettings, BookingData, ClosedSlot, Notice, Inquiry, Store } from '../../types';
import { THEMES, DEFAULT_ADMIN_SETTINGS, INITIAL_NOTICES, STORES } from '../../constants';

const SUPABASE_URL = 'https://gkkgprsflomawizioiao.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wlQ4HAA8WN4NRIUNS-DdJg_ZSYUDV9f';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SITE_CONTENT_KEYS = {
  SETTINGS: 'settings',
  THEMES: 'themes',
  NOTICES: 'notices',
  CLOSED_SLOTS: 'closed_slots',
  STORES: 'stores',
};

// Simple in-memory cache
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5000; // 5 seconds

const getCachedData = (key: string) => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache[key] = { data, timestamp: Date.now() };
};

export const dataService = {
  // --- Site Contents (Settings, Themes, etc.) ---
  getSettings: async (): Promise<AdminSettings> => {
    const cached = getCachedData(SITE_CONTENT_KEYS.SETTINGS);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.SETTINGS)
      .single();
    
    const result = (error || !data) ? DEFAULT_ADMIN_SETTINGS : data.value as AdminSettings;
    setCachedData(SITE_CONTENT_KEYS.SETTINGS, result);
    return result;
  },
  saveSettings: async (settings: AdminSettings) => {
    setCachedData(SITE_CONTENT_KEYS.SETTINGS, settings);
    const { error } = await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.SETTINGS, value: settings }, { onConflict: 'key' });
    if (error) throw error;
  },

  getThemes: async (): Promise<Theme[]> => {
    const cached = getCachedData(SITE_CONTENT_KEYS.THEMES);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.THEMES)
      .single();
    
    const result = (error || !data) ? THEMES : data.value as Theme[];
    setCachedData(SITE_CONTENT_KEYS.THEMES, result);
    return result;
  },
  saveThemes: async (themes: Theme[]) => {
    setCachedData(SITE_CONTENT_KEYS.THEMES, themes);
    const { error } = await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.THEMES, value: themes }, { onConflict: 'key' });
    if (error) throw error;
  },

  getNotices: async (): Promise<Notice[]> => {
    const cached = getCachedData(SITE_CONTENT_KEYS.NOTICES);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.NOTICES)
      .single();
    
    const result = (error || !data) ? INITIAL_NOTICES : data.value as Notice[];
    setCachedData(SITE_CONTENT_KEYS.NOTICES, result);
    return result;
  },
  saveNotices: async (notices: Notice[]) => {
    setCachedData(SITE_CONTENT_KEYS.NOTICES, notices);
    const { error } = await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.NOTICES, value: notices }, { onConflict: 'key' });
    if (error) throw error;
  },

  getClosedSlots: async (): Promise<ClosedSlot[]> => {
    const cached = getCachedData(SITE_CONTENT_KEYS.CLOSED_SLOTS);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.CLOSED_SLOTS)
      .single();
    
    const result = (error || !data) ? [] : data.value as ClosedSlot[];
    setCachedData(SITE_CONTENT_KEYS.CLOSED_SLOTS, result);
    return result;
  },
  saveClosedSlots: async (slots: ClosedSlot[]) => {
    setCachedData(SITE_CONTENT_KEYS.CLOSED_SLOTS, slots);
    const { error } = await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.CLOSED_SLOTS, value: slots }, { onConflict: 'key' });
    if (error) throw error;
  },

  getStores: async (): Promise<Store[]> => {
    const cached = getCachedData(SITE_CONTENT_KEYS.STORES);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.STORES)
      .single();
    
    const result = (error || !data) ? STORES : data.value as Store[];
    setCachedData(SITE_CONTENT_KEYS.STORES, result);
    return result;
  },
  saveStores: async (stores: Store[]) => {
    setCachedData(SITE_CONTENT_KEYS.STORES, stores);
    const { error } = await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.STORES, value: stores }, { onConflict: 'key' });
    if (error) throw error;
  },

  // --- Storage ---
  uploadImage: async (file: File | Blob, path: string, format: 'image/webp' | 'image/jpeg' | 'image/png' = 'image/webp'): Promise<string> => {
    const extension = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const fullPath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fullPath, file, {
        contentType: format,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(fullPath);

    return data.publicUrl;
  },

  deleteImage: async (url: string) => {
    if (!url || !url.includes('gkkgprsflomawizioiao.supabase.co')) return;
    
    try {
      const path = url.split('/storage/v1/object/public/images/')[1];
      if (path) {
        await supabase.storage.from('images').remove([path]);
      }
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  },

  // --- Reservations ---
  getBookings: async (): Promise<BookingData[]> => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) return [];
    return data as BookingData[];
  },
  getBookingsBySlot: async (themeId: string, date: string, time: string): Promise<BookingData[]> => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('themeId', themeId)
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'cancelled');
    
    if (error) return [];
    return data as BookingData[];
  },
  getBookingsByTheme: async (themeId: string): Promise<BookingData[]> => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('themeId', themeId)
      .neq('status', 'cancelled');
    
    if (error) return [];
    return data as BookingData[];
  },
  addBooking: async (booking: BookingData) => {
    const { error } = await supabase
      .from('reservations')
      .insert([booking]);
    if (error) throw error;
  },
  createBooking: async (booking: Omit<BookingData, 'id' | 'createdAt' | 'themeTitle' | 'themePoster'>): Promise<BookingData | null> => {
    const themes = await dataService.getThemes();
    const theme = themes.find(t => t.id === booking.themeId);
    
    const newBooking: BookingData = {
      ...booking,
      id: crypto.randomUUID(),
      themeTitle: theme?.title || 'Unknown Theme',
      themePoster: theme?.posterUrl || '',
      createdAt: new Date().toISOString(),
      status: booking.status || 'pending'
    };

    // Omit columns that might not exist in the Supabase schema to avoid 400 errors
    // BUT themeTitle and themePoster are required by the schema (not-null constraint)
    const { totalPrice, ...insertData } = newBooking as any;

    const { error } = await supabase
      .from('reservations')
      .insert([insertData]);
    
    if (error) throw error;
    return newBooking;
  },
  updateBookingStatus: async (id: string, status: BookingData['status']) => {
    await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);
  },

  // --- Inquiries ---
  getInquiries: async (): Promise<Inquiry[]> => {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) return [];
    return data as Inquiry[];
  },
  addInquiry: async (inquiry: Omit<Inquiry, 'id' | 'createdAt'>) => {
    const { error } = await supabase
      .from('inquiries')
      .insert([{
        ...inquiry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      }]);
    if (error) throw error;
  },

  // --- Notifications (Client-side Aligo API call) ---
  sendNotification: async (type: 'booking' | 'contact' | 'reminder', data: any, settings: AdminSettings) => {
    // 알리고 API 연동을 위한 환경변수 (Netlify 환경변수에 등록 필요)
    // VITE_ALIGO_KEY, VITE_ALIGO_ID, VITE_ALIGO_SENDER
    const ALIGO_KEY = import.meta.env.VITE_ALIGO_KEY;
    const ALIGO_ID = import.meta.env.VITE_ALIGO_ID;
    const ALIGO_SENDER = import.meta.env.VITE_ALIGO_SENDER || settings.managerPhone;

    if (!ALIGO_KEY || !ALIGO_ID) {
      console.warn("Aligo API keys are not configured. Skipping SMS notification.");
      return;
    }

    try {
      let targetPhone = '';
      let message = '';

      if (type === 'booking') {
        // 1. 고객에게 발송
        const customerPhone = data.userPhone.replace(/[^0-9]/g, '');
        const customerMsg = settings.smsTemplates.onBooking.content
          .replace(/{이름}/g, data.userName)
          .replace(/{테마명}/g, data.themeTitle)
          .replace(/{예약일시}/g, `${data.date} ${data.time}`)
          .replace(/{인원}/g, `${data.participantCount}명`);

        // 2. 관리자에게 발송
        const adminPhone = settings.managerPhone.replace(/[^0-9]/g, '');
        const adminMsg = `[신규 예약 알림]\n테마: ${data.themeTitle}\n일시: ${data.date} ${data.time}\n예약자: ${data.userName}\n연락처: ${data.userPhone}\n인원: ${data.participantCount}명`;

        // 고객에게 문자 전송
        if (settings.smsTemplates.onBooking.enabled) {
          await dataService.sendAligoSMS(ALIGO_KEY, ALIGO_ID, ALIGO_SENDER, customerPhone, customerMsg);
        }
        // 관리자에게 문자 전송
        await dataService.sendAligoSMS(ALIGO_KEY, ALIGO_ID, ALIGO_SENDER, adminPhone, adminMsg);

      } else if (type === 'contact') {
        const adminPhone = settings.managerPhone.replace(/[^0-9]/g, '');
        const adminMsg = `[신규 문의 접수]\n작성자: ${data.author}\n내용: ${data.content.substring(0, 50)}...`;
        await dataService.sendAligoSMS(ALIGO_KEY, ALIGO_ID, ALIGO_SENDER, adminPhone, adminMsg);
      }
    } catch (error) {
      console.error("Failed to send SMS notification:", error);
    }
  },

  sendAligoSMS: async (key: string, userId: string, sender: string, receiver: string, msg: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('key', key);
      formData.append('user_id', userId);
      formData.append('sender', sender);
      formData.append('receiver', receiver);
      formData.append('msg', msg);

      // CORS 이슈를 피하기 위해 Netlify Functions나 Edge Functions를 사용하는 것이 가장 좋지만,
      // 프론트엔드에서 직접 호출할 경우 브라우저 보안 정책에 막힐 수 있습니다.
      // 실제 서비스 시에는 Supabase Edge Functions를 권장합니다.
      const response = await fetch('https://apis.aligo.in/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      const result = await response.json();
      console.log("Aligo SMS Result:", result);
      return result;
    } catch (error) {
      console.error("Aligo API Error:", error);
      throw error;
    }
  },

  // --- Helper ---
  getRemainingSlots: async (themeId: string, date: string, time: string): Promise<number> => {
    const themes = await dataService.getThemes();
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return 0;

    const { data: bookings, error } = await supabase
      .from('reservations')
      .select('participantCount, isCloseRequested')
      .eq('themeId', themeId)
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'cancelled');

    if (error) return 0;

    const bookedCount = (bookings || []).reduce((sum, b) => sum + b.participantCount, 0);
    const isClosedByRequest = (bookings || []).some(b => b.isCloseRequested);
    
    const closedSlots = await dataService.getClosedSlots();
    const isClosedByAdmin = closedSlots.some(cs => 
      cs.themeId === themeId && cs.date === date && cs.time === time
    );

    if (isClosedByRequest || isClosedByAdmin) return 0;

    return Math.max(0, theme.maxPlayers - bookedCount);
  }
};
