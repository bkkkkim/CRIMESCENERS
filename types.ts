
export interface Theme {
  id: string;
  title: string;
  posterUrl: string; // Can be a URL or Base64 string
  synopsis: string;
  minPlayers: number;
  maxPlayers: number;
  duration: number;
  difficulty: number;
  fearLevel: number; // Added fear level
  price: number;
  customSlots?: string[]; // Default or Weekend slots
  weekdaySlots?: string[]; // Optional: separate weekday slots
  useSeparateWeekdaySlots?: boolean;
  storeId?: string;
  startDate?: string;
  endDate?: string;
  futureDisplayMode?: 'coming_soon' | 'open_calendar';
  isComingSoon?: boolean;
  showOnMain?: boolean;
  showDDay?: boolean;
}

export interface Store {
  id: string;
  name: string;
  phone: string;
  weekdayHours: string;
  weekendHours: string;
  address: string;
  imageUrl?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant?: boolean;
}

export interface Inquiry {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export interface PopupSettings {
  isEnabled: boolean;
  imageUrl: string;
  linkUrl: string;
}

export interface IntroPoint {
  title: string;
  description: string;
  imageUrl: string;
}

export interface AdminSettings {
  managerPhone: string;
  managerEmail: string;
  weekdaySlots: string; // Now just display text
  weekendSlots: string; // Now just display text
  bankInfo: {
    bankName: string;
    accountNumber: string;
    holderName: string;
  };
  businessInfo: {
    registrationNumber: string;
    representativeName: string;
    instagramUrl: string;
    naverUrl: string;
  };
  logoUrl: string;
  faviconUrl: string;
  thumbnailUrl: string;
  termsContent: string;
  privacyContent: string;
  noticeTitle: string;
  noticeContent: string;
  smsTemplates: {
    onBooking: { content: string; enabled: boolean };
    dayBefore: { content: string; time: string; enabled: boolean };
  };
  homeConfig: {
    heroImageUrl: string; // Keep for backward compatibility or remove? Let's keep it but add heroSlides
    heroSlides: HeroSlide[];
    introTitle: string;
    introDescription: string;
    introPoints: IntroPoint[];
  };
  popupSettings: PopupSettings;
  bookingNotice: string;
  reservationLandingUrl?: string;
  advanceDepositDiscount?: {
    enabled: boolean;
    discountAmount: number;
  };
}

export interface BookingData {
  id: string;
  bookingNumber?: string;
  themeId: string;
  themeTitle: string;
  themePoster: string;
  storeName?: string;
  storeAddress?: string;
  date: string;
  time: string;
  userName: string;
  userPhone: string;
  participantCount: number;
  isCloseRequested: boolean;
  notes: string;
  requestPreRoleCard?: boolean;
  paymentMethod: 'on-site' | 'bank-transfer' | 'deposit' | 'onsite';
  status: 'confirmed' | 'cancelled' | 'paid' | 'pending';
  totalPrice?: number;
  createdAt: string;
}

export interface ClosedSlot {
  date: string;
  themeId: string;
  time: string;
}
