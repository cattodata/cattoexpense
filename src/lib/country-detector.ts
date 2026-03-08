/** Country detection rules: [flag, label, patterns] */
const COUNTRY_RULES: [string, string, RegExp[]][] = [
  // Iceland
  ["🇮🇸", "Iceland", [
    /troll\.is|troll\s?expedition/i,
    /icelandic|icelandia/i,
    /\biceland\b/i,
    /rammagerdin/i,
    /hagkaup/i,
    /\bkef\b|kefla?v[ií]k/i,
    /lava\s?show/i,
    /island\s?duty\s?free/i,
    /point\s?south.*kef|is\s?kef/i,
    /fjallsarlon/i,
    /reykjavik/i,
    /oraefum/i,
    /gardabaer/i,
    /\bhof\b/i,
  ]],
  // Finland
  ["🇫🇮", "Finland", [
    /finnair/i,
    /\bhsl\b.*len/i,
    /alepa/i,
    /fivp\s?hel|hel\s?t2/i,
    /schengen\s?alue/i,
    /helsinki/i,
    /vantaa/i,
    /\bfinland\b/i,
  ]],
  // Singapore
  ["🇸🇬", "Singapore", [
    /flyscoot|scoot\.com/i,
    /irvins.*t3|changi/i,
    /whsmith.*syd.*t1/i,
  ]],
  // Norway
  ["🇳🇴", "Norway", [
    /utenriksdepartementet/i,
  ]],
  // South Korea
  ["🇰🇷", "South Korea", [
    /asiana\s?air/i,
    /korean\s?air/i,
    /incheon/i,
    /olive\s?young/i,
    /cj\s?cgv|\bcgv\b/i,
    /myeong.?dong/i,
    /k-?eta/i,
    /kakaomobility|eksim\s?bay|eximbay/i,
    /myongdong/i,
    /\bseoul\b/i,
    /\bbusan\b/i,
    /\bkorea\b/i,
    /\bkrw\b/i,
    /peeopildbaimaelieotseo|huilraseouljeom|jinsang/i,
    /seocho.?dong/i,
    /hongdaeppaegbaji/i,
  ]],
  // Thailand
  ["🇹🇭", "Thailand", [
    /bangkok/i,
    /\bthailand\b/i,
    /\bbaht\b|\bthb\b/i,
  ]],
  // Japan
  ["🇯🇵", "Japan", [
    /lawson\s?ticket/i,
    /hi\s?q\s?japan/i,
    /ticket\s?board/i,
    /\btokyo\b/i,
    /\bosaka\b/i,
    /\bkyoto\b/i,
    /haneda|narita/i,
    /\bjapan\b(?!.*(?:st\s?leon|chatswood))/i,
    /\bjpy\b/i,
  ]],
  // Online / International (no specific country)
  ["🌐", "Online", [
    /booking\.com/i,
    /viator/i,
    /godaddy/i,
    /dji\.com/i,
    /whoop/i,
    /apple\.com/i,
    /amazon|ebay|shopee|lazada|etsy|aliexpress|alibaba|temu/i,
    /netflix|spotify|youtube|disney|hbo|hulu|adobe|microsoft\s?365|icloud|openai|chatgpt/i,
    /pitaka/i,
    /hype\s?online/i,
  ]],
  // Netherlands
  ["🇳🇱", "Netherlands", [
    /amsterdam/i,
    /netherlands/i,
  ]],
  // UK
  ["🇬🇧", "UK", [
    /\blondon\b/i,
    /united\s?kingdom/i,
  ]],
  // Australia — last because it's the default/most common
  ["🇦🇺", "Australia", [
    /chatswood|macquarie|sydney|parramatta|parra\b|north\s?ryde|st\s?leon|marrickville|galeries|bondi|surfers\s?paradise|coomera|melbourne|brisbane|mascot/i,
    /woolworth|coles|iga\b|harris\s?farm|kmart/i,
    /service\s?nsw/i,
    /macpac/i,
    /boost\s?juice/i,
    /mecca\s?brand/i,
    /\blush\b/i,
    /chemist\s?warehouse|priceline|pline(?:\s?ph)?/i,
    /nth\s?shore/i,
    /nxchem/i,
    /tangerine\s?telecom/i,
    /optus|telstra|vodafone|nbn\b|iinet|tpg\b/i,
    /eziabacus/i,
    /dovel\s?butchery/i,
    /pop\s?mart.*oceania/i,
    /australian\s?way/i,
    /cantaloupe\s?systems\s?aus/i,
    /ringo\s?australia/i,
    /film\s?fest/i,
    /vfs\s?service/i,
    /acf\s?investment/i,
    /qantas|virgin\s?australia|jetstar|currumbin|dreamworld|phillip\s?island/i,
    /opal\b|myki\b/i,
    /ddk\s?trading|interchange\s?trading/i,
    /daiso/i,
    /pty\s?l/i,
  ]],
];

/**
 * Detect country from transaction description.
 * Returns "🇦🇺 Australia" style string, or undefined if unknown.
 */
export function detectCountry(description: string): string | undefined {
  const cleaned = description.trim();

  for (const [flag, label, patterns] of COUNTRY_RULES) {
    for (const pattern of patterns) {
      if (pattern.test(cleaned)) {
        return `${flag} ${label}`;
      }
    }
  }

  return undefined;
}

/** Get just the flag emoji for compact display */
export function getCountryFlag(country: string | undefined): string {
  if (!country) return "";
  return country.split(" ")[0];
}
