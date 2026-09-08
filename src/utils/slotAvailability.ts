/**
 * 당일 자동 예약 마감 규칙 유틸리티
 * 
 * 1. 당일 첫 타임(평일 12:20, 주말 09:40 등 당일 첫 번째 슬롯):
 *    - 당일(00:00 이후)에는 신규 예약 불가(자동 마감).
 * 2. 그 이후 타임(두 번째 슬롯부터):
 *    - 직전 타임 시작 시간 전까지만 예약 활성화.
 *    - 직전 타임 시작 시간이 지났을 때 해당 타임에 기존 예약이 없으면 자동으로 예약 마감.
 *    - (기존 예약이 있는 경우 해당 타임 정원까지는 계속 예약 가능)
 *    - 해당 타임 시작 시간이 이미 지난 경우는 당연히 마감.
 * 3. 당일이 아닌 미래 날짜(내일, 모레 등)는 당일 자동 마감 규칙의 대상이 아님.
 */

export interface SlotAutoCloseResult {
  isAutoClosed: boolean;
  reason?: string;
  type?: 'first_slot_today' | 'prev_slot_passed_no_booking' | 'slot_time_passed';
}

/**
 * 날짜 객체를 YYYY-MM-DD 문자열로 변환
 */
export function formatDateToStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 당일 슬롯 자동 마감 여부 판별
 * @param targetDateStr 'YYYY-MM-DD'
 * @param slotTime 'HH:mm' (예: '12:20')
 * @param allSlotsOfDay 당일 해당 테마의 전체 타임 슬롯 목록 (시간순 정렬 권장, 정렬 안 되어 있어도 내부 정렬)
 * @param hasActiveBookings 해당 슬롯에 취소되지 않은 유효 예약이 존재하는지 여부
 * @param now 기준 현재 시각 (기본값: new Date())
 */
export function checkSlotAutoClosed(
  targetDateStr: string,
  slotTime: string,
  allSlotsOfDay: string[],
  hasActiveBookings: boolean,
  now: Date = new Date()
): SlotAutoCloseResult {
  if (!targetDateStr || !slotTime) {
    return { isAutoClosed: false };
  }

  const todayStr = formatDateToStr(now);

  // 1. 당일이 아닌 경우(미래 날짜)는 당일 마감 규칙 미적용
  if (targetDateStr.trim() !== todayStr) {
    return { isAutoClosed: false };
  }

  const cleanSlot = slotTime.trim();
  const sortedSlots = [...allSlotsOfDay]
    .filter(Boolean)
    .map(s => s.trim())
    .sort((a, b) => a.localeCompare(b));

  const slotIndex = sortedSlots.indexOf(cleanSlot);

  // 슬롯 시간 파싱
  const [slotH, slotM] = cleanSlot.split(':').map(Number);
  const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotH, slotM, 0, 0);

  // 2. 해당 슬롯의 시작 시각이 이미 지난 경우 마감
  if (now.getTime() >= slotDate.getTime()) {
    return {
      isAutoClosed: true,
      reason: '해당 타임 이용 시간이 지났습니다.',
      type: 'slot_time_passed'
    };
  }

  // 3. 당일 첫 타임(index === 0): 당일 00:00 이후에는 신규 예약 불가
  if (slotIndex === 0) {
    return {
      isAutoClosed: true,
      reason: '당일 첫 타임은 당일 예약이 마감되었습니다.',
      type: 'first_slot_today'
    };
  }

  // 4. 그 이후 타임(index > 0): 직전 타임 시작 시간이 지났는데 예약이 없으면 자동 마감
  if (slotIndex > 0) {
    const prevSlot = sortedSlots[slotIndex - 1];
    const [prevH, prevM] = prevSlot.split(':').map(Number);
    const prevSlotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), prevH, prevM, 0, 0);

    // 직전 타임 시작 시간이 지났거나 도달한 경우
    if (now.getTime() >= prevSlotDate.getTime()) {
      // 해당 타임에 기존 예약이 전혀 없다면 마감
      if (!hasActiveBookings) {
        return {
          isAutoClosed: true,
          reason: `직전 타임(${prevSlot}) 시작 시점까지 예약 내역이 없어 마감되었습니다.`,
          type: 'prev_slot_passed_no_booking'
        };
      }
    }
  }

  return { isAutoClosed: false };
}
