import React from 'react';
import { Volume2, VolumeX, Shield, Award, Play, Pause, FastForward, Sparkles, MapPin, Sword } from 'lucide-react';
import { Clan, GameState } from '../types/game';
import { sound } from '../utils/sound';

interface HeaderBarProps {
  gameState: GameState;
  playerClan: Clan;
  isPaused: boolean;
  gameSpeed: number;
  activeTab: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTogglePause: () => void;
  onChangeSpeed: (speed: number) => void;
  onOpenUnificationCeremony: () => void;
  onOpenEventList: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  gameState,
  playerClan,
  isPaused,
  gameSpeed,
  activeTab,
  soundEnabled,
  onToggleSound,
  onTogglePause,
  onChangeSpeed,
  onOpenUnificationCeremony,
  onOpenEventList,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'map':
        return '全日本沙盤大戰略';
      case 'battle':
        return '實時合戰戰場 · 破門斬將';
      case 'council':
        return '評定所 · 內政與外交政略';
      case 'castle':
        return '地盤與城堡管理系統';
      case 'encyclopedia':
        return '兵種百科全書 · 常規與勢力特色';
      case 'custom':
        return '自創武將殿堂';
      default:
        return '日本戰國：天下布武';
    }
  };

  return (
    <header className="relative z-30 bg-stone-950/95 border-b border-amber-900/60 shadow-2xl backdrop-blur-md px-3 py-2 text-stone-200 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Day Counter & Resources */}
        <div className="flex items-center gap-3">
          {/* Day Counter Seal */}
          <div
            onClick={() => {
              sound.playTaiko();
              onTogglePause();
            }}
            className="group relative flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-amber-600/80 bg-gradient-to-br from-stone-900 to-amber-950/80 shadow-[0_0_15px_rgba(217,119,6,0.3)] cursor-pointer hover:border-amber-400 transition"
            title="點擊暫停/繼續天數流逝"
          >
            <span className="text-[10px] tracking-wider text-amber-400/90 font-serif leading-none">Day</span>
            <span className="text-sm font-bold font-serif text-amber-200 leading-tight">
              {gameState.unificationPercent >= 100 ? '統一' : gameState.day}
            </span>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-stone-800 border border-amber-600/60 flex items-center justify-center text-[8px] text-amber-300">
              {isPaused ? '⏸' : `${gameSpeed}x`}
            </div>
          </div>

          {/* Resources Bar */}
          <div className="flex items-center gap-2 sm:gap-4 bg-stone-900/90 border border-stone-800 rounded-lg px-3 py-1.5 shadow-inner">
            {/* Gold */}
            <div className="flex items-center gap-1.5" title="國庫金錢（用於採購裝備、築城、外交與發動合戰）">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-xs text-amber-300 font-bold">
                金
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-300 tracking-wide font-mono">
                  {gameState.gold.toLocaleString()}
                </span>
                <span className="text-[9px] text-stone-400 hidden sm:inline">商業金幣</span>
              </div>
            </div>

            <div className="w-px h-6 bg-stone-800" />

            {/* Soldiers */}
            <div className="flex items-center gap-1.5" title="常備兵力（受石高上限限制）">
              <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/60 flex items-center justify-center text-xs text-red-300 font-bold">
                兵
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-red-300 tracking-wide font-mono">
                  {gameState.soldiers.toLocaleString()}
                </span>
                <span className="text-[9px] text-stone-400 hidden sm:inline">總兵力</span>
              </div>
            </div>

            <div className="w-px h-6 bg-stone-800" />

            {/* Provisions / Kokudaka */}
            <div className="flex items-center gap-1.5" title="兵糧 / 石高儲備（維繫行軍與據點補給）">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-xs text-emerald-300 font-bold">
                石
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-300 tracking-wide font-mono">
                  {gameState.provisions.toLocaleString()}
                </span>
                <span className="text-[9px] text-stone-400 hidden sm:inline">兵糧石高</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Title & Current View Banner */}
        <div className="hidden md:flex flex-col items-center justify-center px-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-serif text-sm tracking-widest font-black">【</span>
            <h1 className="text-base lg:text-lg font-bold font-serif tracking-[0.2em] bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 bg-clip-text text-transparent drop-shadow">
              {getTabTitle()}
            </h1>
            <span className="text-amber-500 font-serif text-sm tracking-widest font-black">】</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-stone-400 font-serif">
            <span className="text-amber-400/90 font-bold">{playerClan.name}</span>
            <span>·</span>
            <span>{playerClan.leaderName}</span>
            <span>·</span>
            <span className="text-amber-300/80">{gameState.courtRank}</span>
          </div>
        </div>

        {/* Right: Unification Progress & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Unification Progress */}
          <div
            onClick={onOpenUnificationCeremony}
            className="flex flex-col items-end cursor-pointer group"
            title="點擊查看天下統一慶祝大典進度"
          >
            <div className="flex items-center gap-1.5 text-xs text-amber-300/90 font-serif">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition" />
              <span className="text-[11px] tracking-wider">天下統一進度</span>
              <span className="font-mono font-bold text-amber-200">{gameState.unificationPercent}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-28 sm:w-36 h-2 bg-stone-900 rounded-full border border-stone-800 overflow-hidden p-0.5 mt-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-300 transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                style={{ width: `${Math.min(100, Math.max(5, gameState.unificationPercent))}%` }}
              />
            </div>
          </div>

          {/* Controls: Speed, Pause, Sound, Events */}
          <div className="flex items-center gap-1 bg-stone-900/80 border border-stone-800 rounded-lg p-1">
            <button
              onClick={() => {
                sound.playClick();
                onTogglePause();
              }}
              className="p-1.5 rounded hover:bg-stone-800 text-stone-300 hover:text-amber-300 transition"
              title={isPaused ? '繼續天數流逝' : '暫停'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                const nextSpeed = gameSpeed === 1 ? 2 : gameSpeed === 2 ? 4 : 1;
                onChangeSpeed(nextSpeed);
              }}
              className="px-1.5 py-1 text-[10px] font-mono font-bold rounded hover:bg-stone-800 text-stone-300 hover:text-amber-300 transition"
              title="切換流逝倍速 (1x / 2x / 4x)"
            >
              {gameSpeed}x
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenEventList();
              }}
              className="p-1.5 rounded hover:bg-stone-800 text-stone-300 hover:text-amber-300 transition"
              title="歷史合戰分歧事件簿"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              onClick={() => {
                onToggleSound();
                if (!soundEnabled) {
                  sound.enabled = true;
                  sound.playTaiko();
                } else {
                  sound.enabled = false;
                }
              }}
              className="p-1.5 rounded hover:bg-stone-800 text-stone-300 hover:text-amber-300 transition"
              title={soundEnabled ? '關閉音效' : '開啟和風戰國音效'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-stone-500" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
