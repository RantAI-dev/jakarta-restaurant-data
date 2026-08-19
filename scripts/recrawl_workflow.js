export const meta = {
  name: 'recrawl-event-addresses',
  description: 'Sonnet agents crawl real Jakarta venue addresses with sources, then verify each',
  phases: [
    { title: 'Crawl', detail: 'research each venue address + source URL' },
    { title: 'Verify', detail: 'adversarially check city, source, plausibility' },
  ],
}

const batches = [["56 BOUTIQUE BA", "AA MARAMIS", "ANCOL", "ANJUNGAN DKI JAKARTA, TMII", "ANJUNGAN DKI JAKATA DAN BOULEVARD BAMBOO TMII", "ASTON KARTIKA GROGOL HOTEL", "AULA SIMFONIA JAKARTA", "BALAI KARTINI", "BALAI KARTINI, JAKARTA", "BATAVIA PIK"], ["BAYWALK MALL, PLUIT, JAKARTA UTARA", "BEACH CITY INTERNATIONAL STADIUM", "BEACH CITY INTERNATIONAL STADIUM, JAKARTA", "BERANDA SARINAH", "BLOK M HUB", "BUNDARAN HI", "BUNDARAN HOTEL INDONESIA", "BUNDARAN HOTEL INDONESIA JAKARTA PUSAT", "CENTRAL PARK 2", "CENTRAL PARK MALL JAKARTA"], ["CREATIVE FUTURE LAB BUILDING", "DERMAGA UTAMA PULAU HARAPAN", "DKI JAKARTA", "DUKUNGAN MC DAN ABANG NONE", "DUSIT THANI PATTAYA, THAILAND", "FAIRMONT HOTEL", "GAMBIR EXPO", "GANDARIA CITY", "GANDARIA CITY MALL, JAKARTA", "GOR CIRACAS"], ["GPIB IMMANUEL JAKARTA", "GRAHA BHAKTI BUDAYA", "GRAND ATRIUM DAN MOSAIC WALK KOTA KASABLANKA", "GRAND INDONESIA, JAKARTA", "H CLUB SCBD JAKARTA", "HALAMAN PANTI NUGRAHA, JL. BANGO RAYA NO.45 8, RT.8/RW.3, PD. LABU, KEC. CILANDAK, KOTA JAKARTA, SELATAN, DAERAH KHUSUS IBUKOTA JAKARTA 12450", "HALL A & HALL B", "HALO NIKO RESTAURANT", "HOTEL MERCURE ANCOL JAKARTA UTARA", "HUTAN KOTA GELORA BUNG KARNO"], ["INDONESIA ARENA", "INDONESIA ARENA JAKARTA", "INDONESIA ARENA, JAKARTA", "ISTORA SENAYAN", "ISTORA SENAYAN JAKARTA", "ISTORA SENAYAN – JAKARTA", "ISTORA SENAYAN, JAKARTA", "JAKARTA", "JAKARTA (MONAS)", "JAKARTA CONVENTION CENTER JAKARTA"], ["JAKARTA INTERNATIONAL EXPO KEMAYORAN", "JAKARTA INTERNATIONAL VELODROME", "JALAN LADA", "JALAN PURI INDAH RAYA, KEL. KEMBANGAN SELATAN, KEC. KEMBANGAN, KOTA ADMINISTRASI JAKARTA BARAT", "JALAN RASUNDA SAID KUNINGAN", "JICC", "JIEXPO KEMAYORAN", "JL. PEMUDA RAWAMANGUN", "JL. SADAR RAYA RT 001 RW 005 KELURAHAN CIGANJUR, KECAMATAN JAGAKARSA, JAKARTA SELATAN", "JL. TIPAR CAKUNG JAKARTA TIMUR"], ["KANTOR WALIKOTA", "KANTOR WALIKOTA JAKARTA PUSAT", "KANTOR WALIKOTA JAKARTA TIMUR", "KEC. PALMERAH", "KEDUTAAN BESAR PALESTINA", "KELAB MALAM (INDOOR)", "KOTA TUA", "KRAPELA, JAKARTA", "KSYE", "LAPANGAN BANTENG"], ["LAPANGAN HOCKEY, PLAZA FESTIVAL JAKARTA", "LAPANGAN ISTANA ANAK-ANAK INDONESIA", "LEVEL 4, PLAZA SENAYAN", "LOTTE MALL JAKARTA", "LTX SCBD, JAKARTA", "M BLOK SPACE", "MALL ARTHA GADING", "MALL CIJANTUNG", "MALL CIPINANG INDAH", "MASJID CUT MEUTIA JAKARTA PUSAT"], ["MESSE FRANKFURT", "MONUMEN NASIONAL", "MUSEUM BAHARI", "OLD SHANGHAI SEDAYU CITY", "PANTAI PASIR PERAWAN, PULAU PARI", "PARKIRAN AQUATIC GBK", "PECINAN GLODOK", "PENJARINGAN, JAKARTA UTARA", "PERPUSTAKAAN JAKARTA", "PLAZA BARAT GBK"], ["PLAZA FESTIVAL KUNINGAN JAKARTA SELATAN", "PLAZA KABUPATEN, PULAU PRAMUKA", "PLAZA LOKOMOTIF & BOULEVARD BAMBOO TMII", "PLAZA SENAYAN, JAKARTA", "PLAZA TIMUR GBK SENAYAN", "PLUMPANG SEMPER, KOJA, JAKARTA UTARA", "PONDOK INDAH MALL, JAKARTA", "PULAU SEPA, KEPULAUAN SERIBU", "PURI INDAH MALL, JAKARTA", "PUSAT GROSIR TANAH ABANG"], ["PUSKESMAS PONDOK RANGGON", "RUANG MH THAMRIN", "SARINAH", "SENAYAN CITY JAKARTA", "SHANGHAI WORLD EXPO EXHIBITION & CONVENTION CENTER", "SKYE, JAKARTA", "STADION SEPAK BOLA LAPANGAN BANTENG", "STADION TENNIS INDOOR SENAYAN RT. 001 RW. 001 GELORA, TANAH ABANG, KOTA JAKARTA PUSAT, DKI JAKARTA KODE POS 10270", "STADION UTAMA GELORA BUNG KARNO", "SWISSOTEL GRAND HOTEL, SHANGHAI, CHINA"], ["TAMAN BENDERA PUSAKA", "TAMAN FATAHILLAH", "TAMAN ISMAIL MARZUKI", "TAMAN MENTENG", "TAMAN MINI INDONESIA INDAH", "THE H CLUB SCBD", "THE H CLUB SCBD, JAKARTA", "TIM", "TMII", "TOBA DREAM, JAKARTA"], ["VAULT JAKARTA", "VELODROME, RAWAMANGUN", "WILAYAH JAKARTA UTARA", "YAMAHA MUSIC CENTER BUILDING, SD NOTRE DAME & AULA MAFTUCHAH YUSUF UNJ, JAKARTA"]]

const CRAWL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['lokasi', 'alamat', 'kota', 'lat', 'lon', 'sumber', 'confidence', 'catatan'],
        properties: {
          lokasi: { type: 'string', description: 'the ORIGINAL location string, verbatim' },
          alamat: { type: 'string', description: 'full street address; empty string if genuinely not found' },
          kota: { type: 'string', description: 'e.g. Jakarta Pusat, Jakarta Selatan, or foreign city' },
          lat: { type: 'string', description: 'decimal latitude or empty' },
          lon: { type: 'string', description: 'decimal longitude or empty' },
          sumber: { type: 'string', description: 'source URL(s) the address came from; empty if not found' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low', 'not_found'] },
          catatan: { type: 'string', description: 'short note, e.g. if multi-venue which one, or ambiguity' },
        },
      },
    },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['lokasi', 'alamat', 'kota', 'lat', 'lon', 'sumber', 'confidence', 'review_status', 'catatan'],
        properties: {
          lokasi: { type: 'string' },
          alamat: { type: 'string' },
          kota: { type: 'string' },
          lat: { type: 'string' },
          lon: { type: 'string' },
          sumber: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low', 'not_found'] },
          review_status: { type: 'string', enum: ['ok', 'corrected', 'needs_review', 'rejected'] },
          catatan: { type: 'string' },
        },
      },
    },
  },
}

const crawlPrompt = (batch) => `You are geocoding venue/location names from a Jakarta (DKI Jakarta, Indonesia) tourism-events spreadsheet. For EACH location string below, find its real-world street address using web search.

Rules:
- Most venues are in DKI Jakarta. Some are foreign or in other Indonesian cities (Bali, Bandung, Thailand, Denmark, Korea) — detect these and use the correct city/country.
- Use WebSearch + WebFetch. Look at Google Maps listings, official venue websites, news articles, directories (PergiKuliner, Zomato, TripAdvisor, Traveloka). Prefer the most authoritative source.
- If a string names MULTIPLE venues (e.g. "MASJID ISTIQLAL DAN BUNDARAN HI") pick the PRIMARY/first named venue for the address, and note the others in "catatan".
- Strip noise like "LANTAI 2", "ATRIUM", "HALL A" to find the underlying building/mall, then give THAT building's address.
- "sumber" MUST be the actual URL(s) you used. Do NOT invent addresses or sources. If you cannot find it confidently, set alamat/sumber empty and confidence "not_found".
- "lokasi" in your output MUST be the original string copied EXACTLY (byte-for-byte) so it can be matched back.
- Provide lat/lon (decimal) only if you find them from a real source; otherwise empty.

Locations:
${batch.map((l, i) => `${i + 1}. ${JSON.stringify(l)}`).join('\n')}`

const verifyPrompt = (batch, crawled) => `You are QA-reviewing crawled Jakarta venue addresses. For EACH result below, verify:
1. Does the "sumber" URL plausibly support the address? (Reject fabricated-looking sources — e.g. made-up google.com/maps links with no place id, or a source that clearly wouldn't contain this address.)
2. Is the "kota"/address in the CORRECT administrative area? Jakarta venues must resolve inside DKI Jakarta (or Kepulauan Seribu), NOT Depok/Tangerang/Bekasi/Bogor unless the name explicitly says so. Foreign venues must be in the right country.
3. Is the address specific enough (street-level) or only a vague area? Vague = needs_review.

Set review_status:
- "ok": address + source look correct and specific.
- "corrected": you fixed an error — put the corrected values in the fields and explain in catatan. Only correct if you are confident from the source.
- "needs_review": plausible but unverifiable / vague / wrong-city suspicion — keep values, explain.
- "rejected": clearly wrong or fabricated — BLANK out alamat/lat/lon/sumber, set confidence "not_found", explain why in catatan.
Copy "lokasi" exactly. You may use WebSearch/WebFetch to double-check suspicious ones.

Original location strings: ${JSON.stringify(batch)}

Crawled results to review:
${JSON.stringify(crawled, null, 1)}`

const out = await pipeline(
  batches,
  (batch, _orig, i) =>
    agent(crawlPrompt(batch), {
      label: `crawl:b${i}`,
      phase: 'Crawl',
      schema: CRAWL_SCHEMA,
      model: 'sonnet',
    }),
  (crawled, batch, i) => {
    if (!crawled || !crawled.results) return null
    return agent(verifyPrompt(batch, crawled.results), {
      label: `verify:b${i}`,
      phase: 'Verify',
      schema: VERIFY_SCHEMA,
      model: 'sonnet',
    })
  }
)

const all = out.filter(Boolean).flatMap((r) => (r && r.results) || [])
log(`crawled+verified ${all.length} locations`)
return { results: all }
