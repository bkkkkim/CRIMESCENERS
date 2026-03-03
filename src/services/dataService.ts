
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
const CACHE_TTL = 30000; // 30 seconds

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
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.SETTINGS, value: settings }, { onConflict: 'key' });
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
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.THEMES, value: themes }, { onConflict: 'key' });
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
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.NOTICES, value: notices }, { onConflict: 'key' });
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
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.CLOSED_SLOTS, value: slots }, { onConflict: 'key' });
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
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.STORES, value: stores }, { onConflict: 'key' });
  },

  // --- Storage ---
  uploadImage: async (file: File | Blob, path: string): Promise<string> => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const fullPath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fullPath, file, {
        contentType: 'image/webp',
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
