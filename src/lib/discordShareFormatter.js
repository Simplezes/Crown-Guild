import { emojiservers } from '@/lib/emojiservers';

const DISCORD_PROFILE_BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
const CATEGORY_ORDER = ['S+L', 'Small', 'Large'];

function stripNamePrefixes(name) {
  let stripped = String(name || '').trim();
  stripped = stripped.replace(/^Tempered\s+Guardian\s+/i, '');
  stripped = stripped.replace(/^Guardian\s+/i, '');
  stripped = stripped.replace(/^Tempered\s+/i, '');
  return stripped;
}

function normalizeEmojiKey(name) {
  return stripNamePrefixes(name)
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
}

function isGuardianVariant(monster) {
  const variant = String(monster?.variant || '').toLowerCase();
  const name = String(monster?.name || '').toLowerCase();
  return variant === 'guardian' || /^guardian\s+/.test(name) || /^tempered\s+guardian\s+/.test(name);
}

function getMonsterEmojiOrFallback(monster, serverEmojis, serverEmojiLookup) {
  const keyBase = normalizeEmojiKey(monster?.name);
  const key = isGuardianVariant(monster) ? `G${keyBase}` : keyBase;
  return serverEmojis[key] || serverEmojiLookup[key.toLowerCase()] || stripNamePrefixes(monster?.name);
}

function appendCategoryLine(label, values) {
  if (!values.length) return null;
  return `**${label}** ${values.join(' ')}`;
}

function formatCompactWishlist(wishlist, serverEmojis, serverEmojiLookup) {
  if (!Array.isArray(wishlist) || wishlist.length === 0) return null;

  const grouped = {
    S: [],
    L: [],
    'S+L': [],
  };

  for (const item of wishlist) {
    const typeRaw = String(item?.type || '').toLowerCase();
    const group = typeRaw === 'large' ? 'L' : typeRaw === 'small' ? 'S' : 'S+L';
    const fakeMonster = { name: item?.monster_name, variant: item?.tempered ? 'Tempered' : null };
    grouped[group].push(getMonsterEmojiOrFallback(fakeMonster, serverEmojis, serverEmojiLookup));
  }

  const parts = [];
  if (grouped.S.length) parts.push(`S ${grouped.S.join(' ')}`);
  if (grouped.L.length) parts.push(`L ${grouped.L.join(' ')}`);
  if (grouped['S+L'].length) parts.push(`S+L ${grouped['S+L'].join(' ')}`);

  if (parts.length === 0) return null;
  return `Wishlist: ${parts.join('  •  ')}`;
}

export function formatEmojiGrid(data, useEmojis = true) {
  const shouldUseEmojis = typeof data?.useEmojis === 'boolean' ? data.useEmojis : useEmojis;
  const emojiServerId = String(data?.emojiServerId || '');
  const serverEmojis = emojiservers[emojiServerId] || {};
  const serverEmojiLookup = Object.fromEntries(
    Object.entries(serverEmojis).map(([key, value]) => [key.toLowerCase(), value])
  );
  const username = String(data?.username || 'unknown');
  const userId = String(data?.userId || '');
  const shareId = String(data?.shareId || '');
  const monsters = Array.isArray(data?.monsters) ? data.monsters : [];
  const wishlist = Array.isArray(data?.wishlist) ? data.wishlist : [];

  const profileUrl = `${DISCORD_PROFILE_BASE_URL}/profile/${userId}?share=${shareId}`;

  if (!shouldUseEmojis) {
    const slCount = monsters.filter((m) => m?.category === 'S+L').length;
    const smallCount = monsters.filter((m) => m?.category === 'Small').length;
    const largeCount = monsters.filter((m) => m?.category === 'Large').length;
    const wishlistCount = wishlist.length;

    const lines = [
      `**.${username} - Crown Collection**`,
      '',
      `Small + Large: ${slCount} monster${slCount !== 1 ? 's' : ''}`,
      `Small Crown: ${smallCount} monster${smallCount !== 1 ? 's' : ''}`,
      `Large Crown: ${largeCount} monster${largeCount !== 1 ? 's' : ''}`,
    ];

    if (wishlistCount > 0) {
      lines.push(`Wishlist: ${wishlistCount} Monster${wishlistCount !== 1 ? 's' : ''}`);
    }

    lines.push('', `:link: View full collection:`, profileUrl);

    return lines.join('\n');
  }

  const rawCrowns = Array.isArray(data?.crowns) ? data.crowns : [];

  // Deduplicate into small and large lists preserving order
  const smallCrowns = [];
  const largeCrowns = [];
  const seenSmall = new Set();
  const seenLarge = new Set();

  for (const crown of rawCrowns) {
    const variant = crown?.variant || (crown?.tempered ? 'Tempered' : null);
    const fakeMonster = { name: crown?.name || crown?.monster_name, variant };
    const emoji = getMonsterEmojiOrFallback(fakeMonster, serverEmojis, serverEmojiLookup);
    const key = `${crown?.name}||${crown?.tempered ? 1 : 0}||${Number(crown?.strength_rating || 0)}`;
    if (String(crown?.type).toLowerCase() === 'small' && !seenSmall.has(key)) {
      seenSmall.add(key);
      smallCrowns.push({ ...crown, _emoji: emoji });
    } else if (String(crown?.type).toLowerCase() === 'large' && !seenLarge.has(key)) {
      seenLarge.add(key);
      largeCrowns.push({ ...crown, _emoji: emoji });
    }
  }

  function formatAvailLine(prefix, crowns) {
    const regular = crowns.filter((c) => !c.tempered).map((c) => c._emoji);
    const temperedByStrength = new Map();
    crowns
      .filter((c) => c.tempered)
      .forEach((crown) => {
        const strength = Number(crown?.strength_rating || 0);
        const label = strength > 0 ? `${strength}★` : 'Tempered';
        if (!temperedByStrength.has(label)) temperedByStrength.set(label, []);
        temperedByStrength.get(label).push(crown._emoji);
      });
    const parts = [...regular];
    for (const [label, emojis] of temperedByStrength.entries()) {
      parts.push(`(${label}: ${emojis.join(' ')})`);
    }
    if (!parts.length) return null;
    return `${prefix}: ${parts.join(' ')}`;
  }

  const sLine = formatAvailLine('S', smallCrowns);
  const lLine = formatAvailLine('L', largeCrowns);

  // Build Multi-Quest pairs from pair_id
  const pairMap = new Map();
  for (const crown of rawCrowns) {
    if (!crown?.pair_id) continue;
    const pairId = String(crown.pair_id);
    if (!pairMap.has(pairId)) pairMap.set(pairId, []);
    pairMap.get(pairId).push(crown);
  }

  const multiPairs = [];
  const seenPairLabels = new Set();
  for (const pair of pairMap.values()) {
    if (pair.length < 2) continue;
    const label = pair.slice(0, 2).map((c) => {
      const variant = c?.variant || (c?.tempered ? 'Tempered' : null);
      const emoji = getMonsterEmojiOrFallback({ name: c?.name || c?.monster_name, variant }, serverEmojis, serverEmojiLookup);
      return `${String(c?.type).toLowerCase() === 'small' ? 'S' : 'L'} ${emoji}`;
    }).join(' + ');
    if (!seenPairLabels.has(label)) {
      seenPairLabels.add(label);
      multiPairs.push(label);
    }
  }

  const lines = ['Available:'];
  if (sLine) lines.push(sLine);
  if (lLine) lines.push(lLine);

  if (multiPairs.length) {
    lines.push('Multi-Quest:');
    lines.push(multiPairs.join(' / '));
  }

  lines.push('', profileUrl);

  return lines.join('\n');
}

export function buildShareMonstersFromCrowns(crowns) {
  const list = Array.isArray(crowns) ? crowns : [];
  const groupedByMonster = new Map();
  const linkedMonsters = new Set();
  const pairMap = new Map();

  list.forEach((crown) => {
    if (!crown?.pair_id) return;

    const pairId = String(crown.pair_id);
    if (!pairMap.has(pairId)) pairMap.set(pairId, []);
    pairMap.get(pairId).push(crown);
  });

  for (const pair of pairMap.values()) {
    const pairMonsters = new Map();

    pair.forEach((crown) => {
      const name = String(crown?.name || crown?.monster_name || '').trim();
      if (!name) return;

      const variant = crown?.variant || (crown?.tempered ? 'Tempered' : null);
      const key = `${name}||${variant || ''}`;

      if (!pairMonsters.has(key)) {
        pairMonsters.set(key, { hasSmall: false, hasLarge: false });
      }

      const current = pairMonsters.get(key);
      if (crown?.type === 'small') current.hasSmall = true;
      if (crown?.type === 'large') current.hasLarge = true;
    });

    for (const [key, entry] of pairMonsters.entries()) {
      if (entry.hasSmall && entry.hasLarge) linkedMonsters.add(key);
    }
  }

  list.forEach((crown, index) => {
    const name = String(crown?.name || crown?.monster_name || '').trim();
    if (!name) return;

    const variant = crown?.variant || (crown?.tempered ? 'Tempered' : null);
    const key = `${name}||${variant || ''}`;

    if (!groupedByMonster.has(key)) {
      groupedByMonster.set(key, {
        name,
        variant,
        hasSmall: false,
        hasLarge: false,
        firstSeenSmall: Number.POSITIVE_INFINITY,
        firstSeenLarge: Number.POSITIVE_INFINITY,
        firstSeen: index,
      });
    }

    const current = groupedByMonster.get(key);
    if (crown?.type === 'small') {
      current.hasSmall = true;
      current.firstSeenSmall = Math.min(current.firstSeenSmall, index);
    }
    if (crown?.type === 'large') {
      current.hasLarge = true;
      current.firstSeenLarge = Math.min(current.firstSeenLarge, index);
    }
  });

  return Array.from(groupedByMonster.values())
    .flatMap((entry) => {
      const key = `${entry.name}||${entry.variant || ''}`;

      if (linkedMonsters.has(key)) {
        return [{
          name: entry.name,
          variant: entry.variant,
          category: 'S+L',
          order: entry.firstSeen,
        }];
      }

      const categories = [];

      if (entry.hasSmall) {
        categories.push({
          name: entry.name,
          variant: entry.variant,
          category: 'Small',
          order: entry.firstSeenSmall,
        });
      }

      if (entry.hasLarge) {
        categories.push({
          name: entry.name,
          variant: entry.variant,
          category: 'Large',
          order: entry.firstSeenLarge,
        });
      }

      return categories;
    })
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...entry }) => entry);
}
