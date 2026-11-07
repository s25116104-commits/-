import React, { useEffect } from 'react';
import { Award, Sparkles, X, Crown, MapPin, Trophy, Users, Shield } from 'lucide-react';
import { Clan, GameState } from '../types/game';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';

interface UnificationCeremonyProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  playerClan: Clan;
}

export const UnificationCeremony: React.FC<UnificationCeremonyProps> = ({
  isOpen,
  onClose,
  gameState,
  playerClan,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playFanfare();
      sound.playTaiko(1.5);

      const duration = 3.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: 0.2, y: 0.4 } });
        confetti({ ...defaults, particleCount, origin: { x: 0.8, y: 0.4 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="max-w-4xl w-full bg-gradient-to-b from-[#1f1915] via-stone-900 to-[#120f0d] border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-stone-200 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-400" />
            <div>
              <span className="text-[11px] text-amber-400 tracking-[0.2em] font-serif block">
                TENKA FUBU: GRAND CELEBRATION OF UNIFICATION & HERITAGE
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200">
                天下布武：統一全日本與傳承慶祝大典
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grand Ceremony Banner & Image (Matching Image #6) */}
        <div className="relative mt-4 rounded-2xl overflow-hidden border border-amber-700/60 shadow-2xl">
          <img
            src="/assets/aistudio/Gemini_Generated_Image_7wbn9j7wbn9j7wbn_565fda12.jfif"
            alt="Tenka Fubu Grand Celebration"
            className="w-full max-h-72 object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent flex items-end p-4">
            <div className="bg-stone-950/85 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/40">
              <span className="text-xs text-amber-400 font-serif font-bold">
                【全日本 66 國統一大願達成】
              </span>
              <p className="text-xs text-stone-300 font-serif mt-0.5">
                歷經百戰風霜，{playerClan.leaderName}奉行「天下布武」之夙願，降服六十六國群雄，開闢太平治世！
              </p>
            </div>
          </div>
        </div>

        {/* Imperial Decrees & Statistics Recap */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-serif">
          <div className="bg-stone-950/80 p-3 rounded-xl border border-amber-900/40 text-center">
            <span className="text-stone-400 block text-[10px]">征戰歷時</span>
            <strong className="text-amber-300 text-base font-mono mt-1 block">Day {gameState.day}</strong>
          </div>
          <div className="bg-stone-950/80 p-3 rounded-xl border border-amber-900/40 text-center">
            <span className="text-stone-400 block text-[10px]">朝廷奉封大位</span>
            <strong className="text-amber-200 text-base font-serif mt-1 block">關白 / 征夷大將軍</strong>
          </div>
          <div className="bg-stone-950/80 p-3 rounded-xl border border-amber-900/40 text-center">
            <span className="text-stone-400 block text-[10px]">支配全國石高</span>
            <strong className="text-emerald-400 text-base font-mono mt-1 block">22,500,000 石</strong>
          </div>
          <div className="bg-stone-950/80 p-3 rounded-xl border border-amber-900/40 text-center">
            <span className="text-stone-400 block text-[10px]">麾下名將賢相</span>
            <strong className="text-sky-300 text-base font-mono mt-1 block">{gameState.generals.length} 位</strong>
          </div>
        </div>

        {/* Final Speech / Declaration */}
        <div className="mt-4 bg-amber-950/20 border border-amber-800/60 rounded-2xl p-4 text-xs font-serif leading-relaxed text-stone-300">
          <h4 className="font-bold text-amber-300 text-sm mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>天下泰平之御教書：頒布「總無事令」</span>
          </h4>
          <p>
            自應仁之亂百餘年以降，群雄割據，蒼生塗炭。今{playerClan.name}順應天命，平定九州、四國、西國、近畿、關東與奧羽！
            自此全日本境內嚴禁私鬥，兵農分離，萬民各安其業，海內外商船通行無阻，戰國亂世自此落幕，開拓千秋萬載之盛世基業！
          </p>
        </div>

        {/* Footer Button */}
        <div className="mt-6 pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-xs tracking-wider transition shadow-lg"
          >
            巡行四海 · 檢閱天下軍容
          </button>
        </div>
      </div>
    </div>
  );
};
