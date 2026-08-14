
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
const CACHE_TTL = 600000; // 10 minutes

const getCachedData = (key: string) => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(`cs_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Date.now() - parsed.timestamp < CACHE_TTL) {
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
const queryWithTimeout = async <T>(promise: PromiseLike<T>, timeoutMs = 3500): Promise<T | null> => {
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

const BRAND_DEFAULT_IMAGE = 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp';

const isUnsplashOrDummy = (url?: string | null) => {
  if (!url) return true;
  return url.includes('unsplash.com') || url.includes('picsum.photos') || url === '/logo.jpg' || url === '/hero.jpg';
};

const sanitizeImageUrl = (url?: string | null, fallback: string = BRAND_DEFAULT_IMAGE): string => {
  if (isUnsplashOrDummy(url)) return fallback;
  return url!;
};

export const dataService = {
  // --- Site Contents (Settings, Themes, etc.) ---
  getSettings: async (): Promise<AdminSettings> => {
    const cached = getCachedData(SITE_CONTENT_KEYS.SETTINGS);
    
    // Background fetch helper
    const fetchLatest = async () => {
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
        const rawResult = (error || !data) ? DEFAULT_ADMIN_SETTINGS : data.value as AdminSettings;
        const result: AdminSettings = {
          ...rawResult,
          logoUrl: sanitizeImageUrl(rawResult.logoUrl, BRAND_DEFAULT_IMAGE),
          homeConfig: rawResult.homeConfig ? {
            ...rawResult.homeConfig,
            heroImageUrl: isUnsplashOrDummy(rawResult.homeConfig.heroImageUrl) ? '' : rawResult.homeConfig.heroImageUrl,
            heroSlides: (rawResult.homeConfig.heroSlides || []).map(s => ({
              ...s,
              imageUrl: isUnsplashOrDummy(s.imageUrl) ? '' : s.imageUrl
            })),
            introPoints: (rawResult.homeConfig.introPoints || []).map(p => ({
              ...p,
              imageUrl: isUnsplashOrDummy(p.imageUrl) ? '' : p.imageUrl
            }))
          } : rawResult.homeConfig
        };
        setCachedData(SITE_CONTENT_KEYS.SETTINGS, result);
        return result;
      } catch {
        return cached || DEFAULT_ADMIN_SETTINGS;
      }
    };

    if (cached) {
      // Trigger background revalidation
      fetchLatest();
      return cached;
    }

    return await fetchLatest();
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
    
    const fetchLatest = async () => {
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
        const rawResult = (error || !data) ? THEMES : data.value as Theme[];
        const result = rawResult.map(t => ({
          ...t,
          posterUrl: sanitizeImageUrl(t.posterUrl, BRAND_DEFAULT_IMAGE)
        }));
        setCachedData(SITE_CONTENT_KEYS.THEMES, result);
        return result;
      } catch {
        return cached || THEMES;
      }
    };

    if (cached) {
      fetchLatest();
      return cached;
    }

    return await fetchLatest();
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

    const fetchLatest = async () => {
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
        const result = (error || !data) ? INITIAL_NOTICES : data.value as Notice[];
        setCachedData(SITE_CONTENT_KEYS.NOTICES, result);
        return result;
      } catch {
        return cached || INITIAL_NOTICES;
      }
    };

    if (cached) {
      fetchLatest();
      return cached;
    }

    return await fetchLatest();
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

    const fetchLatest = async () => {
      try {
        const res = await queryWithTimeout(
          supabase
            .from('site_contents')
            .select('value')
            .eq('key', SITE_CONTENT_KEYS.CLOSED_SLOTS)
            .single()
        );
        const data = res?.data;
        const error = res?.error;
        const result = (error || !data) ? [] : data.value as ClosedSlot[];
        setCachedData(SITE_CONTENT_KEYS.CLOSED_SLOTS, result);
        return result;
      } catch {
        return cached || [];
      }
    };

    if (cached) {
      fetchLatest();
      return cached;
    }

    return await fetchLatest();
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
  getBookings: async (): Promise<BookingData[]> => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) return [];
    return (data || []).map(dataService.mapBookingData);
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
  },
  createBooking: async (booking: Omit<BookingData, 'id' | 'createdAt' | 'themeTitle' | 'themePoster'>): Promise<BookingData | null> => {
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
      status: booking.status || 'pending'
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
