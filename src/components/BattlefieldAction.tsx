import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Swords,
  Shield,
  Zap,
  Crosshair,
  Flag,
  ArrowLeft,
  Volume2,
  Award,
  Skull,
  Heart,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Flame,
  Users,
  AlertTriangle,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';
import { Clan, Formation, General, Province } from '../types/game';
import { sound } from '../utils/sound';
import { FORMATIONS_DATA, GENERALS, CLANS } from '../data/sengokuData';
import confetti from 'canvas-confetti';

interface BattlefieldActionProps {
  targetProvince: Province;
  playerClan: Clan;
  playerGeneral: General;
  onBattleEnd: (result: {
    victory: boolean;
    provinceId: string;
    spoils: { gold: number; provisions: number; capturedGeneral?: General };
  }) => void;
  onRetreat: () => void;
}

// Regiment / Troop Card Interface
export interface TroopCard {
  id: string;
  name: string;
  kanji: string;
  isPlayer: boolean;
  type: 'spear' | 'arquebus' | 'cavalry' | 'archer' | 'artillery' | 'special';
  count: number;          // 兵力數量 (Headcount)
  maxCount: number;
  morale: number;         // 士氣 (Morale 0 - 100)
  maxMorale: number;
  attack: number;
  speed: number;
  range: number;
  x: number;              // Battalion center on field
  y: number;
  color: string;
  accentColor: string;
  status: '衝鋒' | '齊射' | '固守' | '動搖' | '高昂' | '進軍' | '交戰';
  skillName: string;
  attackCooldown: number;
  formationOffset: { offsetX: number; offsetY: number };
  targetEntity?: {
    type: 'enemy_card' | 'enemy_general' | 'gate';
    targetId?: string;
    name: string;
  } | null;
  customDestination?: { x: number; y: number } | null;
}

export interface DragState {
  isDragging: boolean;
  dragType: 'none' | 'card' | 'general' | 'formation_line';
  cardId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  hoverTarget: {
    type: 'enemy_card' | 'enemy_general' | 'gate' | 'ground';
    targetId?: string;
    name: string;
    x: number;
    y: number;
  } | null;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  damage: number;
  isBullet: boolean;
  lifetime: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface DamageNumber {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export const BattlefieldAction: React.FC<BattlefieldActionProps> = ({
  targetProvince,
  playerClan,
  playerGeneral,
  onBattleEnd,
  onRetreat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tactical Controls state
  const [formation, setFormation] = useState<Formation>('fishScale');
  const [tacticalCommand, setTacticalCommand] = useState<'charge' | 'volley' | 'regroup'>('charge');

  // References for pure 60FPS physics
  const formationRef = useRef<Formation>('fishScale');
  const commandRef = useRef<'charge' | 'volley' | 'regroup'>('charge');

  // Pre-Battle Deployment Phase & Independent Unit Selection
  const [battlePhase, setBattlePhase] = useState<'deployment' | 'battle'>('deployment');
  const battlePhaseRef = useRef<'deployment' | 'battle'>('deployment');

  // Currently focused unit for exclusive direct control ('general' | card.id)
  const [selectedControlId, setSelectedControlId] = useState<string>('general');
  const selectedControlIdRef = useRef<string>('general');

  // Throttled HUD state
  const [playerHpDisplay, setPlayerHpDisplay] = useState<number>(500);
  const [enemyGeneralHpDisplay, setEnemyGeneralHpDisplay] = useState<number>(600);
  const [gateHpDisplay, setGateHpDisplay] = useState<number>(800);
  const [skillCdDisplay, setSkillCdDisplay] = useState<number>(0);
  const [dashCdDisplay, setDashCdDisplay] = useState<number>(0);
  const [killCountDisplay, setKillCountDisplay] = useState<number>(0);

  // Live Troop Cards for UI Display (Throttled update)
  const [playerCardsDisplay, setPlayerCardsDisplay] = useState<TroopCard[]>([]);
  const [enemyCardsDisplay, setEnemyCardsDisplay] = useState<TroopCard[]>([]);

  const [battleResult, setBattleResult] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [capturedGeneral, setCapturedGeneral] = useState<General | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([
    `戰鼓雷鳴！${playerClan.name}軍勢逼臨${targetProvince.name}國【${targetProvince.castleName}】！`,
    `士兵已編制為各戰術卡牌！卡牌顯示實時【數量】與【士氣】；點擊卡牌可下達兵團專屬號令！`,
  ]);

  // Enemy general definition
  const enemyGeneral = GENERALS.find((g) => g.clanId === targetProvince.clanId) || {
    id: `enemy_commander_${targetProvince.id}`,
    name: `${targetProvince.name}城守大將`,
    kanji: `${targetProvince.name}守將`,
    clanId: targetProvince.clanId,
    role: 'General' as const,
    roleName: '城代守將',
    avatar: '/assets/aistudio/Gemini_Generated_Image_nkgpminkgpminkgp_d33d7e24.jfif',
    command: 85,
    martial: 88,
    intellect: 80,
    politics: 75,
    charisma: 82,
    loyalty: 80,
    fief: targetProvince.name,
    skill: {
      name: '死守城壁',
      description: '率領城守死士發動防衛反擊',
      cooldown: 8,
      damage: 100,
      effectType: 'buff' as const,
    },
    title: '城代大將',
    biography: `守衛${targetProvince.castleName}的宿將。`,
  };

  // Keyboard input state & IME normalization
  const keysRef = useRef<{ [key: string]: boolean }>({});
  // Virtual D-pad input ref
  const virtualDpadRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  // Click-to-move destination ref
  const targetMovePosRef = useRef<{ x: number; y: number } | null>(null);

  // Core internal battle mutable states
  const playerRef = useRef({
    x: 180,
    y: 280,
    hp: 500,
    maxHp: 500,
    invincibleTimer: 0,
    slashCooldown: 0,
    slashEffect: 0,
    skillCooldown: 0,
    dashCooldown: 0,
    angle: 0,
    alive: true,
  });

  const gateRef = useRef({ x: 700, y: 280, hp: 800, maxHp: 800, broken: false });
  const enemyGenRef = useRef({
    x: 840,
    y: 280,
    hp: 600,
    maxHp: 600,
    alive: true,
    attackTimer: 0,
  });

  // Mutable Troop Cards on Field
  const cardsRef = useRef<TroopCard[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const damageNumsRef = useRef<DamageNumber[]>([]);
  const killCountRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);

  // Mouse Dragging State for Formations and Engagements
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    dragType: 'none',
    cardId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    hoverTarget: null,
  });

  // Switch formation smoothly without triggering RAF loop re-mount
  const changeFormation = useCallback((newForm: Formation) => {
    formationRef.current = newForm;
    setFormation(newForm);
    sound.playClick();

    const formInfo = FORMATIONS_DATA.find((f) => f.id === newForm);
    setBattleLog((prev) => [
      `【陣形切換】全軍變陣為【${formInfo?.kanji || newForm}】！${formInfo?.description || ''}`,
      ...prev.slice(0, 3),
    ]);

    // Recalculate formation slot offsets for allied cards and clear individual overrides
    const playerCards = cardsRef.current.filter((c) => c.isPlayer);
    playerCards.forEach((card, idx) => {
      card.targetEntity = null;
      card.customDestination = null;
      card.status = '衝鋒';
      if (newForm === 'fishScale') {
        // Wedge triangular formation
        const offsets = [
          { offsetX: 40, offsetY: 0 },    // Spear 1 (Vanguard center)
          { offsetX: 20, offsetY: 40 },   // Spear 2 (Vanguard right)
          { offsetX: -35, offsetY: -25 }, // Arquebus (Back left)
          { offsetX: 55, offsetY: -55 },  // Cavalry (Front flank)
          { offsetX: -60, offsetY: 30 },  // Artillery (Rear)
        ];
        card.formationOffset = offsets[idx % offsets.length];
      } else if (newForm === 'craneWing') {
        // Flanking two wings
        const offsets = [
          { offsetX: 25, offsetY: -60 },  // Spear 1 (North wing)
          { offsetX: 25, offsetY: 60 },   // Spear 2 (South wing)
          { offsetX: -10, offsetY: 0 },   // Arquebus (Center)
          { offsetX: 60, offsetY: -80 },  // Cavalry (North outflank)
          { offsetX: -50, offsetY: 0 },   // Artillery (Rear reserve)
        ];
        card.formationOffset = offsets[idx % offsets.length];
      } else {
        // Circular ring formation
        const angle = (idx / playerCards.length) * Math.PI * 2;
        card.formationOffset = {
          offsetX: Math.cos(angle) * 55,
          offsetY: Math.sin(angle) * 55,
        };
      }
    });
  }, []);

  const changeCommand = useCallback((cmd: 'charge' | 'volley' | 'regroup') => {
    commandRef.current = cmd;
    setTacticalCommand(cmd);
    if (cmd === 'charge') {
      sound.playHorn();
      setBattleLog((prev) => ['【軍團指令】號令全軍兵團卡牌發動正面總突擊！', ...prev.slice(0, 3)]);
    } else if (cmd === 'volley') {
      sound.playGunshot();
      setBattleLog((prev) => ['【軍團指令】鐵砲兵團發動密集連環齊射！', ...prev.slice(0, 3)]);
    } else {
      sound.playTaiko();
      setBattleLog((prev) => ['【軍團指令】各部隊卡牌向大將本陣集結固守！', ...prev.slice(0, 3)]);
    }
  }, []);

  // Direct Card Tactical Order Trigger (When player clicks on a specific card in the card rack)
  const triggerCardAction = (cardId: string) => {
    const card = cardsRef.current.find((c) => c.id === cardId);
    if (!card || card.count <= 0) return;

    sound.playTaiko();

    if (card.type === 'spear') {
      card.status = '固守';
      card.morale = Math.min(card.maxMorale, card.morale + 15);
      sound.playSwordSlash();
      setBattleLog((prev) => [`【兵團指令】${card.name}布設「槍衾固守陣」，防衛大幅提升！`, ...prev.slice(0, 3)]);
    } else if (card.type === 'arquebus') {
      card.status = '齊射';
      card.morale = Math.min(card.maxMorale, card.morale + 10);
      sound.playGunshot();
      // Trigger volley projectiles from this card's coordinates
      for (let i = -2; i <= 2; i++) {
        projectilesRef.current.push({
          x: card.x + 20,
          y: card.y + i * 14,
          vx: 8.5,
          vy: i * 0.6,
          isPlayer: true,
          damage: 55,
          isBullet: true,
          lifetime: 75,
        });
      }
      setBattleLog((prev) => [`【兵團指令】${card.name}發動「特技·連環齊射」，硝煙瀰漫！`, ...prev.slice(0, 3)]);
    } else if (card.type === 'cavalry' || card.type === 'special') {
      card.status = '衝鋒';
      card.speed = 3.6;
      card.morale = Math.min(card.maxMorale, card.morale + 20);
      sound.playSwordSlash();
      setBattleLog((prev) => [`【兵團指令】${card.name}全速「鐵騎衝鋒」，直鑿敵軍側翼！`, ...prev.slice(0, 3)]);
    } else if (card.type === 'artillery') {
      card.status = '齊射';
      sound.playGunshot();
      setTimeout(() => sound.playTaiko(1.4), 100);
      projectilesRef.current.push({
        x: card.x + 20,
        y: card.y,
        vx: 7,
        vy: 0,
        isPlayer: true,
        damage: 120,
        isBullet: true,
        lifetime: 80,
      });
      setBattleLog((prev) => [`【兵團指令】${card.name}開火！重型大筒轟擊城門石垣！`, ...prev.slice(0, 3)]);
    }
  };

  // Particle & text helpers
  const spawnSparks = (x: number, y: number, color: string, count: number) => {
    if (particlesRef.current.length > 50) return;
    const safeCount = Math.min(count, 8);
    for (let i = 0; i < safeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 15 + Math.random() * 10,
        maxLife: 25,
        size: 2 + Math.random() * 2,
      });
    }
  };

  const spawnDamageNumber = (x: number, y: number, text: string, color: string) => {
    if (damageNumsRef.current.length > 20) damageNumsRef.current.shift();
    damageNumsRef.current.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y - 10,
      text,
      color,
      life: 30,
    });
  };

  // Player Katana Slash Attack
  const triggerPlayerAttack = useCallback(() => {
    const p = playerRef.current;
    if (p.slashCooldown > 0 || !p.alive || isFinishedRef.current) return;
    p.slashCooldown = 14;
    p.slashEffect = 7;
    sound.playSwordSlash();

    const px = p.x;
    const py = p.y;
    const slashRange = 65;

    // Check hit on gate
    if (!gateRef.current.broken && Math.hypot(px - gateRef.current.x, py - gateRef.current.y) < slashRange + 35) {
      gateRef.current.hp -= 45;
      spawnDamageNumber(gateRef.current.x, gateRef.current.y - 20, '-45', '#fbbf24');
      spawnSparks(gateRef.current.x, gateRef.current.y, '#f59e0b', 6);
      if (gateRef.current.hp <= 0) {
        gateRef.current.broken = true;
        sound.playTaiko(1.4);
        setBattleLog((prev) => [`【城門攻破】${targetProvince.castleName}大手門轟然破裂！全軍突入！`, ...prev.slice(0, 3)]);
      }
    }

    // Check hit on enemy general
    const eg = enemyGenRef.current;
    if (eg.alive && Math.hypot(px - eg.x, py - eg.y) < slashRange + 25) {
      const dmg = 45 + Math.floor(Math.random() * 25);
      eg.hp -= dmg;
      spawnDamageNumber(eg.x, eg.y - 20, `-${dmg}`, '#ef4444');
      spawnSparks(eg.x, eg.y, '#ef4444', 8);
      if (eg.hp <= 0 && eg.alive) {
        eg.alive = false;
        isFinishedRef.current = true;
        sound.playFanfare();
        killCountRef.current++;
        setCapturedGeneral(enemyGeneral);
        setBattleResult('victory');
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }

    // Check hit on enemy cards
    cardsRef.current.forEach((card) => {
      if (!card.isPlayer && card.count > 0) {
        if (Math.hypot(px - card.x, py - card.y) < slashRange + 15) {
          const casualties = 25 + Math.floor(Math.random() * 20);
          card.count = Math.max(0, card.count - casualties);
          card.morale = Math.max(0, card.morale - 8);
          spawnDamageNumber(card.x, card.y - 15, `-${casualties}兵`, '#f87171');
          spawnSparks(card.x, card.y, '#ef4444', 4);
          if (card.morale < 30) card.status = '動搖';
          if (card.count <= 0) {
            killCountRef.current += 100;
            setBattleLog((prev) => [`【敵軍潰散】敵方【${card.name}】全軍崩潰潰散！`, ...prev.slice(0, 3)]);
          }
        }
      }
    });
  }, [enemyGeneral, targetProvince.castleName]);

  // Player Unique Skill (Q Key)
  const triggerPlayerSkill = useCallback(() => {
    const p = playerRef.current;
    if (p.skillCooldown > 0 || !p.alive || isFinishedRef.current) return;
    p.skillCooldown = playerGeneral.skill.cooldown * 60;
    sound.playTaiko(1.3);

    // Skill boosts all player cards' morale!
    cardsRef.current.forEach((card) => {
      if (card.isPlayer) {
        card.morale = Math.min(card.maxMorale, card.morale + 25);
        card.status = '高昂';
      }
    });

    setBattleLog((prev) => [
      `【武將奧義】${playerGeneral.name}發動奧義「${playerGeneral.skill.name}」！全軍士氣大振！`,
      ...prev.slice(0, 3),
    ]);

    const px = p.x;
    const py = p.y;

    if (playerGeneral.skill.effectType === 'volley') {
      sound.playGunshot();
      for (let wave = 0; wave < 3; wave++) {
        setTimeout(() => {
          sound.playGunshot();
          for (let i = -2; i <= 2; i++) {
            if (projectilesRef.current.length < 35) {
              projectilesRef.current.push({
                x: playerRef.current.x + 20,
                y: playerRef.current.y + i * 16,
                vx: 8.5,
                vy: i * 0.7,
                isPlayer: true,
                damage: 60,
                isBullet: true,
                lifetime: 75,
              });
            }
          }
        }, wave * 160);
      }
    } else if (playerGeneral.skill.effectType === 'charge') {
      sound.playSwordSlash();
      p.x += 150;
      spawnSparks(px + 75, py, '#dc2626', 20);
      cardsRef.current.forEach((card) => {
        if (!card.isPlayer && Math.hypot(px + 75 - card.x, py - card.y) < 130) {
          const casualties = 80;
          card.count = Math.max(0, card.count - casualties);
          card.morale = Math.max(0, card.morale - 25);
          spawnDamageNumber(card.x, card.y - 15, `-${casualties}兵 衝鋒`, '#f87171');
        }
      });
      if (Math.hypot(px + 75 - enemyGenRef.current.x, py - enemyGenRef.current.y) < 130) {
        enemyGenRef.current.hp -= 110;
        spawnDamageNumber(enemyGenRef.current.x, enemyGenRef.current.y - 25, '-110 衝鋒', '#ef4444');
      }
    } else {
      p.invincibleTimer = 300;
      cardsRef.current.forEach((card) => {
        if (card.isPlayer && card.count > 0) {
          card.count = Math.min(card.maxCount, card.count + 40);
          spawnDamageNumber(card.x, card.y - 10, '+40兵 護佑', '#10b981');
        }
      });
      spawnSparks(px, py, '#38bdf8', 25);
    }
  }, [playerGeneral]);

  // Player Dash (E Key)
  const triggerPlayerDash = useCallback(() => {
    const p = playerRef.current;
    if (p.dashCooldown > 0 || !p.alive || isFinishedRef.current) return;
    p.dashCooldown = 50;
    sound.playClick();

    let dx = 0;
    let dy = 0;
    if (keysRef.current['up'] || virtualDpadRef.current.up) dy -= 1;
    if (keysRef.current['down'] || virtualDpadRef.current.down) dy += 1;
    if (keysRef.current['left'] || virtualDpadRef.current.left) dx -= 1;
    if (keysRef.current['right'] || virtualDpadRef.current.right) dx += 1;

    const dist = Math.hypot(dx, dy) || 1;
    p.x += (dx / dist) * 85;
    p.y += (dy / dist) * 85;
    p.invincibleTimer = 22;
    spawnSparks(p.x, p.y, '#f59e0b', 8);
  }, []);

  // Select a specific unit or general for exclusive direct control
  const selectControlledUnit = useCallback((unitId: string) => {
    selectedControlIdRef.current = unitId;
    setSelectedControlId(unitId);
    sound.playClick();
    if (unitId === 'general') {
      setBattleLog((prev) => [`【獨立指揮】當前主控：總大將【${playerGeneral.name}】！WASD/方向鍵由大將直率！`, ...prev.slice(0, 3)]);
    } else {
      const card = cardsRef.current.find((c) => c.id === unitId);
      if (card) {
        setBattleLog((prev) => [`【獨立指揮】當前主控：【${card.name}】！已專注單一兵種，WASD/點擊/攻擊皆由此部隊執行！`, ...prev.slice(0, 3)]);
      }
    }
  }, [playerGeneral.name]);

  // Start Real-Time Battle after Pre-Battle Deployment
  const handleStartBattle = useCallback(() => {
    battlePhaseRef.current = 'battle';
    setBattlePhase('battle');
    commandRef.current = 'charge';
    isFinishedRef.current = false;
    dragStateRef.current = {
      isDragging: false,
      dragType: 'card',
      cardId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      hoverTarget: null,
    };

    // Awaken and order all units into immediate dynamic engagement
    cardsRef.current.forEach((card) => {
      if (card.isPlayer && card.count > 0) {
        card.status = '衝鋒';
        card.customDestination = null;
      } else if (!card.isPlayer && card.count > 0) {
        if (card.type === 'cavalry' || card.type === 'spear') {
          card.status = '進軍';
          // Vanguard units sally forth from gate to meet player in open field
          if (card.x > 670) {
            card.x = Math.max(620, card.x - 70);
          }
        }
      }
    });

    sound.playHorn();
    sound.playTaiko(1.4);
    setBattleLog((prev) => [
      `【開戰號令】陣形布署完畢，擊鼓出征！全軍展開正面突擊！`,
      ...prev.slice(0, 3),
    ]);
  }, []);

  // Active Controlled Unit Attack (Space / Action Button)
  const triggerActiveUnitAttack = useCallback(() => {
    const activeId = selectedControlIdRef.current;
    if (activeId === 'general') {
      triggerPlayerAttack();
      return;
    }

    const card = cardsRef.current.find((c) => c.id === activeId);
    if (!card || card.count <= 0) return;

    if (card.type === 'spear') {
      sound.playSwordSlash();
      spawnSparks(card.x + 35, card.y, '#f59e0b', 8);
      cardsRef.current.forEach((en) => {
        if (!en.isPlayer && en.count > 0 && Math.hypot(card.x + 35 - en.x, card.y - en.y) < 55) {
          const casualties = Math.floor(card.attack * 1.25);
          en.count = Math.max(0, en.count - casualties);
          en.morale = Math.max(0, en.morale - 6);
          spawnDamageNumber(en.x, en.y - 15, `-${casualties}兵 突刺`, '#fbbf24');
          spawnSparks(en.x, en.y, '#ef4444', 4);
          if (en.count <= 0) killCountRef.current += 100;
        }
      });
      if (enemyGenRef.current.alive && Math.hypot(card.x + 35 - enemyGenRef.current.x, card.y - enemyGenRef.current.y) < 55) {
        const dmg = Math.floor(card.attack * 1.1);
        enemyGenRef.current.hp -= dmg;
        spawnDamageNumber(enemyGenRef.current.x, enemyGenRef.current.y - 20, `-${dmg}`, '#ef4444');
      }
      if (!gateRef.current.broken && Math.hypot(card.x + 35 - gateRef.current.x, card.y - gateRef.current.y) < 70) {
        gateRef.current.hp -= card.attack;
        spawnDamageNumber(gateRef.current.x, gateRef.current.y - 20, `-${card.attack}`, '#fbbf24');
        if (gateRef.current.hp <= 0) {
          gateRef.current.broken = true;
          sound.playTaiko(1.4);
        }
      }
    } else if (card.type === 'arquebus') {
      sound.playGunshot();
      projectilesRef.current.push({
        x: card.x + 20,
        y: card.y,
        vx: 8.5,
        vy: (Math.random() - 0.5) * 0.8,
        isPlayer: true,
        damage: Math.floor(card.attack * 1.3),
        isBullet: true,
        lifetime: 80,
      });
      spawnSparks(card.x + 22, card.y, '#fef08a', 6);
    } else if (card.type === 'cavalry') {
      sound.playSwordSlash();
      card.x += 45;
      spawnSparks(card.x, card.y, '#dc2626', 10);
      cardsRef.current.forEach((en) => {
        if (!en.isPlayer && en.count > 0 && Math.hypot(card.x - en.x, card.y - en.y) < 75) {
          const casualties = Math.floor(card.attack * 1.4);
          en.count = Math.max(0, en.count - casualties);
          en.morale = Math.max(0, en.morale - 8);
          spawnDamageNumber(en.x, en.y - 15, `-${casualties}兵 騎突`, '#f87171');
          if (en.count <= 0) killCountRef.current += 100;
        }
      });
    } else if (card.type === 'artillery') {
      sound.playGunshot();
      setTimeout(() => sound.playTaiko(1.4), 80);
      projectilesRef.current.push({
        x: card.x + 25,
        y: card.y,
        vx: 7,
        vy: 0,
        isPlayer: true,
        damage: 130,
        isBullet: true,
        lifetime: 85,
      });
      spawnSparks(card.x + 25, card.y, '#f59e0b', 14);
    }
  }, [triggerPlayerAttack]);

  // Active Controlled Unit Skill (Q / Action Button)
  const triggerActiveUnitSkill = useCallback(() => {
    const activeId = selectedControlIdRef.current;
    if (activeId === 'general') {
      triggerPlayerSkill();
    } else {
      triggerCardAction(activeId);
    }
  }, [triggerPlayerSkill]);

  // Active Controlled Unit Dash / Sprint (E / Action Button)
  const triggerActiveUnitDash = useCallback(() => {
    const activeId = selectedControlIdRef.current;
    if (activeId === 'general') {
      triggerPlayerDash();
    } else {
      const card = cardsRef.current.find((c) => c.id === activeId);
      if (card && card.count > 0) {
        card.x += 65;
        spawnSparks(card.x, card.y, '#38bdf8', 10);
        sound.playClick();
      }
    }
  }, [triggerPlayerDash]);

  // Helper: Convert client coordinates to canvas internal pixel coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Handle Mouse Down on Canvas (Start card drag, general drag, or formation line drag)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    const { x, y } = coords;

    // 1. Check if user clicked on or near a player Troop Card (Hitbox 42px)
    const clickedCard = cardsRef.current.find(
      (c) =>
        c.isPlayer &&
        c.count > 0 &&
        (Math.hypot(x - c.x, y - c.y) < 42 ||
          (x >= c.x - 32 && x <= c.x + 32 && y >= c.y - 48 && y <= c.y - 6))
    );

    if (clickedCard) {
      selectControlledUnit(clickedCard.id);
      dragStateRef.current = {
        isDragging: true,
        dragType: 'card',
        cardId: clickedCard.id,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        hoverTarget: null,
      };
      return;
    }

    // 2. Check if clicked near player general (Hitbox 42px)
    const p = playerRef.current;
    if (Math.hypot(x - p.x, y - p.y) < 42) {
      selectControlledUnit('general');
      dragStateRef.current = {
        isDragging: true,
        dragType: 'general',
        cardId: 'general',
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        hoverTarget: null,
      };
      return;
    }

    // 3. Otherwise: start formation line drag or click-to-move
    dragStateRef.current = {
      isDragging: true,
      dragType: 'formation_line',
      cardId: null,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      hoverTarget: null,
    };
  };

  // Handle Mouse Move on Canvas (Real-time formation dragging & tactile repositioning)
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    const { x, y } = coords;

    if (!dragStateRef.current.isDragging) return;

    dragStateRef.current.currentX = x;
    dragStateRef.current.currentY = y;

    const isDeployment = battlePhaseRef.current === 'deployment';

    // In Deployment Phase: Dragging directly relocates the unit / general in real-time!
    if (isDeployment) {
      if (dragStateRef.current.dragType === 'card' && dragStateRef.current.cardId) {
        const card = cardsRef.current.find((c) => c.id === dragStateRef.current.cardId);
        if (card && card.count > 0) {
          // Constrain within deployment zone (x: 25 to 540, y: 25 to 455)
          const clampedX = Math.max(25, Math.min(540, x));
          const clampedY = Math.max(25, Math.min(455, y));
          card.x = clampedX;
          card.y = clampedY;
          card.formationOffset = {
            offsetX: card.x - playerRef.current.x,
            offsetY: card.y - playerRef.current.y,
          };
          card.customDestination = null;
        }
      } else if (dragStateRef.current.dragType === 'general') {
        const p = playerRef.current;
        const oldX = p.x;
        const oldY = p.y;
        const clampedX = Math.max(25, Math.min(500, x));
        const clampedY = Math.max(25, Math.min(455, y));
        const deltaX = clampedX - oldX;
        const deltaY = clampedY - oldY;
        p.x = clampedX;
        p.y = clampedY;
        // Shift entire squad with the general so whole formation moves
        cardsRef.current.forEach((c) => {
          if (c.isPlayer) {
            c.x = Math.max(25, Math.min(545, c.x + deltaX));
            c.y = Math.max(25, Math.min(455, c.y + deltaY));
          }
        });
      }
      return;
    }

    // In Battle Phase: Detect tactical lock-on target under cursor
    let foundTarget: DragState['hoverTarget'] = null;

    // A. Check Enemy Troop Cards
    for (const en of cardsRef.current) {
      if (!en.isPlayer && en.count > 0) {
        if (
          Math.hypot(x - en.x, y - en.y) < 38 ||
          (x >= en.x - 28 && x <= en.x + 28 && y >= en.y - 44 && y <= en.y - 10)
        ) {
          foundTarget = {
            type: 'enemy_card',
            targetId: en.id,
            name: en.name,
            x: en.x,
            y: en.y,
          };
          break;
        }
      }
    }

    // B. Check Enemy General
    if (!foundTarget && enemyGenRef.current.alive && Math.hypot(x - enemyGenRef.current.x, y - enemyGenRef.current.y) < 36) {
      foundTarget = {
        type: 'enemy_general',
        name: enemyGeneral.name,
        x: enemyGenRef.current.x,
        y: enemyGenRef.current.y,
      };
    }

    // C. Check Castle Gate
    if (!foundTarget && !gateRef.current.broken && x >= 665 && x <= 735 && y >= 210 && y <= 350) {
      foundTarget = {
        type: 'gate',
        name: `${targetProvince.castleName}大手門`,
        x: gateRef.current.x,
        y: gateRef.current.y,
      };
    }

    // D. Default Ground Destination
    if (!foundTarget) {
      foundTarget = {
        type: 'ground',
        name: '指定陣位',
        x,
        y,
      };
    }

    dragStateRef.current.hoverTarget = foundTarget;
  };

  // Handle Mouse Up on Canvas (Execute drag formation placement or tactical attack)
  const handleCanvasMouseUp = () => {
    if (!dragStateRef.current.isDragging) return;

    const { dragType, cardId, startX, startY, currentX, currentY, hoverTarget } = dragStateRef.current;
    const dragDist = Math.hypot(currentX - startX, currentY - startY);
    const isDeployment = battlePhaseRef.current === 'deployment';

    // 1. Troop Card Drag Execution
    if (dragType === 'card' && cardId) {
      const card = cardsRef.current.find((c) => c.id === cardId);
      if (card && card.count > 0) {
        if (isDeployment) {
          // Deployment snap sound & feedback
          if (dragDist > 10) {
            sound.playTaiko(1.1);
            setBattleLog((prev) => [
              `【陣位就緒】${card.name} 已滑鼠拖曳進駐指定新陣位！`,
              ...prev.slice(0, 3),
            ]);
            spawnSparks(card.x, card.y, '#fbbf24', 10);
          }
        } else {
          // Combat Phase Drag
          if (dragDist > 16) {
            if (hoverTarget && hoverTarget.type === 'enemy_card') {
              card.targetEntity = {
                type: 'enemy_card',
                targetId: hoverTarget.targetId,
                name: hoverTarget.name,
              };
              card.customDestination = null;
              card.status = '衝鋒';
              sound.playTaiko(1.2);
              sound.playSwordSlash();
              setBattleLog((prev) => [
                `【交戰指令】${card.name} 鎖定突擊 【${hoverTarget.name}】！`,
                ...prev.slice(0, 3),
              ]);
              spawnSparks(hoverTarget.x, hoverTarget.y, '#ef4444', 12);
            } else if (hoverTarget && hoverTarget.type === 'enemy_general') {
              card.targetEntity = {
                type: 'enemy_general',
                name: hoverTarget.name,
              };
              card.customDestination = null;
              card.status = '衝鋒';
              sound.playSwordSlash();
              setBattleLog((prev) => [
                `【斬將指令】${card.name} 突擊敵方總大將【${hoverTarget.name}】！`,
                ...prev.slice(0, 3),
              ]);
              spawnSparks(hoverTarget.x, hoverTarget.y, '#ef4444', 14);
            } else if (hoverTarget && hoverTarget.type === 'gate') {
              card.targetEntity = {
                type: 'gate',
                name: hoverTarget.name,
              };
              card.customDestination = null;
              card.status = '衝鋒';
              sound.playTaiko(1.3);
              setBattleLog((prev) => [
                `【攻門指令】${card.name} 直奔大手門發動強襲破門！`,
                ...prev.slice(0, 3),
              ]);
              spawnSparks(hoverTarget.x, hoverTarget.y, '#f59e0b', 12);
            } else {
              // Dragged to empty ground -> Set custom formation waypoint & update offset
              card.targetEntity = null;
              card.customDestination = { x: currentX, y: currentY };
              card.formationOffset = {
                offsetX: currentX - playerRef.current.x,
                offsetY: currentY - playerRef.current.y,
              };
              card.status = '進軍';
              sound.playTaiko(0.9);
              setBattleLog((prev) => [
                `【自訂陣位】${card.name} 移防至指定戰術陣位！`,
                ...prev.slice(0, 3),
              ]);
              spawnSparks(currentX, currentY, '#38bdf8', 8);
            }
          } else {
            // Clicked without dragging -> trigger squad skill
            triggerCardAction(card.id);
          }
        }
      }
    } else if (dragType === 'general') {
      // 2. General Drag Execution
      if (isDeployment) {
        if (dragDist > 10) {
          sound.playTaiko(1.2);
          setBattleLog((prev) => [
            `【大將陣位】總大將【${playerGeneral.name}】率全軍移防新陣位完畢！`,
            ...prev.slice(0, 3),
          ]);
          spawnSparks(playerRef.current.x, playerRef.current.y, '#fbbf24', 12);
        }
      } else {
        if (dragDist > 16) {
          if (hoverTarget && hoverTarget.type !== 'ground') {
            triggerPlayerAttack();
          } else {
            targetMovePosRef.current = { x: currentX, y: currentY };
            spawnSparks(currentX, currentY, '#38bdf8', 6);
          }
        } else {
          triggerPlayerAttack();
        }
      }
    } else if (dragType === 'formation_line') {
      // 3. Formation Line Drag Execution (全軍拖曳戰線排陣)
      if (dragDist > 24) {
        const playerCards = cardsRef.current.filter((c) => c.isPlayer && c.count > 0);
        const count = playerCards.length;
        if (count > 0) {
          const dx = currentX - startX;
          const dy = currentY - startY;
          const lineLength = Math.hypot(dx, dy);
          const ux = dx / lineLength;
          const uy = dy / lineLength;
          const nx = -uy;
          const ny = ux;

          playerCards.forEach((card, idx) => {
            const t = count === 1 ? 0.5 : idx / (count - 1);
            let posX = startX + dx * t;
            let posY = startY + dy * t;

            if (card.type === 'arquebus' || card.type === 'artillery') {
              posX -= nx * 35;
              posY -= ny * 35;
            } else if (card.type === 'cavalry') {
              posX += nx * 14;
              posY += ny * 14;
            }

            if (isDeployment) {
              // In deployment phase, instantly snap to the dragged line!
              card.x = Math.max(25, Math.min(540, posX));
              card.y = Math.max(25, Math.min(455, posY));
              card.formationOffset = {
                offsetX: card.x - playerRef.current.x,
                offsetY: card.y - playerRef.current.y,
              };
              card.customDestination = null;
              card.targetEntity = null;
            } else {
              card.targetEntity = null;
              card.customDestination = { x: posX, y: posY };
              card.formationOffset = {
                offsetX: posX - playerRef.current.x,
                offsetY: posY - playerRef.current.y,
              };
              card.status = '進軍';
            }
          });

          sound.playTaiko(1.3);
          sound.playHorn();
          setBattleLog((prev) => [
            isDeployment
              ? `【滑鼠拖曳排陣】全軍兵團已依照拖曳陣線重新完成布陣！`
              : `【全軍劃線排陣】全軍兵團依照拖曳戰線展開新陣形！`,
            ...prev.slice(0, 3),
          ]);
          spawnSparks((startX + currentX) / 2, (startY + currentY) / 2, '#fbbf24', 16);
        }
      } else {
        // Simple click on empty ground
        if (selectedControlIdRef.current === 'general') {
          targetMovePosRef.current = { x: currentX, y: currentY };
          spawnSparks(currentX, currentY, '#38bdf8', 6);
        } else {
          const activeCard = cardsRef.current.find((c) => c.id === selectedControlIdRef.current);
          if (activeCard) {
            if (isDeployment) {
              activeCard.x = Math.max(25, Math.min(540, currentX));
              activeCard.y = Math.max(25, Math.min(455, currentY));
              activeCard.formationOffset = {
                offsetX: activeCard.x - playerRef.current.x,
                offsetY: activeCard.y - playerRef.current.y,
              };
            } else {
              activeCard.customDestination = { x: currentX, y: currentY };
            }
            spawnSparks(currentX, currentY, '#38bdf8', 6);
          }
        }
      }
    }

    dragStateRef.current = {
      isDragging: false,
      dragType: 'none',
      cardId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      hoverTarget: null,
    };
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    if (!coords) return;
    handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as unknown as React.MouseEvent<HTMLCanvasElement>);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    if (!coords) return;
    handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as unknown as React.MouseEvent<HTMLCanvasElement>);
  };

  const handleTouchEnd = () => {
    handleCanvasMouseUp();
  };

  // Initialize and Reset Battle (Cards Setup)
  useEffect(() => {
    sound.playTaiko(1.2);
    sound.playHorn();

    playerRef.current = {
      x: 180,
      y: 280,
      hp: 500,
      maxHp: 500,
      invincibleTimer: 0,
      slashCooldown: 0,
      slashEffect: 0,
      skillCooldown: 0,
      dashCooldown: 0,
      angle: 0,
      alive: true,
    };
    isFinishedRef.current = false;
    killCountRef.current = 0;
    targetMovePosRef.current = null;
    keysRef.current = {};
    virtualDpadRef.current = { up: false, down: false, left: false, right: false };

    gateRef.current = { x: 700, y: 280, hp: 800, maxHp: 800, broken: false };
    enemyGenRef.current = { x: 840, y: 280, hp: 600, maxHp: 600, alive: true, attackTimer: 0 };

    setBattleResult('playing');
    setCapturedGeneral(null);

    // Initializing Troop Cards (兵團卡牌)
    const initialCards: TroopCard[] = [
      // Player Cards (4 Regiments)
      {
        id: 'player_spear_1',
        name: '長槍足輕第一隊',
        kanji: '槍',
        isPlayer: true,
        type: 'spear',
        count: 500,
        maxCount: 500,
        morale: 100,
        maxMorale: 100,
        attack: 26,
        speed: 1.8,
        range: 45,
        x: 130,
        y: 230,
        color: '#f59e0b',
        accentColor: '#fbbf24',
        status: '衝鋒',
        skillName: '槍衾抗突',
        attackCooldown: 0,
        formationOffset: { offsetX: 35, offsetY: -30 },
      },
      {
        id: 'player_spear_2',
        name: '長槍足輕第二隊',
        kanji: '槍',
        isPlayer: true,
        type: 'spear',
        count: 500,
        maxCount: 500,
        morale: 100,
        maxMorale: 100,
        attack: 26,
        speed: 1.8,
        range: 45,
        x: 130,
        y: 330,
        color: '#f59e0b',
        accentColor: '#fbbf24',
        status: '衝鋒',
        skillName: '槍衾抗突',
        attackCooldown: 0,
        formationOffset: { offsetX: 35, offsetY: 30 },
      },
      {
        id: 'player_arquebus',
        name: '種子島鐵砲連射隊',
        kanji: '銃',
        isPlayer: true,
        type: 'arquebus',
        count: 350,
        maxCount: 350,
        morale: 95,
        maxMorale: 100,
        attack: 42,
        speed: 1.5,
        range: 220,
        x: 80,
        y: 280,
        color: '#fbbf24',
        accentColor: '#fef08a',
        status: '齊射',
        skillName: '三段連射',
        attackCooldown: 25,
        formationOffset: { offsetX: -35, offsetY: 0 },
      },
      {
        id: 'player_cavalry',
        name: `${playerClan.name}精銳騎兵隊`,
        kanji: '馬',
        isPlayer: true,
        type: 'cavalry',
        count: 250,
        maxCount: 250,
        morale: 110,
        maxMorale: 120,
        attack: 38,
        speed: 2.8,
        range: 50,
        x: 100,
        y: 160,
        color: '#dc2626',
        accentColor: '#ef4444',
        status: '衝鋒',
        skillName: '鐵騎破陣',
        attackCooldown: 0,
        formationOffset: { offsetX: 50, offsetY: -60 },
      },
      {
        id: 'player_artillery',
        name: '大筒工兵攻城隊',
        kanji: '砲',
        isPlayer: true,
        type: 'artillery',
        count: 150,
        maxCount: 150,
        morale: 90,
        maxMorale: 100,
        attack: 55,
        speed: 1.2,
        range: 260,
        x: 60,
        y: 380,
        color: '#38bdf8',
        accentColor: '#7dd3fc',
        status: '齊射',
        skillName: '巨砲轟城',
        attackCooldown: 40,
        formationOffset: { offsetX: -60, offsetY: 40 },
      },

      // Enemy Cards (3 Defense Regiments)
      {
        id: 'enemy_spear',
        name: '大手門守備槍隊',
        kanji: '槍',
        isPlayer: false,
        type: 'spear',
        count: 600,
        maxCount: 600,
        morale: 95,
        maxMorale: 100,
        attack: 24,
        speed: 1.5,
        range: 45,
        x: 630,
        y: 280,
        color: '#ef4444',
        accentColor: '#f87171',
        status: '固守',
        skillName: '死守城門',
        attackCooldown: 0,
        formationOffset: { offsetX: 0, offsetY: 0 },
      },
      {
        id: 'enemy_archer',
        name: '角櫓和弓射擊隊',
        kanji: '弓',
        isPlayer: false,
        type: 'archer',
        count: 350,
        maxCount: 350,
        morale: 90,
        maxMorale: 100,
        attack: 28,
        speed: 1.3,
        range: 220,
        x: 740,
        y: 200,
        color: '#f87171',
        accentColor: '#fca5a5',
        status: '齊射',
        skillName: '亂箭狙殺',
        attackCooldown: 30,
        formationOffset: { offsetX: 0, offsetY: 0 },
      },
      {
        id: 'enemy_cavalry',
        name: '城代鐵騎突擊隊',
        kanji: '馬',
        isPlayer: false,
        type: 'cavalry',
        count: 250,
        maxCount: 250,
        morale: 100,
        maxMorale: 100,
        attack: 32,
        speed: 2.6,
        range: 50,
        x: 800,
        y: 360,
        color: '#b91c1c',
        accentColor: '#ef4444',
        status: '衝鋒',
        skillName: '城外襲擊',
        attackCooldown: 0,
        formationOffset: { offsetX: 0, offsetY: 0 },
      },
    ];

    cardsRef.current = initialCards;
    setPlayerCardsDisplay(initialCards.filter((c) => c.isPlayer));
    setEnemyCardsDisplay(initialCards.filter((c) => !c.isPlayer));

    battlePhaseRef.current = 'deployment';
    setBattlePhase('deployment');
    selectedControlIdRef.current = 'general';
    setSelectedControlId('general');

    changeFormation('fishScale');

    // Unit rotation list for Tab key cycling
    const unitCycleList = ['general', 'player_spear_1', 'player_spear_2', 'player_arquebus', 'player_cavalry', 'player_artillery'];

    // Keyboard bindings
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code ? e.code.toLowerCase() : '';
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'keyw' || code === 'arrowup' || key === 'w' || key === 'arrowup') {
        keysRef.current['up'] = true;
      }
      if (code === 'keys' || code === 'arrowdown' || key === 's' || key === 'arrowdown') {
        keysRef.current['down'] = true;
      }
      if (code === 'keya' || code === 'arrowleft' || key === 'a' || key === 'arrowleft') {
        keysRef.current['left'] = true;
      }
      if (code === 'keyd' || code === 'arrowright' || key === 'd' || key === 'arrowright') {
        keysRef.current['right'] = true;
      }

      if (
        code === 'enter' ||
        key === 'enter' ||
        ((key === ' ' || code === 'space') && battlePhaseRef.current === 'deployment')
      ) {
        e.preventDefault();
        handleStartBattle();
        return;
      }

      if (key === ' ' || code === 'space') {
        e.preventDefault();
        triggerActiveUnitAttack();
      } else if (code === 'keyq' || key === 'q') {
        triggerActiveUnitSkill();
      } else if (code === 'keye' || key === 'e') {
        triggerActiveUnitDash();
      } else if (code === 'tab' || key === 'tab') {
        e.preventDefault();
        const curIdx = unitCycleList.indexOf(selectedControlIdRef.current);
        const nextId = unitCycleList[(curIdx + 1) % unitCycleList.length];
        selectControlledUnit(nextId);
      } else if (code === 'digit1' || key === '1') {
        selectControlledUnit('general');
      } else if (code === 'digit2' || key === '2') {
        selectControlledUnit('player_spear_1');
      } else if (code === 'digit3' || key === '3') {
        selectControlledUnit('player_spear_2');
      } else if (code === 'digit4' || key === '4') {
        selectControlledUnit('player_arquebus');
      } else if (code === 'digit5' || key === '5') {
        selectControlledUnit('player_cavalry');
      } else if (code === 'digit6' || key === '6') {
        selectControlledUnit('player_artillery');
      } else if (code === 'f1') {
        e.preventDefault();
        changeFormation('fishScale');
      } else if (code === 'f2') {
        e.preventDefault();
        changeFormation('craneWing');
      } else if (code === 'f3') {
        e.preventDefault();
        changeFormation('circular');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code ? e.code.toLowerCase() : '';
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'keyw' || code === 'arrowup' || key === 'w' || key === 'arrowup') {
        keysRef.current['up'] = false;
      }
      if (code === 'keys' || code === 'arrowdown' || key === 's' || key === 'arrowdown') {
        keysRef.current['down'] = false;
      }
      if (code === 'keya' || code === 'arrowleft' || key === 'a' || key === 'arrowleft') {
        keysRef.current['left'] = false;
      }
      if (code === 'keyd' || code === 'arrowright' || key === 'd' || key === 'arrowright') {
        keysRef.current['right'] = false;
      }
    };

    const handleBlur = () => {
      keysRef.current = {};
      virtualDpadRef.current = { up: false, down: false, left: false, right: false };
      dragStateRef.current.isDragging = false;
    };

    const handleGlobalMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        handleCanvasMouseUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [changeFormation, targetProvince.id, triggerPlayerAttack, triggerPlayerDash, triggerPlayerSkill, playerClan.name, handleStartBattle]);

  // Main 60FPS RAF Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frameCount = 0;

    const gameLoop = () => {
      frameCount++;

      // 1. Clear battlefield canvas
      ctx.fillStyle = '#221e1b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dirt field & terrain
      ctx.fillStyle = '#171412';
      ctx.fillRect(0, 0, 700, canvas.height);

      // Castle Wall & Ramparts
      ctx.fillStyle = '#3f3a36';
      ctx.fillRect(690, 0, 35, canvas.height);

      // Gate Opening or Doors
      const gate = gateRef.current;
      if (!gate.broken) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(690, 220, 35, 120);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(690, 220, 35, 120);

        // Gate HP bar
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(675, 205, 65, 5);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(675, 205, 65 * Math.max(0, gate.hp / gate.maxHp), 5);
      } else {
        ctx.fillStyle = '#221e1b';
        ctx.fillRect(690, 220, 35, 120);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(695, 230, 15, 20);
        ctx.fillRect(705, 310, 18, 25);
      }

      // Castle Watchtower / 櫓
      ctx.fillStyle = '#524d47';
      ctx.fillRect(680, 70, 55, 55);
      ctx.fillRect(680, 440, 55, 55);
      ctx.fillStyle = '#d97706';
      ctx.font = '10px serif';
      ctx.fillText('城角櫓', 690, 102);
      ctx.fillText('城角櫓', 690, 472);

      // Directional inputs
      let dx = 0;
      let dy = 0;

      if (keysRef.current['up']) dy -= 1;
      if (keysRef.current['down']) dy += 1;
      if (keysRef.current['left']) dx -= 1;
      if (keysRef.current['right']) dx += 1;

      if (virtualDpadRef.current.up) dy -= 1;
      if (virtualDpadRef.current.down) dy += 1;
      if (virtualDpadRef.current.left) dx -= 1;
      if (virtualDpadRef.current.right) dx += 1;

      const inputLen = Math.hypot(dx, dy);
      const activeUnitId = selectedControlIdRef.current;
      const isDeployment = battlePhaseRef.current === 'deployment';

      // Draw Deployment Zone Boundary Line during Pre-Battle Deployment
      if (isDeployment) {
        ctx.save();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(560, 0);
        ctx.lineTo(560, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px serif';
        ctx.textAlign = 'right';
        ctx.fillText('◄ 我軍出陣布署區 (拖曳各兵種排陣)', 545, 24);
        ctx.restore();
      }

      // 2. Player General Movement Logic
      const p = playerRef.current;
      if (p.alive && !isFinishedRef.current) {
        if (activeUnitId === 'general') {
          if (inputLen > 0) {
            targetMovePosRef.current = null;
            const speed = 3.6;
            p.x += (dx / inputLen) * speed;
            p.y += (dy / inputLen) * speed;
            p.angle = Math.atan2(dy, dx);
          } else if (targetMovePosRef.current) {
            const target = targetMovePosRef.current;
            const toDist = Math.hypot(target.x - p.x, target.y - p.y);
            if (toDist > 8) {
              const speed = 3.6;
              p.x += ((target.x - p.x) / toDist) * speed;
              p.y += ((target.y - p.y) / toDist) * speed;
              p.angle = Math.atan2(target.y - p.y, target.x - p.x);
            } else {
              targetMovePosRef.current = null;
            }
          }
        }

        // Gate collision
        if (!gate.broken && p.x > 675 && p.x < 725 && p.y > 210 && p.y < 350) {
          p.x = 675;
        }

        p.x = Math.max(25, Math.min(canvas.width - 25, p.x));
        p.y = Math.max(25, Math.min(canvas.height - 25, p.y));

        if (p.slashCooldown > 0) p.slashCooldown--;
        if (p.slashEffect > 0) p.slashEffect--;
        if (p.skillCooldown > 0) p.skillCooldown--;
        if (p.dashCooldown > 0) p.dashCooldown--;
        if (p.invincibleTimer > 0) p.invincibleTimer--;
      }

      // If activeUnitId is an individual player troop card, move that specific card exclusively!
      if (activeUnitId !== 'general') {
        const activeCard = cardsRef.current.find((c) => c.id === activeUnitId);
        if (activeCard && activeCard.count > 0) {
          if (inputLen > 0) {
            targetMovePosRef.current = null;
            const cardSpeed = activeCard.speed * 1.8;
            activeCard.x += (dx / inputLen) * cardSpeed;
            activeCard.y += (dy / inputLen) * cardSpeed;
            activeCard.formationOffset = {
              offsetX: activeCard.x - p.x,
              offsetY: activeCard.y - p.y,
            };
            activeCard.customDestination = null;
            activeCard.targetEntity = null;
          } else if (targetMovePosRef.current) {
            const target = targetMovePosRef.current;
            const toDist = Math.hypot(target.x - activeCard.x, target.y - activeCard.y);
            if (toDist > 8) {
              const cardSpeed = activeCard.speed * 1.8;
              activeCard.x += ((target.x - activeCard.x) / toDist) * cardSpeed;
              activeCard.y += ((target.y - activeCard.y) / toDist) * cardSpeed;
              activeCard.formationOffset = {
                offsetX: activeCard.x - p.x,
                offsetY: activeCard.y - p.y,
              };
            } else {
              targetMovePosRef.current = null;
              activeCard.customDestination = null;
            }
          }
          activeCard.x = Math.max(25, Math.min(canvas.width - 30, activeCard.x));
          activeCard.y = Math.max(25, Math.min(canvas.height - 30, activeCard.y));
        }
      }

      // 3. Draw Click-to-Move Target Destination
      if (targetMovePosRef.current) {
        ctx.beginPath();
        ctx.arc(targetMovePosRef.current.x, targetMovePosRef.current.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 4. Draw Player General
      if (p.alive) {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Highlight ring if General is currently under exclusive player control
        if (activeUnitId === 'general') {
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px serif';
          ctx.textAlign = 'center';
          ctx.fillText('★主控中', 0, -30);
        }

        if (p.invincibleTimer > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = playerClan.color;
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(playerGeneral.name.slice(0, 1), 0, 0);

        if (p.slashEffect > 0) {
          ctx.beginPath();
          ctx.arc(0, 0, 48, -0.6, 0.6);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 5;
          ctx.stroke();
        }
        ctx.restore();

        // Player HP bar
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(p.x - 20, p.y - 24, 40, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x - 20, p.y - 24, 40 * Math.max(0, p.hp / p.maxHp), 4);
      }

      // 5. Update & Draw Enemy General
      const eg = enemyGenRef.current;
      if (eg.alive) {
        if (!isDeployment && (gate.broken || p.x > 670)) {
          const egDist = Math.hypot(p.x - eg.x, p.y - eg.y);
          if (egDist > 40) {
            eg.x += ((p.x - eg.x) / egDist) * 1.4;
            eg.y += ((p.y - eg.y) / egDist) * 1.4;
          } else {
            eg.attackTimer++;
            if (eg.attackTimer > 45) {
              eg.attackTimer = 0;
              if (p.invincibleTimer <= 0) {
                const dmg = 30 + Math.floor(Math.random() * 15);
                p.hp = Math.max(0, p.hp - dmg);
                spawnDamageNumber(p.x, p.y - 15, `-${dmg}`, '#ef4444');
                sound.playSwordSlash();
                if (p.hp <= 0 && p.alive) {
                  p.alive = false;
                  isFinishedRef.current = true;
                  setBattleResult('defeat');
                  sound.playTaiko();
                }
              }
            }
          }
        }

        ctx.save();
        ctx.translate(eg.x, eg.y);
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#7f1d1d';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('敵', 0, 0);
        ctx.restore();

        ctx.fillStyle = '#450a0a';
        ctx.fillRect(eg.x - 22, eg.y - 25, 44, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(eg.x - 22, eg.y - 25, 44 * Math.max(0, eg.hp / eg.maxHp), 4);
      }

      // 6. Update Troop Cards on Battlefield
      const currentCmd = commandRef.current;
      const cards = cardsRef.current;

      cards.forEach((card) => {
        if (card.count <= 0) return;

        if (card.isPlayer) {
          // Movement relative to General, Dragged Custom Position, or Dragged Engagement Target
          let targetX = p.x + card.formationOffset.offsetX;
          let targetY = p.y + card.formationOffset.offsetY;

          // Priority 1: Direct Engagement command via dragging
          if (card.targetEntity) {
            if (card.targetEntity.type === 'enemy_card') {
              const en = cards.find((c) => c.id === card.targetEntity?.targetId);
              if (en && en.count > 0) {
                targetX = en.x - (card.range > 80 ? 120 : 30);
                targetY = en.y;
              } else {
                card.targetEntity = null; // Enemy destroyed
              }
            } else if (card.targetEntity.type === 'enemy_general') {
              if (eg.alive) {
                targetX = eg.x - (card.range > 80 ? 130 : 35);
                targetY = eg.y;
              } else {
                card.targetEntity = null;
              }
            } else if (card.targetEntity.type === 'gate') {
              if (!gate.broken) {
                targetX = gate.x - 35;
                targetY = gate.y + card.formationOffset.offsetY * 0.4;
              } else {
                card.targetEntity = null;
              }
            }
          } else if (card.customDestination) {
            // Priority 2: Custom dragged position / frontline waypoint
            targetX = card.customDestination.x;
            targetY = card.customDestination.y;
            const destDist = Math.hypot(card.customDestination.x - card.x, card.customDestination.y - card.y);
            if (destDist < 12) {
              // Arrived at custom waypoint! Re-lock offset so as General walks, army stays in custom formation
              card.formationOffset = {
                offsetX: card.x - p.x,
                offsetY: card.y - p.y,
              };
              card.customDestination = null;
              card.status = '固守';
            }
          } else if (currentCmd === 'charge' || card.status === '衝鋒') {
            // Target closest enemy card or gate
            let closestEnemy: TroopCard | null = null;
            let minDist = 9999;
            cards.forEach((en) => {
              if (!en.isPlayer && en.count > 0) {
                const d = Math.hypot(en.x - card.x, en.y - card.y);
                if (d < minDist) {
                  minDist = d;
                  closestEnemy = en;
                }
              }
            });

            if (closestEnemy && minDist < 650) {
              targetX = (closestEnemy as TroopCard).x - (card.range > 80 ? 120 : 25);
              targetY = (closestEnemy as TroopCard).y;
            } else if (!gate.broken) {
              targetX = gate.x - 30;
              targetY = gate.y + card.formationOffset.offsetY * 0.5;
            } else {
              targetX = eg.alive ? eg.x : 850;
              targetY = eg.alive ? eg.y : 280;
            }
          }

          const dist = Math.hypot(targetX - card.x, targetY - card.y);
          // Only march automatically when not in deployment phase (or if user manually ordered/dragged)
          if ((!isDeployment || card.customDestination || card.targetEntity) && dist > 12) {
            const moveSpeed = card.targetEntity ? card.speed * 1.3 : card.speed;
            card.x += ((targetX - card.x) / dist) * moveSpeed;
            card.y += ((targetY - card.y) / dist) * moveSpeed;
          }

          // Combat interactions (Only when battle is active)
          if (!isDeployment) {
            card.attackCooldown++;
            if (card.attackCooldown > 45) {
              // Attack designated enemy general
              if (card.targetEntity?.type === 'enemy_general' && eg.alive && Math.hypot(card.x - eg.x, card.y - eg.y) < card.range + 20) {
                card.attackCooldown = 0;
                const dmg = Math.floor(card.attack * 0.9);
                eg.hp = Math.max(0, eg.hp - dmg);
                spawnDamageNumber(eg.x, eg.y - 20, `-${dmg}`, '#ef4444');
                spawnSparks(eg.x, eg.y, '#ef4444', 4);
                if (eg.hp <= 0 && eg.alive) {
                  eg.alive = false;
                  isFinishedRef.current = true;
                  sound.playFanfare();
                  killCountRef.current++;
                  setCapturedGeneral(enemyGeneral);
                  setBattleResult('victory');
                  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
                }
              } else if (!gate.broken && Math.hypot(card.x - gate.x, card.y - gate.y) < 65) {
                // Check gate attack
                card.attackCooldown = 0;
                gate.hp -= card.attack;
                spawnSparks(gate.x, gate.y, '#f59e0b', 3);
                if (gate.hp <= 0) {
                  gate.broken = true;
                  sound.playTaiko(1.2);
                }
              } else {
                // Attack enemy card
                for (let j = 0; j < cards.length; j++) {
                  const en = cards[j];
                  if (!en.isPlayer && en.count > 0 && Math.hypot(en.x - card.x, en.y - card.y) < card.range) {
                    card.attackCooldown = 0;
                    const casualties = Math.floor((card.attack * (card.morale / 100)) / 1.5);
                    en.count = Math.max(0, en.count - casualties);
                    en.morale = Math.max(0, en.morale - 5);
                    spawnDamageNumber(en.x, en.y - 15, `-${casualties}兵`, '#fbbf24');
                    spawnSparks(en.x, en.y, '#ef4444', 3);
                    if (en.count <= 0) killCountRef.current += 100;
                    break;
                  }
                }
              }
            }

            // Arquebus & Artillery projectile volley
            if (card.type === 'arquebus' && card.attackCooldown > 90) {
              card.attackCooldown = 0;
              if (projectilesRef.current.length < 35) {
                projectilesRef.current.push({
                  x: card.x + 15,
                  y: card.y,
                  vx: 7.5,
                  vy: (Math.random() - 0.5) * 1.5,
                  isPlayer: true,
                  damage: card.attack,
                  isBullet: true,
                  lifetime: 70,
                });
                sound.playGunshot();
              }
            }
          }
        } else {
          // Enemy Card Movement & Attack (Only active when battle begins)
          if (!isDeployment) {
            let targetX = p.x;
            let targetY = p.y;
            let minDist = Math.hypot(p.x - card.x, p.y - card.y);

            // Vanguard units (cavalry, spear) actively sally out into the field to clash
            if (gate.broken || card.x < 685 || card.type === 'cavalry' || card.type === 'spear') {
              cards.forEach((al) => {
                if (al.isPlayer && al.count > 0) {
                  const d = Math.hypot(al.x - card.x, al.y - card.y);
                  if (d < minDist) {
                    minDist = d;
                    targetX = al.x;
                    targetY = al.y;
                  }
                }
              });

              if (minDist > 30) {
                card.x += ((targetX - card.x) / minDist) * card.speed;
                card.y += ((targetY - card.y) / minDist) * card.speed;
              } else {
                card.attackCooldown++;
                if (card.attackCooldown > 45) {
                  card.attackCooldown = 0;
                  // Attack player
                  if (minDist < 35 && targetX === p.x && p.invincibleTimer <= 0) {
                    p.hp = Math.max(0, p.hp - card.attack);
                    spawnDamageNumber(p.x, p.y - 10, `-${card.attack}`, '#ef4444');
                  } else {
                    // Attack player card
                    for (let k = 0; k < cards.length; k++) {
                      const al = cards[k];
                      if (al.isPlayer && al.count > 0 && Math.hypot(al.x - card.x, al.y - card.y) < card.range) {
                        const casualties = Math.floor(card.attack / 1.6);
                        al.count = Math.max(0, al.count - casualties);
                        al.morale = Math.max(0, al.morale - 4);
                        spawnDamageNumber(al.x, al.y - 15, `-${casualties}兵`, '#ef4444');
                        if (al.morale < 30) al.status = '動搖';
                        break;
                      }
                    }
                  }
                }
              }
            }

            // Enemy Archer Shoot
            if (card.type === 'archer') {
              card.attackCooldown++;
              if (card.attackCooldown > 85) {
                card.attackCooldown = 0;
                if (projectilesRef.current.length < 35) {
                  projectilesRef.current.push({
                    x: card.x - 12,
                    y: card.y,
                    vx: -6,
                    vy: (Math.random() - 0.5) * 1.8,
                    isPlayer: false,
                    damage: card.attack,
                    isBullet: false,
                    lifetime: 75,
                  });
                }
              }
            }
          }
        }

        // ==========================================
        // DRAW BATTLEFIELD TROOP CARD & SASHIMONO BANNER
        // ==========================================
        ctx.save();
        ctx.translate(card.x, card.y);

        // Highlight ring if this card is currently under exclusive player control
        if (card.isPlayer && activeUnitId === card.id) {
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px serif';
          ctx.textAlign = 'center';
          ctx.fillText('★主控中', 0, -42);
        }

        // 1. Draw mini soldier squad formation around card center
        const squadPositions = [
          { dx: -12, dy: -8 },
          { dx: 12, dy: -8 },
          { dx: -14, dy: 8 },
          { dx: 14, dy: 8 },
          { dx: 0, dy: 10 },
        ];
        squadPositions.forEach((pos) => {
          ctx.beginPath();
          ctx.arc(pos.dx, pos.dy, card.type === 'cavalry' ? 4 : 3, 0, Math.PI * 2);
          ctx.fillStyle = card.color;
          ctx.fill();
        });

        // 2. Draw Overhead Card Sashimono / Badge
        const isFieldLowMorale = card.isPlayer && card.morale / card.maxMorale < 0.3;
        // Card Background Box
        ctx.fillStyle = 'rgba(24, 20, 18, 0.92)';
        ctx.strokeStyle = isFieldLowMorale ? '#ef4444' : card.isPlayer ? '#fbbf24' : '#ef4444';
        ctx.lineWidth = isFieldLowMorale ? 2 : 1.5;
        ctx.beginPath();
        ctx.roundRect(-24, -36, 48, 22, 4);
        ctx.fill();
        ctx.stroke();

        // Unit Kanji & Mon
        ctx.fillStyle = isFieldLowMorale ? '#fca5a5' : card.accentColor;
        ctx.font = 'bold 9px serif';
        ctx.textAlign = 'left';
        ctx.fillText(card.kanji, -20, -23);

        // Headcount (數量)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${card.count}`, 20, -23);

        // Morale Bar (士氣條)
        const moralePct = Math.max(0, card.morale / card.maxMorale);
        ctx.fillStyle = '#44403c';
        ctx.fillRect(-22, -18, 44, 2.5);
        if (isFieldLowMorale) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-22, -18, 44 * moralePct, 2.5);
          // Overhead warning
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 8px serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚠動搖', 0, -42);
        } else {
          ctx.fillStyle = moralePct > 0.7 ? '#22c55e' : moralePct > 0.35 ? '#f59e0b' : '#ef4444';
          ctx.fillRect(-22, -18, 44 * moralePct, 2.5);
        }

        ctx.restore();
      });

      // 7. Update Projectiles
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const pr = projectilesRef.current[i];
        pr.x += pr.vx;
        pr.y += pr.vy;
        pr.lifetime--;

        ctx.beginPath();
        if (pr.isBullet) {
          ctx.arc(pr.x, pr.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
        } else {
          ctx.moveTo(pr.x, pr.y);
          ctx.lineTo(pr.x - pr.vx * 1.8, pr.y - pr.vy * 1.8);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }

        if (pr.isPlayer) {
          cards.forEach((c) => {
            if (!c.isPlayer && c.count > 0 && Math.hypot(pr.x - c.x, pr.y - c.y) < 22) {
              const casualties = 18;
              c.count = Math.max(0, c.count - casualties);
              c.morale = Math.max(0, c.morale - 4);
              spawnDamageNumber(c.x, c.y - 10, `-${casualties}兵`, '#fbbf24');
              pr.lifetime = 0;
              if (c.count <= 0) killCountRef.current += 100;
            }
          });
          if (eg.alive && Math.hypot(pr.x - eg.x, pr.y - eg.y) < 18) {
            eg.hp -= pr.damage;
            spawnDamageNumber(eg.x, eg.y - 15, `-${pr.damage}`, '#ef4444');
            pr.lifetime = 0;
            if (eg.hp <= 0 && eg.alive) {
              eg.alive = false;
              isFinishedRef.current = true;
              sound.playFanfare();
              killCountRef.current++;
              setCapturedGeneral(enemyGeneral);
              setBattleResult('victory');
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
          }
        } else {
          // Hits player
          if (p.invincibleTimer <= 0 && Math.hypot(pr.x - p.x, pr.y - p.y) < 16) {
            p.hp = Math.max(0, p.hp - pr.damage);
            spawnDamageNumber(p.x, p.y - 10, `-${pr.damage}`, '#ef4444');
            pr.lifetime = 0;
            if (p.hp <= 0 && p.alive) {
              p.alive = false;
              isFinishedRef.current = true;
              setBattleResult('defeat');
            }
          }
        }

        if (pr.lifetime <= 0) projectilesRef.current.splice(i, 1);
      }

      // 8. Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, pt.size * (pt.life / pt.maxLife)), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
        if (pt.life <= 0) particlesRef.current.splice(i, 1);
      }

      // 9. Update Damage Numbers
      for (let i = damageNumsRef.current.length - 1; i >= 0; i--) {
        const dn = damageNumsRef.current[i];
        dn.y -= 0.7;
        dn.life--;
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = dn.color;
        ctx.fillText(dn.text, dn.x, dn.y);
        if (dn.life <= 0) damageNumsRef.current.splice(i, 1);
      }

      // 10. Draw Active Engagement Lines & Custom Waypoint Markers
      cards.forEach((card) => {
        if (card.isPlayer && card.count > 0) {
          // If locked onto target entity
          if (card.targetEntity) {
            let tx = card.x + 50;
            let ty = card.y;
            if (card.targetEntity.type === 'enemy_card') {
              const en = cards.find((c) => c.id === card.targetEntity?.targetId);
              if (en && en.count > 0) {
                tx = en.x;
                ty = en.y;
              }
            } else if (card.targetEntity.type === 'enemy_general') {
              tx = eg.x;
              ty = eg.y;
            } else if (card.targetEntity.type === 'gate') {
              tx = gate.x;
              ty = gate.y;
            }

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(card.x, card.y);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw small sword battle indicator at target
            ctx.font = '10px serif';
            ctx.fillStyle = '#fca5a5';
            ctx.fillText('⚔', tx - 4, ty - 16);
            ctx.restore();
          }

          // If marching to custom waypoint
          if (card.customDestination) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(card.customDestination.x, card.customDestination.y, 9, 0, Math.PI * 2);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(card.x, card.y);
            ctx.lineTo(card.customDestination.x, card.customDestination.y);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 9px serif';
            ctx.fillText('陣', card.customDestination.x - 4, card.customDestination.y + 3);
            ctx.restore();
          }
        }
      });

      // 11. Draw Interactive Mouse Dragging Overlays
      const ds = dragStateRef.current;
      if (ds.isDragging) {
        if (ds.dragType === 'card' && ds.cardId) {
          const card = cards.find((c) => c.id === ds.cardId);
          if (card) {
            const isTargetingEnemy = ds.hoverTarget && ds.hoverTarget.type !== 'ground';

            ctx.save();
            // Trajectory Line
            ctx.beginPath();
            ctx.moveTo(card.x, card.y);
            ctx.lineTo(ds.currentX, ds.currentY);
            ctx.strokeStyle = isTargetingEnemy ? '#ef4444' : '#38bdf8';
            ctx.lineWidth = isTargetingEnemy ? 3 : 2;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow head
            const angle = Math.atan2(ds.currentY - card.y, ds.currentX - card.x);
            ctx.beginPath();
            ctx.moveTo(ds.currentX, ds.currentY);
            ctx.lineTo(
              ds.currentX - 14 * Math.cos(angle - Math.PI / 6),
              ds.currentY - 14 * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              ds.currentX - 14 * Math.cos(angle + Math.PI / 6),
              ds.currentY - 14 * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = isTargetingEnemy ? '#ef4444' : '#38bdf8';
            ctx.fill();

            // Hover indicator
            if (isTargetingEnemy && ds.hoverTarget) {
              // Enemy reticle
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(ds.hoverTarget.x, ds.hoverTarget.y, 28, 0, Math.PI * 2);
              ctx.stroke();

              // Crosshair ticks
              ctx.beginPath();
              ctx.moveTo(ds.hoverTarget.x - 34, ds.hoverTarget.y);
              ctx.lineTo(ds.hoverTarget.x + 34, ds.hoverTarget.y);
              ctx.moveTo(ds.hoverTarget.x, ds.hoverTarget.y - 34);
              ctx.lineTo(ds.hoverTarget.x, ds.hoverTarget.y + 34);
              ctx.stroke();

              // Label banner
              ctx.fillStyle = 'rgba(20, 15, 13, 0.9)';
              ctx.fillRect(ds.currentX + 12, ds.currentY - 28, 160, 24);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 1;
              ctx.strokeRect(ds.currentX + 12, ds.currentY - 28, 160, 24);

              ctx.fillStyle = '#fca5a5';
              ctx.font = 'bold 11px serif';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(`⚔ 突擊指令: ${ds.hoverTarget.name.slice(0, 8)}`, ds.currentX + 18, ds.currentY - 16);
            } else {
              // Ground waypoint
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(ds.currentX, ds.currentY, 16, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = 'rgba(20, 15, 13, 0.9)';
              ctx.fillRect(ds.currentX + 12, ds.currentY - 28, 160, 24);
              ctx.strokeStyle = isDeployment ? '#fbbf24' : '#38bdf8';
              ctx.lineWidth = 1;
              ctx.strokeRect(ds.currentX + 12, ds.currentY - 28, 160, 24);

              ctx.fillStyle = isDeployment ? '#fef08a' : '#7dd3fc';
              ctx.font = 'bold 11px serif';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(
                isDeployment ? `📍 【拖曳兵種排陣】放開就位` : `📍 移防擺陣: 移至此位`,
                ds.currentX + 18,
                ds.currentY - 16
              );
            }
            ctx.restore();
          }
        } else if (ds.dragType === 'general') {
          ctx.save();
          const p = playerRef.current;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(ds.currentX, ds.currentY);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Halo at cursor
          ctx.beginPath();
          ctx.arc(ds.currentX, ds.currentY, 22, 0, Math.PI * 2);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Label
          const labelText = isDeployment ? '👑 【拖曳大將】帶動全軍移陣' : '👑 【大將出陣】移往目標位置';
          ctx.fillStyle = 'rgba(20, 15, 13, 0.9)';
          ctx.fillRect(ds.currentX + 12, ds.currentY - 28, 175, 24);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          ctx.strokeRect(ds.currentX + 12, ds.currentY - 28, 175, 24);

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 11px serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, ds.currentX + 18, ds.currentY - 16);
          ctx.restore();
        } else if (ds.dragType === 'formation_line') {
          const dragDist = Math.hypot(ds.currentX - ds.startX, ds.currentY - ds.startY);
          if (dragDist > 20) {
            ctx.save();
            // Grand tactical frontline
            ctx.beginPath();
            ctx.moveTo(ds.startX, ds.startY);
            ctx.lineTo(ds.currentX, ds.currentY);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Regiment nodes along frontline
            const playerCards = cards.filter((c) => c.isPlayer && c.count > 0);
            playerCards.forEach((card, idx) => {
              const t = playerCards.length === 1 ? 0.5 : idx / (playerCards.length - 1);
              const px = ds.startX + (ds.currentX - ds.startX) * t;
              const py = ds.startY + (ds.currentY - ds.startY) * t;

              ctx.beginPath();
              ctx.arc(px, py, 11, 0, Math.PI * 2);
              ctx.fillStyle = card.color;
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 10px serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(card.kanji, px, py);
            });

            // Banner label
            const midX = (ds.startX + ds.currentX) / 2;
            const midY = Math.min(ds.startY, ds.currentY) - 20;
            ctx.fillStyle = 'rgba(20, 15, 13, 0.9)';
            ctx.fillRect(midX - 110, midY - 14, 220, 24);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1;
            ctx.strokeRect(midX - 110, midY - 14, 220, 24);

            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 11px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              isDeployment ? '⚔ 【拖曳戰線·全軍排陣】放開立即列陣' : '⚔ 【拖曳戰線·全軍推進】放開列陣',
              midX,
              midY - 2
            );

            ctx.restore();
          }
        }
      }

      // Throttled HUD and Cards update (8 frames)
      if (frameCount % 8 === 0) {
        setPlayerHpDisplay(p.hp);
        setEnemyGeneralHpDisplay(eg.hp);
        setGateHpDisplay(gate.hp);
        setSkillCdDisplay(Math.ceil(p.skillCooldown / 60));
        setDashCdDisplay(Math.ceil(p.dashCooldown / 60));
        setKillCountDisplay(killCountRef.current);
        setPlayerCardsDisplay([...cards.filter((c) => c.isPlayer)]);
        setEnemyCardsDisplay([...cards.filter((c) => !c.isPlayer)]);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [enemyGeneral, playerClan.color, playerGeneral.name]);

  // Low Morale Detection for dynamic UI effects, card shaking & screen edge debuff alert
  const lowMoraleCards = playerCardsDisplay.filter((c) => c.count > 0 && c.morale / c.maxMorale < 0.3);
  const hasLowMorale = lowMoraleCards.length > 0 && battlePhase === 'battle';

  return (
    <div className="relative w-full h-[calc(100vh-125px)] min-h-[620px] bg-stone-950 flex flex-col select-none overflow-hidden">
      {/* Interface Edge Danger Vignette Alert (士氣低於30%時界面邊緣負面提示) */}
      {hasLowMorale && (
        <div className="pointer-events-none absolute inset-0 z-30 ring-4 sm:ring-8 ring-inset ring-red-600/40 animate-edge-danger shadow-[inset_0_0_90px_rgba(220,38,38,0.4)]" />
      )}

      {/* Screen Top Docked Debuff Alert (優雅置頂提醒，不遮擋戰場與操作按鈕) */}
      {hasLowMorale && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-35 max-w-xl w-[94%] sm:w-auto animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto">
          <div className="bg-stone-950/95 border-2 border-red-600 rounded-xl px-3 py-1.5 shadow-[0_0_30px_rgba(239,68,68,0.6)] backdrop-blur flex items-center justify-between gap-3 text-stone-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce shrink-0" />
              <div className="text-[11px] font-serif leading-tight">
                <span className="text-red-300 font-bold">【軍心動搖 DEBUFF】</span>
                <span className="text-stone-300 hidden sm:inline ml-1">動搖部隊攻防 -40%！點選切換直控救援：</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {lowMoraleCards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectControlledUnit(c.id)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-red-900/90 hover:bg-red-800 border border-red-500 text-red-100 font-serif font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer shadow"
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-yellow-300 animate-pulse" />
                  <span>{c.kanji}隊</span>
                  <span className="text-yellow-300 font-mono">({Math.round((c.morale / c.maxMorale) * 100)}%)</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top HUD: Generals Duel & Enemy Army Cards Status */}
      <div className="z-10 bg-stone-900/95 border-b border-amber-950/80 px-4 py-2 flex items-center justify-between gap-3 text-stone-200 backdrop-blur">
        {/* Player General HP */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full border-2 border-amber-400 bg-stone-800 flex items-center justify-center font-serif font-bold text-amber-200 shadow">
            {playerGeneral.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-amber-200">
              <span>{playerGeneral.name}</span>
              <span className="text-[10px] text-amber-400/80 px-1 rounded bg-amber-950/60 border border-amber-800">
                己方總大將
              </span>
            </div>
            <div className="w-28 sm:w-40 h-2 bg-stone-950 rounded-full border border-stone-800 overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-150"
                style={{ width: `${Math.max(0, (playerHpDisplay / 500) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Enemy Garrison Cards Status (數量與士氣) */}
        <div className="hidden lg:flex items-center gap-2 bg-stone-950/80 border border-red-950/60 rounded-xl px-3 py-1">
          <span className="text-[10px] text-red-400 font-serif font-bold mr-1">敵軍守備部隊:</span>
          {enemyCardsDisplay.map((ec) => (
            <div key={ec.id} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-stone-900 border border-stone-800">
              <span className="text-red-300 font-serif">{ec.kanji}</span>
              <span className="font-mono text-stone-200 font-bold">{ec.count}兵</span>
              <span className="text-amber-400 font-mono">士氣{ec.morale}</span>
            </div>
          ))}
        </div>

        {/* Enemy General HP */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end text-xs font-serif font-bold text-red-300">
              <span className="text-[10px] text-red-400/80 px-1 rounded bg-red-950/60 border border-red-800">
                敵方守將
              </span>
              <span>{enemyGeneral.name}</span>
            </div>
            <div className="w-28 sm:w-40 h-2 bg-stone-950 rounded-full border border-stone-800 overflow-hidden mt-1">
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-150"
                style={{ width: `${Math.max(0, (enemyGeneralHpDisplay / 600) * 100)}%` }}
              />
            </div>
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-red-500 bg-stone-800 flex items-center justify-center font-serif font-bold text-red-200 shadow">
            {enemyGeneral.name.slice(0, 1)}
          </div>
        </div>
      </div>

      {/* Pre-Battle Deployment Banner or In-Combat Tactical Bar */}
      {battlePhase === 'deployment' ? (
        <div className="z-20 bg-gradient-to-r from-amber-950/95 via-[#1a1410] to-amber-950/95 border-b-2 border-amber-500/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div>
              <div className="font-serif font-black text-amber-300 text-sm tracking-wider flex items-center gap-2">
                <span>【合戰前夕 · 排兵布陣】</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-amber-900/80 border border-amber-600 text-amber-200">
                  尚未開戰 · 戰場時間凍結
                </span>
              </div>
              <p className="text-[11px] text-stone-300 font-serif mt-0.5 hidden sm:block">
                🖱️ <strong className="text-amber-300 font-bold">操作提示：</strong>
                按住兵種或大將可直接拖曳擺陣；在空地按住拖曳可劃出全軍戰線；亦可點選下方卡牌直接切換主控！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Formation Presets */}
            <div className="hidden md:flex items-center gap-1 bg-stone-950/80 p-1 rounded-lg border border-stone-800">
              <span className="text-[10px] text-stone-400 font-serif px-1">陣形預設:</span>
              {FORMATIONS_DATA.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => changeFormation(f.id)}
                  className={`px-2 py-0.5 text-[11px] rounded font-serif transition cursor-pointer ${
                    formation === f.id
                      ? 'bg-amber-600 text-stone-950 font-bold shadow'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {f.kanji}
                </button>
              ))}
            </div>

            {/* BIG PROMINENT START BATTLE BUTTON */}
            <button
              type="button"
              onClick={handleStartBattle}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 text-stone-950 font-serif font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.85)] border-2 border-amber-200 flex items-center gap-2 cursor-pointer transition transform active:scale-95 animate-pulse"
              title="陣形調整完畢，開始合戰！(亦可按 Enter 或空白鍵)"
            >
              <Swords className="w-4 h-4 text-stone-950" />
              <span>開戰號令 · 擊鼓出征</span>
              <span className="hidden sm:inline text-[10px] bg-stone-950/20 px-1.5 py-0.5 rounded font-mono font-bold">
                [Enter]
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="z-10 bg-amber-950/40 border-b border-amber-900/40 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-amber-200 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-serif font-bold text-amber-300">
              ⚔ 實時合戰交鋒中：
            </span>
            <span className="text-stone-300 text-[11px] hidden sm:inline">
              點擊下方卡牌即「專注操控該兵種」；拖曳卡牌或在空地劃線可即時變陣突擊！
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeFormation(formation)}
              className="px-2.5 py-0.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-800/80 text-[11px] text-amber-300 font-serif transition shadow cursor-pointer"
              title="復原為當前武將預設軍陣"
            >
              復原軍陣
            </button>
            <button
              type="button"
              onClick={() => changeCommand('charge')}
              className="px-2.5 py-0.5 rounded-lg bg-red-900/80 hover:bg-red-800 border border-red-700 text-[11px] text-red-200 font-serif font-bold transition flex items-center gap-1 shadow cursor-pointer"
              title="全軍發起總突擊"
            >
              <Swords className="w-3 h-3" />
              全軍衝鋒
            </button>
          </div>
        </div>
      )}

      {/* Main Real-Time Battlefield Canvas (Clean, unhindered view) */}
      <div className="relative flex-1 bg-stone-950 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={960}
          height={480}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const cardId = e.dataTransfer.getData('text/plain');
            if (!cardId) return;
            const coords = getCanvasCoords(e.clientX, e.clientY);
            if (!coords) return;
            const card = cardsRef.current.find((c) => c.id === cardId);
            if (card && card.count > 0) {
              const targetX = Math.max(30, Math.min(930, coords.x));
              const targetY = Math.max(30, Math.min(450, coords.y));
              if (battlePhaseRef.current === 'deployment') {
                card.x = Math.min(540, targetX);
                card.y = targetY;
              } else {
                card.customDestination = { x: targetX, y: targetY };
              }
              card.formationOffset = {
                offsetX: card.x - playerRef.current.x,
                offsetY: card.y - playerRef.current.y,
              };
              selectControlledUnit(card.id);
              sound.playTaiko(1.1);
              setBattleLog((prev) => [`【拖曳入陣】${card.name} 已進駐指定戰場陣位！`, ...prev.slice(0, 3)]);
              spawnSparks(targetX, targetY, '#fbbf24', 12);
            }
          }}
          className="w-full h-full max-w-5xl max-h-[480px] cursor-grab active:cursor-grabbing object-contain bg-stone-900 border border-stone-800 shadow-2xl rounded-lg touch-none"
        />

        {/* Minimalist Live Battle Log (Top-Left corner) */}
        <div className="absolute top-3 left-3 max-w-xs pointer-events-none space-y-1 z-10">
          {battleLog.slice(0, 2).map((log, idx) => (
            <div
              key={idx}
              className={`text-[10px] px-2 py-0.5 rounded backdrop-blur-md font-serif transition-opacity duration-300 ${
                idx === 0
                  ? 'bg-stone-950/85 text-amber-300 border border-amber-900/60 shadow'
                  : 'bg-stone-950/50 text-stone-400'
              }`}
            >
              {log}
            </div>
          ))}
        </div>

        {/* Discreet Mini D-Pad (Bottom-Left corner, compact & subtle) */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col items-center bg-stone-950/75 hover:bg-stone-950/90 border border-stone-800/80 rounded-xl p-1 backdrop-blur shadow-md transition opacity-70 hover:opacity-100">
          <button
            onMouseDown={() => (virtualDpadRef.current.up = true)}
            onMouseUp={() => (virtualDpadRef.current.up = false)}
            onMouseLeave={() => (virtualDpadRef.current.up = false)}
            onTouchStart={() => (virtualDpadRef.current.up = true)}
            onTouchEnd={() => (virtualDpadRef.current.up = false)}
            className="w-6 h-6 rounded bg-stone-800 active:bg-amber-600 text-stone-200 flex items-center justify-center transition active:scale-95"
            title="向上移動 [W]"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              onMouseDown={() => (virtualDpadRef.current.left = true)}
              onMouseUp={() => (virtualDpadRef.current.left = false)}
              onMouseLeave={() => (virtualDpadRef.current.left = false)}
              onTouchStart={() => (virtualDpadRef.current.left = true)}
              onTouchEnd={() => (virtualDpadRef.current.left = false)}
              className="w-6 h-6 rounded bg-stone-800 active:bg-amber-600 text-stone-200 flex items-center justify-center transition active:scale-95"
              title="向左移動 [A]"
            >
              <ArrowLeftIcon className="w-3 h-3" />
            </button>
            <button
              onMouseDown={() => (virtualDpadRef.current.down = true)}
              onMouseUp={() => (virtualDpadRef.current.down = false)}
              onMouseLeave={() => (virtualDpadRef.current.down = false)}
              onTouchStart={() => (virtualDpadRef.current.down = true)}
              onTouchEnd={() => (virtualDpadRef.current.down = false)}
              className="w-6 h-6 rounded bg-stone-800 active:bg-amber-600 text-stone-200 flex items-center justify-center transition active:scale-95"
              title="向下移動 [S]"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <button
              onMouseDown={() => (virtualDpadRef.current.right = true)}
              onMouseUp={() => (virtualDpadRef.current.right = false)}
              onMouseLeave={() => (virtualDpadRef.current.right = false)}
              onTouchStart={() => (virtualDpadRef.current.right = true)}
              onTouchEnd={() => (virtualDpadRef.current.right = false)}
              className="w-6 h-6 rounded bg-stone-800 active:bg-amber-600 text-stone-200 flex items-center justify-center transition active:scale-95"
              title="向右移動 [D]"
            >
              <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* UNIFIED COMMAND CONSOLE: 整合式軍團卡牌列與戰術指令區      */}
      {/* ======================================================== */}
      <div className="z-20 bg-[#130f0d] border-t-2 border-amber-950 px-3 py-2 flex flex-col gap-1.5 shadow-2xl">
        {/* Command Console Top Bar */}
        <div className="flex items-center justify-between text-xs font-serif text-stone-400 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-bold text-amber-200">
              戰術指揮卡牌列
            </span>
            <span className="text-[11px] text-stone-400 hidden sm:inline">
              (當前主控: <strong className="text-amber-300 font-bold">{selectedControlId === 'general' ? `👑 ${playerGeneral.name}` : playerCardsDisplay.find((c) => c.id === selectedControlId)?.name || '兵團'}</strong> · [Tab / 數字 1-6] 快速切換)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-stone-400 hidden sm:inline">陣形:</span>
            {FORMATIONS_DATA.map((f, idx) => (
              <button
                key={f.id}
                type="button"
                onClick={() => changeFormation(f.id)}
                className={`px-2 py-0.5 text-[11px] rounded font-serif transition flex items-center gap-1 cursor-pointer ${
                  formation === f.id
                    ? 'bg-amber-600 text-stone-950 font-bold shadow'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800'
                }`}
                title={f.description}
              >
                <span className="opacity-60 text-[9px]">[{idx + 1}]</span>
                <span>{f.kanji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 6 Unit Cards (General + 5 Regiments) + Integrated Action Cluster */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 items-stretch">
          {/* Card 1: Player General (總大將卡牌) */}
          <div
            onClick={() => selectControlledUnit('general')}
            className={`group relative p-2 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-lg ${
              selectedControlId === 'general'
                ? 'bg-gradient-to-b from-amber-950/90 via-[#261d15] to-stone-950 border-2 border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.45)] scale-[1.02]'
                : 'bg-gradient-to-b from-stone-900 via-[#1e1916] to-stone-950 hover:border-amber-400/80 border-amber-900/40 hover:shadow-amber-500/15'
            }`}
          >
            {/* Top: Mon Icon & Title */}
            <div className="flex items-start justify-between gap-1 border-b border-stone-800/80 pb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-5 h-5 rounded-full flex items-center justify-center font-serif font-black text-[10px] shrink-0 border bg-amber-500/20 border-amber-400 text-amber-300">
                  大
                </span>
                <span className="font-serif font-bold text-xs text-amber-200 truncate">
                  {playerGeneral.name}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 border border-amber-800 text-amber-300 font-mono font-bold">
                  [1]
                </span>
                {selectedControlId === 'general' && (
                  <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500 text-stone-950 font-serif font-bold animate-pulse">
                    主控中
                  </span>
                )}
              </div>
            </div>

            {/* Mid: General HP */}
            <div className="space-y-1.5 my-1.5">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                  <span className="text-stone-400 flex items-center gap-1 font-serif">
                    <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                    大將體力:
                  </span>
                  <strong className="text-emerald-300">
                    {playerHpDisplay} <span className="text-[8px] text-stone-500">/500</span>
                  </strong>
                </div>
                <div className="w-full h-1.5 bg-stone-950 rounded-full border border-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                    style={{ width: `${Math.max(0, (playerHpDisplay / 500) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-[9px] text-stone-400 font-serif flex items-center justify-between pt-0.5">
                <span>直屬護衛軍陣</span>
                <span className="text-amber-300 font-bold">親衛總督</span>
              </div>
            </div>

            {/* Bottom Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectControlledUnit('general');
                triggerActiveUnitAttack();
              }}
              className={`w-full py-1 rounded-lg text-stone-300 font-serif font-bold text-[10px] tracking-wider transition flex items-center justify-center gap-1 border active:scale-95 cursor-pointer ${
                selectedControlId === 'general'
                  ? 'bg-amber-600 text-stone-950 border-amber-300 shadow'
                  : 'bg-stone-800 group-hover:bg-amber-600 group-hover:text-stone-950 border-stone-700/80'
              }`}
              title="切換至大將直控 [1]"
            >
              <Swords className="w-2.5 h-2.5" />
              <span>無雙斬擊</span>
            </button>
          </div>

          {/* Cards 2-6: Player Troop Cards (長槍、鐵砲、騎兵、大筒) */}
          {playerCardsDisplay.map((card, idx) => {
            const countPct = Math.max(0, (card.count / card.maxCount) * 100);
            const moralePct = Math.max(0, (card.morale / card.maxMorale) * 100);
            const isCurrentlySelected = selectedControlId === card.id;
            const isLowMorale = moralePct < 30 && card.count > 0;

            return (
              <div
                key={card.id}
                draggable={card.count > 0}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', card.id);
                  e.dataTransfer.effectAllowed = 'move';
                  selectControlledUnit(card.id);
                }}
                onClick={() => selectControlledUnit(card.id)}
                className={`group relative p-2 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-lg ${
                  card.count <= 0
                    ? 'bg-stone-950/80 border-stone-800 opacity-50 pointer-events-none'
                    : isLowMorale
                    ? 'animate-card-shake bg-gradient-to-b from-red-950/90 via-[#260f0d] to-stone-950 border-2 border-red-600 ring-2 ring-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.7)]'
                    : isCurrentlySelected
                    ? 'bg-gradient-to-b from-amber-950/90 via-[#261d15] to-stone-950 border-2 border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.45)] scale-[1.02]'
                    : 'bg-gradient-to-b from-stone-900 via-[#1e1916] to-stone-950 hover:border-amber-400/80 border-amber-900/40 hover:shadow-amber-500/15'
                }`}
              >
                {/* Card Top: Mon Icon & Title */}
                <div className="flex items-start justify-between gap-1 border-b border-stone-800/80 pb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center font-serif font-black text-[10px] shrink-0 border"
                      style={{
                        backgroundColor: `${card.color}35`,
                        borderColor: card.color,
                        color: card.accentColor,
                      }}
                    >
                      {card.kanji}
                    </span>
                    <span className="font-serif font-bold text-xs text-amber-200 truncate">
                      {card.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] px-1 py-0.2 rounded bg-stone-900 border border-stone-800 text-stone-300 font-mono">
                      [{idx + 2}]
                    </span>
                    {isCurrentlySelected && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500 text-stone-950 font-serif font-bold animate-pulse">
                        主控中
                      </span>
                    )}
                    {isLowMorale && (
                      <span className="text-[8px] px-1 py-0.2 rounded bg-red-600 text-stone-100 font-serif font-bold animate-pulse flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5 text-yellow-300" />
                        動搖
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Mid: Quantity (數量) & Morale (士氣) */}
                <div className="space-y-1 my-1.5">
                  {/* Quantity (兵員數量) */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                      <span className="text-stone-400 flex items-center gap-1 font-serif">
                        <Users className="w-2.5 h-2.5 text-emerald-400" />
                        數量:
                      </span>
                      <strong className="text-emerald-300">
                        {card.count} <span className="text-[8px] text-stone-500">/{card.maxCount}</span>
                      </strong>
                    </div>
                    <div className="w-full h-1.5 bg-stone-950 rounded-full border border-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                        style={{ width: `${countPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Morale Bar with Fluid Transition & Shimmer FX */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                      <span className="text-stone-400 flex items-center gap-1 font-serif">
                        <Flame className={`w-2.5 h-2.5 ${isLowMorale ? 'text-red-500 animate-bounce' : moralePct > 50 ? 'text-amber-400' : 'text-amber-600'}`} />
                        <span>士氣:</span>
                      </span>
                      <strong className={isLowMorale ? 'text-red-400 font-bold animate-pulse flex items-center gap-0.5' : moralePct > 50 ? 'text-amber-300' : 'text-amber-500'}>
                        {card.morale} <span className="text-[8px] text-stone-500">/{card.maxMorale}</span>
                      </strong>
                    </div>
                    <div className="w-full h-1.5 bg-stone-950 rounded-full border border-stone-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                          isLowMorale
                            ? 'bg-gradient-to-r from-red-700 via-rose-500 to-red-600 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.85)]'
                            : moralePct > 70
                            ? 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-morale-shimmer shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                            : 'bg-gradient-to-r from-amber-600 to-amber-500'
                        }`}
                        style={{ width: `${moralePct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Tactical Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectControlledUnit(card.id);
                    triggerCardAction(card.id);
                  }}
                  className={`w-full py-1 rounded-lg text-stone-300 font-serif font-bold text-[10px] tracking-wider transition flex items-center justify-center gap-1 border active:scale-95 cursor-pointer ${
                    isLowMorale
                      ? 'bg-red-900/90 hover:bg-red-800 text-stone-100 border-red-500 shadow animate-pulse'
                      : isCurrentlySelected
                      ? 'bg-amber-600 text-stone-950 border-amber-300 shadow'
                      : 'bg-stone-800 group-hover:bg-amber-600 group-hover:text-stone-950 border-stone-700/80'
                  }`}
                  title="點選以獨立操控並施展該兵種特技"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{card.skillName}</span>
                </button>
              </div>
            );
          })}

          {/* Column 7: Tactical Action Console (主控兵種行動區) */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-2 rounded-xl bg-stone-900/90 border border-amber-900/60 shadow-lg flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-1">
              <span className="text-[10px] text-amber-300 font-serif font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                戰術行動
              </span>
              <span className="text-[9px] text-stone-400 font-mono">
                [Space/Q/E]
              </span>
            </div>

            <div className="grid grid-cols-3 lg:grid-cols-1 gap-1.5 flex-1">
              {/* Primary Attack Button */}
              <button
                type="button"
                onClick={triggerActiveUnitAttack}
                className="py-1 px-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-stone-950 font-serif font-bold text-[11px] shadow border border-amber-400 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                title="當前兵種攻擊 [Space / 點擊]"
              >
                <Swords className="w-3.5 h-3.5 text-stone-950" />
                <span>
                  {selectedControlId === 'general'
                    ? '斬擊'
                    : selectedControlId.includes('spear')
                    ? '突刺'
                    : selectedControlId.includes('arquebus')
                    ? '齊射'
                    : selectedControlId.includes('cavalry')
                    ? '騎突'
                    : '轟擊'}
                </span>
                <span className="text-[9px] opacity-75 font-mono hidden lg:inline">[Space]</span>
              </button>

              {/* Special Skill Button */}
              <button
                type="button"
                onClick={triggerActiveUnitSkill}
                disabled={skillCdDisplay > 0}
                className={`py-1 px-2 rounded-lg font-serif font-bold text-[11px] border flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow ${
                  skillCdDisplay > 0
                    ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-amber-100 border-red-400'
                }`}
                title="全軍激勵奧義 [Q]"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{skillCdDisplay > 0 ? `${skillCdDisplay}s` : '奧義'}</span>
                <span className="text-[9px] opacity-75 font-mono hidden lg:inline">[Q]</span>
              </button>

              {/* Dash / Advance Button */}
              <button
                type="button"
                onClick={triggerActiveUnitDash}
                disabled={dashCdDisplay > 0}
                className={`py-1 px-2 rounded-lg font-serif font-bold text-[11px] border flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow ${
                  dashCdDisplay > 0
                    ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                    : 'bg-stone-800 hover:bg-stone-700 text-sky-300 border-sky-400/80'
                }`}
                title="當前部隊疾行突進 [E]"
              >
                <ArrowRightIcon className="w-3.5 h-3.5" />
                <span>{dashCdDisplay > 0 ? `${dashCdDisplay}s` : '疾行'}</span>
                <span className="text-[9px] opacity-75 font-mono hidden lg:inline">[E]</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Battle End Settlement Modal (Victory / Defeat) */}
      {battleResult !== 'playing' && (
        <div className="absolute inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border-2 border-amber-600 rounded-2xl p-6 shadow-2xl text-stone-200">
            {battleResult === 'victory' ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                  <Award className="w-8 h-8 text-amber-300" />
                </div>
                <h2 className="text-2xl font-bold font-serif text-amber-200 tracking-widest">合戰大勝！奪取全境</h2>
                <p className="text-xs text-stone-400 mt-1 font-serif">
                  攻陷【{targetProvince.castleName}】，{targetProvince.name}國領地控制度達成 100%！
                </p>

                {/* Spoils Summary */}
                <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 mt-4 text-left space-y-1.5 text-xs">
                  <div className="text-stone-400 font-serif border-b border-stone-800 pb-1 font-bold text-amber-300">
                    戰利品與戰果結算:
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">繳獲軍費金幣:</span>
                    <strong className="text-amber-300">+4,500 金</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">收繳領地兵糧:</span>
                    <strong className="text-emerald-300">+3,200 石</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">版圖石高增長:</span>
                    <strong className="text-amber-200">+{targetProvince.kokudaka.toLocaleString()} 石</strong>
                  </div>
                </div>

                {/* Captured General Disposal */}
                {capturedGeneral && (
                  <div className="mt-4 bg-red-950/30 border border-red-900/60 rounded-xl p-3 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Skull className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-serif font-bold text-red-200">
                        生擒敵將: 【{capturedGeneral.name}】
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-serif mb-3">
                      敵將戰敗被俘，請大名定奪其生死或招納為麾下重臣！
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-xs font-serif">
                      <button
                        onClick={() => {
                          sound.playClick();
                          onBattleEnd({
                            victory: true,
                            provinceId: targetProvince.id,
                            spoils: { gold: 4500, provisions: 3200, capturedGeneral },
                          });
                        }}
                        className="py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-stone-950 font-bold"
                      >
                        招降任官
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick();
                          onBattleEnd({
                            victory: true,
                            provinceId: targetProvince.id,
                            spoils: { gold: 6500, provisions: 3200 },
                          });
                        }}
                        className="py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold"
                      >
                        贖金釋放 (+金)
                      </button>
                      <button
                        onClick={() => {
                          sound.playSwordSlash();
                          onBattleEnd({
                            victory: true,
                            provinceId: targetProvince.id,
                            spoils: { gold: 4500, provisions: 3200 },
                          });
                        }}
                        className="py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-amber-200 font-bold"
                      >
                        當眾處決
                      </button>
                    </div>
                  </div>
                )}

                {!capturedGeneral && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onBattleEnd({
                        victory: true,
                        provinceId: targetProvince.id,
                        spoils: { gold: 4500, provisions: 3200 },
                      });
                    }}
                    className="w-full mt-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-sm tracking-widest shadow-lg transition"
                  >
                    凱旋返陣 · 更新領地
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-950 border-2 border-red-600 flex items-center justify-center mx-auto mb-3">
                  <Skull className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold font-serif text-red-300 tracking-widest">兵敗撤退</h2>
                <p className="text-xs text-stone-400 mt-1 font-serif">
                  我軍在【{targetProvince.castleName}】攻防戰中傷亡過甚，暫行後撤重整軍馬！
                </p>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={onRetreat}
                    className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-serif text-xs"
                  >
                    撤退回大本營
                  </button>
                  <button
                    onClick={() => {
                      sound.playTaiko();
                      playerRef.current.hp = 500;
                      playerRef.current.x = 180;
                      playerRef.current.y = 280;
                      playerRef.current.alive = true;
                      isFinishedRef.current = false;
                      targetMovePosRef.current = null;
                      setBattleResult('playing');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-amber-100 font-serif font-bold text-xs"
                  >
                    重新出陣猛攻
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
