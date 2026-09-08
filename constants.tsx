
import { Theme, AdminSettings, Notice, Store } from './types';
import { getThrillerPosterSvg } from './src/utils/imageUtils';

export const THEMES: Theme[] = [
  {
    id: 'theme-1',
    title: '박수무당 살인사건',
    posterUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/themes/1786496436467-zga0ai.webp',
    synopsis: '"가짜였어! 월광이 가짜라서 신들이 노한 거야!"\n\n전라남도 사기군 비오면 대지리. 큰 비가 오면 다리가 끊겨 세상과 단절되는 외딴 산골 마을입니다. 일주일 전부터 원인 모를 역병이 돌기 시작했고, 마을의 박수무당 \'월광\'은 마을 전체의 명운을 건 \'대동굿\'을 선언했습니다. 그리고 굿 첫날 밤이 지난 아침, 그는 자신의 신당에서 처참하게 살해된 채 발견됩니다. 무당의 죽음으로 마을 전체가 패닉에 휩싸였습니다. 사건 당일 밤 신당 주변에 있었던 다섯 사람이 유력한 용의자로 지목되었습니다.',
    minPlayers: 5,
    maxPlayers: 6,
    duration: 150,
    difficulty: 4,
    fearLevel: 2,
    price: 40000,
    storeId: 'store-1772805211062',
    startDate: '2026-09-01',
    endDate: '2027-02-28',
    customSlots: ['09:40', '12:20', '15:00', '17:40', '20:20'],
    weekdaySlots: ['12:20', '15:00', '17:40', '20:20'],
    useSeparateWeekdaySlots: true,
    showOnMain: true,
    showDDay: false,
    futureDisplayMode: 'open_calendar',
    useSuspects: true,
    suspects: [
      {
        id: 'suspect-1786688103078',
        name: '탐정',
        age: '?',
        gender: '?',
        job: '탐정',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/suspects/1786688111474-4hze8x.webp',
        description: '사건을 맡은 탐정'
      },
      {
        id: 'suspect-1786685668281',
        name: '최무녀',
        age: '20세',
        gender: '여',
        job: '무속인',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/suspects/1786685876511-grb4li.webp',
        description: '무당의 신딸'
      },
      {
        id: 'suspect-1786685982305',
        name: '김경위',
        age: '42세',
        gender: '남',
        job: '경찰',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/suspects/1786685985515-rmjiib.webp',
        description: '대지리 파출소 경찰'
      },
      {
        id: 'suspect-1786686020634',
        name: '조신부',
        age: '52세',
        gender: '남',
        job: '성직자',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/suspects/1786686026486-o1tyrm.webp',
        description: '가톨릭 신부'
      },
      {
        id: 'suspect-1786686222682',
        name: '컬렉리',
        age: '39세',
        gender: '남',
        job: '사업가',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/suspects/1786686227919-xkuhhu.webp',
        description: '골동품 수집가'
      },
      {
        id: 'suspect-1786686864667',
        name: '박기자',
        age: '35세',
        gender: '여',
        job: '기자',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/suspects/1786686871916-0f28i.webp',
        description: '언론사의 기자'
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
    bankName: '하나',
    accountNumber: '288-910388-91807',
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
        id: '1774783986199',
        title: '9월 1일 오픈!',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/home/1774783995611-pplo8t.webp',
        subtitle: '현재 예약 가능합니다. 곧 뵙겠습니다!',
        buttonLink: '/info',
        buttonText: '이용 안내'
      },
      {
        id: '1774783770396',
        title: 'SCENERS ?',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/home/1786455238812-2j9y.webp',
        subtitle: '사건현장의 우리는 SCENERS 입니다.',
        buttonLink: '/theme/theme-1',
        buttonText: '지금 예약하기'
      }
    ],
    introTitle: 'CRIME SCENERS?',
    introDescription: '스릴러 매니아들이 설계한 몰입형 추리 게임 카페\n\'크라임 씨너스\' 에 오신것을 환영합니다!',
    introPoints: [
      {
        title: '완벽한 역할 몰입',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/home/1786533300243-qovweq.webp',
        description: '사전 롤카드 제공 및 150분의 긴 플레이 시간'
      },
      {
        title: '프라이빗 사건 현장',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/home/1786449717257-zn6bk.webp',
        description: '오직 한 팀만을 위한 100% 예약제 공간'
      },
      {
        title: '탄탄한 시나리오',
        imageUrl: 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/home/1786533304782-mcnjckj.webp',
        description: '시네마에 미친 사람이 작업한 단 하나의 사건'
      }
    ]
  },
  popupSettings: {
    isEnabled: false,
    imageUrl: '',
    linkUrl: ''
  },
  bookingNotice: `• 환불 관련 정책
이용 2일 전(전전날 24:00까지) : 100% 환불
이용 1일 전(전날 24:00까지) : 50% 환불
이용 당일/노쇼: 환불 불가

기한 내 예약 취소 후 환불을 원하시는 고객님께서는 매장으로 연락 부탁드립니다.
환불 요청 접수 후, 1~2일 이내로 처리해 드립니다.

• 오픈 예약(타인 매칭) 규정 관련
당일 타인의 결원으로 인해 최소 인원(5인) 미달로 게임이 무산될 경우, 결원 외 고객님께 100% 전액 환불해 드립니다. (결원 당사자는 환불 불가)
결원 발생 시, 지인 대타 초청 가능하나, 매장에서 임의로 인원을 매칭해드리지 않습니다.

• 사전 롤카드 관련
- 원할한 게임을 위해 사전 롤카드 신청 고객은 함께 플레이하실 고객분들과 사전에 플레이 역할을 정해주세요.
- 예약 전날 발송되는 문자에 정해진 역할별 고객 이메일주소들을 회신해주시면 롤카드를 발송해드립니다.
- 오픈 예약(타인 매칭)으로 예약 확정된 팀에서는 먼저 예약하신 고객 순으로 역할을 정할 기회를 드립니다. 순차적으로 모든 롤 배정이 끝나면 플레이어 메일로 롤카드를 발송해 드립니다.`,
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
