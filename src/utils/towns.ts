/**
 * Town normalisation for Cameroonian listings.
 *
 * `properties.town` is free text: the add-listing form lets the owner type it,
 * and otherwise fills it from Mapbox's `context[0]`, which is sometimes a
 * neighbourhood ("Bonapriso") or a region ("Littoral") rather than the town.
 * Accents make it worse — a listing saved as "Yaounde" never matched a
 * "Yaoundé" chip. Everything here funnels both sides onto one canonical name so
 * a listing shows up under its town as soon as it is created.
 */

/** Canonical town -> extra spellings that should resolve to it. */
const TOWN_ALIASES: Record<string, string[]> = {
  Douala: ['douala', 'duala', 'bonaberi', 'bonabéri', 'bonapriso', 'bonanjo', 'akwa', 'deido', 'bepanda', 'makepe', 'logbessou', 'ndokoti', 'pk', 'japoma'],
  'Yaoundé': ['yaounde', 'yaoundé', 'yde', 'bastos', 'mvan', 'nsam', 'mvog-ada', 'mvog ada', 'odza', 'nkolbisson', 'biyem-assi', 'biyem assi', 'emana', 'mendong', 'simbock', 'ngousso', 'essos'],
  Bamenda: ['bamenda', 'mankon', 'nkwen', 'bambili', 'up station', 'mile 4', 'ntarikon'],
  Buea: ['buea', 'molyko', 'bonduma', 'muea', 'mile 16', 'mile 17', 'great soppo', 'small soppo', 'bokwaongo', 'checkpoint'],
  Limbe: ['limbe', 'victoria', 'mile 4 limbe', 'bota', 'down beach', 'mile one limbe', 'ngeme', 'isokolo'],
  Kribi: ['kribi', 'grand batanga', 'mboa manga'],
  Bafoussam: ['bafoussam', 'tamdja', 'banengo', 'kamkop'],
  Garoua: ['garoua', 'garua'],
  Maroua: ['maroua'],
  'Ngaoundéré': ['ngaoundere', 'ngaoundéré', 'ndere'],
  Bertoua: ['bertoua'],
  Ebolowa: ['ebolowa'],
  Kumba: ['kumba', 'fiango', 'mambanda'],
  'Edéa': ['edea', 'edéa'],
  Dschang: ['dschang'],
  Nkongsamba: ['nkongsamba'],
  Tiko: ['tiko', 'mutengene', 'likomba'],
  Foumban: ['foumban'],
  Mbouda: ['mbouda'],
  Bandjoun: ['bandjoun'],
  'Sangmélima': ['sangmelima', 'sangmélima'],
};

/** Towns offered as filter chips on the home screens, in display order. */
export const POPULAR_TOWNS = ['Douala', 'Yaoundé', 'Bamenda', 'Buea', 'Limbe', 'Kribi'] as const;

export const CANONICAL_TOWNS = Object.keys(TOWN_ALIASES);

/** Latin-1 accents used in Cameroonian place names, folded to ASCII. */
const ACCENT_FOLD: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o',
  ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n', ÿ: 'y',
};

/** Lowercase, accent-free, punctuation collapsed to single spaces. */
export function normalizeTownText(value: string | null | undefined): string {
  if (!value) return '';
  let out = '';
  for (const char of value.toLowerCase()) {
    out += ACCENT_FOLD[char] ?? char;
  }
  return out.replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Aliases sorted longest-first, so "mile 4 limbe" wins over "mile 4" and a
 * short alias never shadows a more specific one.
 */
const SORTED_ALIASES: { town: string; alias: string }[] = Object.entries(TOWN_ALIASES)
  .flatMap(([town, aliases]) =>
    [normalizeTownText(town), ...aliases.map(normalizeTownText)].map((alias) => ({ town, alias }))
  )
  .filter((entry, index, all) => all.findIndex((e) => e.alias === entry.alias) === index)
  .sort((a, b) => b.alias.length - a.alias.length);

/** Whole-word containment, so "Buea" doesn't match inside "Bueakwa". */
function containsWord(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  const index = haystack.indexOf(needle);
  if (index === -1) return false;
  const before = index === 0 ? ' ' : haystack[index - 1];
  const afterIndex = index + needle.length;
  const after = afterIndex >= haystack.length ? ' ' : haystack[afterIndex];
  return before === ' ' && after === ' ';
}

/**
 * Best canonical town for a free-text town field or full address, or null when
 * nothing recognisable is in there.
 */
export function resolveTown(...candidates: (string | null | undefined)[]): string | null {
  for (const candidate of candidates) {
    const normalized = normalizeTownText(candidate);
    if (!normalized) continue;
    const match = SORTED_ALIASES.find((entry) => containsWord(normalized, entry.alias));
    if (match) return match.town;
  }
  return null;
}

/**
 * Spellings to match a town against in the database. Listings created before
 * normalisation still carry the raw value, so a query has to look for every
 * variant, in both `town` and the full `location` address.
 */
export function townSearchTerms(town: string): string[] {
  const canonical = resolveTown(town);
  const aliases = canonical ? TOWN_ALIASES[canonical] ?? [] : [];
  const terms = new Set<string>();
  terms.add(town.trim());
  if (canonical) terms.add(canonical);
  // Accent-free forms of the canonical name catch rows saved as "Yaounde".
  if (canonical) terms.add(normalizeTownText(canonical));
  // Only whole-town aliases are useful for a LIKE — neighbourhood aliases would
  // pull in unrelated listings, so keep those for resolution only.
  aliases
    .filter((alias) => normalizeTownText(alias).split(' ').length === 1 && alias.length > 3)
    .forEach((alias) => terms.add(alias));
  return [...terms].filter(Boolean);
}
