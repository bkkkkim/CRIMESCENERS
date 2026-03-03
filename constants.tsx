
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
    storeId: 'store-1',
    customSlots: ['10:00', '12:30', '15:00', '17:30', '20:00'],
    weekdaySlots: ['20:00'],
    useSeparateWeekdaySlots: true
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
    storeId: 'store-1',
    customSlots: ['10:30', '13:00', '15:30', '18:00', '20:30'],
    weekdaySlots: ['20:00'],
    useSeparateWeekdaySlots: true
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
    title: '탄탄한 시나리오',
    desc: '씨네마광 공대박사의 탄탄한 시나리오',
    img: '/intro1.jpg'
  },
  {
    title: '몰입도 높은 현장',
    desc: '미대생 출신이 직접 연출한 크라임씬',
    img: '/intro2.jpg'
  },
  {
    title: '다양한 롤플레잉',
    desc: '각기 다른 사연과 비밀을 가진 캐릭터들',
    img: '/intro3.jpg'
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
  logoUrl: '/logo.jpg',
  faviconUrl: '/favicon.ico',
  thumbnailUrl: '/thumbnail.jpg',
  termsContent: `제1조 (목적)\n본 약관은 크라임씨너스(이하 "회사")가 제공하는 예약 서비스의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다...\n\n제2조 (예약 및 취소)\n1. 예약은 온라인 시스템을 통해 실시간으로 진행됩니다.\n2. 예약 취소는 방문 24시간 전까지 가능하며, 이후 취소 시 위약금이 발생할 수 있습니다.`,
  privacyContent: `1. 수집하는 개인정보 항목\n회사는 예약 서비스를 위해 성함, 연락처를 수집합니다.\n\n2. 개인정보의 수집 및 이용목적\n수집된 정보는 예약 확인, 서비스 안내, 본인 확인을 위해 사용됩니다.\n\n3. 개인정보의 보유 및 이용기간\n서비스 이용 목적 달성 후 해당 정보를 지체 없이 파기합니다.`,
  noticeTitle: '[필독] 크라임씨너스 이용 가이드 및 주의사항',
  noticeContent: '현장에 도착하시면 먼저 의상 교체와 캐릭터 시트를 수령하게 됩니다. 원활한 게임 진행을 위해 예약 시간 10분 전까지 반드시 도착해 주시기 바랍니다.\n\n[주의사항]\n1. 스포일러 금지: 게임 내용 및 트릭에 대한 스포일러는 다른 이용자들을 위해 절대 금지됩니다.\n2. 기물 파손 주의: 현장 기물 파손 시 배상의 책임이 있을 수 있습니다.\n3. 촬영 금지: 내부 시설 및 소품 촬영은 금지되어 있습니다.',
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
    heroImageUrl: '/hero.jpg',
    introImages: [
      '/intro1.jpg',
      '/intro2.jpg',
      '/intro3.jpg'
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
