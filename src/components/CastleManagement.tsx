import React, { useState } from 'react';
import { Castle, Shield, Users, Coins, ArrowUpCircle, MapPin, Eye, CheckCircle2, ChevronRight } from 'lucide-react';
import { CastleType, Clan, Province } from '../types/game';
import { CASTLE_TYPES_INFO, CLANS } from '../data/sengokuData';
import { sound } from '../utils/sound';

interface CastleManagementProps {
  provinces: Province[];
  playerClan: Clan;
  onUpgradeCastle: (provinceId: string) => void;
  gold: number;
}

export const CastleManagement: React.FC<CastleManagementProps> = ({
  provinces,
  playerClan,
  onUpgradeCastle,
  gold,
}) => {
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('omi'); // Azuchi Castle default
  const [activeInset, setActiveInset] = useState<'hierarchy' | 'regionalSiege'>('hierarchy');

  const selectedProvince = provinces.find((p) => p.id === selectedProvinceId) || provinces[0];
  const currentCastleInfo = CASTLE_TYPES_INFO[selectedProvince.castleType];

  // Ranking of clans by total provinces
  const clanCounts = CLANS.map((clan) => {
    const count = provinces.filter((p) => p.clanId === clan.id).length;
    return { clan, count };
  }).sort((a, b) => b.count - a.count);

  const getNextCastleType = (current: CastleType): CastleType | null => {
    if (current === 'Fort') return 'BranchCastle';
    if (current === 'BranchCastle') return 'ProvincialCapital';
    if (current === 'ProvincialCapital') return 'DaimyoMainCastle';
    return null;
  };

  const nextType = getNextCastleType(selectedProvince.castleType);
  const nextCastleInfo = nextType ? CASTLE_TYPES_INFO[nextType] : null;

  return (
    <div className="relative w-full h-[calc(100vh-125px)] min-h-[580px] bg-[#14110f] text-stone-200 flex flex-col overflow-hidden select-none">
      {/* Top Banner Navigation */}
      <div className="z-10 bg-stone-900/90 border-b border-amber-950/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Castle className="w-4 h-4 text-amber-400" />
          <h2 className="font-serif font-bold text-amber-200 text-sm">
            日本戰國：天下布武 - 地盤與城堡管理系統
          </h2>
          <span className="text-[11px] text-stone-400 font-serif hidden md:inline">
            (Domain & Castle Management System)
          </span>
        </div>

        {/* Inset Map Selector */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-lg border border-stone-800">
          <button
            onClick={() => {
              sound.playClick();
              setActiveInset('hierarchy');
            }}
            className={`px-3 py-1 text-xs font-serif rounded transition ${
              activeInset === 'hierarchy'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            城堡層級與石高控制 (Hierarchy)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveInset('regionalSiege');
            }}
            className={`px-3 py-1 text-xs font-serif rounded transition ${
              activeInset === 'regionalSiege'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            區域攻城與細節 (Regional Siege)
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Scroll: Clan Province Standings (Matching Image #7 Left Scroll) */}
        <div className="w-full lg:w-72 bg-gradient-to-b from-[#221c17] to-stone-950 border-r border-amber-950/70 p-4 overflow-y-auto flex flex-col">
          <div className="border-b-2 border-amber-800/80 pb-2 mb-3 text-center">
            <span className="text-[10px] text-amber-400 tracking-widest font-serif block">領地版圖排行榜</span>
            <h3 className="text-base font-bold font-serif text-amber-200">大名勢力支配國數</h3>
          </div>

          <div className="space-y-2 flex-1">
            {clanCounts.map(({ clan, count }, idx) => (
              <div
                key={clan.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                  clan.id === playerClan.id
                    ? 'bg-amber-950/60 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-stone-900/60 border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: `${clan.color}35`, color: clan.accentColor }}
                  >
                    {clan.monSymbol}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-xs text-stone-200">{clan.name}</span>
                      {clan.id === playerClan.id && (
                        <span className="text-[9px] px-1 rounded bg-amber-500 text-stone-950 font-bold">
                          己方
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 font-serif">{clan.leaderName}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-amber-300">{count}</span>
                  <span className="text-[10px] text-stone-400 ml-1 font-serif">國</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center / Right Content: Inset Visuals & Castle Hierarchy Upgrading */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-stone-950 via-[#181412] to-stone-950 flex flex-col gap-6">
          {/* Top Inset System Showcase Matching Image #7 */}
          {activeInset === 'hierarchy' ? (
            <div className="bg-stone-900/90 border-2 border-amber-900/60 rounded-2xl p-5 shadow-2xl">
              <div className="border-b border-stone-800 pb-3 mb-4">
                <span className="text-[10px] text-amber-400 font-serif tracking-widest block">
                  INSET MAP 2: CASTLE HIERARCHY & KOKUDAKA CONTROL
                </span>
                <h3 className="text-base font-bold font-serif text-amber-200">
                  城堡層級與石高控制體系 (Castle Hierarchy)
                </h3>
                <p className="text-xs text-stone-400 font-serif mt-1">
                  城堡依軍事規模與城下町經濟劃分為四個階層，升級城池能顯著擴大補給圈半徑與兵糧儲備。
                </p>
              </div>

              {/* 4 Castle Hierarchy Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.values(CASTLE_TYPES_INFO).map((c) => (
                  <div
                    key={c.type}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                      selectedProvince.castleType === c.type
                        ? 'bg-amber-950/70 border-amber-500 shadow-xl ring-1 ring-amber-500'
                        : 'bg-stone-950/70 border-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold font-serif text-amber-200">{c.name}</span>
                        {selectedProvince.castleType === c.type && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 font-bold">
                            當前
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 font-serif mb-3 leading-snug">
                        {c.description}
                      </div>
                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-stone-300">
                          <span>石高加成:</span>
                          <strong className="text-emerald-400">+{c.kokudakaBonus}%</strong>
                        </div>
                        <div className="flex justify-between text-stone-300">
                          <span>商業加成:</span>
                          <strong className="text-amber-300">+{c.commerceBonus}%</strong>
                        </div>
                        <div className="flex justify-between text-stone-300">
                          <span>補給半徑:</span>
                          <strong className="text-sky-300">{c.supplyRange} 里</strong>
                        </div>
                        <div className="flex justify-between text-stone-300">
                          <span>城防值:</span>
                          <strong className="text-amber-200">+{c.defenseBonus}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Inset 1: Regional Siege & Detail (Matching Image #7 Inset Map 1) */
            <div className="bg-stone-900/90 border-2 border-amber-900/60 rounded-2xl p-5 shadow-2xl">
              <div className="border-b border-stone-800 pb-3 mb-4">
                <span className="text-[10px] text-amber-400 font-serif tracking-widest block">
                  INSET MAP 1: REGIONAL SIEGE & LOGISTICS NETWORK
                </span>
                <h3 className="text-base font-bold font-serif text-amber-200">
                  區域攻城與兵站線路圖 (Regional Siege & Detail)
                </h3>
                <p className="text-xs text-stone-400 font-serif mt-1">
                  展現近江觀音寺城、安土城與美濃岐阜城、山城二條御所之間的進軍與防禦體系。
                </p>
              </div>

              {/* Graphical Siege Map Representation */}
              <div className="relative aspect-[21/9] rounded-xl bg-gradient-to-br from-stone-950 via-[#1e1916] to-stone-950 border border-stone-800 p-4 flex items-center justify-around overflow-hidden">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-500 bg-stone-900 flex items-center justify-center text-emerald-400 text-xs font-serif font-bold shadow-lg">
                    美濃
                  </div>
                  <span className="text-[11px] font-serif text-stone-300 mt-1">岐阜城 (Gifu)</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-amber-400 font-mono animate-pulse">
                    ======== 進軍糧道 ========▶
                  </span>
                  <span className="text-[9px] text-stone-500">補給線通暢</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-amber-400 bg-gradient-to-br from-red-900 to-amber-950 flex items-center justify-center text-amber-200 text-sm font-serif font-bold shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                    近江
                  </div>
                  <span className="text-[11px] font-serif font-bold text-amber-200 mt-1">安土城 (Azuchi)</span>
                  <span className="text-[9px] text-amber-400/80">大名本城巨城</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-red-400 font-mono animate-pulse">
                    ◀======== 上洛路線 ========
                  </span>
                  <span className="text-[9px] text-stone-500">直逼二條御所</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full border-2 border-red-500 bg-stone-900 flex items-center justify-center text-red-300 text-xs font-serif font-bold shadow-lg">
                    山城
                  </div>
                  <span className="text-[11px] font-serif text-stone-300 mt-1">二條御所 (Kyoto)</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Castle Upgrading Workbench */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-amber-400 font-serif">SELECTED CASTLE TO UPGRADE</span>
                <span className="text-xs px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-300 font-serif">
                  {selectedProvince.name}國
                </span>
              </div>
              <h4 className="text-lg font-bold font-serif text-amber-200">{selectedProvince.castleName}</h4>
              <p className="text-xs text-stone-400 font-serif mt-1">
                當前等級：<strong className="text-amber-300">{currentCastleInfo.name}</strong>。
                {nextCastleInfo
                  ? `可擴建為【${nextCastleInfo.name}】，消耗 2,000 金以提升全領地石高與商業上限！`
                  : '該城堡已擴建至天下最頂級名城（巨城天守）！'}
              </p>
            </div>

            {nextCastleInfo ? (
              <button
                onClick={() => {
                  if (gold < 2000) {
                    alert('國庫資金不足 2,000 金！');
                    return;
                  }
                  sound.playTaiko();
                  onUpgradeCastle(selectedProvince.id);
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-serif font-bold text-xs tracking-wider transition shadow-lg flex items-center gap-2 shrink-0"
              >
                <ArrowUpCircle className="w-4 h-4 text-stone-950" />
                <span>升級至【{nextCastleInfo.name}】 (2,000 金)</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs font-serif text-amber-400 font-bold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>已達最高巨城規模</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
