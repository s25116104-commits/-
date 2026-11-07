import React, { useState } from 'react';
import { Shield, Coins, Users, Castle, Swords, Compass, ChevronRight, AlertCircle, ArrowUpRight, Flame, Target } from 'lucide-react';
import { Clan, ClanId, Province } from '../types/game';
import { sound } from '../utils/sound';
import { CLANS, CASTLE_TYPES_INFO } from '../data/sengokuData';

interface GrandStrategyMapProps {
  provinces: Province[];
  playerClan: Clan;
  playerProvisions: number;
  onSelectProvinceToBattle: (province: Province, provisionCost: number) => void;
  onOpenCouncil: (province?: Province) => void;
  onSeverSupplyLine: (provinceId: string) => void;
  onPatrolProvince: (provinceId: string) => void;
  onRecruitTroops: (provinceId: string) => void;
}

export const GrandStrategyMap: React.FC<GrandStrategyMapProps> = ({
  provinces,
  playerClan,
  playerProvisions,
  onSelectProvinceToBattle,
  onOpenCouncil,
  onSeverSupplyLine,
  onPatrolProvince,
  onRecruitTroops,
}) => {
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('yamashiro');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [showMarchingRoutes, setShowMarchingRoutes] = useState<boolean>(true);

  const selectedProvince = provinces.find((p) => p.id === selectedProvinceId) || provinces[0];
  const isPlayerOwned = selectedProvince.clanId === playerClan.id;
  const provinceClan = CLANS.find((c) => c.id === selectedProvince.clanId) || CLANS[0];

  const regions = [
    { id: 'all', label: '全日本 (All)' },
    { id: 'Kinai', label: '畿內 (Kinai)' },
    { id: 'Tokaido', label: '東海道 (Tokaido)' },
    { id: 'Tosando', label: '東山道 (Tosando)' },
    { id: 'Hokurikudo', label: '北陸道 (Hokuriku)' },
    { id: 'Sanyo', label: '山陽·山陰 (Chugoku)' },
    { id: 'Nankaido', label: '四國 (Shikoku)' },
    { id: 'Saikaido', label: '九州 (Kyushu)' },
    { id: 'Tohoku', label: '奧羽 (Tohoku)' },
  ];

  const filteredProvinces = regionFilter === 'all'
    ? provinces
    : regionFilter === 'Sanyo'
    ? provinces.filter((p) => p.region === 'Sanyo' || p.region === 'Sanin')
    : provinces.filter((p) => p.region === regionFilter);

  // Stats summary
  const playerProvinces = provinces.filter((p) => p.clanId === playerClan.id);
  const playerProvincesCount = playerProvinces.length;
  const totalPlayerKokudaka = playerProvinces.reduce((sum, p) => sum + p.kokudaka, 0);
  const totalPlayerCommerce = playerProvinces.reduce((sum, p) => sum + p.commerce, 0);

  const castleInfo = CASTLE_TYPES_INFO[selectedProvince.castleType] || CASTLE_TYPES_INFO.ProvincialCapital;

  // Calculate distance to closest player territory & expedition provision cost (兵糧消耗計算)
  const calculateMarchingData = (target: Province) => {
    if (target.clanId === playerClan.id) {
      return {
        distanceRi: 0,
        distanceCategory: '本陣直轄',
        provisionCost: 0,
        baseProvisions: 0,
        distanceProvisions: 0,
        closestProvince: target,
        isOwned: true,
        isAffordable: true,
        supplyLevel: 'safe' as const,
      };
    }

    let minDistance = 999;
    let closest: Province = playerProvinces[0] || target;

    playerProvinces.forEach((p) => {
      const dx = target.coords.x - p.coords.x;
      const dy = target.coords.y - p.coords.y;
      const d = Math.hypot(dx, dy);
      if (d < minDistance) {
        minDistance = d;
        closest = p;
      }
    });

    // 1 coord unit ≈ 4 里 (Sengoku leagues)
    const distanceRi = Math.max(12, Math.round(minDistance * 4));

    // Base engagement ration: 300 糧
    // Distance ration: 16 糧 per 里 (遠征輜重糧草倍增，越遠耗糧越高)
    const baseProvisions = 300;
    const distanceProvisions = Math.round(distanceRi * 16);
    const totalProvisionCost = baseProvisions + distanceProvisions;

    let distanceCategory = '近鄰接壤';
    if (distanceRi > 160) distanceCategory = '萬里遠征 (極遠)';
    else if (distanceRi > 90) distanceCategory = '長途遠征 (遠)';
    else if (distanceRi > 40) distanceCategory = '中程進擊 (中)';

    const isAffordable = playerProvisions >= totalProvisionCost;
    const isTight = playerProvisions < totalProvisionCost * 1.5;

    let supplyLevel: 'safe' | 'tight' | 'shortage' = 'safe';
    if (!isAffordable) supplyLevel = 'shortage';
    else if (isTight) supplyLevel = 'tight';

    return {
      distanceRi,
      distanceCategory,
      provisionCost: totalProvisionCost,
      baseProvisions,
      distanceProvisions,
      closestProvince: closest,
      isOwned: false,
      isAffordable,
      supplyLevel,
    };
  };

  const marchingData = calculateMarchingData(selectedProvince);

  return (
    <div className="relative w-full h-[calc(100vh-125px)] min-h-[580px] bg-stone-950 flex flex-col overflow-hidden">
      {/* Top Map Toolbar */}
      <div className="z-10 bg-stone-900/90 border-b border-amber-950/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-stone-200">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="font-serif font-bold text-amber-200 text-sm">全日本 66 國沙盤領地爭奪</span>
          <span className="text-xs px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300">
            支配國數: <strong className="text-amber-300">{playerProvincesCount}</strong> / 66
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 hidden sm:inline">
            總石高: <strong className="text-emerald-300">{totalPlayerKokudaka.toLocaleString()}</strong> 石
          </span>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {regions.map((reg) => (
            <button
              key={reg.id}
              onClick={() => {
                sound.playClick();
                setRegionFilter(reg.id);
              }}
              className={`px-2.5 py-1 text-xs rounded font-serif transition whitespace-nowrap ${
                regionFilter === reg.id
                  ? 'bg-amber-600 text-stone-950 font-bold shadow'
                  : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/60'
              }`}
            >
              {reg.label}
            </button>
          ))}

          <button
            onClick={() => setShowMarchingRoutes(!showMarchingRoutes)}
            className={`px-2 py-1 text-xs rounded border transition flex items-center gap-1 ${
              showMarchingRoutes
                ? 'bg-red-950/80 border-red-700 text-red-300'
                : 'bg-stone-800 border-stone-700 text-stone-400'
            }`}
            title="開關進軍行軍路線箭頭"
          >
            <Target className="w-3 h-3" />
            <span className="hidden md:inline">進軍路線</span>
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Map Interactive Viewport */}
        <div className="relative flex-1 bg-[#1a1715] overflow-auto flex items-center justify-center p-4">
          {/* Decorative antique map parchment texture & background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Map Container (Aspect Ratio representing Japan Arch) */}
          <div className="relative w-full max-w-5xl aspect-[16/10] min-h-[460px] bg-gradient-to-br from-stone-900 via-stone-950 to-[#120f0d] rounded-2xl border-2 border-amber-900/40 p-4 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Japan Map SVG Graphic with Coastline / Island outlines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 650"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Sea Waves / Grid background lines */}
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="allyRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Decorative Land Masses / Topography Silhouettes */}
              <path
                d="M 120 480 Q 150 420, 220 400 T 320 370 T 450 350 T 600 320 T 720 280 T 800 180"
                fill="none"
                stroke="#44352b"
                strokeWidth="120"
                strokeLinecap="round"
                opacity="0.3"
              />
              <path
                d="M 140 520 Q 180 460, 260 430 T 400 390 T 550 360 T 700 330 T 780 230"
                fill="none"
                stroke="#32261e"
                strokeWidth="60"
                strokeLinecap="round"
                opacity="0.4"
              />

              {/* Marching Arrows (Authentic to Image #4 & #7) */}
              {showMarchingRoutes && (
                <>
                  {/* Advance to Kyoto/Yamashiro Arrow */}
                  <path
                    d="M 570 330 Q 540 340, 500 350"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="4"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                  <polygon points="500,350 514,342 512,356" fill="#ef4444" />

                  {/* Advance from Mikawa to Owari */}
                  <path
                    d="M 600 360 Q 585 350, 570 340"
                    fill="none"
                    stroke="url(#allyRouteGradient)"
                    strokeWidth="3"
                    strokeDasharray="5 3"
                  />
                  <polygon points="570,340 582,336 580,348" fill="#10b981" />

                  {/* Kawanakajima Conflict Line between Kai & Echigo */}
                  <path
                    d="M 680 330 Q 675 300, 670 270"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                  {/* Western Marching Arrow (Chugoku towards Kyoto) */}
                  <path
                    d="M 370 370 Q 430 360, 470 360"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="3.5"
                    strokeDasharray="6 3"
                  />
                </>
              )}

              {/* Dynamic Marching Route & Provision Line to Selected Province */}
              {!marchingData.isOwned && marchingData.closestProvince && (
                <g className="transition-all duration-300">
                  <path
                    d={`M ${marchingData.closestProvince.coords.x * 10} ${marchingData.closestProvince.coords.y * 6.5} Q ${(marchingData.closestProvince.coords.x + selectedProvince.coords.x) * 5} ${(marchingData.closestProvince.coords.y + selectedProvince.coords.y) * 3.25 - 28} ${selectedProvince.coords.x * 10} ${selectedProvince.coords.y * 6.5}`}
                    fill="none"
                    stroke={marchingData.isAffordable ? "#f59e0b" : "#ef4444"}
                    strokeWidth="4"
                    strokeDasharray="7 4"
                    className="animate-pulse"
                  />
                  {/* Base Circle */}
                  <circle
                    cx={marchingData.closestProvince.coords.x * 10}
                    cy={marchingData.closestProvince.coords.y * 6.5}
                    r="9"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  {/* Destination Reticle */}
                  <circle
                    cx={selectedProvince.coords.x * 10}
                    cy={selectedProvince.coords.y * 6.5}
                    r="15"
                    fill="none"
                    stroke={marchingData.isAffordable ? "#f59e0b" : "#ef4444"}
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                  />
                </g>
              )}
            </svg>

            {/* Provinces Nodes Layer */}
            <div className="absolute inset-0">
              {filteredProvinces.map((prov) => {
                const isSelected = prov.id === selectedProvinceId;
                const isOwned = prov.clanId === playerClan.id;
                const provClan = CLANS.find((c) => c.id === prov.clanId) || CLANS[0];

                return (
                  <button
                    key={prov.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedProvinceId(prov.id);
                    }}
                    style={{
                      left: `${prov.coords.x}%`,
                      top: `${prov.coords.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`group absolute flex flex-col items-center transition-all duration-300 z-20 ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                    }`}
                  >
                    {/* Castle / Mon Badge */}
                    <div
                      className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border shadow-lg transition-all ${
                        isOwned
                          ? 'border-amber-400 bg-gradient-to-br from-red-800 to-amber-900 text-amber-200'
                          : 'border-stone-600 bg-stone-900/95 text-stone-200'
                      } ${isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.8)]' : ''}`}
                    >
                      {/* Mon character or Castle symbol */}
                      <span className="text-[11px] font-bold font-serif leading-none">
                        {provClan.monSymbol}
                      </span>

                      {/* Small Castle hierarchy indicator dot */}
                      <span
                        className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-stone-900 ${
                          prov.castleType === 'DaimyoMainCastle'
                            ? 'bg-amber-400'
                            : prov.castleType === 'ProvincialCapital'
                            ? 'bg-sky-400'
                            : prov.castleType === 'BranchCastle'
                            ? 'bg-emerald-400'
                            : 'bg-stone-500'
                        }`}
                        title={prov.castleType}
                      />

                      {/* Conflict / Occupation alert ping if not 100% controlled */}
                      {prov.occupationProgress < 100 && (
                        <span className="absolute -bottom-1 -left-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Province Name Tag */}
                    <div
                      className={`mt-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-serif font-bold whitespace-nowrap transition-all shadow-md ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 shadow-amber-500/50'
                          : isOwned
                          ? 'bg-amber-950/90 text-amber-200 border border-amber-700/60'
                          : 'bg-stone-900/90 text-stone-300 border border-stone-700/50'
                      }`}
                    >
                      {prov.kanji}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map Legend (Bottom-Left) */}
            <div className="absolute bottom-3 left-3 bg-stone-950/90 border border-amber-950/80 rounded-lg p-2.5 backdrop-blur text-[10px] text-stone-300 font-serif shadow-xl pointer-events-none hidden sm:block">
              <div className="font-bold text-amber-300 mb-1 border-b border-stone-800 pb-1">圖例說明 (Legend)</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>己方直轄領地 (Your Domain)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>敵方割據領地 (Hostile Clan)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 border border-black" />
                <span>本城巨城 (Main Castle)</span>
                <span className="w-2 h-2 rounded-full bg-sky-400 border border-black ml-1" />
                <span>國府政廳 (Capital)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Province Domain Detail Drawer */}
        <div className="w-full md:w-80 lg:w-96 bg-stone-950 border-t md:border-t-0 md:border-l border-amber-950/80 flex flex-col p-4 shadow-2xl overflow-y-auto">
          {/* Card Header */}
          <div className="flex items-start justify-between border-b border-stone-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-serif text-amber-200">{selectedProvince.name}國</span>
                <span className="text-xs px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-400 font-mono">
                  {selectedProvince.regionName}
                </span>
              </div>
              <div className="text-xs text-stone-400 font-serif mt-0.5 flex items-center gap-1.5">
                <span>守備城池:</span>
                <strong className="text-amber-300">{selectedProvince.castleName}</strong>
              </div>
            </div>

            {/* Owning Clan Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow"
              style={{
                backgroundColor: `${provinceClan.color}25`,
                borderColor: provinceClan.color,
              }}
            >
              <span className="text-xs font-bold" style={{ color: provinceClan.accentColor }}>
                {provinceClan.name}
              </span>
            </div>
          </div>

          {/* Castle Hierarchy Description */}
          <div className="mt-3 bg-stone-900/80 border border-stone-800 rounded-lg p-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Castle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-amber-200 font-serif">{castleInfo.name}</div>
              <div className="text-[11px] text-stone-400 mt-0.5 leading-snug">{castleInfo.description}</div>
            </div>
          </div>

          {/* Four Core Indicators (Kokudaka, Commerce, Loyalty, Defense) */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* Kokudaka */}
            <div className="bg-stone-900/60 border border-stone-800/80 rounded-lg p-2">
              <div className="text-[10px] text-stone-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>石高 (軍力上限)</span>
              </div>
              <div className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
                {selectedProvince.kokudaka.toLocaleString()} <span className="text-[10px] font-serif">石</span>
              </div>
              <div className="text-[9px] text-stone-500">補給支援半徑: {castleInfo.supplyRange}里</div>
            </div>

            {/* Commerce */}
            <div className="bg-stone-900/60 border border-stone-800/80 rounded-lg p-2">
              <div className="text-[10px] text-stone-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>商業 (金錢收入)</span>
              </div>
              <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                +{selectedProvince.commerce.toLocaleString()} <span className="text-[10px] font-serif">文/季</span>
              </div>
              <div className="text-[9px] text-stone-500">樂市加成: +{castleInfo.commerceBonus}%</div>
            </div>

            {/* Public Loyalty */}
            <div className="bg-stone-900/60 border border-stone-800/80 rounded-lg p-2">
              <div className="text-[10px] text-stone-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-sky-400" />
                <span>民忠度 (暴亂率)</span>
              </div>
              <div className="text-sm font-bold font-mono text-sky-300 mt-0.5">
                {selectedProvince.loyalty}%
              </div>
              <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-sky-400 rounded-full"
                  style={{ width: `${selectedProvince.loyalty}%` }}
                />
              </div>
            </div>

            {/* Castle Defense */}
            <div className="bg-stone-900/60 border border-stone-800/80 rounded-lg p-2">
              <div className="text-[10px] text-stone-400 flex items-center gap-1">
                <Castle className="w-3 h-3 text-amber-400" />
                <span>城防值 (耐久)</span>
              </div>
              <div className="text-sm font-bold font-mono text-amber-200 mt-0.5">
                {selectedProvince.defense} / {selectedProvince.maxDefense}
              </div>
              <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(selectedProvince.defense / selectedProvince.maxDefense) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Regional Occupation Progress */}
          <div className="mt-3 bg-stone-900/90 border border-stone-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-stone-300 font-serif flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-red-400" />
                區域控制度 (Occupation)
              </span>
              <span className="font-mono font-bold text-amber-300">
                {selectedProvince.occupationProgress}%
              </span>
            </div>
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${selectedProvince.occupationProgress}%` }}
              />
            </div>
            <div className="text-[10px] text-stone-400 mt-1 leading-snug">
              {selectedProvince.occupationProgress >= 100
                ? '該令制國核心城池已被攻克，全境哨站與村落已全權納入統治。'
                : '前線要塞尚有敵軍守軍駐紮，需破門斬將以奪取控制權。'}
            </div>
          </div>

          {/* Action Decision Buttons */}
          <div className="mt-auto pt-4 flex flex-col gap-2">
            {!isPlayerOwned ? (
              <>
                {/* Marching Distance & Provision Cost Panel (遠征軍糧消耗評估) */}
                <div className="bg-gradient-to-br from-stone-900 to-[#1e1713] border border-amber-900/70 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-amber-950/80">
                    <span className="font-serif font-bold text-amber-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      遠征行軍與兵糧消耗
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-serif font-bold border ${
                        marchingData.supplyLevel === 'safe'
                          ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                          : marchingData.supplyLevel === 'tight'
                          ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                          : 'bg-red-950/80 border-red-700 text-red-300 animate-pulse'
                      }`}
                    >
                      {marchingData.supplyLevel === 'safe'
                        ? '糧道充裕'
                        : marchingData.supplyLevel === 'tight'
                        ? '兵糧吃緊'
                        : '兵糧匱乏'}
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-2 text-xs">
                    {/* Origin Base */}
                    <div className="flex items-center justify-between text-stone-300">
                      <span className="text-stone-400 text-[11px] font-serif">最近出征基城:</span>
                      <strong className="text-stone-200 font-serif text-[11px]">
                        【{marchingData.closestProvince.name} · {marchingData.closestProvince.castleName}】
                      </strong>
                    </div>

                    {/* Distance */}
                    <div className="flex items-center justify-between text-stone-300">
                      <span className="text-stone-400 text-[11px] font-serif">行軍遠征距離:</span>
                      <div className="flex items-center gap-1 font-mono">
                        <strong className="text-amber-300 font-bold">{marchingData.distanceRi} 里</strong>
                        <span className="text-[10px] text-stone-400 font-serif">({marchingData.distanceCategory})</span>
                      </div>
                    </div>

                    {/* Provision Cost Breakdown */}
                    <div className="flex items-center justify-between text-stone-300">
                      <span className="text-stone-400 text-[11px] font-serif">出征所需兵糧:</span>
                      <div className="text-right">
                        <strong className="text-amber-400 font-mono text-sm">
                          -{marchingData.provisionCost.toLocaleString()} 石
                        </strong>
                        <div className="text-[9px] text-stone-500 font-mono">
                          (基城出兵 {marchingData.baseProvisions} + 遠征耗糧 {marchingData.distanceProvisions})
                        </div>
                      </div>
                    </div>

                    {/* Current Available Provisions */}
                    <div className="flex items-center justify-between text-stone-300 pt-1 border-t border-stone-800">
                      <span className="text-stone-400 text-[11px] font-serif">我軍當前兵糧:</span>
                      <strong className={`font-mono text-xs ${marchingData.isAffordable ? 'text-emerald-300' : 'text-red-400'}`}>
                        {playerProvisions.toLocaleString()} 石
                      </strong>
                    </div>
                  </div>

                  {/* Warning if insufficient */}
                  {!marchingData.isAffordable && (
                    <div className="mt-2 p-1.5 rounded-lg bg-red-950/70 border border-red-800/80 text-[10px] text-red-300 font-serif flex items-start gap-1 leading-snug">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>
                        兵糧不足！離己方領地過遠，長途遠征輜重糧草耗盡。請至「評定」開墾水田籌備糧草，或先攻下鄰近城池以推進補給線！
                      </span>
                    </div>
                  )}
                </div>

                {/* Attack Button */}
                <button
                  disabled={!marchingData.isAffordable}
                  onClick={() => {
                    if (!marchingData.isAffordable) return;
                    sound.playTaiko();
                    sound.playSwordSlash();
                    onSelectProvinceToBattle(selectedProvince, marchingData.provisionCost);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-serif font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all border ${
                    marchingData.isAffordable
                      ? 'bg-gradient-to-r from-red-700 via-red-600 to-amber-700 hover:from-red-600 hover:to-amber-600 text-amber-100 shadow-red-900/50 border-red-500/50 active:scale-98 cursor-pointer'
                      : 'bg-stone-900 text-stone-500 border-stone-800 cursor-not-allowed opacity-60'
                  }`}
                  title={
                    marchingData.isAffordable
                      ? `出征扣除 ${marchingData.provisionCost} 兵糧`
                      : `兵糧不足！尚缺 ${marchingData.provisionCost - playerProvisions} 石`
                  }
                >
                  <Swords className="w-4 h-4 text-amber-300" />
                  <span>
                    {marchingData.isAffordable
                      ? `親自出陣 · 攻城合戰 (-${marchingData.provisionCost} 糧)`
                      : `兵糧不足 (需 ${marchingData.provisionCost} 糧 / 現有 ${playerProvisions} 糧)`}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-amber-300" />
                </button>

                {/* Sever Supply Line */}
                <button
                  onClick={() => {
                    sound.playClick();
                    onSeverSupplyLine(selectedProvince.id);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-serif flex items-center justify-center gap-1.5 transition"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>切斷後勤補給線 (削弱城防耐久 -15)</span>
                </button>
              </>
            ) : (
              <>
                {/* Player Province Actions */}
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenCouncil(selectedProvince);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-serif font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all border border-amber-400/60 active:scale-98"
                >
                  <Castle className="w-4 h-4 text-stone-950" />
                  <span>領地評定所 (開墾水田 / 樂市樂座)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onPatrolProvince(selectedProvince.id);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-serif flex items-center justify-center gap-1"
                  >
                    <Shield className="w-3 h-3 text-sky-400" />
                    <span>巡邏鎮撫 (+民忠)</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playTaiko();
                      onRecruitTroops(selectedProvince.id);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-serif flex items-center justify-center gap-1"
                  >
                    <Users className="w-3 h-3 text-red-400" />
                    <span>動員徵兵 (+兵員)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
