
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

export const dataService = {
  // --- Site Contents (Settings, Themes, etc.) ---
  getSettings: async (): Promise<AdminSettings> => {
    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.SETTINGS)
      .single();
    
    if (error || !data) return DEFAULT_ADMIN_SETTINGS;
    return data.value as AdminSettings;
  },
  saveSettings: async (settings: AdminSettings) => {
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.SETTINGS, value: settings }, { onConflict: 'key' });
  },

  getThemes: async (): Promise<Theme[]> => {
    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.THEMES)
      .single();
    
    if (error || !data) return THEMES;
    return data.value as Theme[];
  },
  saveThemes: async (themes: Theme[]) => {
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.THEMES, value: themes }, { onConflict: 'key' });
  },

  getNotices: async (): Promise<Notice[]> => {
    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.NOTICES)
      .single();
    
    if (error || !data) return INITIAL_NOTICES;
    return data.value as Notice[];
  },
  saveNotices: async (notices: Notice[]) => {
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.NOTICES, value: notices }, { onConflict: 'key' });
  },

  getClosedSlots: async (): Promise<ClosedSlot[]> => {
    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.CLOSED_SLOTS)
      .single();
    
    if (error || !data) return [];
    return data.value as ClosedSlot[];
  },
  saveClosedSlots: async (slots: ClosedSlot[]) => {
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.CLOSED_SLOTS, value: slots }, { onConflict: 'key' });
  },

  getStores: async (): Promise<Store[]> => {
    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEYS.STORES)
      .single();
    
    if (error || !data) return STORES;
    return data.value as Store[];
  },
  saveStores: async (stores: Store[]) => {
    await supabase
      .from('site_contents')
      .upsert({ key: SITE_CONTENT_KEYS.STORES, value: stores }, { onConflict: 'key' });
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

    const { error } = await supabase
      .from('reservations')
      .insert([newBooking]);
    
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
