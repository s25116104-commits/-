import React, { useState } from 'react';
import { Hammer, Globe, Users, Coins, Castle, Award, HeartHandshake, Shield, Sparkles, Feather, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Clan, ClanId, General, Province } from '../types/game';
import { CLANS, CASTLE_TYPES_INFO } from '../data/sengokuData';
import { sound } from '../utils/sound';

interface CouncilPoliticsProps {
  provinces: Province[];
  playerClan: Clan;
  generals: General[];
  gold: number;
  provisions: number;
  courtRank: string;
  onExecuteDomestic: (action: 'paddy' | 'commerce' | 'fortify' | 'flood', provinceId: string) => void;
  onExecuteDiplomacy: (action: 'alliance' | 'marriage' | 'vassal' | 'court' | 'coalition', targetClanId: ClanId) => void;
  onRewardGeneral: (generalId: string, rewardType: 'fief' | 'treasure' | 'gold') => void;
  onProcureArms: (type: 'gun' | 'horse' | 'cannon') => void;
}

export const CouncilPolitics: React.FC<CouncilPoliticsProps> = ({
  provinces,
  playerClan,
  generals,
  gold,
  provisions,
  courtRank,
  onExecuteDomestic,
  onExecuteDiplomacy,
  onRewardGeneral,
  onProcureArms,
}) => {
  const [activeTab, setActiveTab] = useState<'domestic' | 'diplomacy' | 'personnel' | 'arms'>('domestic');
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>(
    provinces.find((p) => p.clanId === playerClan.id)?.id || provinces[0].id
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const playerProvinces = provinces.filter((p) => p.clanId === playerClan.id);
  const selectedProvince = provinces.find((p) => p.id === selectedProvinceId) || playerProvinces[0] || provinces[0];

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="relative w-full h-[calc(100vh-125px)] min-h-[580px] bg-stone-950 text-stone-200 flex flex-col overflow-hidden select-none">
      {/* Top Navigation Tabs */}
      <div className="z-10 bg-stone-900/90 border-b border-amber-950/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-amber-400" />
          <h2 className="font-serif font-bold text-amber-200 text-sm">
            本丸評定所：內政建設、外交斡旋與家臣賞賜
          </h2>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="text-xs bg-amber-500/20 border border-amber-500/60 text-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('domestic');
            }}
            className={`px-3 py-1 text-xs font-serif rounded transition flex items-center gap-1.5 ${
              activeTab === 'domestic'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>內政開發</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('diplomacy');
            }}
            className={`px-3 py-1 text-xs font-serif rounded transition flex items-center gap-1.5 ${
              activeTab === 'diplomacy'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>外交朝廷</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('personnel');
            }}
            className={`px-3 py-1 text-xs font-serif rounded transition flex items-center gap-1.5 ${
              activeTab === 'personnel'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>知行封賞</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('arms');
            }}
            className={`px-3 py-1 text-xs font-serif rounded transition flex items-center gap-1.5 ${
              activeTab === 'arms'
                ? 'bg-amber-600 text-stone-950 font-bold shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>軍備採購</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-stone-950 via-[#181412] to-stone-950">
        <div className="max-w-5xl mx-auto">
          {/* TAB 1: DOMESTIC DEVELOPMENT */}
          {activeTab === 'domestic' && (
            <div className="space-y-6">
              {/* Province Picker */}
              <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl">
                <span className="text-xs text-stone-400 font-serif block mb-2">選擇評定施政領地:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {playerProvinces.map((prov) => (
                    <button
                      key={prov.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedProvinceId(prov.id);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-serif whitespace-nowrap transition flex items-center gap-2 ${
                        selectedProvinceId === prov.id
                          ? 'border-amber-400 bg-amber-950/80 text-amber-200 shadow-md ring-1 ring-amber-500'
                          : 'border-stone-800 bg-stone-950 hover:bg-stone-800 text-stone-300'
                      }`}
                    >
                      <Castle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{prov.name}國</span>
                      <span className="text-[10px] text-stone-400">({prov.castleName})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Province Status Overview */}
              <div className="bg-stone-900/80 border border-amber-900/40 rounded-2xl p-4 shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div className="text-[10px] text-stone-400 font-serif">石高產量</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                    {selectedProvince.kokudaka.toLocaleString()} <span className="text-xs">石</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div className="text-[10px] text-stone-400 font-serif">每季商業稅入</div>
                  <div className="text-base font-bold font-mono text-amber-300 mt-1">
                    +{selectedProvince.commerce.toLocaleString()} <span className="text-xs">文</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div className="text-[10px] text-stone-400 font-serif">民忠度</div>
                  <div className="text-base font-bold font-mono text-sky-400 mt-1">
                    {selectedProvince.loyalty}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
                  <div className="text-[10px] text-stone-400 font-serif">城防耐久</div>
                  <div className="text-base font-bold font-mono text-amber-200 mt-1">
                    {selectedProvince.defense} / {selectedProvince.maxDefense}
                  </div>
                </div>
              </div>

              {/* 4 Core Domestic Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. 開墾水田 */}
                <div className="bg-stone-900/90 border border-stone-800 hover:border-amber-600/60 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                          🌾
                        </div>
                        <h3 className="font-serif font-bold text-amber-200 text-sm">開墾水田 (Develop Paddies)</h3>
                      </div>
                      <span className="text-xs text-stone-400 font-mono">費用: 1,200 金</span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed font-serif">
                      組織農民開拓新田、修築灌溉水渠，永久提升領地石高上限與兵糧徵收效率。
                    </p>
                    <div className="mt-3 text-xs text-emerald-400 font-serif font-bold">
                      效果：領地石高 +25,000 石，軍力容量上限提升！
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (gold < 1200) {
                        triggerNotice('國庫金錢不足！');
                        return;
                      }
                      sound.playClick();
                      onExecuteDomestic('paddy', selectedProvince.id);
                      triggerNotice(`已對【${selectedProvince.name}國】下達開墾水田政令！`);
                    }}
                    className="mt-4 w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-stone-950 font-serif font-bold text-xs transition"
                  >
                    頒布水田墾荒令
                  </button>
                </div>

                {/* 2. 樂市樂座 */}
                <div className="bg-stone-900/90 border border-stone-800 hover:border-amber-600/60 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                          🏮
                        </div>
                        <h3 className="font-serif font-bold text-amber-200 text-sm">樂市樂座 (Free Commerce Markets)</h3>
                      </div>
                      <span className="text-xs text-stone-400 font-mono">費用: 1,800 金</span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed font-serif">
                      廢除行會專利特權，免除商稅雜役，吸引南蠻商人與全日本行商前來城下町開埠。
                    </p>
                    <div className="mt-3 text-xs text-amber-300 font-serif font-bold">
                      效果：領地每季商業收入 +8,000 文，鐵砲採購折扣 15%！
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (gold < 1800) {
                        triggerNotice('國庫金錢不足！');
                        return;
                      }
                      sound.playClick();
                      onExecuteDomestic('commerce', selectedProvince.id);
                      triggerNotice(`已在【${selectedProvince.name}國】推行樂市樂座法令！`);
                    }}
                    className="mt-4 w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-xs transition"
                  >
                    頒布樂市樂座公文
                  </button>
                </div>

                {/* 3. 築城加固 */}
                <div className="bg-stone-900/90 border border-stone-800 hover:border-amber-600/60 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                          🏯
                        </div>
                        <h3 className="font-serif font-bold text-amber-200 text-sm">築城加固 (Fortify Castle Ramparts)</h3>
                      </div>
                      <span className="text-xs text-stone-400 font-mono">費用: 2,500 金 / 1,000 石</span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed font-serif">
                      修築牛蒡積石垣、開鑿深塹護城河、增設天守銃眼箭樓，大幅提升防守攻城突破所需時間。
                    </p>
                    <div className="mt-3 text-xs text-amber-400 font-serif font-bold">
                      效果：城池防禦耐久上限 +30，守軍射擊攻擊力提升！
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (gold < 2500) {
                        triggerNotice('國庫金錢不足！');
                        return;
                      }
                      sound.playClick();
                      onExecuteDomestic('fortify', selectedProvince.id);
                      triggerNotice(`【${selectedProvince.castleName}】石垣改修工程全面動工！`);
                    }}
                    className="mt-4 w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-600/40 font-serif font-bold text-xs transition"
                  >
                    啟動巨石築城
                  </button>
                </div>

                {/* 4. 治水改修 */}
                <div className="bg-stone-900/90 border border-stone-800 hover:border-amber-600/60 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-400">
                          🌊
                        </div>
                        <h3 className="font-serif font-bold text-amber-200 text-sm">治水改修 (Flood Control & Dykes)</h3>
                      </div>
                      <span className="text-xs text-stone-400 font-mono">費用: 1,000 金</span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed font-serif">
                      仿傚信玄堤構築防汛水壩，平抑洪澇災害，使百姓安居樂業，徹底杜絕農民一揆暴亂。
                    </p>
                    <div className="mt-3 text-xs text-sky-300 font-serif font-bold">
                      效果：領地民忠度直接回升至 98% 以上，徵募兵員效率倍增！
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (gold < 1000) {
                        triggerNotice('國庫金錢不足！');
                        return;
                      }
                      sound.playClick();
                      onExecuteDomestic('flood', selectedProvince.id);
                      triggerNotice(`【${selectedProvince.name}國】完成防洪堤壩改修，民心大悅！`);
                    }}
                    className="mt-4 w-full py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-stone-950 font-serif font-bold text-xs transition"
                  >
                    下達治水改修令
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIPLOMACY & IMPERIAL COURT */}
          {activeTab === 'diplomacy' && (
            <div className="space-y-6">
              {/* Imperial Court Box */}
              <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 border-2 border-amber-600/70 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 text-xl font-serif font-bold">
                    勅
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400 font-serif tracking-widest">KYOTO IMPERIAL COURT</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                        {courtRank}
                      </span>
                    </div>
                    <h3 className="text-base font-bold font-serif text-amber-100 mt-0.5">
                      朝廷斡旋與大將軍冊封 (Imperial Sanction)
                    </h3>
                    <p className="text-xs text-stone-400 font-serif mt-1">
                      派遣使節進京貢奉金銀，獲得朝廷冊封官位，提升全天下大名敬畏與大義名分！
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playTaiko();
                    onExecuteDiplomacy('court', 'oda');
                    triggerNotice('已派遣使節進京進貢！朝廷降下嘉獎勅命！');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-xs tracking-wider transition whitespace-nowrap shadow-lg"
                >
                  進貢金幣 (朝廷任官 3,000金)
                </button>
              </div>

              {/* Roster of Other Daimyos for Diplomacy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CLANS.filter((c) => c.id !== playerClan.id && c.id !== 'custom').map((clan) => (
                  <div
                    key={clan.id}
                    className="bg-stone-900/90 border border-stone-800 hover:border-amber-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between border-b border-stone-800 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                            style={{ backgroundColor: `${clan.color}40`, color: clan.accentColor }}
                          >
                            {clan.monSymbol}
                          </span>
                          <div>
                            <h4 className="font-serif font-bold text-sm text-stone-200">{clan.name}</h4>
                            <span className="text-[10px] text-stone-400 font-serif">{clan.leaderName} ({clan.leaderTitle})</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-amber-400/90 font-serif px-2 py-0.5 rounded bg-stone-950 border border-stone-800">
                          獨特: {clan.uniqueTroopName.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-2 font-serif leading-relaxed line-clamp-2">
                        {clan.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-800">
                      <button
                        onClick={() => {
                          sound.playClick();
                          onExecuteDiplomacy('alliance', clan.id);
                          triggerNotice(`已向【${clan.name}】提出不侵犯同盟倡議！`);
                        }}
                        className="py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-serif transition"
                      >
                        締結同盟
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick();
                          onExecuteDiplomacy('marriage', clan.id);
                          triggerNotice(`已向【${clan.name}】發起政略聯姻請求！`);
                        }}
                        className="py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-[11px] font-serif transition"
                      >
                        政略聯姻
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick();
                          onExecuteDiplomacy('coalition', clan.id);
                          triggerNotice(`已組織包圍網，號召各國共討逆賊！`);
                        }}
                        className="py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 text-[11px] font-serif transition"
                      >
                        包圍網
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PERSONNEL & REWARDS */}
          {activeTab === 'personnel' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400 font-serif bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                透過賞賜知行領地、封授朝廷官階、賜予名刀名馬（如村正、鬼切、松風），可提升麾下武將忠誠度，防止被敵國調略叛變。
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generals.map((gen) => (
                  <div
                    key={gen.id}
                    className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full border border-amber-400/80 bg-stone-800 flex items-center justify-center font-serif font-bold text-amber-200">
                            {gen.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-sm text-amber-100">{gen.name}</span>
                              <span className="text-[10px] text-stone-400 px-1.5 py-0.5 rounded bg-stone-950 border border-stone-800">
                                {gen.roleName}
                              </span>
                            </div>
                            <span className="text-[10px] text-amber-300/80 font-serif">{gen.title}</span>
                          </div>
                        </div>

                        {/* Loyalty Meter */}
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block font-serif">家臣忠誠</span>
                          <span className="text-xs font-bold font-mono text-emerald-400">{gen.loyalty} / 100</span>
                        </div>
                      </div>

                      {/* 5 Stats */}
                      <div className="grid grid-cols-5 gap-1 text-center my-3 text-[10px] font-serif">
                        <div className="bg-stone-950 p-1 rounded border border-stone-800">
                          <span className="text-stone-400 block">統率</span>
                          <strong className="text-amber-300 font-mono text-xs">{gen.command}</strong>
                        </div>
                        <div className="bg-stone-950 p-1 rounded border border-stone-800">
                          <span className="text-stone-400 block">武力</span>
                          <strong className="text-red-400 font-mono text-xs">{gen.martial}</strong>
                        </div>
                        <div className="bg-stone-950 p-1 rounded border border-stone-800">
                          <span className="text-stone-400 block">智略</span>
                          <strong className="text-sky-400 font-mono text-xs">{gen.intellect}</strong>
                        </div>
                        <div className="bg-stone-950 p-1 rounded border border-stone-800">
                          <span className="text-stone-400 block">政治</span>
                          <strong className="text-emerald-400 font-mono text-xs">{gen.politics}</strong>
                        </div>
                        <div className="bg-stone-950 p-1 rounded border border-stone-800">
                          <span className="text-stone-400 block">魅力</span>
                          <strong className="text-purple-300 font-mono text-xs">{gen.charisma}</strong>
                        </div>
                      </div>

                      <div className="text-[11px] text-stone-400 font-serif">
                        知行領地: <strong className="text-stone-200">{gen.fief}</strong>
                      </div>
                      {gen.equippedItem && (
                        <div className="text-[11px] text-amber-300/90 font-serif mt-0.5">
                          賜予名物: <strong>{gen.equippedItem}</strong>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-800 text-xs font-serif">
                      <button
                        onClick={() => {
                          sound.playClick();
                          onRewardGeneral(gen.id, 'fief');
                          triggerNotice(`已賞賜新知行領地予【${gen.name}】！忠誠度大增！`);
                        }}
                        className="py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200"
                      >
                        知行封邑
                      </button>
                      <button
                        onClick={() => {
                          sound.playSwordSlash();
                          onRewardGeneral(gen.id, 'treasure');
                          triggerNotice(`賜予【${gen.name}】天下銘刀與名駒！`);
                        }}
                        className="py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-stone-950 font-bold"
                      >
                        賞賜名刃
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick();
                          onRewardGeneral(gen.id, 'gold');
                          triggerNotice(`發放恩賞金幣給【${gen.name}】！`);
                        }}
                        className="py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300"
                      >
                        金幣恩賞
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MILITARY PROCUREMENT */}
          {activeTab === 'arms' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-2xl mb-3">
                    🔫
                  </div>
                  <h3 className="font-serif font-bold text-amber-200 text-sm">採購種子島鐵砲 (Arquebuses)</h3>
                  <p className="text-xs text-stone-400 font-serif mt-2 leading-relaxed">
                    向堺港或平戶南蠻商館採購西歐最新燧發火繩槍與優質黑火藥，組建連環射擊兵團。
                  </p>
                  <div className="mt-4 text-xs font-serif text-amber-300 font-bold">
                    單價: 1,500 金 / 300 挺
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playGunshot();
                    onProcureArms('gun');
                    triggerNotice('已採購 300 挺精銳種子島鐵砲入庫！');
                  }}
                  className="mt-6 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-xs transition"
                >
                  向南蠻商館採購
                </button>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/40 flex items-center justify-center text-2xl mb-3">
                    🐎
                  </div>
                  <h3 className="font-serif font-bold text-amber-200 text-sm">採購奧羽木曾軍馬 (War Horses)</h3>
                  <p className="text-xs text-stone-400 font-serif mt-2 leading-relaxed">
                    引進甲斐黑駒與奧州駿馬，為旗本親衛隊與突擊騎兵擴充坐騎儲備。
                  </p>
                  <div className="mt-4 text-xs font-serif text-red-300 font-bold">
                    單價: 2,000 金 / 200 匹
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playTaiko();
                    onProcureArms('horse');
                    triggerNotice('已自奧羽牧場採購 200 匹精選戰馬！');
                  }}
                  className="mt-6 w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-amber-100 font-serif font-bold text-xs transition"
                >
                  採購戰馬入廄
                </button>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-2xl mb-3">
                    💣
                  </div>
                  <h3 className="font-serif font-bold text-amber-200 text-sm">鑄造巨型大筒砲 (Siege Cannons)</h3>
                  <p className="text-xs text-stone-400 font-serif mt-2 leading-relaxed">
                    聘請國友村鍛冶匠人澆築青銅攻城巨砲，專門用於粉碎堅固石垣與破壞城門。
                  </p>
                  <div className="mt-4 text-xs font-serif text-sky-300 font-bold">
                    單價: 3,500 金 / 2 門
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playGunshot();
                    onProcureArms('cannon');
                    triggerNotice('國友村已成功鑄造兩門重型青銅大筒！');
                  }}
                  className="mt-6 w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-sky-300 border border-sky-600/40 font-serif font-bold text-xs transition"
                >
                  委託國友村鑄砲
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
