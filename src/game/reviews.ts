// What customers say after eating, and what they write on Yumm. Everything is built in both
// languages at once so it follows the language toggle later.

import type { Lang, L } from './i18n';
import { REASON_TEXT, type Reason } from './orders';

export type VerdictReply = 'sorry' | 'free' | 'argue' | 'thanks' | 'promise' | 'enjoy' | 'none';

const R = (r: Reason, lang: Lang) => REASON_TEXT[r][lang];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const join = (a: string[], lang: Lang) =>
  a.length <= 1
    ? a.join('')
    : a.slice(0, -1).join(', ') + (lang === 'tr' ? ' ve ' : ' and ') + a[a.length - 1];
function bi(f: (lang: Lang) => string): L {
  return { tr: f('tr'), en: f('en') };
}
const pickBy = <T>(a: T[], seed: number) => a[Math.abs(seed) % a.length];

export function starsFor(sat: number) {
  return sat >= 90 ? 5 : sat >= 75 ? 4 : sat >= 55 ? 3 : sat >= 35 ? 2 : 1;
}

/** the honest first reaction after eating */
export function verdictLine(sat: number, reasons: Reason[], seed: number, complaint = false): L {
  const rs = reasons.filter((r) => r !== 'slow').slice(0, 2);
  if (sat >= 90 && !rs.length)
    return pickBy(
      [
        {
          tr: 'Harika! Tam istediğim gibi, ağzımda eridi!',
          en: 'Amazing! Exactly what I wanted, it melts in my mouth!',
        },
        {
          tr: 'Vay! Hayatımın en güzel sushisi olabilir!',
          en: 'Wow! That might be the best sushi of my life!',
        },
        {
          tr: 'Mmm… pirinç sıcacık, balık taptaze. Bayıldım!',
          en: 'Mmm… warm rice, super fresh fish. I love it!',
        },
      ],
      seed
    );
  if (sat >= 75 && !complaint)
    return bi((l) =>
      rs.length
        ? l === 'tr'
          ? `Lezzetli! Sadece ${R(rs[0], l)}.`
          : `Tasty! Just that ${R(rs[0], l)}.`
        : l === 'tr'
          ? 'Çok güzel olmuş, eline sağlık!'
          : 'Really good, nice work!'
    );
  if (sat >= 55 && !complaint)
    return bi((l) =>
      l === 'tr'
        ? `İdare eder ama ${
            join(
              rs.map((r) => R(r, l)),
              l
            ) || 'biraz geç geldi'
          }.`
        : `It’s okay, but ${
            join(
              rs.map((r) => R(r, l)),
              l
            ) || 'it took a while'
          }.`
    );
  return bi((l) => {
    const why = rs.length
      ? cap(
          join(
            rs.map((r) => R(r, l)),
            l
          )
        ) + '.'
      : l === 'tr'
        ? 'Hiç tadı yok.'
        : 'It has no taste.';
    return l === 'tr'
      ? `Açıkçası beğenmedim. ${why} Kötü olmuş.`
      : `Honestly, I didn’t like it. ${why} It’s bad.`;
  });
}

/** what the customer says back to your reply */
export function reactLine(reply: VerdictReply, good: boolean): L {
  switch (reply) {
    case 'sorry':
      return {
        tr: 'Peki… en azından özür diledin. Ama bahşiş yok.',
        en: 'Well… at least you apologized. But no tip.',
      };
    case 'free':
      return {
        tr: 'Ücretsiz mi? Bu çok nazik. Bir şans daha veririm.',
        en: 'Free? That’s very kind. I’ll give you another chance.',
      };
    case 'argue':
      return {
        tr: 'Ne?! Bir de haklı mı çıkacaksın? Bunu Nefis’e yazacağım!',
        en: 'What?! You think you’re right? I’m writing this on Yumm!',
      };
    case 'promise':
      return { tr: 'Tamam, bir dahakine bakarız.', en: 'Okay, we’ll see next time.' };
    case 'thanks':
    case 'enjoy':
      return good
        ? { tr: 'Ben teşekkür ederim! Herkese anlatacağım.', en: 'Thank YOU! I’ll tell everyone.' }
        : { tr: 'Hı hı.', en: 'Uh-huh.' };
    default:
      return { tr: 'Neyse…', en: 'Anyway…' };
  }
}

const GOOD_TAGS: L[] = [
  { tr: 'Taze balık', en: 'Fresh fish' },
  { tr: 'Güzel sunum', en: 'Nice plating' },
  { tr: 'Sıcak pirinç', en: 'Warm rice' },
];
const FAST: L = { tr: 'Hızlı servis', en: 'Fast service' };
const FRIENDLY: L = { tr: 'Güler yüzlü şef', en: 'Friendly chef' };
const RUDE: L = { tr: 'Kaba şef', en: 'Rude chef' };

export interface ReviewDraft {
  stars: number;
  text: L;
  good: L[];
}

/** the Yumm review a customer writes */
export function writeReview(o: {
  sat: number;
  reasons: Reason[];
  reply: VerdictReply;
  chatted: boolean;
  fast: boolean;
  walkout?: boolean;
  online?: boolean;
  seed: number;
  special?: string;
}): ReviewDraft {
  if (o.walkout)
    return {
      stars: 1,
      text: pickBy(
        [
          {
            tr: 'Çok bekledim, sipariş gelmeden gittim. Buz kestim!',
            en: 'Waited forever and left before my food came. I froze!',
          },
          { tr: 'Kimse ilgilenmedi. Bir daha gelmem.', en: 'Nobody took care of me. Never again.' },
        ],
        o.seed
      ),
      good: [],
    };
  let stars = starsFor(o.sat);
  if (o.reply === 'sorry') stars = Math.min(3, stars + 1);
  if (o.reply === 'free') stars = Math.min(4, stars + 2);
  if (o.reply === 'argue') stars = Math.max(1, stars - 1);
  if (o.special === 'squawk') stars = Math.max(1, Math.min(4, stars - 1));
  const rs = o.reasons.slice(0, 2);
  const good: L[] = [];
  if (stars >= 4) good.push(pickBy(GOOD_TAGS, o.seed));
  if (stars >= 4 && o.fast) good.push(FAST);
  if (o.chatted && o.reply !== 'argue') good.push(FRIENDLY);
  if (o.reply === 'argue') good.push(RUDE);

  const text = bi((l) => {
    const tr = l === 'tr';
    const why = join(
      rs.map((r) => R(r, l)),
      l
    );
    let s: string;
    if (o.special === 'squawk')
      s =
        stars >= 4
          ? tr
            ? 'GAK. Hata aradım, bulamadım. Bu kadar. Dört yıldız. GAK.'
            : 'SQUAWK. Looked for a mistake, found none. That’s it. Four stars. SQUAWK.'
          : tr
            ? `GAK! Söylemiştim: ${why || 'berbat'}! Festivalde kulübe benim!`
            : `SQUAWK! Told you: ${why || 'awful'}! The hut is mine at the festival!`;
    else if (stars === 5)
      s = pickBy(
        tr
          ? [
              'Limanın en iyi sushisi! Kesinlikle tekrar geleceğim.',
              'Mükemmeldi. Pencereden kar yağarken sushi… bayıldım.',
              'Her şey tam istediğim gibiydi!',
            ]
          : [
              'Best sushi on the harbor! Definitely coming back.',
              'Perfect. Sushi while the snow falls outside… loved it.',
              'Everything was exactly how I wanted it!',
            ],
        o.seed
      );
    else if (stars === 4)
      s = why
        ? tr
          ? `Çok güzeldi, sadece ${why}.`
          : `Really good, just that ${why}.`
        : tr
          ? 'Çok lezzetliydi, tavsiye ederim.'
          : 'Very tasty, recommended.';
    else if (stars === 3)
      s = tr
        ? `Fena değil ama ${why || 'biraz bekledim'}.`
        : `Not bad, but ${why || 'I waited a bit'}.`;
    else s = tr ? `Beğenmedim: ${why || 'tadı yoktu'}.` : `Didn’t like it: ${why || 'no taste'}.`;
    if (o.reply === 'sorry')
      s += tr
        ? ' Şef özür diledi, en azından kibar.'
        : ' The chef apologized, at least that was kind.';
    if (o.reply === 'free')
      s += tr ? ' Ücret almadılar, çok naziktiler.' : ' They didn’t charge me, very kind.';
    if (o.reply === 'argue')
      s += tr
        ? ' Üstelik şef bana “sen anlamadın” dedi!'
        : ' And the chef told me I “didn’t get it”!';
    if (o.chatted && stars >= 3 && o.reply !== 'argue')
      s += tr ? ' Şef çok sohbetçi.' : ' The chef is so friendly.';
    if (o.online) s = (tr ? 'Paket: ' : 'Delivery: ') + s;
    return s;
  });
  return { stars, text, good };
}

export interface Choice {
  id: string;
  label: L;
}

export const ORDER_REPLIES: Choice[] = [
  { id: 'ok', label: { tr: 'Hemen geliyor!', en: 'Coming right up!' } },
  { id: 'repeat', label: { tr: 'Tekrar söyler misin?', en: 'Could you repeat that?' } },
];

const CHATS: [L, L][] = [
  [
    { tr: 'Bugün kar çok güzel, değil mi?', en: 'Lovely snow today, right?' },
    { tr: 'Evet! Sabah kartopu oynadık.', en: 'Yes! We had a snowball fight this morning.' },
  ],
  [
    { tr: 'Atkın çok yakışmış!', en: 'Love your scarf!' },
    { tr: 'Aa, teşekkürler! Ninem ördü.', en: 'Aw, thanks! Grandma knitted it.' },
  ],
  [
    { tr: 'Balıklar bu sabah geldi, taptaze!', en: 'The fish came in this morning, super fresh!' },
    { tr: 'Süper, sabırsızlanıyorum!', en: 'Great, can’t wait!' },
  ],
  [
    { tr: 'Festivale geliyor musun?', en: 'Coming to the festival?' },
    { tr: 'Tabii! Kuzey ışıklarını kaçırmam.', en: 'Of course! I won’t miss the northern lights.' },
  ],
];
export function chatFor(seed: number) {
  return CHATS[Math.abs(seed) % CHATS.length];
}

export const HURRY_LINE: L = {
  tr: 'Hâlâ bekliyorum… acele eder misin?',
  en: 'Still waiting… could you hurry?',
};
export const HURRY_REPLIES: Choice[] = [
  { id: 'soon', label: { tr: 'Az kaldı, söz!', en: 'Almost done, promise!' } },
  { id: 'patience', label: { tr: 'Güzel şeyler zaman alır.', en: 'Good things take time.' } },
];

export function verdictReplies(good: boolean, bad: boolean): Choice[] {
  if (bad)
    return [
      { id: 'sorry', label: { tr: 'Haklısın, özür dilerim.', en: 'You’re right, I’m sorry.' } },
      { id: 'free', label: { tr: 'Bu tabak bizden, ücretsiz!', en: 'This one’s on the house!' } },
      { id: 'argue', label: { tr: 'Bence gayet güzel.', en: 'I think it’s fine.' } },
    ];
  if (good)
    return [
      { id: 'enjoy', label: { tr: 'Afiyet olsun!', en: 'Enjoy!' } },
      { id: 'thanks', label: { tr: 'Yine bekleriz!', en: 'Come again!' } },
    ];
  return [
    { id: 'thanks', label: { tr: 'Teşekkürler!', en: 'Thanks!' } },
    { id: 'promise', label: { tr: 'Bir dahakine daha iyisi!', en: 'Even better next time!' } },
  ];
}
