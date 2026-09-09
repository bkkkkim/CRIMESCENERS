
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

// LocalStorage + In-memory cache for instant loading & network resilience
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute fresh cache

// Purge any stale cache from earlier outages
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const stored = localStorage.getItem('cs_cache_settings');
    if (stored && (stored.includes('data:image/svg') || stored.includes('data:image%2Fsvg'))) {
      localStorage.removeItem('cs_cache_settings');
      localStorage.removeItem('cs_cache_themes');
      localStorage.removeItem('cs_cache_stores');
    }
  } catch {
    // ignore
  }
}

const getCachedData = (key: string, ttl: number = CACHE_TTL) => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(`cs_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Date.now() - parsed.timestamp < ttl) {
          cache[key] = parsed;
          return parsed.data;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
};

export const invalidateDataCache = (key?: string) => {
  if (key) {
    delete cache[key];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`cs_cache_${key}`);
    }
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
    if (typeof window !== 'undefined' && window.localStorage) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('cs_cache_'))
        .forEach(k => localStorage.removeItem(k));
    }
  }
};

const setCachedData = (key: string, data: any) => {
  const payload = { data, timestamp: Date.now() };
  cache[key] = payload;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`cs_cache_${key}`, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }
};

// Timeout helper to avoid infinite hanging if Supabase API slows down or fails
const queryWithTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 4000): Promise<T | null> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
};

import { BRAND_LOGO_SVG, getThrillerPosterSvg, isDummyOrInvalidUrl } from '../utils/imageUtils';

const BRAND_DEFAULT_IMAGE = 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp';

const isUnsplashOrDummy = (url?: string | null) => {
  return isDummyOrInvalidUrl(url);
};

const sanitizeImageUrl = (url?: string | null, fallback: string = BRAND_DEFAULT_IMAGE): string => {
  if (isDummyOrInvalidUrl(url)) return fallback;
  return url!;
};

export const dataService = {
  // --- Site Contents (Settings, Themes, etc.) ---
  getSettings: async (): Promise<AdminSettings> => {
    try {
      const res = await queryWithTimeout(
        supabase
          .from('site_contents')
          .select('value')
          .eq('key', SITE_CONTENT_KEYS.SETTINGS)
          .single()
      );
      const data = res?.data;
      const error = res?.error;
      
      if (!error && data?.value) {
        const rawResult = data.value as AdminSettings;
        const result: AdminSettings = {
          ...rawResult,
          logoUrl: rawResult.logoUrl || BRAND_DEFAULT_IMAGE,
          homeConfig: rawResult.homeConfig ? {
            ...rawResult.homeConfig,
            heroImageUrl: rawResult.homeConfig.heroImageUrl || '',
            heroSlides: (rawResult.homeConfig.heroSlides || []).map(s => ({
              ...s,
              imageUrl: s.imageUrl || ''
            })),
            introPoints: (rawResult.homeConfig.introPoints || []).map(p => ({
              ...p,
              imageUrl: p.imageUrl || ''
            }))
          } : rawResult.homeConfig
        };
        setCachedData(SITE_CONTENT_KEYS.SETTINGS, result);
        return result;
      }
    } catch (e) {
      console.warn("Failed to fetch fresh settings from Supabase, falling back to cache", e);
    }

    const cached = getCachedData(SITE_CONTENT_KEYS.SETTINGS);
    return cached || DEFAULT_ADMIN_SETTINGS;
  },
  saveSettings: async (settings: AdminSettings) => {
    setCachedData(SITE_CONTENT_KEYS.SETTINGS, settings);
    const { error } = await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.SETTINGS, value: settings }, { onConflict: 'key' });
    if (error) throw error;
  },

  getThemes: async (): Promise<Theme[]> => {
    try {
      const res = await queryWithTimeout(
        supabase
          .from('site_contents')
          .select('value')
          .eq('key', SITE_CONTENT_KEYS.THEMES)
          .single()
      );
      const data = res?.data;
      const error = res?.error;
      if (!error && data?.value) {
        const rawResult = data.value as Theme[];
        const result = rawResult.map(t => ({
          ...t,
          posterUrl: t.posterUrl || getThrillerPosterSvg(t.title)
        }));
        setCachedData(SITE_CONTENT_KEYS.THEMES, result);
        return result;
      }
    } catch (e) {
      console.warn("Failed to fetch themes from Supabase", e);
    }

    const cached = getCachedData(SITE_CONTENT_KEYS.THEMES);
    return cached || THEMES;
  },

  saveThemes: async (themes: Theme[]) => {
    setCachedData(SITE_CONTENT_KEYS.THEMES, themes);
    const { error } = await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.THEMES, value: themes }, { onConflict: 'key' });
    if (error) throw error;
  },

  getNotices: async (): Promise<Notice[]> => {
    try {
      const res = await queryWithTimeout(
        supabase
          .from('site_contents')
          .select('value')
          .eq('key', SITE_CONTENT_KEYS.NOTICES)
          .single()
      );
      const data = res?.data;
      const error = res?.error;
      if (!error && data?.value) {
        const result = data.value as Notice[];
        setCachedData(SITE_CONTENT_KEYS.NOTICES, result);
        return result;
      }
    } catch (e) {
      console.warn("Failed to fetch notices from Supabase", e);
    }

    const cached = getCachedData(SITE_CONTENT_KEYS.NOTICES);
    return cached || INITIAL_NOTICES;
  },
  saveNotices: async (notices: Notice[]) => {
    setCachedData(SITE_CONTENT_KEYS.NOTICES, notices);
    const { error } = await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.NOTICES, value: notices }, { onConflict: 'key' });
    if (error) throw error;
  },

  getClosedSlots: async (forceFresh = false): Promise<ClosedSlot[]> => {
    if (!forceFresh) {
      const cached = getCachedData(SITE_CONTENT_KEYS.CLOSED_SLOTS, 15000);
      if (cached) return cached;
    }
    try {
      const res = await queryWithTimeout(
        supabase
          .from('site_contents')
          .select('value')
          .eq('key', SITE_CONTENT_KEYS.CLOSED_SLOTS)
          .single(),
        3500
      );
      const data = res?.data;
      const error = res?.error;
      if (!error && data?.value) {
        const result = data.value as ClosedSlot[];
        setCachedData(SITE_CONTENT_KEYS.CLOSED_SLOTS, result);
        return result;
      }
    } catch (e) {
      console.warn("Failed to fetch closed slots from Supabase", e);
    }

    const cached = getCachedData(SITE_CONTENT_KEYS.CLOSED_SLOTS, 120000);
    return cached || [];
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

    const fetchLatest = async () => {
      try {
        const res = await queryWithTimeout(
          supabase
            .from('site_contents')
            .select('value')
            .eq('key', SITE_CONTENT_KEYS.STORES)
            .single()
        );
        const data = res?.data;
        const error = res?.error;
        const result = (error || !data) ? STORES : data.value as Store[];
        setCachedData(SITE_CONTENT_KEYS.STORES, result);
        return result;
      } catch {
        return cached || STORES;
      }
    };

    if (cached) {
      fetchLatest();
      return cached;
    }

    return await fetchLatest();
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

  mapBookingData: (b: any): BookingData => ({
    ...b,
    requestPreRoleCard: b.requestPreRoleCard ?? (typeof b.notes === 'string' && b.notes.includes('[사전 롤카드 신청]'))
  }),

  // --- Reservations ---
  getBookings: async (forceFresh = false): Promise<BookingData[]> => {
    if (!forceFresh) {
      const cached = getCachedData('reservations', 15000);
      if (cached) return cached;
    }

    try {
      const res = await queryWithTimeout(
        supabase
          .from('reservations')
          .select('*')
          .order('createdAt', { ascending: false }),
        3500
      );
      if (res && !res.error && res.data) {
        const mapped = (res.data || []).map(dataService.mapBookingData);
        setCachedData('reservations', mapped);
        return mapped;
      }
    } catch (e) {
      console.warn("Failed to fetch fresh bookings with timeout", e);
    }

    const cachedFallback = getCachedData('reservations', 120000);
    return cachedFallback || [];
  },

  verifySlotAvailability: async (
    themeId: string, 
    date: string, 
    time: string, 
    requestingCount: number = 1
  ): Promise<{ canBook: boolean; reason?: string; remaining: number }> => {
    try {
      const themes = await dataService.getThemes();
      const theme = themes.find(t => t.id === themeId);
      if (!theme) return { canBook: false, reason: '테마 정보를 찾을 수 없습니다.', remaining: 0 };

      // Force fresh check directly from Supabase
      const [freshBookings, freshClosed] = await Promise.all([
        dataService.getBookings(true),
        dataService.getClosedSlots(true)
      ]);

      const normalizeDate = (d?: string) => (d || '').trim().replace(/[\.\/]/g, '-');
      const normalizeTime = (t?: string) => (t || '').trim();

      const normDate = normalizeDate(date);
      const normTime = normalizeTime(time);

      // 1. Check if closed by admin
      const isClosedByAdmin = freshClosed.some(cs => 
        (!cs.themeId || cs.themeId === themeId || cs.themeId === 'all') && 
        normalizeDate(cs.date) === normDate && 
        (cs.time === 'all' || normalizeTime(cs.time) === normTime)
      );

      if (isClosedByAdmin) {
        return { canBook: false, reason: '해당 타임은 관리자에 의해 마감되었습니다. 다른 일정을 선택해주세요.', remaining: 0 };
      }

      // 2. Check bookings for this slot
      const slotBookings = freshBookings.filter(b => 
        b.themeId === themeId && 
        normalizeDate(b.date) === normDate && 
        normalizeTime(b.time) === normTime && 
        b.status !== 'cancelled'
      );

      // 3. Check if private closed by another user
      const isClosedByRequest = slotBookings.some(b => b.isCloseRequested === true || String(b.isCloseRequested).toLowerCase() === 'true');
      if (isClosedByRequest) {
        return { canBook: false, reason: '해당 타임은 다른 예약팀의 프라이빗 게임(마감) 요청으로 마감되었습니다. 다른 일정을 선택해주세요.', remaining: 0 };
      }

      // 4. Check capacity
      const bookedCount = slotBookings.reduce((sum, b) => sum + (Number(b.participantCount) || 0), 0);
      const remaining = Math.max(0, theme.maxPlayers - bookedCount);

      if (remaining <= 0) {
        return { canBook: false, reason: '해당 타임은 이미 최대 인원(FULL)으로 마감되었습니다. 다른 일정을 선택해주세요.', remaining: 0 };
      }

      if (requestingCount > remaining) {
        return { canBook: false, reason: `예약 인원(${requestingCount}명)이 잔여 가능 인원(${remaining}명)을 초과하여 마감되었습니다.`, remaining };
      }

      return { canBook: true, remaining };
    } catch (err) {
      console.error("Failed during verifySlotAvailability:", err);
      // Fallback: allow to proceed to prevent false locking if check query fails
      return { canBook: true, remaining: 6 };
    }
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
    return (data || []).map(dataService.mapBookingData);
  },
  getBookingsByTheme: async (themeId: string): Promise<BookingData[]> => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('themeId', themeId)
      .neq('status', 'cancelled');
    
    if (error) return [];
    return (data || []).map(dataService.mapBookingData);
  },
  addBooking: async (booking: BookingData) => {
    const { totalPrice, bookingNumber: omittedBookingNumber, requestPreRoleCard: omittedRequestPreRoleCard, ...insertData } = booking as any;
    if (booking.requestPreRoleCard) {
      if (!insertData.notes) {
        insertData.notes = '[사전 롤카드 신청]';
      } else if (!insertData.notes.includes('[사전 롤카드 신청]')) {
        insertData.notes = `${insertData.notes} [사전 롤카드 신청]`;
      }
    }
    const { error } = await supabase
      .from('reservations')
      .insert([insertData]);
    if (error) throw error;
    invalidateDataCache('reservations');
  },
  createBooking: async (booking: Omit<BookingData, 'id' | 'createdAt' | 'themeTitle' | 'themePoster'>): Promise<BookingData | null> => {
    // 실시간 중복 예약 및 정원 초과 방지 검증
    const check = await dataService.verifySlotAvailability(
      booking.themeId, 
      booking.date, 
      booking.time, 
      booking.participantCount
    );

    if (!check.canBook) {
      throw new Error(check.reason || '해당 타임은 이미 예약이 마감되었습니다. 다른 일정을 선택해주세요.');
    }

    const themes = await dataService.getThemes();
    const theme = themes.find(t => t.id === booking.themeId);
    
    let storeName = undefined;
    let storeAddress = undefined;
    
    if (theme && theme.storeId) {
      const stores = await dataService.getStores();
      const store = stores.find(s => s.id === theme.storeId);
      if (store) {
        storeName = store.name;
        storeAddress = store.address;
      }
    }
    
    const generatedId = crypto.randomUUID();
    const bookingNumber = generatedId.split('-')[0].toUpperCase();

    const newBooking: BookingData = {
      ...booking,
      id: generatedId,
      bookingNumber,
      themeTitle: theme?.title || 'Unknown Theme',
      themePoster: theme?.posterUrl || '',
      storeName,
      storeAddress,
      createdAt: new Date().toISOString(),
      status: booking.status || 'confirmed'
    };

    // Omit columns that might not exist in the Supabase schema to avoid 400/PGRST204 errors
    const { totalPrice, bookingNumber: omittedBookingNumber, requestPreRoleCard: omittedRequestPreRoleCard, ...insertData } = newBooking as any;

    if (newBooking.requestPreRoleCard) {
      if (!insertData.notes) {
        insertData.notes = '[사전 롤카드 신청]';
      } else if (!insertData.notes.includes('[사전 롤카드 신청]')) {
        insertData.notes = `${insertData.notes} [사전 롤카드 신청]`;
      }
    }

    const { error } = await supabase
      .from('reservations')
      .insert([insertData]);
    
    if (error) throw error;
    invalidateDataCache('reservations');
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

  // --- Notifications ---
  sendNotification: async (type: 'booking' | 'contact' | 'reminder', data: any, settings: AdminSettings) => {
    // Netlify 환경에서는 서버가 없으므로 프론트엔드에서 직접 알리고 API를 호출할 수 없습니다. (IP 제한 문제)
    // 따라서 이 함수는 현재 작동하지 않으며, Zapier나 Supabase Edge Functions를 통한 백엔드 연동이 필요합니다.
    console.log(`[Notification Placeholder] Type: ${type} - Please configure Zapier or Edge Functions for actual SMS delivery.`);
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
