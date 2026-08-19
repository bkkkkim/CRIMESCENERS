
import { Theme, AdminSettings, Notice, Store } from './types';

export const THEMES: Theme[] = [
  {
    id: 'theme-1',
    title: '박수무당 살인사건',
    posterUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp',
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
    useSeparateWeekdaySlots: true,
    showOnMain: true,
    isComingSoon: false,
    useSuspects: true,
    suspects: [
      {
        id: 'suspect-1',
        name: '강도령',
        age: '28세',
        gender: '남',
        job: '박수무당 (피해자의 수제자)',
        imageUrl: '',
        description: '피해자 밑에서 5년간 신내림을 받고 무속 수련을 해온 제자. 최근 스승과 금전 문제로 잦은 다툼이 있었다.'
      },
      {
        id: 'suspect-2',
        name: '윤선녀',
        age: '45세',
        gender: '여',
        job: '무속인 (경쟁 신당 원장)',
        imageUrl: '',
        description: '인근에서 가장 큰 신당을 운영하며 피해자와 오랜 기간 영적 라이벌 구도를 형성해 온 무속인.'
      },
      {
        id: 'suspect-3',
        name: '한재벌',
        age: '53세',
        gender: '남',
        job: '대기업 임원 (단골 신도)',
        imageUrl: '',
        description: '거액의 복채를 내며 피해자에게 집안의 흉사를 상담해오던 VIP 고객. 최근 굿판의 효험에 불만을 품고 있었다.'
      },
      {
        id: 'suspect-4',
        name: '송기자',
        age: '33세',
        gender: '남',
        job: '탐사보도 기자',
        imageUrl: '',
        description: '사이비 무속 사기 및 불법 부적 유통 실태를 취재 중이던 기자. 사건 당일 신당 주변에서 잠복 중이었다.'
      },
      {
        id: 'suspect-5',
        name: '배청소',
        age: '61세',
        gender: '여',
        job: '신당 관리인',
        imageUrl: '',
        description: '신당의 청소와 잔심부름을 도맡아 하던 관리인. 신당 내부 사정과 신도들의 출입을 가장 잘 알고 있는 인물.'
      }
    ]
  },
  {
    id: 'theme-2',
    title: '미대생 살인사건',
    posterUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp',
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
    useSeparateWeekdaySlots: true,
    showOnMain: true,
    useSuspects: true,
    suspects: [
      {
        id: 'suspect-2-1',
        name: '민서우',
        age: '23세',
        gender: '여',
        job: '회화과 4학년 (피해자의 동기)',
        imageUrl: '',
        description: '졸업 전시회 대상 후보로 피해자와 치열하게 경쟁하던 수석 학생.'
      },
      {
        id: 'suspect-2-2',
        name: '정하진',
        age: '26세',
        gender: '남',
        job: '조소과 대학원생 (조교)',
        imageUrl: '',
        description: '작업실 열쇠를 관리하던 실습실 조교. 피해자와 사적인 비밀을 공유하고 있었다.'
      },
      {
        id: 'suspect-2-3',
        name: '강도일',
        age: '50세',
        gender: '남',
        job: '미술대학 학과장 교수',
        imageUrl: '',
        description: '피해자의 지도교수이자 화단의 거물. 대작 논란과 공모전 비리 의혹에 휩싸여 있다.'
      },
      {
        id: 'suspect-2-4',
        name: '이수빈',
        age: '22세',
        gender: '여',
        job: '조예과 3학년 (피해자의 후배)',
        imageUrl: '',
        description: '피해자의 작업을 도와주던 어시스턴트 후배. 사건 전날 큰 소리로 다투는 모습이 목격되었다.'
      },
      {
        id: 'suspect-2-5',
        name: '최유찬',
        age: '24세',
        gender: '남',
        job: '타과생 (피해자의 전 연인)',
        imageUrl: '',
        description: '피해자와 최근 결별한 전 남자친구. 사건 당일 작업실 복도 CCTV에 찍혔다.'
      }
    ]
  }
];

export const STORES: Store[] = [
  {
    id: 'store-1',
    name: '강남점',
    phone: '02-123-4567',
    weekdayHours: '17:00~24:00',
    weekendHours: '10:00~24:00',
    address: '서울특별시 강남구 테헤란로 123, B1',
    imageUrl: '/store1.jpg'
  }
];

export const INTRO_POINTS = [
  {
    title: '탄탄한 시나리오',
    desc: '씨네마광 공대박사의 탄탄한 시나리오',
    img: ''
  },
  {
    title: '몰입도 높은 현장',
    desc: '미대생 출신이 직접 연출한 크라임씬',
    img: ''
  },
  {
    title: '다양한 롤플레잉',
    desc: '각기 다른 사연과 비밀을 가진 캐릭터들',
    img: ''
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
    holderName: '권정혁'
  },
  businessInfo: {
    registrationNumber: '123-45-67890',
    representativeName: '김범인',
    instagramUrl: '#',
    naverUrl: '#'
  },
  logoUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp',
  faviconUrl: '/favicon.ico',
  thumbnailUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1773142864574-640kfj.jpg',
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
    heroImageUrl: '',
    heroSlides: [
      {
        id: '1',
        imageUrl: '',
        title: 'CRIME SCENERS',
        subtitle: '사건 현장에 있는 우리 모두 SCENERS 입니다.',
        buttonText: '지금 예약하기',
        buttonLink: '/theme/theme-1'
      }
    ],
    introTitle: 'CRIME SCENERS?',
    introDescription: '스릴러 매니아들이 설계한 몰입형 추리 게임 카페\n\'크라임 씨너스\' 에 오신것을 환영합니다!',
    introPoints: [
      {
        title: '탄탄한 시나리오',
        description: '씨네마광 공대박사의 탄탄한 시나리오',
        imageUrl: ''
      },
      {
        title: '몰입도 높은 현장',
        description: '미대생 출신이 직접 연출한 크라임씬',
        imageUrl: ''
      },
      {
        title: '다양한 롤플레잉',
        description: '각기 다른 사연과 비밀을 가진 캐릭터들',
        imageUrl: ''
      }
    ]
  },
  popupSettings: {
    isEnabled: false,
    imageUrl: '',
    linkUrl: ''
  },
  bookingNotice: `[예약 및 환불 규정]
- 예약금 입금 후 예약이 확정됩니다.
- 이용일 3일 전 취소 시 100% 환불
- 이용일 2일 전 취소 시 50% 환불
- 이용일 1일 전 및 당일 취소 시 환불 불가`,
  reservationLandingUrl: '/theme/theme-1',
  advanceDepositDiscount: {
    enabled: true,
    discountAmount: 2000
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
