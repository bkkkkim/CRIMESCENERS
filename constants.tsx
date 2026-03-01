
import { Theme, AdminSettings, Notice, Store } from './types';

export const THEMES: Theme[] = [
  {
    id: 'theme-1',
    title: '박수무당 살인사건',
    posterUrl: 'https://ooeoox.cafe24.com/web/product/medium/202601/e6bfce224ee477630dbed4bd2b1b2b2b.png',
    synopsis: '신비로운 무당의 집에서 벌어진 참혹한 살인사건. 당신은 이 미스터리를 풀고 범인을 잡을 수 있을 것인가?',
    minPlayers: 4,
    maxPlayers: 5,
    duration: 100,
    difficulty: 4,
    fearLevel: 3,
    price: 28000,
    storeId: 'store-1'
  },
  {
    id: 'theme-2',
    title: '미대생 살인사건',
    posterUrl: 'https://ooeoox.cafe24.com/web/product/medium/202601/9b7b2f0d1a61388dbe9327e188e67cbc.png',
    synopsis: '화려한 예술의 이면에 숨겨진 어두운 진실. 미대 작업실에서 발견된 사체와 얽히고설킨 인물들.',
    minPlayers: 5,
    maxPlayers: 6,
    duration: 120,
    difficulty: 5,
    fearLevel: 2,
    price: 32000,
    storeId: 'store-1'
  }
];

export const STORES: Store[] = [
  {
    id: 'store-1',
    name: '강남점',
    phone: '02-123-4567',
    weekdayHours: '17:00~24:00',
    weekendHours: '10:00~24:00',
    address: '서울특별시 강남구 테헤란로 123, B1'
  }
];

export const INTRO_POINTS = [
  {
    title: '완성도 높은 스토리',
    desc: '씨네마광 공대박사의 탄탄한 시나리오',
    img: 'https://ooeoox.cafe24.com/web/upload/ezst/image/ez-image-contents-1bh0f5q-1-0v6vr7s-3.jpg?v=1769305545109'
  },
  {
    title: '몰입도 높은 현장',
    desc: '미대생 출신이 직접 연출한 크라임씬',
    img: 'https://ooeoox.cafe24.com/web/upload/ezst/image/ez-image-contents-1bh0f5q-1-1uxqr3y-3.jpg?v=1769305966630'
  },
  {
    title: '다양한 롤플레잉',
    desc: '각기 다른 사연과 비밀을 가진 캐릭터들',
    img: 'https://ooeoox.cafe24.com/web/upload/ezst/image/ez-image-contents-1bh0f5q-1-1x1ez8b-3.jpg?v=1769305993215'
  }
];

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  managerPhone: '010-1234-5678',
  managerEmail: 'admin@crimesceners.com',
  weekdaySlots: '평일 17:00~24:00',
  weekendSlots: '주말 10:00~24:00',
  bankInfo: {
    bankName: '신한',
    accountNumber: '110520466113',
    holderName: '김보경'
  },
  businessInfo: {
    registrationNumber: '123-45-67890',
    representativeName: '김범인',
    instagramUrl: '#',
    naverUrl: '#'
  },
  logoUrl: 'https://ooeoox.cafe24.com/web/upload/category/logo/v2_e3568ec7d04031b1b19098dd3c4bda3b_CxpxDUUtZ4_top.jpg',
  faviconUrl: '',
  thumbnailUrl: '',
  findUsImageUrl: 'https://ooeoox.cafe24.com/web/upload/ezst/image/ez-image-contents-0zpwh7y-1-3.jpg?v=1769306281477?v=1769429132925',
  smsTemplates: {
    onBooking: {
      content: '[CRIME SCENERS] {name}님, {theme} 테마 예약이 완료되었습니다. {date} {time}에 뵙겠습니다.',
      enabled: true
    },
    dayBefore: {
      content: '[CRIME SCENERS] 내일은 {theme} 예약일입니다. 10분 전까지 도착 부탁드립니다.',
      time: '14:00',
      enabled: true
    }
  },
  homeConfig: {
    heroImageUrl: 'https://ooeoox.cafe24.com/web/upload/ezst/image/ez-image-contents-1yp4ye0-1-13ua06l-3.jpg',
    introImages: [
      'https://ooeoox.cafe24.com/web/upload/ezst/image/ez-image-contents-1bh0f5q-1-0v6vr7s-3.jpg?v=1769305545109',
      'https://ooeoox.cafe24.com/web/upload/ezst/image/ez-image-contents-1bh0f5q-1-1uxqr3y-3.jpg?v=1769305966630',
      'https://ooeoox.cafe24.com/web/upload/ezst/image/ez-image-contents-1bh0f5q-1-1x1ez8b-3.jpg?v=1769305993215'
    ]
  }
};

export const INITIAL_NOTICES: Notice[] = [
  {
    id: '1',
    title: '[필독] 크라임씨너스 이용 가이드 및 주의사항',
    content: '현장에 도착하시면 먼저 의상 교체와 캐릭터 시트를 수령하게 됩니다...',
    date: '2024-05-01',
    isImportant: true
  }
];

export const STORE_INFO = {
  name: '강남점',
  address: '서울특별시 강남구 테헤란로 123, B1',
  phone: '02-123-4567',
  hours: '평일 17:00-24:00 / 주말 10:00-24:00',
  businessInfo: '사업자등록번호: 123-45-67890 | 대표: 김범인',
  sns: [
    { name: 'Instagram', url: '#' },
    { name: 'YouTube', url: '#' }
  ]
};
