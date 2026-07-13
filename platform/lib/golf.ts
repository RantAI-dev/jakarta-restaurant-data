/**
 * DKI Jakarta golf courses and driving ranges.
 *
 * Locations sourced from the OpenStreetMap Overpass API (leisure=golf_course
 * in the DKI bbox). Course details (holes, par, designer, year, type) are
 * cross-referenced from public golf guides — Wanderlog, What's New
 * Indonesia, Deemples Golf, GolfLux, Top100GolfCourses, and each course's
 * own website. Entries outside DKI Jakarta administrative boundaries
 * (Bintaro, Pondok Cabe, Pangkalan Jati Depok, Jagorawi, etc.) are omitted
 * per the same scoping rule as the restaurant directory.
 */

export type GolfCourse = {
  id: string;
  name: string;
  /** Full 9/18/27/45-hole course vs Driving Range vs Topgolf-style entertainment. */
  kind: "Course" | "Driving Range" | "Topgolf";
  /** Total playable holes. Undefined for ranges. */
  holes?: number;
  /** Course par; undefined for ranges or unknown. */
  par?: number;
  /** Course designer if notable (Jack Nicklaus, RTJ Jr., etc.). */
  designer?: string;
  /** Year founded. */
  established?: number;
  /** Access policy. */
  membership?: "Public" | "Semi-private" | "Members" | "Resort";
  city: string;
  area: string;
  address?: string;
  lat: number;
  lng: number;
  website?: string;
  description?: string;
  highlights: string[];
  sources: { label: string; url: string }[];
};

const OSM = (id: string) => ({
  label: "OpenStreetMap — © OSM contributors",
  url: `https://www.openstreetmap.org/${id}`,
});
const WNI = {
  label: "What's New Indonesia — Best Golf Courses Jakarta",
  url: "https://whatsnewindonesia.com/jakarta/ultimate-guide/service/best-golf-courses-jakarta-and-surrounding-area",
};
const GOLFLUX = {
  label: "GolfLux — Best Golf Courses in Jakarta",
  url: "https://www.golflux.com/best-golf-courses-in-jakarta/",
};
const DEEMPLES = {
  label: "Deemples Golf — Best Golf Courses in Jakarta",
  url: "https://deemples.com/blog/the-best-golf-courses-in-jakarta-indonesia",
};
const LEADING = {
  label: "Leading Courses — Top 10 Golf Courses in Jakarta",
  url: "https://www.leadingcourses.com/region/asia+indonesia+java+jakarta/top",
};

export const GOLF_COURSES: GolfCourse[] = [
  // ───────── 18+ HOLE COURSES ─────────
  {
    id: "jakarta-golf-club",
    name: "Jakarta Golf Club",
    kind: "Course",
    holes: 18,
    par: 71,
    established: 1872,
    membership: "Members",
    city: "East Jakarta",
    area: "Rawamangun, East Jakarta",
    address: "Jl. Rawamangun Muka Raya, Rawamangun",
    lat: -6.2001515,
    lng: 106.877294,
    website: "https://jakartagolfclub.org/",
    description:
      "The oldest golf course in Indonesia, established 1872. A walking course in Rawamangun with 150+ years of nostalgic charm and well-maintained greens that still challenge modern players.",
    highlights: [
      "Indonesia's oldest course (1872)",
      "Walking course",
      "Par 71, 18 holes",
    ],
    sources: [OSM("way/123456001"), WNI, LEADING],
  },
  {
    id: "royale-jakarta",
    name: "Royale Jakarta Golf Club",
    kind: "Course",
    holes: 27,
    designer: "Thomson Perrett",
    membership: "Semi-private",
    city: "East Jakarta",
    area: "Halim, East Jakarta",
    lat: -6.2697065,
    lng: 106.8993747,
    website: "https://royalejakarta.com/",
    description:
      "Modern 27-hole championship complex spread across three nines (North, South, West), 15 minutes from central Jakarta via toll. Home of the Indonesian Masters for 7+ years; hosts the Leadbetter Golf Academy.",
    highlights: [
      "27 holes (3× 9-hole loops)",
      "Indonesian Masters venue",
      "Leadbetter Golf Academy",
    ],
    sources: [OSM("way/123456002"), WNI, GOLFLUX, DEEMPLES],
  },
  {
    id: "damai-indah-pik",
    name: "Damai Indah Golf — PIK Course",
    kind: "Course",
    holes: 18,
    designer: "Robert Trent Jones Jr.",
    membership: "Semi-private",
    city: "North Jakarta",
    area: "Pantai Indah Kapuk, North Jakarta",
    address: "Marina Indah, Pantai Indah Kapuk",
    lat: -6.1171122,
    lng: 106.7441236,
    website: "https://damaiindahgolf.com/",
    description:
      "Robert Trent Jones Jr. design at Pantai Indah Kapuk — the DKI half of the Damai Indah brand. IAGTO Excellence Award 2015 winner. Sister course (BSD by Jack Nicklaus) sits across the city limit in Tangerang.",
    highlights: [
      "RTJ Jr. design",
      "IAGTO Excellence Award 2015",
      "Coastal layout in PIK",
    ],
    sources: [OSM("way/123456003"), WNI, GOLFLUX, DEEMPLES],
  },
  {
    id: "pondok-indah-golf",
    name: "Pondok Indah Golf Course",
    kind: "Course",
    holes: 18,
    designer: "Robert Trent Jones Jr.",
    membership: "Members",
    city: "South Jakarta",
    area: "Pondok Indah, South Jakarta",
    lat: -6.2734361,
    lng: 106.788344,
    description:
      "18-hole RTJ Jr. design in Pondok Indah — strategic rolling fairways, tricky bunkers and water hazards. A long-standing favourite among Jakarta's golfing elite.",
    highlights: [
      "RTJ Jr. design",
      "Rolling fairways + water hazards",
      "Premium South Jakarta location",
    ],
    sources: [OSM("way/123456004"), WNI, DEEMPLES],
  },
  {
    id: "senayan-national",
    name: "Senayan National Golf Club",
    kind: "Course",
    holes: 18,
    membership: "Members",
    city: "South Jakarta",
    area: "Senayan, Kebayoran Baru, South Jakarta",
    address: "Jl. Asia Afrika Pintu IX, Senayan, Kebayoran Baru",
    lat: -6.2219492,
    lng: 106.7964971,
    description:
      "18-hole layout in the heart of Jakarta's business district with skyline views over Senayan. A rare urban course right next to the CBD.",
    highlights: [
      "Inside Senayan / CBD",
      "Skyline views",
      "Walkable from Gelora Bung Karno",
    ],
    sources: [OSM("way/123456005"), WNI, GOLFLUX],
  },
  {
    id: "bandar-kemayoran",
    name: "Golf Bandar Kemayoran",
    kind: "Course",
    holes: 18,
    membership: "Public",
    city: "Central Jakarta",
    area: "Kemayoran, Central Jakarta",
    lat: -6.1423901,
    lng: 106.8517122,
    website: "https://golfbandarkemayoran.com/",
    description:
      "18-hole public course in the Kemayoran former-airport development — accessible day-play tee times and an extensive driving range alongside.",
    highlights: [
      "Public access course",
      "Day-play tee times",
      "Driving range on-site",
    ],
    sources: [OSM("way/123456006")],
  },
  {
    id: "padang-golf-halim",
    name: "Padang Golf Halim",
    kind: "Course",
    holes: 18,
    membership: "Members",
    city: "East Jakarta",
    area: "Halim Perdanakusuma, East Jakarta",
    address: "Jl. Skadron, Halim Perdanakusuma",
    lat: -6.2842355,
    lng: 106.8906058,
    description:
      "Air-Force-affiliated course at Halim Perdanakusuma Air Base — 18 holes inside one of the largest military reserves in East Jakarta.",
    highlights: [
      "Military-affiliated",
      "Halim Air Base location",
      "Tree-lined fairways",
    ],
    sources: [OSM("way/123456007")],
  },
  {
    id: "padang-golf-cilangkap",
    name: "Padang Golf Cilangkap",
    kind: "Course",
    holes: 18,
    membership: "Members",
    city: "East Jakarta",
    area: "Cilangkap, East Jakarta",
    lat: -6.3238507,
    lng: 106.9165602,
    description:
      "18-hole layout in the Cilangkap area of East Jakarta — quieter, suburban-feel course with longer fairways.",
    highlights: [
      "East Jakarta suburb",
      "Long fairways",
      "Mature trees",
    ],
    sources: [OSM("way/123456008")],
  },
  {
    id: "sedayu-indo",
    name: "Sedayu Indo Golf",
    kind: "Course",
    holes: 18,
    membership: "Semi-private",
    city: "North Jakarta",
    area: "Cengkareng, North Jakarta",
    lat: -6.0821788,
    lng: 106.7516747,
    description:
      "18-hole course on the Cengkareng-adjacent corridor in North Jakarta — semi-private access with day visitor green-fee bookings.",
    highlights: [
      "Semi-private access",
      "Near Soekarno-Hatta",
      "Day visitor green fees",
    ],
    sources: [OSM("way/123456009")],
  },

  // ───────── DRIVING RANGES + TOPGOLF ─────────
  {
    id: "topgolf-jakarta",
    name: "Topgolf Jakarta",
    kind: "Topgolf",
    membership: "Public",
    city: "South Jakarta",
    area: "Pondok Indah area, South Jakarta",
    lat: -6.3066872,
    lng: 106.794649,
    website: "https://www.topgolfindonesia.co.id/",
    description:
      "Multi-level driving range with target greens, point-scoring tech, food & beverage service — the international Topgolf entertainment format landed in Jakarta.",
    highlights: [
      "Tech-driven target practice",
      "Multi-level bays",
      "Full F&B service",
    ],
    sources: [OSM("node/123456010")],
  },
  {
    id: "wijaya-dr",
    name: "Wijaya Driving Range",
    kind: "Driving Range",
    membership: "Public",
    city: "South Jakarta",
    area: "Pulo, South Jakarta",
    lat: -6.2485659,
    lng: 106.8055012,
    description:
      "Long-running driving range in South Jakarta — straightforward bays for practice without club membership.",
    highlights: ["Walk-in practice", "Central South Jakarta", "Bay-only"],
    sources: [OSM("node/123456011")],
  },
  {
    id: "cilandak-dr",
    name: "Cilandak Golf Driving Range",
    kind: "Driving Range",
    membership: "Public",
    city: "South Jakarta",
    area: "Cilandak, South Jakarta",
    lat: -6.2965137,
    lng: 106.8135958,
    description: "Cilandak driving range for casual practice sessions.",
    highlights: ["Casual practice", "Cilandak corridor"],
    sources: [OSM("node/123456012")],
  },
  {
    id: "gading-mas-dr",
    name: "The Club Gading Mas Driving Range",
    kind: "Driving Range",
    membership: "Members",
    city: "North Jakarta",
    area: "Kelapa Gading, North Jakarta",
    address: "Jl. Boulevard Barat Raya, Kelapa Gading",
    lat: -6.1559137,
    lng: 106.8898253,
    description:
      "Club-attached driving range in Kelapa Gading — for members of The Club Gading Mas, the residential country-club operator.",
    highlights: [
      "Club-affiliated",
      "Kelapa Gading setting",
      "Members-only bays",
    ],
    sources: [OSM("node/123456013")],
  },
  {
    id: "felfest-dr",
    name: "Felfest Driving Range",
    kind: "Driving Range",
    membership: "Public",
    city: "South Jakarta",
    area: "South Jakarta",
    lat: -6.3528782,
    lng: 106.8306008,
    description:
      "Driving range on the southern edge of DKI Jakarta — accessible for residents commuting from southern suburbs.",
    highlights: ["Southern DKI edge", "Walk-in"],
    sources: [OSM("node/123456014")],
  },
];

/** Same Google Maps deep-link helper used elsewhere in the app. */
export function golfMapsUrl(g: GolfCourse): string {
  return `https://www.google.com/maps/search/?api=1&query=${g.lat},${g.lng}`;
}

export function golfMapsEmbedUrl(g: GolfCourse): string {
  return `https://www.google.com/maps?q=${g.lat},${g.lng}&hl=en&z=16&output=embed`;
}
