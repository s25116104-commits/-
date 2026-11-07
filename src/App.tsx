import React, { useState, useEffect } from 'react';
import {
  Compass,
  Swords,
  Castle,
  BookOpen,
  UserPlus,
  Crown,
  Sparkles,
  Award,
  Shield,
  Coins,
  Users,
} from 'lucide-react';
import { CastleType, Clan, ClanId, Formation, GameState, General, Province } from './types/game';
import { CLANS, HISTORICAL_PROVINCES, GENERALS } from './data/sengokuData';
import { HeaderBar } from './components/HeaderBar';
import { GrandStrategyMap } from './components/GrandStrategyMap';
import { BattlefieldAction } from './components/BattlefieldAction';
import { TroopEncyclopedia } from './components/TroopEncyclopedia';
import { CouncilPolitics } from './components/CouncilPolitics';
import { CastleManagement } from './components/CastleManagement';
import { ClanSelectionModal } from './components/ClanSelectionModal';
import { CustomOfficerModal } from './components/CustomOfficerModal';
import { HistoricalEventsModal } from './components/HistoricalEventsModal';
import { UnificationCeremony } from './components/UnificationCeremony';
import { sound } from './utils/sound';

export default function App() {
  // Player state - strictly single chosen faction
  const [playerClanId, setPlayerClanId] = useState<ClanId>('oda');
  const [playerClan, setPlayerClan] = useState<Clan>(CLANS[0]);
  const [playerGeneral, setPlayerGeneral] = useState<General>(GENERALS[0]);

  // Main active tab: 'map' | 'battle' | 'council' | 'castle' | 'encyclopedia'
  const [activeTab, setActiveTab] = useState<'map' | 'battle' | 'council' | 'castle' | 'encyclopedia'>('map');

  // Time & Game Loop
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameSpeed, setGameSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [isClanSelectOpen, setIsClanSelectOpen] = useState<boolean>(false);
  const [isCustomOfficerOpen, setIsCustomOfficerOpen] = useState<boolean>(false);
  const [isHistoricalEventsOpen, setIsHistoricalEventsOpen] = useState<boolean>(false);
  const [isUnificationOpen, setIsUnificationOpen] = useState<boolean>(false);

  // Target province currently being besieged
  const [battleProvince, setBattleProvince] = useState<Province | null>(null);

  // Core Game State
  const [gameState, setGameState] = useState<GameState>({
    day: 126,
    playerClanId: 'oda',
    gold: 15200,
    soldiers: 48000,
    provisions: 9500,
    provinces: HISTORICAL_PROVINCES,
    generals: GENERALS.filter((g) => g.clanId === 'oda'),
    capturedGenerals: [],
    activeFormation: 'fishScale',
    diplomacy: {
      oda: { relation: 100, allied: true, truceDays: true },
      tokugawa: { relation: 85, allied: true, truceDays: true },
      takeda: { relation: 20, allied: false, truceDays: false },
      uesugi: { relation: 35, allied: false, truceDays: false },
      date: { relation: 50, allied: false, truceDays: false },
      mori: { relation: 30, allied: false, truceDays: false },
      hojo: { relation: 40, allied: false, truceDays: false },
      shimazu: { relation: 45, allied: false, truceDays: false },
      chosokabe: { relation: 50, allied: false, truceDays: false },
      custom: { relation: 70, allied: false, truceDays: false },
    },
    courtRank: '正四位下 · 尾張守',
    unificationPercent: 28, // initial percentage
  });

  // Calculate unification percentage whenever provinces update
  useEffect(() => {
    const ownedCount = gameState.provinces.filter((p) => p.clanId === playerClanId).length;
    const pct = Math.min(100, Math.round((ownedCount / gameState.provinces.length) * 100));
    setGameState((prev) => ({
      ...prev,
      unificationPercent: pct,
    }));
  }, [gameState.provinces, playerClanId]);

  // Day Progression Ticker
  useEffect(() => {
    if (isPaused || activeTab === 'battle') return;

    const intervalMs = 2400 / gameSpeed;
    const timer = setInterval(() => {
      setGameState((prev) => {
        const nextDay = prev.day + 1;
        let newGold = prev.gold;
        let newProvisions = prev.provisions;

        // Every 30 days: seasonal tax collection
        if (nextDay % 30 === 0) {
          const totalCommerce = prev.provinces
            .filter((p) => p.clanId === playerClanId)
            .reduce((sum, p) => sum + p.commerce, 0);
          newGold += Math.round(totalCommerce * 0.1);
          newProvisions += 800;
        }

        return {
          ...prev,
          day: nextDay,
          gold: newGold,
          provisions: newProvisions,
        };
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, gameSpeed, activeTab, playerClanId]);

  // Handle Single Clan Selection & Commitment
  const handleSelectClan = (clanId: ClanId) => {
    sound.playTaiko(1.4);
    sound.playFanfare();
    setPlayerClanId(clanId);
    const chosenClan = CLANS.find((c) => c.id === clanId) || CLANS[0];
    setPlayerClan(chosenClan);

    // Pick chief general for this clan
    const chiefGen = GENERALS.find((g) => g.clanId === clanId) || GENERALS[0];
    setPlayerGeneral(chiefGen);

    // Re-initialize map provinces: Clan's home territories belong to the player
    const homeProvincesMap: Record<ClanId, string[]> = {
      oda: ['owari', 'mino', 'omi', 'yamashiro', 'settsu', 'yamato', 'kawachi', 'izumi', 'harima', 'tamba', 'kaga', 'echizen'],
      tokugawa: ['mikawa', 'totomi', 'suruga'],
      takeda: ['kai', 'shinano', 'suruga'],
      uesugi: ['echigo', 'etchu', 'noto'],
      hojo: ['sagami', 'musashi', 'izu', 'kazusa', 'shimosa', 'kozuke'],
      date: ['mutsu', 'dewa', 'shimotsuke', 'hitachi', 'hokkaido'],
      mori: ['aki', 'suo', 'nagato', 'bizen', 'bitchu', 'izumo', 'iwami'],
      shimazu: ['satsuma', 'osumi', 'hyuga', 'higo', 'bungo', 'chikuzen', 'hizen'],
      chosokabe: ['tosa', 'iyo', 'sanuki', 'awa_shikoku'],
      custom: ['yamashiro', 'settsu'],
    };

    const playerHomeIds = homeProvincesMap[clanId] || ['owari'];

    const newProvinces = HISTORICAL_PROVINCES.map((prov) => {
      if (playerHomeIds.includes(prov.id)) {
        return {
          ...prov,
          clanId: clanId,
          occupationProgress: 100,
          defense: prov.maxDefense,
        };
      }
      return prov;
    });

    setGameState((prev) => ({
      ...prev,
      day: 1,
      playerClanId: clanId,
      gold: 15200,
      soldiers: 32000,
      provisions: 8500,
      provinces: newProvinces,
      generals: GENERALS.filter((g) => g.clanId === clanId),
      courtRank: clanId === 'oda' ? '正四位下 · 尾張守' : clanId === 'takeda' ? '從四位下 · 大膳大夫' : '従五位下',
    }));

    setIsClanSelectOpen(false);
    setActiveTab('map');
  };

  // Launch Battle against a province (with distance-based provisions expenditure)
  const handleLaunchBattle = (province: Province, provisionCost: number = 300) => {
    if (gameState.provisions < provisionCost) {
      sound.playClick();
      return;
    }
    sound.playTaiko(1.3);
    sound.playHorn();
    // Deduct provisions immediately for the military expedition
    setGameState((prev) => ({
      ...prev,
      provisions: Math.max(0, prev.provisions - provisionCost),
    }));
    setBattleProvince(province);
    setActiveTab('battle');
  };

  // Handle Battle Finished
  const handleBattleEnd = (result: {
    victory: boolean;
    provinceId: string;
    spoils: { gold: number; provisions: number; capturedGeneral?: General };
  }) => {
    if (result.victory) {
      sound.playFanfare();

      // Annex province to player clan with 100% control
      setGameState((prev) => {
        const updatedProvinces = prev.provinces.map((p) => {
          if (p.id === result.provinceId) {
            return {
              ...p,
              clanId: playerClanId,
              occupationProgress: 100,
              defense: p.maxDefense,
            };
          }
          return p;
        });

        const newGenerals = result.spoils.capturedGeneral
          ? [...prev.generals, { ...result.spoils.capturedGeneral, clanId: playerClanId, loyalty: 70 }]
          : prev.generals;

        return {
          ...prev,
          gold: prev.gold + result.spoils.gold,
          provisions: prev.provisions + result.spoils.provisions,
          provinces: updatedProvinces,
          generals: newGenerals,
        };
      });
    }

    setActiveTab('map');
    setBattleProvince(null);
  };

  // Domestic Actions execution
  const handleExecuteDomestic = (action: 'paddy' | 'commerce' | 'fortify' | 'flood', provinceId: string) => {
    setGameState((prev) => {
      const costs = {
        paddy: 1200,
        commerce: 1800,
        fortify: 2500,
        flood: 1000,
      };
      const cost = costs[action];
      if (prev.gold < cost) return prev;

      const updatedProvinces = prev.provinces.map((p) => {
        if (p.id === provinceId) {
          if (action === 'paddy') return { ...p, kokudaka: p.kokudaka + 25000 };
          if (action === 'commerce') return { ...p, commerce: p.commerce + 8000 };
          if (action === 'fortify') return { ...p, maxDefense: p.maxDefense + 30, defense: p.maxDefense + 30 };
          if (action === 'flood') return { ...p, loyalty: Math.min(100, p.loyalty + 18) };
        }
        return p;
      });

      return {
        ...prev,
        gold: prev.gold - cost,
        provinces: updatedProvinces,
      };
    });
  };

  // Diplomacy Actions
  const handleExecuteDiplomacy = (action: 'alliance' | 'marriage' | 'vassal' | 'court' | 'coalition', targetClanId: ClanId) => {
    if (action === 'court') {
      if (gameState.gold < 3000) return;
      setGameState((prev) => ({
        ...prev,
        gold: prev.gold - 3000,
        courtRank: '正二位 · 征夷大將軍 / 關白',
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        gold: Math.max(0, prev.gold - 1000),
      }));
    }
  };

  // Reward General
  const handleRewardGeneral = (generalId: string, rewardType: 'fief' | 'treasure' | 'gold') => {
    setGameState((prev) => {
      const updatedGenerals = prev.generals.map((g) => {
        if (g.id === generalId) {
          return {
            ...g,
            loyalty: Math.min(100, g.loyalty + (rewardType === 'treasure' ? 25 : 15)),
            equippedItem: rewardType === 'treasure' ? '名刀 · 備前長船兼光' : g.equippedItem,
          };
        }
        return g;
      });

      return {
        ...prev,
        gold: Math.max(0, prev.gold - (rewardType === 'gold' ? 800 : 400)),
        generals: updatedGenerals,
      };
    });
  };

  // Procure Arms
  const handleProcureArms = (type: 'gun' | 'horse' | 'cannon') => {
    const costs = { gun: 1500, horse: 2000, cannon: 3500 };
    const cost = costs[type];
    if (gameState.gold < cost) return;

    setGameState((prev) => ({
      ...prev,
      gold: prev.gold - cost,
      soldiers: prev.soldiers + (type === 'gun' ? 300 : type === 'horse' ? 200 : 100),
    }));
  };

  // Sever enemy supply line
  const handleSeverSupplyLine = (provinceId: string) => {
    if (gameState.gold < 500) return;
    setGameState((prev) => {
      const updatedProvinces = prev.provinces.map((p) => {
        if (p.id === provinceId) {
          return {
            ...p,
            defense: Math.max(10, p.defense - 20),
            occupationProgress: Math.min(100, p.occupationProgress + 15),
          };
        }
        return p;
      });

      return {
        ...prev,
        gold: prev.gold - 500,
        provinces: updatedProvinces,
      };
    });
  };

  // Patrol province to quell unrest
  const handlePatrolProvince = (provinceId: string) => {
    setGameState((prev) => {
      const updatedProvinces = prev.provinces.map((p) => {
        if (p.id === provinceId) {
          return { ...p, loyalty: Math.min(100, p.loyalty + 12) };
        }
        return p;
      });
      return { ...prev, provinces: updatedProvinces };
    });
  };

  // Recruit troops in province
  const handleRecruitTroops = (provinceId: string) => {
    if (gameState.gold < 600) return;
    setGameState((prev) => ({
      ...prev,
      gold: prev.gold - 600,
      soldiers: prev.soldiers + 1200,
    }));
  };

  // Upgrade Castle
  const handleUpgradeCastle = (provinceId: string) => {
    setGameState((prev) => {
      if (prev.gold < 2000) return prev;
      const updatedProvinces = prev.provinces.map((p) => {
        if (p.id === provinceId) {
          const nextType: CastleType =
            p.castleType === 'Fort'
              ? 'BranchCastle'
              : p.castleType === 'BranchCastle'
              ? 'ProvincialCapital'
              : 'DaimyoMainCastle';
          return { ...p, castleType: nextType, maxDefense: p.maxDefense + 25, defense: p.maxDefense + 25 };
        }
        return p;
      });
      return {
        ...prev,
        gold: prev.gold - 2000,
        provinces: updatedProvinces,
      };
    });
  };

  // Apply custom officer
  const handleSaveCustomOfficer = (officer: General) => {
    setPlayerGeneral(officer);
    setGameState((prev) => ({
      ...prev,
      generals: [officer, ...prev.generals],
    }));
  };

  // Historical event choice applied
  const handleApplyEventChoice = (choice: any) => {
    setGameState((prev) => {
      let updatedProvinces = prev.provinces;
      if (choice.effect.gainProvinces) {
        updatedProvinces = prev.provinces.map((p) => {
          if (choice.effect.gainProvinces.includes(p.id)) {
            return { ...p, clanId: playerClanId, occupationProgress: 100 };
          }
          return p;
        });
      }

      return {
        ...prev,
        gold: prev.gold + (choice.effect.gold || 0),
        soldiers: prev.soldiers + (choice.effect.troops || 0),
        provisions: prev.provisions + (choice.effect.provisions || 0),
        provinces: updatedProvinces,
      };
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans flex flex-col justify-between selection:bg-amber-600 selection:text-stone-950">
      {/* Top Status & Resource Header */}
      <HeaderBar
        gameState={gameState}
        playerClan={playerClan}
        isPaused={isPaused}
        gameSpeed={gameSpeed}
        activeTab={activeTab}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onTogglePause={() => setIsPaused(!isPaused)}
        onChangeSpeed={(spd) => setGameSpeed(spd)}
        onOpenUnificationCeremony={() => setIsUnificationOpen(true)}
        onOpenEventList={() => setIsHistoricalEventsOpen(true)}
      />

      {/* Main Workspace Render */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'map' && (
          <GrandStrategyMap
            provinces={gameState.provinces}
            playerClan={playerClan}
            playerProvisions={gameState.provisions}
            onSelectProvinceToBattle={handleLaunchBattle}
            onOpenCouncil={(prov) => setActiveTab('council')}
            onSeverSupplyLine={handleSeverSupplyLine}
            onPatrolProvince={handlePatrolProvince}
            onRecruitTroops={handleRecruitTroops}
          />
        )}

        {activeTab === 'battle' && battleProvince && (
          <BattlefieldAction
            targetProvince={battleProvince}
            playerClan={playerClan}
            playerGeneral={playerGeneral}
            onBattleEnd={handleBattleEnd}
            onRetreat={() => {
              setActiveTab('map');
              setBattleProvince(null);
            }}
          />
        )}

        {activeTab === 'council' && (
          <CouncilPolitics
            provinces={gameState.provinces}
            playerClan={playerClan}
            generals={gameState.generals}
            gold={gameState.gold}
            provisions={gameState.provisions}
            courtRank={gameState.courtRank}
            onExecuteDomestic={handleExecuteDomestic}
            onExecuteDiplomacy={handleExecuteDiplomacy}
            onRewardGeneral={handleRewardGeneral}
            onProcureArms={handleProcureArms}
          />
        )}

        {activeTab === 'castle' && (
          <CastleManagement
            provinces={gameState.provinces}
            playerClan={playerClan}
            onUpgradeCastle={handleUpgradeCastle}
            gold={gameState.gold}
          />
        )}

        {activeTab === 'encyclopedia' && (
          <TroopEncyclopedia playerClan={playerClan} />
        )}
      </main>

      {/* Bottom Main Navigation Bar (Matching Mockup Footer) */}
      <footer className="z-30 bg-stone-950/95 border-t border-amber-950/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-2xl backdrop-blur-md">
        {/* Left: Dedicated Single Sovereign Clan Badge */}
        <div className="flex items-center gap-2.5 bg-stone-900/90 border border-amber-900/50 rounded-xl px-3 py-1.5 shadow-inner">
          <div
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-serif font-black text-xs shadow"
            style={{
              backgroundColor: `${playerClan.color}45`,
              borderColor: playerClan.accentColor,
              color: playerClan.accentColor,
            }}
          >
            {playerClan.monSymbol}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-amber-400 font-serif font-bold">誓約勢力:</span>
              <span className="text-xs font-serif font-bold text-amber-200">{playerClan.name}</span>
              <span className="text-[10px] text-stone-400">· {playerClan.leaderName}</span>
            </div>
            <span className="text-[9px] text-amber-300/80 font-serif truncate max-w-[200px] hidden sm:inline">
              專屬兵種: {playerClan.uniqueTroopName.split('/')[0]}
            </span>
          </div>

          {/* Change Clan / Restart Campaign Button */}
          <button
            onClick={() => {
              sound.playClick();
              setIsClanSelectOpen(true);
            }}
            className="ml-2 text-[10px] px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 border border-stone-700 transition font-serif whitespace-nowrap flex items-center gap-1"
            title="更換唯一起手陣營"
          >
            <span>重選陣營</span>
          </button>
        </div>

        {/* Right: Core Mode Navigation Toggles */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* 1. Grand Strategy Map */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('map');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-serif font-bold transition flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-lg'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>沙盤大地圖</span>
          </button>

          {/* 2. Tactical Action Battlefield */}
          <button
            onClick={() => {
              sound.playTaiko();
              if (!battleProvince) {
                // Pick nearest enemy province as default target
                const enemyProv = gameState.provinces.find((p) => p.clanId !== playerClanId) || gameState.provinces[1];
                setBattleProvince(enemyProv);
              }
              setActiveTab('battle');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-serif font-bold transition flex items-center gap-1.5 ${
              activeTab === 'battle'
                ? 'bg-red-700 text-amber-100 border-red-500 shadow-lg'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-red-400" />
            <span>合戰戰場</span>
          </button>

          {/* 3. Council Politics */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('council');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-serif font-bold transition flex items-center gap-1.5 ${
              activeTab === 'council'
                ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-lg'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
          >
            <Castle className="w-3.5 h-3.5" />
            <span>評定政略</span>
          </button>

          {/* 4. Domain & Castle Hierarchy (Matching Image #7) */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('castle');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-serif font-bold transition flex items-center gap-1.5 ${
              activeTab === 'castle'
                ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-lg'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>城堡地盤</span>
          </button>

          {/* 5. Troop Encyclopedia (Matching Images #1, #2, #3, #5) */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('encyclopedia');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-serif font-bold transition flex items-center gap-1.5 ${
              activeTab === 'encyclopedia'
                ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-lg'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>兵種百科</span>
          </button>

          {/* 6. Custom Officer Creator */}
          <button
            onClick={() => {
              sound.playClick();
              setIsCustomOfficerOpen(true);
            }}
            className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-amber-400 hover:text-amber-300 transition"
            title="自創武將殿堂"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Modals */}
      <ClanSelectionModal
        isOpen={isClanSelectOpen}
        currentClanId={playerClanId}
        onConfirmClan={handleSelectClan}
        onOpenCustomCreator={() => {
          setIsClanSelectOpen(false);
          setIsCustomOfficerOpen(true);
        }}
        canCancel={true}
        onCancel={() => setIsClanSelectOpen(false)}
      />

      <CustomOfficerModal
        isOpen={isCustomOfficerOpen}
        onClose={() => setIsCustomOfficerOpen(false)}
        onSaveOfficer={handleSaveCustomOfficer}
      />

      <HistoricalEventsModal
        isOpen={isHistoricalEventsOpen}
        onClose={() => setIsHistoricalEventsOpen(false)}
        onApplyEventChoice={handleApplyEventChoice}
      />

      <UnificationCeremony
        isOpen={isUnificationOpen}
        onClose={() => setIsUnificationOpen(false)}
        gameState={gameState}
        playerClan={playerClan}
      />
    </div>
  );
}
