import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Sparkles,
  BookOpen,
  ChevronRight,
  Crosshair,
  Award,
  Flame,
  Users,
  Info,
  Volume2,
  Sword,
  Target,
  Compass,
} from 'lucide-react';
import { Clan, ClanId, TroopUnit } from '../types/game';
import { TROOPS_DATA, CLANS } from '../data/sengokuData';
import { sound } from '../utils/sound';

interface TroopEncyclopediaProps {
  playerClan: Clan;
}

export const TroopEncyclopedia: React.FC<TroopEncyclopediaProps> = ({ playerClan }) => {
  // Selected regular troop on the left
  const [selectedRegularId, setSelectedRegularId] = useState<string>('ashigaru_arquebusier');
  // Selected clan unique troop in the middle/right
  const [selectedClanId, setSelectedClanId] = useState<ClanId>('takeda');
  // Selected troop type filter
  const [activeType, setActiveType] = useState<string>('all');
  // Selected development branch tab
  const [activeStage, setActiveStage] = useState<'compare' | 'clanUnique' | 'advancement'>('compare');

  const regularTroops = TROOPS_DATA.filter((t) => !t.isClanUnique);
  const clanTroops = TROOPS_DATA.filter((t) => t.isClanUnique);

  const selectedRegular = regularTroops.find((t) => t.id === selectedRegularId) || regularTroops[0];
  const selectedClanTroop = clanTroops.find((t) => t.clanId === selectedClanId) || clanTroops[0];
  const currentInspectClan = CLANS.find((c) => c.id === selectedClanId) || CLANS[0];

  const types = [
    { id: 'all', label: '全部兵種', icon: '軍' },
    { id: 'arquebusier', label: '鐵砲 (Arquebus)', icon: '銃' },
    { id: 'spearman', label: '長槍 (Spear)', icon: '槍' },
    { id: 'cavalry', label: '騎兵 (Cavalry)', icon: '馬' },
    { id: 'archer', label: '弓兵 (Archer)', icon: '弓' },
    { id: 'artillery', label: '大筒 (Artillery)', icon: '砲' },
    { id: 'special', label: '特種/水軍 (Special)', icon: '船' },
  ];

  const filteredRegularTroops = activeType === 'all'
    ? regularTroops
    : regularTroops.filter((t) => t.type === activeType);

  const playTroopAudio = (troop: TroopUnit) => {
    sound.playTaiko();
    if (troop.type === 'arquebusier') {
      sound.playGunshot();
    } else if (troop.type === 'artillery') {
      sound.playGunshot();
      setTimeout(() => sound.playTaiko(1.4), 80);
    } else if (troop.type === 'cavalry') {
      sound.playSwordSlash();
    } else {
      sound.playSwordSlash();
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-125px)] min-h-[600px] bg-gradient-to-b from-[#181411] via-[#120f0d] to-[#0c0a09] text-stone-200 flex flex-col overflow-hidden select-none">
      {/* Top Banner (Matching Screen 1 & 2 Header) */}
      <div className="z-10 bg-stone-900/90 border-b border-amber-950/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-300 font-serif font-bold text-xs">
            典
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.25em] text-amber-400 font-serif uppercase">
                TROOP ENCYCLOPEDIA: EXPANDED REGULAR & CLAN UNIQUE UNITS
              </span>
            </div>
            <h2 className="text-base font-bold font-serif text-amber-200">
              兵種百科全書：常規編制與各勢力特色武裝
            </h2>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => {
              sound.playClick();
              setActiveStage('compare');
            }}
            className={`px-3 py-1 text-xs font-serif rounded-lg transition ${
              activeStage === 'compare'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            雙台對照展示 (Comparison)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveStage('clanUnique');
            }}
            className={`px-3 py-1 text-xs font-serif rounded-lg transition ${
              activeStage === 'clanUnique'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            勢力專屬研討 (Clan Unique)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveStage('advancement');
            }}
            className={`px-3 py-1 text-xs font-serif rounded-lg transition ${
              activeStage === 'advancement'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            兵種進階樹 (Advancement Tree)
          </button>
        </div>
      </div>

      {/* Main Encyclopedia Stage */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Regular Troops Roster (Matching Mockup Left Sidebar) */}
        <div className="w-full md:w-64 lg:w-72 bg-stone-950/95 border-r border-amber-950/70 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="p-3 border-b border-stone-800/80 bg-stone-900/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-400 font-serif tracking-wider uppercase block">
                REGULAR TROOPS
              </span>
              <h3 className="font-serif font-bold text-xs text-amber-100">常規編制部隊</h3>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
              {filteredRegularTroops.length} 種
            </span>
          </div>

          {/* Troop Type Filter Icons */}
          <div className="p-2 border-b border-stone-800/60 flex gap-1 overflow-x-auto scrollbar-none">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  sound.playClick();
                  setActiveType(t.id);
                }}
                className={`px-2 py-0.5 text-[10px] rounded whitespace-nowrap font-serif transition flex items-center gap-1 ${
                  activeType === t.id
                    ? 'bg-amber-600 text-stone-950 font-bold shadow'
                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* List of Units */}
          <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
            {filteredRegularTroops.map((troop) => {
              const isSelected = troop.id === selectedRegularId;
              return (
                <div
                  key={troop.id}
                  onClick={() => {
                    sound.playTaiko(0.8);
                    setSelectedRegularId(troop.id);
                  }}
                  className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition duration-150 ${
                    isSelected
                      ? 'bg-amber-950/80 border-amber-500 shadow-md ring-1 ring-amber-500/60'
                      : 'bg-stone-900/60 hover:bg-stone-800/80 border-stone-800/80 text-stone-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-700/80 flex items-center justify-center shrink-0 overflow-hidden">
                    {troop.artAsset ? (
                      <img
                        src={troop.artAsset}
                        alt={troop.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif font-bold text-amber-300 text-xs">
                        {troop.kanji.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-serif font-bold text-amber-200 truncate">
                        {troop.kanji}
                      </span>
                      <span className="text-[9px] text-stone-400 font-mono">
                        {troop.costCategory}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-serif truncate block mt-0.5">
                      {troop.name.split('(')[1]?.replace(')', '') || troop.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Showcase Stage: The 2 Pedestals (Regular vs Clan Unique) */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-stretch">
            {/* PEDESTAL 1: REGULAR TROOP SHOWCASE (Matching Image #1 & #2 Left Stage) */}
            <div className="bg-stone-900/90 border-2 border-stone-800 hover:border-amber-900/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl backdrop-blur relative overflow-hidden">
              {/* Pedestal Stage Top Banner */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div>
                  <span className="text-[10px] text-amber-400 font-serif tracking-widest uppercase block">
                    REGULAR TROOP ADVANCEMENT
                  </span>
                  <h4 className="text-base font-bold font-serif text-amber-100">{selectedRegular.name}</h4>
                </div>
                <button
                  onClick={() => playTroopAudio(selectedRegular)}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 text-[10px] font-serif flex items-center gap-1 transition"
                  title="試聽兵器作戰音效"
                >
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  <span>戰音試聽</span>
                </button>
              </div>

              {/* Pedestal Figure Artwork */}
              <div className="my-3 relative flex items-center justify-center min-h-[190px] max-h-[240px]">
                {selectedRegular.artAsset ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img
                      src={selectedRegular.artAsset}
                      alt={selectedRegular.name}
                      className="max-h-56 object-contain rounded-xl drop-shadow-[0_15px_20px_rgba(0,0,0,0.85)] border border-amber-900/30"
                    />
                    <div className="absolute bottom-1 inset-x-2 py-1 px-2 rounded-lg bg-stone-950/85 backdrop-blur text-center text-[10px] text-amber-200 border border-stone-800 font-serif">
                      相克：{selectedRegular.counters}
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full border-2 border-amber-400 flex items-center justify-center text-3xl font-serif text-amber-400">
                    {selectedRegular.kanji.slice(0, 1)}
                  </div>
                )}
              </div>

              {/* Stat Scroll Card (Matching Image #1 & #2 Authentic Inset Card) */}
              <div className="bg-stone-950/80 border border-amber-900/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-stone-800/80 pb-1.5">
                  <span className="font-serif font-bold text-amber-300">{selectedRegular.kanji} 兵種屬性</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-stone-400 font-mono">
                    維持費用: {selectedRegular.costCategory}
                  </span>
                </div>

                {/* 5 Sengoku Stat Bars */}
                <div className="grid grid-cols-2 gap-2 text-xs font-serif">
                  <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400">距擊 (Range)</span>
                    <strong className="text-amber-300 font-mono">{selectedRegular.range}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400">烈度 (Power)</span>
                    <strong className="text-red-400 font-mono">{selectedRegular.power}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400">防衛 (Defense)</span>
                    <strong className="text-sky-300 font-mono">{selectedRegular.defense}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400">速度 (Speed)</span>
                    <strong className="text-emerald-300 font-mono">{selectedRegular.speed}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800 text-xs font-serif">
                  <span className="text-stone-400">優兆 / 士氣上限 (Morale)</span>
                  <strong className="text-amber-300 font-mono">{selectedRegular.morale}</strong>
                </div>

                {/* Special characteristic */}
                <div className="text-[11px] text-stone-300 font-serif bg-amber-950/30 p-2 rounded border border-amber-900/50 leading-relaxed">
                  <span className="text-amber-400 font-bold mr-1">特別技選:</span>
                  <span>{selectedRegular.specialSkill}</span>
                </div>
              </div>

              {/* Pedestal Bottom Button */}
              <div className="mt-3 pt-2 border-t border-stone-800 flex justify-center">
                <button
                  onClick={() => sound.playClick()}
                  className="w-full py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-serif transition border border-stone-700"
                >
                  常規部隊進階樹 (Regular Troop Advancement Tree)
                </button>
              </div>
            </div>

            {/* PEDESTAL 2: CLAN UNIQUE TROOP SHOWCASE (Matching Image #1, #2, #3, #5 Right Stage) */}
            <div className="bg-stone-900/90 border-2 border-amber-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-2xl backdrop-blur relative overflow-hidden">
              {/* Pedestal Stage Top Banner */}
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full border flex items-center justify-center font-serif font-black text-xs shadow"
                    style={{
                      backgroundColor: `${currentInspectClan.color}40`,
                      borderColor: currentInspectClan.accentColor,
                      color: currentInspectClan.accentColor,
                    }}
                  >
                    {currentInspectClan.monSymbol}
                  </div>
                  <div>
                    <span className="text-[10px] text-red-400 font-serif tracking-widest uppercase block">
                      CLAN DEVELOPMENT BRANCH · {currentInspectClan.name}
                    </span>
                    <h4 className="text-base font-bold font-serif text-amber-100">{selectedClanTroop.name}</h4>
                  </div>
                </div>
                <button
                  onClick={() => playTroopAudio(selectedClanTroop)}
                  className="px-2.5 py-1 rounded-lg bg-red-950/70 hover:bg-red-900/80 border border-red-700 text-red-200 text-[10px] font-serif flex items-center gap-1 transition"
                  title="試聽專屬兵器作戰音效"
                >
                  <Volume2 className="w-3 h-3 text-red-400" />
                  <span>奧義戰音</span>
                </button>
              </div>

              {/* Pedestal Figure Artwork */}
              <div className="my-3 relative flex items-center justify-center min-h-[190px] max-h-[240px]">
                {selectedClanTroop.artAsset ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img
                      src={selectedClanTroop.artAsset}
                      alt={selectedClanTroop.name}
                      className="max-h-56 object-contain rounded-xl drop-shadow-[0_15px_20px_rgba(0,0,0,0.85)] border border-amber-900/30"
                    />
                    <div className="absolute bottom-1 inset-x-2 py-1 px-2 rounded-lg bg-stone-950/85 backdrop-blur text-center text-[10px] text-amber-200 border border-stone-800 font-serif">
                      特性：{selectedClanTroop.counters}
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full border-2 border-red-500 flex items-center justify-center text-3xl font-serif text-red-400">
                    {selectedClanTroop.kanji.slice(0, 1)}
                  </div>
                )}
              </div>

              {/* Stat Scroll Card (Matching Image #1 & #2 Authentic Inset Card) */}
              <div className="bg-stone-950/80 border border-amber-900/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-stone-800/80 pb-1.5">
                  <span className="font-serif font-bold text-red-300">
                    {currentInspectClan.name} 【{selectedClanTroop.kanji}】 絕密軍籍
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800 font-mono font-bold">
                    維持費用: {selectedClanTroop.costCategory}
                  </span>
                </div>

                {/* 5 Sengoku Stat Bars */}
                <div className="grid grid-cols-2 gap-2 text-xs font-serif">
                  <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400">距擊 (Range)</span>
                    <strong className="text-amber-300 font-mono">{selectedClanTroop.range}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400">烈度 (Power)</span>
                    <strong className="text-red-400 font-mono">{selectedClanTroop.power}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400">防衛 (Defense)</span>
                    <strong className="text-sky-300 font-mono">{selectedClanTroop.defense}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800">
                    <span className="text-stone-400">速度 (Speed)</span>
                    <strong className="text-emerald-300 font-mono">{selectedClanTroop.speed}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-stone-900/60 px-2 py-1 rounded border border-stone-800 text-xs font-serif">
                  <span className="text-stone-400">優兆 / 士氣上限 (Morale)</span>
                  <strong className="text-amber-300 font-mono">{selectedClanTroop.morale}</strong>
                </div>

                {/* Special characteristic */}
                <div className="text-[11px] text-red-200 font-serif bg-red-950/30 p-2 rounded border border-red-900/50 leading-relaxed">
                  <span className="text-red-400 font-bold mr-1">特別技選:</span>
                  <span>{selectedClanTroop.specialSkill}</span>
                </div>
              </div>

              {/* Pedestal Bottom Button */}
              <div className="mt-3 pt-2 border-t border-stone-800 flex justify-center">
                <button
                  onClick={() => sound.playTaiko()}
                  className="w-full py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-stone-950 font-bold text-xs font-serif transition"
                >
                  勢力特色分支樹 (Clan Development Branch)
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Clan Selector Bar (Matching Mockup Footer Clan Badges) */}
          <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-stone-400 font-serif shrink-0">勢力兵種切換 (Select Clan):</span>
            <div className="flex items-center gap-1.5">
              {CLANS.map((clan) => (
                <button
                  key={clan.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedClanId(clan.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-serif transition shrink-0 ${
                    selectedClanId === clan.id
                      ? 'border-amber-400 bg-amber-950/90 text-amber-200 shadow-md ring-1 ring-amber-500'
                      : 'border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-stone-400'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]"
                    style={{ backgroundColor: `${clan.color}40`, color: clan.accentColor }}
                  >
                    {clan.monSymbol}
                  </span>
                  <span>{clan.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
