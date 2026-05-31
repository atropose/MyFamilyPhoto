// ========== Mock data ==========
const MEMBERS = [
  { id: "all", name: "전체", color: "#6B7280" },
  { id: "gildong", name: "홍길동", color: "#4F7FFF" },
  { id: "younghee", name: "홍영희", color: "#FF8C42" },
  { id: "slr", name: "SLR", color: "#7B5BD5" },
];

const LOCATIONS = ["제주 성산", "서울 한강", "부산 광안리", "강릉 안목", "전주 한옥", "서울 북촌", "남이섬", "양양 서피비치", "거제 외도", "경주 첨성대"];
const PEOPLE_LABELS = ["FAMILY", "PORTRAIT", "DAUGHTER", "GRANDPA"];
const SCENE_LABELS = ["LANDSCAPE", "SUNSET", "BEACH", "MOUNTAIN", "CITY"];
const FOOD_LABELS = ["DINNER", "BREAKFAST", "CAKE", "PICNIC"];
const PET_LABELS = ["PET", "DOG", "CAT"];

// 8 palettes (foreground stripe, background, accent)
const PALETTES = [
  ["#FFD6B5", "#FFE9D6", "#FF8C42"], // warm peach
  ["#C9DBFF", "#E6EEFF", "#4F7FFF"], // sky blue
  ["#FFC9DE", "#FFE3EE", "#E5598A"], // blush pink
  ["#BCDDC6", "#D8EBDD", "#4F9F6A"], // sage green
  ["#FFE2A8", "#FFF1D2", "#C99220"], // butter
  ["#D6CAE5", "#E8E0F0", "#7B5BD5"], // dusty plum
  ["#C9D5DD", "#E1E7EC", "#506478"], // ash slate
  ["#FFC7B5", "#FFE0D2", "#D85B40"], // coral
];

const PATTERNS = ["diag", "horiz", "vert", "checks", "rings", "dots"];

// deterministic pseudo-random
function srand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function genPhotos() {
  const r = srand(42);
  const items = [];
  let id = 0;

  // Months: 2024-05 .. 2023-12 (6 months for richer demo)
  const months = [
    { ym: "2024-05", count: 14 },
    { ym: "2024-04", count: 17 },
    { ym: "2024-03", count: 20 },
    { ym: "2024-02", count: 11 },
    { ym: "2024-01", count: 13 },
    { ym: "2023-12", count: 9 },
  ];

  for (const { ym, count } of months) {
    const [y, m] = ym.split("-").map(Number);
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(r() * 27);
      const hour = 7 + Math.floor(r() * 14);
      const min = Math.floor(r() * 60);
      const isVideo = r() < 0.18;
      const variant = Math.floor(r() * PALETTES.length);
      const pattern = PATTERNS[Math.floor(r() * PATTERNS.length)];
      // Choose subject category to pick a label
      const cat = Math.floor(r() * 4);
      const labelPool = cat === 0 ? PEOPLE_LABELS : cat === 1 ? SCENE_LABELS : cat === 2 ? FOOD_LABELS : PET_LABELS;
      const label = labelPool[Math.floor(r() * labelPool.length)];
      const location = LOCATIONS[Math.floor(r() * LOCATIONS.length)];
      const memberPick = r();
      const members =
        memberPick < 0.35 ? ["gildong", "younghee"] :
        memberPick < 0.55 ? ["gildong"] :
        memberPick < 0.75 ? ["younghee"] :
        memberPick < 0.88 ? ["slr"] :
                            ["gildong", "younghee", "slr"];
      const duration = isVideo ? `${Math.floor(r() * 3)}:${String(Math.floor(r() * 60)).padStart(2, "0")}` : null;
      const dateStr = `${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const timeStr = `${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}`;

      items.push({
        id: `p${String(id++).padStart(4, "0")}`,
        type: isVideo ? "video" : "photo",
        date: dateStr,
        time: timeStr,
        sortKey: `${dateStr}T${timeStr}`,
        location,
        members,
        variant,
        pattern,
        label,
        duration,
        filename: `${isVideo ? "VID" : "IMG"}_${4000 + id}.${isVideo ? "mov" : "jpg"}`,
      });
    }
  }
  // Sort newest first
  items.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  return items;
}

const ALL_PHOTOS = genPhotos();

// ========== Placeholder SVG ==========
function PlaceholderImg({ variant, pattern, label, isVideo }) {
  const [stripe, bg, accent] = PALETTES[variant];
  const patId = `p-${variant}-${pattern}-${Math.random().toString(36).slice(2, 8)}`;

  let patternEl;
  if (pattern === "diag") {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
        <rect width="14" height="14" fill={bg} />
        <rect width="7" height="14" fill={stripe} />
      </pattern>
    );
  } else if (pattern === "horiz") {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="12" height="12">
        <rect width="12" height="12" fill={bg} />
        <rect width="12" height="5" fill={stripe} />
      </pattern>
    );
  } else if (pattern === "vert") {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="12" height="12">
        <rect width="12" height="12" fill={bg} />
        <rect width="5" height="12" fill={stripe} />
      </pattern>
    );
  } else if (pattern === "checks") {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="18" height="18">
        <rect width="18" height="18" fill={bg} />
        <rect width="9" height="9" fill={stripe} />
        <rect x="9" y="9" width="9" height="9" fill={stripe} />
      </pattern>
    );
  } else if (pattern === "rings") {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="40" height="40">
        <rect width="40" height="40" fill={bg} />
        <circle cx="20" cy="20" r="16" fill="none" stroke={stripe} strokeWidth="3" />
        <circle cx="20" cy="20" r="8" fill="none" stroke={stripe} strokeWidth="3" />
      </pattern>
    );
  } else {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="14" height="14">
        <rect width="14" height="14" fill={bg} />
        <circle cx="7" cy="7" r="3" fill={stripe} />
      </pattern>
    );
  }

  return (
    <svg className="thumb-img" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>{patternEl}</defs>
      <rect width="100" height="100" fill={`url(#${patId})`} />
      {isVideo && <rect width="100" height="100" fill="rgba(0,0,0,0.15)" />}
      <text
        x="50" y="54"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="7"
        fontWeight="700"
        fill={accent}
        letterSpacing="0.12em"
        opacity="0.85"
      >{label}</text>
    </svg>
  );
}

// ========== Icons ==========
const Icon = {
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6"/></svg>,
  Photo: () => <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><path d="M5 17l4-4 3 3 3-2 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  Video: () => <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M16 10l5-3v10l-5-3v-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  Grid: () => <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="4" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/><rect x="4" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="13" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.7"/></svg>,
  Play: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>,
  LogoFrame: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.9"/><circle cx="9" cy="10" r="1.4" fill="currentColor"/><path d="M5.5 17.5L10 13l3 2.5 2.5-2 3 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Book: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 4h9a5 5 0 0 1 5 5v11H9a4 4 0 0 1-4-4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M5 16h14" stroke="currentColor" strokeWidth="1.6"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
};
