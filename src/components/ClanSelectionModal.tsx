import React, { useState } from 'react';
import { Shield, Sparkles, Swords, Crown, Castle, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { Clan, ClanId } from '../types/game';
import { CLANS } from '../data/sengokuData';
import { sound } from '../utils/sound';

interface ClanSelectionModalProps {
  isOpen: boolean;
  currentClanId: ClanId;
  onConfirmClan: (clanId: ClanId) => void;
  onOpenCustomCreator: () => void;
  canCancel?: boolean;
  onCancel?: () => void;
}

export const ClanSelectionModal: React.FC<ClanSelectionModalProps> = ({
  isOpen,
  currentClanId,
  onConfirmClan,
  onOpenCustomCreator,
  canCancel = true,
  onCancel,
}) => {
  const [selectedId, setSelectedId] = useState<ClanId>(currentClanId);

  if (!isOpen) return null;

  const activeClan = CLANS.find((c) => c.id === selectedId) || CLANS[0];

  const getDifficulty = (id: ClanId) => {
    switch (id) {
      case 'oda':
        return { label: '新手推薦 · 潛力無窮', color: 'text-amber-400 bg-amber-950/70 border-amber-600' };
      case 'takeda':
        return { label: '野戰霸主 · 騎兵無雙', color: 'text-red-400 bg-red-950/70 border-red-600' };
      case 'uesugi':
        return { label: '戰國軍神 · 士氣極限', color: 'text-sky-400 bg-sky-950/70 border-sky-600' };
      case 'tokugawa':
        return { label: '堅韌防守 · 外交同盟', color: 'text-emerald-400 bg-emerald-950/70 border-emerald-600' };
      case 'hojo':
        return { label: '鐵壁巨城 · 固若金湯', color: 'text-amber-300 bg-amber-950/70 border-amber-600' };
      case 'mori':
        return { label: '謀略水戰 · 瀨戶霸主', color: 'text-lime-400 bg-lime-950/70 border-lime-600' };
      case 'date':
        return { label: '奧羽雄鷹 · 機動銃騎', color: 'text-teal-400 bg-teal-950/70 border-teal-600' };
      case 'shimazu':
        return { label: '鬼石曼子 · 火器破陣', color: 'text-purple-400 bg-purple-950/70 border-purple-600' };
      case 'chosokabe':
        return { label: '一領具足 · 神速動員', color: 'text-slate-300 bg-slate-900 border-slate-600' };
      case 'custom':
        return { label: '自創豪傑 · 自由設定', color: 'text-blue-400 bg-blue-950/70 border-blue-600' };
      default:
        return { label: '普通', color: 'text-stone-300 bg-stone-900 border-stone-700' };
    }
  };

  const difficultyInfo = getDifficulty(selectedId);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none">
      <div className="max-w-5xl w-full bg-gradient-to-b from-[#1c1815] via-stone-900 to-[#120f0d] border-2 border-amber-600/90 rounded-3xl p-5 sm:p-7 shadow-2xl text-stone-200 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-amber-900/60 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center font-serif font-black text-amber-300 text-lg">
              誓
            </div>
            <div>
              <span className="text-[10px] tracking-[0.25em] text-amber-400 font-serif uppercase block">
                SINGLE CLAN PLEDGE & CAMPAIGN START
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200">
                選擇唯一效忠陣營 (Select Your Sovereign Clan)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300/80 font-serif hidden sm:inline">
              ⚠️ 本次征途只能選擇一個陣營效忠
            </span>
            {canCancel && onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-serif transition"
              >
                返回當前遊戲
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Left Roster Grid, Right Details Card */}
        <div className="mt-4 flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
          {/* Left Grid: All Clans */}
          <div className="w-full lg:w-3/5 overflow-y-auto pr-1 space-y-2">
            <div className="text-xs text-stone-400 font-serif mb-2 flex items-center justify-between">
              <span>點擊選擇大名勢力：</span>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenCustomCreator();
                }}
                className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 font-serif underline underline-offset-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>或創造自創武將勢力</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CLANS.map((clan) => {
                const isSelected = clan.id === selectedId;
                const diff = getDifficulty(clan.id);

                return (
                  <div
                    key={clan.id}
                    onClick={() => {
                      sound.playTaiko(0.9);
                      setSelectedId(clan.id);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/80 border-amber-400 shadow-xl ring-2 ring-amber-500/60 scale-[1.01]'
                        : 'bg-stone-900/70 hover:bg-stone-800/80 border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow shrink-0"
                        style={{
                          backgroundColor: `${clan.color}35`,
                          borderColor: clan.color,
                          color: clan.accentColor,
                        }}
                      >
                        {clan.monSymbol}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-sm text-stone-100">{clan.name}</h4>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] text-stone-400 font-serif block truncate">
                          {clan.leaderName} · {clan.leaderTitle.split('·')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full border ${diff.color} font-serif`}>
                        {diff.label}
                      </span>
                      <span className="text-stone-400 font-serif truncate max-w-[120px]">
                        {clan.uniqueTroopName.split('/')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Detailed Overview Card */}
          <div className="w-full lg:w-2/5 bg-stone-900/90 border-2 border-amber-900/60 rounded-3xl p-5 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Badge & Mon */}
              <div className="flex items-center gap-3.5 border-b border-stone-800 pb-3">
                <div
                  className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-serif font-black text-2xl shadow-xl"
                  style={{
                    backgroundColor: `${activeClan.color}40`,
                    borderColor: activeClan.accentColor,
                    color: activeClan.accentColor,
                  }}
                >
                  {activeClan.monSymbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-serif text-amber-100">{activeClan.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyInfo.color} font-serif`}>
                      {difficultyInfo.label}
                    </span>
                  </div>
                  <span className="text-xs text-amber-300 font-serif mt-0.5 block">
                    大名：{activeClan.leaderName} ({activeClan.leaderTitle})
                  </span>
                </div>
              </div>

              {/* Faction Description */}
              <p className="text-xs text-stone-300 font-serif leading-relaxed mt-3 bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                {activeClan.description}
              </p>

              {/* Characteristic Traits */}
              <div className="mt-3.5 space-y-2.5 text-xs font-serif">
                <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-amber-400 font-bold block mb-0.5">
                    勢力專屬天賦特質 (Clan Trait):
                  </span>
                  <strong className="text-amber-200">{activeClan.trait}</strong>
                </div>

                <div className="bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-red-400 font-bold block mb-0.5">
                    勢力獨特編制軍種 (Unique Armament):
                  </span>
                  <strong className="text-red-300">{activeClan.uniqueTroopName}</strong>
                </div>
              </div>
            </div>

            {/* Confirmation Action */}
            <div className="mt-5 pt-4 border-t border-stone-800">
              <div className="text-[11px] text-stone-400 font-serif mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>確立後，此征途將以【{activeClan.name}】身分征戰全日本！</span>
              </div>
              <button
                onClick={() => {
                  sound.playTaiko(1.4);
                  sound.playFanfare();
                  onConfirmClan(selectedId);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-serif font-black text-sm tracking-widest shadow-2xl transition flex items-center justify-center gap-2 active:scale-98"
              >
                <Crown className="w-4 h-4 text-stone-950" />
                <span>確立唯一誓約 · 開始征伐全日本</span>
                <ChevronRight className="w-4 h-4 text-stone-950" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
