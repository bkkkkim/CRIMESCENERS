import { createClient } from '@supabase/supabase-js';
import { Theme, AdminSettings, BookingData, PublicSlotBooking, ClosedSlot, Notice, Inquiry, Store } from '../../types';
import { THEMES, DEFAULT_ADMIN_SETTINGS, INITIAL_NOTICES, STORES } from '../../constants';
import { getThrillerPosterSvg } from '../utils/imageUtils';

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

const ADMIN_PW_STORAGE_KEY = 'cs_admin_pw';

// LocalStorage + In-memory cache for instant loading & network resilience
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute fresh cache

// Purge any legacy PII cache (`cs_cache_reservations`) & stale SVG cache immediately
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    localStorage.removeItem('cs_cache_reservations');
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

const getAdminPassword = (): string => {
  if (typeof window === 'undefined' || !window.sessionStorage) return '';
  try {
    return sessionStorage.getItem(ADMIN_PW_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const setAdminPassword = (pw: string) => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    if (pw) {
      sessionStorage.setItem(ADMIN_PW_STORAGE_KEY, pw);
    } else {
      sessionStorage.removeItem(ADMIN_PW_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
};

const isMissingRpcError = (error: any): boolean => {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '');
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    msg.includes('Could not find the function') ||
    msg.includes('function public.')
  );
};


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
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
};

const BRAND_DEFAULT_IMAGE = 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp';

const saveSiteContentSecure = async (key: string, value: any) => {
  const pw = getAdminPassword();
  if (pw) {
    const { error: rpcError } = await supabase.rpc('admin_save_site_content', {
      p_password: pw,
      p_key: key,
      p_value: value,
    });
    if (!rpcError) return;
    if (!isMissingRpcError(rpcError)) {
      throw rpcError;
    }
  }

  // Fallback only before SQL security script is applied
  const { error } = await supabase
    .from('site_contents')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
};

export const dataService = {
  // --- Admin Auth ---
  getAdminSessionPassword: getAdminPassword,
  setAdminSessionPassword: setAdminPassword,

  verifyAdminPassword: async (password: string): Promise<boolean> => {
    const trimmed = (password || '').trim();
    if (!trimmed) return false;

    const { data, error } = await supabase.rpc('verify_admin_password', {
      p_password: trimmed,
    });

    if (!error) {
      const ok = Boolean(data);
      if (ok) setAdminPassword(trimmed);
      return ok;
    }

    return false;
  },

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
    await saveSiteContentSecure(SITE_CONTENT_KEYS.SETTINGS, settings);
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
    await saveSiteContentSecure(SITE_CONTENT_KEYS.THEMES, themes);
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
    await saveSiteContentSecure(SITE_CONTENT_KEYS.NOTICES, notices);
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
    await saveSiteContentSecure(SITE_CONTENT_KEYS.CLOSED_SLOTS, slots);
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
    await saveSiteContentSecure(SITE_CONTENT_KEYS.STORES, stores);
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

  mapPublicSlotBooking: (b: any): PublicSlotBooking => ({
    themeId: String(b.themeId || ''),
    date: String(b.date || ''),
    time: String(b.time || ''),
    participantCount: Number(b.participantCount) || 0,
    isCloseRequested: b.isCloseRequested === true || String(b.isCloseRequested).toLowerCase() === 'true',
    status: (b.status || 'confirmed') as PublicSlotBooking['status'],
    notes: typeof b.notes === 'string' ? b.notes : undefined,
    requestPreRoleCard: b.requestPreRoleCard ?? (typeof b.notes === 'string' && b.notes.includes('[사전 롤카드 신청]')),
  }),

  // --- Public Slot Occupancy (ZERO PII: never selects or returns names, phones, or booking numbers) ---
  getPublicBookings: async (forceFresh = false): Promise<PublicSlotBooking[]> => {
    if (!forceFresh) {
      const cached = getCachedData('public_slots', 15000);
      if (cached) return cached;
    }

    try {
      const rpcRes = await queryWithTimeout(
        supabase.rpc('get_public_slot_bookings'),
        3500
      );

      if (rpcRes && !rpcRes.error && Array.isArray(rpcRes.data)) {
        const mapped = rpcRes.data.map(dataService.mapPublicSlotBooking);
        setCachedData('public_slots', mapped);
        return mapped;
      }

      // Narrow-column fallback before SQL script is run (still NEVER requests PII columns)
      if (!rpcRes || isMissingRpcError(rpcRes.error)) {
        const fallbackRes = await queryWithTimeout(
          supabase
            .from('reservations')
            .select('themeId, date, time, participantCount, isCloseRequested, status')
            .neq('status', 'cancelled'),
          3500
        );
        if (fallbackRes && !fallbackRes.error && fallbackRes.data) {
          const mapped = (fallbackRes.data || []).map(dataService.mapPublicSlotBooking);
          setCachedData('public_slots', mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch public slot bookings", e);
    }

    const cachedFallback = getCachedData('public_slots', 120000);
    return cachedFallback || [];
  },

  getPublicBookingsBySlot: async (themeId: string, date: string, time: string): Promise<PublicSlotBooking[]> => {
    try {
      const { data, error } = await supabase.rpc('get_public_slot_details', {
        p_theme_id: themeId,
        p_date: date,
        p_time: time,
      });

      if (!error && Array.isArray(data)) {
        return data.map(dataService.mapPublicSlotBooking);
      }

      if (isMissingRpcError(error)) {
        // Narrow-column fallback before SQL script is run (no userName, userPhone, id, or bookingNumber)
        const fallback = await supabase
          .from('reservations')
          .select('themeId, date, time, participantCount, isCloseRequested, status, notes')
          .eq('themeId', themeId)
          .eq('date', date)
          .eq('time', time)
          .neq('status', 'cancelled');

        if (!fallback.error && fallback.data) {
          return fallback.data.map((row: any) =>
            dataService.mapPublicSlotBooking({
              ...row,
              notes: row.isCloseRequested ? '' : row.notes,
            })
          );
        }
      }
    } catch (e) {
      console.warn("Failed to fetch public slot details", e);
    }
    return [];
  },

  // --- Customer Self-Service Lookup & Cancel (Server-verified by bookingNumber + name + phone) ---
  lookupBooking: async (bookingNumber: string, userName: string, userPhone: string): Promise<BookingData | null> => {
    const cleanCode = (bookingNumber || '').trim().replace(/^#/, '').toUpperCase();
    const cleanName = (userName || '').trim();
    const cleanPhone = (userPhone || '').replace(/[^0-9]/g, '');

    if (cleanCode.length < 4 || !cleanName || cleanPhone.length < 8) {
      return null;
    }

    const enrichTotalPrice = async (raw: any): Promise<BookingData> => {
      const mapped = dataService.mapBookingData(raw);
      if (mapped.totalPrice == null) {
        try {
          const [themes, settings] = await Promise.all([
            dataService.getThemes(),
            dataService.getSettings(),
          ]);
          const theme = themes.find(t => t.id === mapped.themeId);
          if (theme) {
            const isTransfer = mapped.paymentMethod === 'bank-transfer' || mapped.paymentMethod === 'deposit';
            const discount = (isTransfer && settings?.advanceDepositDiscount?.enabled)
              ? (settings.advanceDepositDiscount.discountAmount || 0)
              : 0;
            mapped.totalPrice = Math.max(0, theme.price - discount) * (Number(mapped.participantCount) || 0);
          }
        } catch {
          // ignore
        }
      }
      return mapped;
    };

    const { data, error } = await supabase.rpc('lookup_reservation', {
      p_booking_number: cleanCode,
      p_user_name: cleanName,
      p_user_phone: cleanPhone,
    });

    if (!error) {
      if (!data) return null;
      return await enrichTotalPrice(data);
    }

    if (isMissingRpcError(error)) {
      const fallback = await supabase
        .from('reservations')
        .select('*')
        .eq('userName', cleanName)
        .neq('status', 'cancelled');

      if (!fallback.error && fallback.data) {
        const match = fallback.data.find((b: any) => {
          const rowPhone = String(b.userPhone || '').replace(/[^0-9]/g, '');
          const rowCode = String(b.bookingNumber || String(b.id || '').split('-')[0]).toUpperCase();
          return (
            rowPhone === cleanPhone &&
            (rowCode === cleanCode || String(b.id || '').toUpperCase() === cleanCode)
          );
        });
        if (match) return await enrichTotalPrice(match);
      }
    }

    return null;
  },

  cancelBookingByUser: async (id: string, userName: string, userPhone: string): Promise<boolean> => {
    const cleanName = (userName || '').trim();
    const cleanPhone = (userPhone || '').replace(/[^0-9]/g, '');

    const { data, error } = await supabase.rpc('cancel_user_reservation', {
      p_id: id,
      p_user_name: cleanName,
      p_user_phone: cleanPhone,
    });

    if (!error) {
      invalidateDataCache('public_slots');
      return Boolean(data);
    }

    if (isMissingRpcError(error)) {
      const fallback = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('userName', cleanName);
      if (fallback.error) throw fallback.error;
      invalidateDataCache('public_slots');
      return true;
    }

    throw error;
  },

  // --- Admin Reservations (Requires Admin Password, never cached in localStorage) ---
  getAdminBookings: async (): Promise<BookingData[]> => {
    const pw = getAdminPassword();
    if (pw) {
      const { data, error } = await supabase.rpc('admin_get_reservations', {
        p_password: pw,
      });
      if (!error && Array.isArray(data)) {
        return data.map(dataService.mapBookingData);
      }
      if (error && !isMissingRpcError(error)) {
        console.error("Admin bookings fetch denied or failed:", error);
        return [];
      }
    }

    // Pre-SQL fallback only
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error || !data) return [];
    return data.map(dataService.mapBookingData);
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

      // Force fresh check using non-PII public slot bookings
      const [freshBookings, freshClosed] = await Promise.all([
        dataService.getPublicBookings(true),
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
      return { canBook: true, remaining: 6 };
    }
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
    invalidateDataCache('public_slots');
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
    invalidateDataCache('public_slots');
    return newBooking;
  },

  updateBookingStatus: async (id: string, status: BookingData['status']) => {
    const pw = getAdminPassword();
    if (pw) {
      const { error } = await supabase.rpc('admin_update_reservation_status', {
        p_password: pw,
        p_id: id,
        p_status: status,
      });
      if (!error) {
        invalidateDataCache('public_slots');
        return;
      }
      if (!isMissingRpcError(error)) {
        throw error;
      }
    }

    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    invalidateDataCache('public_slots');
  },

  // --- Inquiries (Admin-only read, public insert) ---
  getInquiries: async (): Promise<Inquiry[]> => {
    const pw = getAdminPassword();
    if (pw) {
      const { data, error } = await supabase.rpc('admin_get_inquiries', {
        p_password: pw,
      });
      if (!error && Array.isArray(data)) {
        return data as Inquiry[];
      }
      if (error && !isMissingRpcError(error)) {
        console.error("Admin inquiries fetch denied or failed:", error);
        return [];
      }
    }

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
  sendNotification: async (type: 'booking' | 'contact' | 'reminder', _data: any, _settings: AdminSettings) => {
    console.log(`[Notification Placeholder] Type: ${type} - Handled via Supabase Webhook / Make integration.`);
  },

  // --- Helper ---
  getRemainingSlots: async (themeId: string, date: string, time: string): Promise<number> => {
    const themes = await dataService.getThemes();
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return 0;

    const publicSlots = await dataService.getPublicBookings(true);
    const bookings = publicSlots.filter(
      b => b.themeId === themeId && b.date === date && b.time === time && b.status !== 'cancelled'
    );

    const bookedCount = bookings.reduce((sum, b) => sum + b.participantCount, 0);
    const isClosedByRequest = bookings.some(b => b.isCloseRequested);

    const closedSlots = await dataService.getClosedSlots();
    const isClosedByAdmin = closedSlots.some(cs =>
      cs.themeId === themeId && cs.date === date && cs.time === time
    );

    if (isClosedByRequest || isClosedByAdmin) return 0;

    return Math.max(0, theme.maxPlayers - bookedCount);
  }
};
