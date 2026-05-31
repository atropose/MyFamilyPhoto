// ========== Types ==========
export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface Photo {
  id: string;
  type: 'photo' | 'video';
  date: string;
  time: string;
  sortKey: string;
  location: string;
  members: string[];
  variant: number;
  pattern: string;
  label: string;
  duration: string | null;
  filename: string;
}

// ========== Members ==========
export const MEMBERS: Member[] = [
  { id: 'all', name: '전체', color: '#6B7280' },
  { id: 'gildong', name: '홍길동', color: '#4F7FFF' },
  { id: 'younghee', name: '홍영희', color: '#FF8C42' },
  { id: 'slr', name: 'SLR', color: '#7B5BD5' },
];

// ========== Palettes & Patterns ==========
export const PALETTES: [string, string, string][] = [
  ['#FFD6B5', '#FFE9D6', '#FF8C42'],
  ['#C9DBFF', '#E6EEFF', '#4F7FFF'],
  ['#FFC9DE', '#FFE3EE', '#E5598A'],
  ['#BCDDC6', '#D8EBDD', '#4F9F6A'],
  ['#FFE2A8', '#FFF1D2', '#C99220'],
  ['#D6CAE5', '#E8E0F0', '#7B5BD5'],
  ['#C9D5DD', '#E1E7EC', '#506478'],
  ['#FFC7B5', '#FFE0D2', '#D85B40'],
];

export const PATTERNS = ['diag', 'horiz', 'vert', 'checks', 'rings', 'dots'];

// ========== Mock data generation ==========
const LOCATIONS = ['제주 성산', '서울 한강', '부산 광안리', '강릉 안목', '전주 한옥', '서울 북촌', '남이섬', '양양 서피비치', '거제 외도', '경주 첨성대'];
const PEOPLE_LABELS = ['FAMILY', 'PORTRAIT', 'DAUGHTER', 'GRANDPA'];
const SCENE_LABELS = ['LANDSCAPE', 'SUNSET', 'BEACH', 'MOUNTAIN', 'CITY'];
const FOOD_LABELS = ['DINNER', 'BREAKFAST', 'CAKE', 'PICNIC'];
const PET_LABELS = ['PET', 'DOG', 'CAT'];

function srand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function genPhotos(): Photo[] {
  const r = srand(42);
  const items: Photo[] = [];
  let id = 0;

  const months = [
    { ym: '2024-05', count: 14 },
    { ym: '2024-04', count: 17 },
    { ym: '2024-03', count: 20 },
    { ym: '2024-02', count: 11 },
    { ym: '2024-01', count: 13 },
    { ym: '2023-12', count: 9 },
  ];

  for (const { ym, count } of months) {
    const [y, m] = ym.split('-').map(Number);
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(r() * 27);
      const hour = 7 + Math.floor(r() * 14);
      const min = Math.floor(r() * 60);
      const isVideo = r() < 0.18;
      const variant = Math.floor(r() * PALETTES.length);
      const pattern = PATTERNS[Math.floor(r() * PATTERNS.length)];
      const cat = Math.floor(r() * 4);
      const labelPool = cat === 0 ? PEOPLE_LABELS : cat === 1 ? SCENE_LABELS : cat === 2 ? FOOD_LABELS : PET_LABELS;
      const label = labelPool[Math.floor(r() * labelPool.length)];
      const location = LOCATIONS[Math.floor(r() * LOCATIONS.length)];
      const memberPick = r();
      const members =
        memberPick < 0.35 ? ['gildong', 'younghee'] :
        memberPick < 0.55 ? ['gildong'] :
        memberPick < 0.75 ? ['younghee'] :
        memberPick < 0.88 ? ['slr'] :
                            ['gildong', 'younghee', 'slr'];
      const duration = isVideo ? `${Math.floor(r() * 3)}:${String(Math.floor(r() * 60)).padStart(2, '0')}` : null;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      items.push({
        id: `p${String(id++).padStart(4, '0')}`,
        type: isVideo ? 'video' : 'photo',
        date: dateStr,
        time: timeStr,
        sortKey: `${dateStr}T${timeStr}`,
        location,
        members,
        variant,
        pattern,
        label,
        duration,
        filename: `${isVideo ? 'VID' : 'IMG'}_${4000 + id}.${isVideo ? 'mov' : 'jpg'}`,
      });
    }
  }

  items.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  return items;
}

export const ALL_PHOTOS: Photo[] = genPhotos();

// ========== Diary mock data ==========
export const DIARY_POOL = [
  '주말에 다 같이 제주로 떠났다. 성산일출봉 일출이 정말 아름다웠고, 아이들이 처음으로 한라봉 따기 체험을 했다. 돌아오는 길에 다들 차에서 잠들었지만 마음이 따뜻했다.',
  '엄마 생신을 맞아 오랜만에 가족 모두 한자리에 모였다. 케이크 앞에서 찍은 사진은 액자에 꼭 걸어두기로 했다. 손자가 카드를 그려드려서 엄마가 눈물을 글썽이셨다.',
  '한강 자전거 길을 따라 처음으로 끝까지 완주했다. 노을이 너무 예뻐서 한참을 멈춰 있었다. 다음엔 도시락도 챙겨와야지.',
  '비가 종일 와서 집에서 영화를 봤다. 거실 카펫에 누워 팝콘을 나눠 먹는 시간이 가장 행복했다. 별 일 없이 지나가는 평일이 새삼 소중하게 느껴진다.',
  '강원도 양양에서 첫 서핑. 파도가 생각보다 셌지만 한 번 일어서니 세상이 달라 보였다. 아이들 웃음소리가 파도 소리를 다 덮었다.',
  '오랜만에 외할머니 댁에 갔다. 텃밭에서 갓 딴 상추로 점심을 차려주셨다. 할머니가 "이게 사진 한 장 안 남아서 그렇지, 마음에는 다 남아있다"고 하셨다.',
  '벚꽃이 만개한 윤중로. 매년 같은 자리에서 사진을 찍는 게 우리 가족 전통이 됐다. 작년 사진과 비교해보니 아이들이 부쩍 컸다.',
  '처음으로 가족 캠핑을 떠났다. 텐트 치는 데 한 시간이 걸렸지만, 모닥불 앞에서 들은 밤하늘 이야기는 평생 잊지 못할 것 같다.',
  '남편이 직접 만들어준 김치찌개. 평소엔 무뚝뚝하지만 가끔 이런 모습을 보면 결혼하길 잘했다 싶다.',
  '친정 어머니가 김장을 도와주러 오셨다. 일은 고되지만 다 같이 둘러앉아 보쌈을 먹는 시간이 1년 중 가장 가족답다.',
  '딸 아이 첫 운동회. 100m 달리기에서 3등을 했다고 자랑스럽게 메달을 보여줬다.',
  '오랜만에 도서관 데이트. 책 읽다 잠든 남편 모습을 몰래 찍었다. 이런 평범한 오후가 제일 좋다.',
  '전주에서 한옥 스테이. 마루에 앉아 막걸리 한 잔. 시간이 천천히 흐르는 곳에서 보낸 주말.',
  '강아지 두부가 가족이 된 지 100일. 처음 데려왔을 땐 한 손에 쏙 들어왔는데 이제 묵직하다.',
  '엄마와 단둘이 떠난 짧은 여행. 차 안에서 옛날 이야기를 많이 했다.',
  '남이섬 단풍. 사람이 너무 많아서 사진은 인파 사이로 겨우 건졌지만, 가을 한가운데를 걸은 게 좋았다.',
  '아이들과 처음으로 영화관에서 라이언 킹을 봤다. 팝콘 봉지가 절반은 카펫에 흩어졌지만.',
  '오랜만에 친구 가족과 더블 데이트. 아이들끼리도 금세 친해져서 어른들은 카페에서 수다를 떨었다.',
];

// ========== ISO Week Helpers ==========
export function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNum };
}

export function getISOWeekStart(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const w1Mon = new Date(jan4);
  w1Mon.setUTCDate(jan4.getUTCDate() - day + 1);
  const mon = new Date(w1Mon);
  mon.setUTCDate(w1Mon.getUTCDate() + (week - 1) * 7);
  return mon;
}
