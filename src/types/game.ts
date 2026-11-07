// Game type definitions for Sengoku Japan: Tenka Fubu

export type ClanId =
  | 'oda'
  | 'tokugawa'
  | 'takeda'
  | 'uesugi'
  | 'date'
  | 'mori'
  | 'hojo'
  | 'shimazu'
  | 'chosokabe'
  | 'custom';

export interface Clan {
  id: ClanId;
  name: string;
  kanji: string;
  leaderName: string;
  leaderTitle: string;
  color: string;
  accentColor: string;
  monSymbol: string;
  description: string;
  uniqueTroopName: string;
  trait: string;
  avatar: string;
}

export type CastleType = 'Fort' | 'BranchCastle' | 'ProvincialCapital' | 'DaimyoMainCastle';

export interface CastleTypeInfo {
  type: CastleType;
  name: string;
  kokudakaBonus: number;
  commerceBonus: number;
  supplyRange: number;
  defenseBonus: number;
  description: string;
}

export interface Province {
  id: string;
  name: string;
  kanji: string;
  region: 'Kinai' | 'Tokaido' | 'Tosando' | 'Hokurikudo' | 'Sanin' | 'Sanyo' | 'Nankaido' | 'Saikaido' | 'Tohoku';
  regionName: string;
  clanId: ClanId;
  kokudaka: number;      // 石高 (food / military capacity in koku)
  commerce: number;      // 商業 (gold income)
  loyalty: number;       // 民忠度 (0-100%)
  defense: number;       // 城防值
  maxDefense: number;
  castleName: string;
  castleType: CastleType;
  occupationProgress: number; // 0 - 100%
  coords: { x: number; y: number }; // Relative coordinates on sand-table map (0 - 100)
}

export interface GeneralSkill {
  name: string;
  description: string;
  cooldown: number; // seconds
  damage: number;
  effectType: 'damage' | 'volley' | 'buff' | 'charge';
}

export interface General {
  id: string;
  name: string;
  kanji: string;
  clanId: ClanId;
  role: 'Daimyo' | 'General' | 'Strategist' | 'Vassal';
  roleName: string;
  avatar: string;
  command: number;   // 統率 (1-100)
  martial: number;   // 武力 (1-100)
  intellect: number; // 智略 (1-100)
  politics: number;  // 政治 (1-100)
  charisma: number;  // 魅力 (1-100)
  loyalty: number;   // 忠誠度 (1-100)
  fief: string;      // 知行領地
  skill: GeneralSkill;
  title: string;
  equippedItem?: string;
  biography: string;
}

export interface TroopUnit {
  id: string;
  name: string;
  kanji: string;
  clanId?: ClanId;
  isClanUnique: boolean;
  type: 'spearman' | 'arquebusier' | 'cavalry' | 'archer' | 'artillery' | 'special';
  range: number;        // 距擊 (1-10)
  power: number;        // 烈度 / 攻擊 (1-100)
  defense: number;      // 防衛 (1-100)
  speed: number;        // 速度 (1-200)
  morale: number;       // 優兆 / 士氣 (1-250)
  costGold: number;
  costKoku: number;
  costCategory: 'Low' | 'Medium' | 'High' | 'Very High';
  specialSkill: string; // 特別技選
  description: string;
  artAsset?: string;
  counters: string;
}

export type Formation = 'fishScale' | 'craneWing' | 'circular';

export interface FormationInfo {
  id: Formation;
  name: string;
  kanji: string;
  atkBonus: number;
  defBonus: number;
  speedBonus: number;
  description: string;
  counteredBy: string;
}

export interface HistoricalEvent {
  id: string;
  title: string;
  year: number;
  summary: string;
  historicalOutcome: string;
  choices: {
    text: string;
    description: string;
    effect: {
      gold?: number;
      troops?: number;
      provisions?: number;
      loyalty?: number;
      gainProvinces?: string[];
      log: string;
    };
  }[];
}

export interface GameState {
  day: number;
  playerClanId: ClanId;
  gold: number;
  soldiers: number;
  provisions: number; // 石高 Kokudaka stored
  provinces: Province[];
  generals: General[];
  capturedGenerals: General[];
  activeFormation: Formation;
  diplomacy: Record<ClanId, { relation: number; allied: boolean; truceDays: boolean }>;
  courtRank: string; // 朝廷官位 (e.g. 従五位下, 正四位下, 征夷大將軍, 關白)
  unificationPercent: number;
}
