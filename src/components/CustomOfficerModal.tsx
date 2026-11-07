import React, { useState } from 'react';
import { UserPlus, Sparkles, X, Shield, Swords, Award, CheckCircle2 } from 'lucide-react';
import { General, GeneralSkill } from '../types/game';
import { sound } from '../utils/sound';

interface CustomOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOfficer: (customGeneral: General) => void;
}

export const CustomOfficerModal: React.FC<CustomOfficerModalProps> = ({
  isOpen,
  onClose,
  onSaveOfficer,
}) => {
  const [name, setName] = useState<string>('天道破軍');
  const [title, setTitle] = useState<string>('亂世豪傑 · 霸業始動');
  const [mon, setMon] = useState<string>('天');
  const [role, setRole] = useState<'Daimyo' | 'General' | 'Strategist'>('Daimyo');
  const [command, setCommand] = useState<number>(92);
  const [martial, setMartial] = useState<number>(95);
  const [intellect, setIntellect] = useState<number>(88);
  const [politics, setPolitics] = useState<number>(80);
  const [charisma, setCharisma] = useState<number>(90);
  const [skillName, setSkillName] = useState<string>('破軍千刃·天地俱滅');
  const [skillType, setSkillType] = useState<'damage' | 'volley' | 'buff' | 'charge'>('charge');
  const [equippedItem, setEquippedItem] = useState<string>('名刀 · 備前長船兼光 & 漆黑當世具足');

  if (!isOpen) return null;

  const monOptions = ['天', '霸', '武', '義', '龍', '虎', '風', '林', '火', '山', '雷', '鬼'];
  const items = [
    '名刀 · 備前長船兼光 & 漆黑當世具足',
    '天下三名槍 · 御手杵 & 鹿角金兜',
    '妖刀 · 村正 & 南蠻胴鎧',
    '名馬 · 松風 & 宗三左文字',
    '名茶器 · 曜變天目茶碗 & 天正軍配',
  ];

  const handleSave = () => {
    sound.playTaiko(1.2);
    sound.playFanfare();

    const newGeneral: General = {
      id: `custom_officer_${Date.now()}`,
      name,
      kanji: name,
      clanId: 'custom',
      role,
      roleName: role === 'Daimyo' ? '創立大名' : role === 'General' ? '無雙猛將' : '首席軍師',
      avatar: '/assets/aistudio/Gemini_Generated_Image_nkgpminkgpminkgp_d33d7e24.jfif',
      command,
      martial,
      intellect,
      politics,
      charisma,
      loyalty: 100,
      fief: '自創本城',
      title,
      equippedItem,
      skill: {
        name: skillName,
        description: '自創武將專屬奧義，爆發驚人統帥威能！',
        cooldown: 8,
        damage: 160,
        effectType: skillType,
      },
      biography: `亂世之中脫穎而出的自創豪傑【${name}】，胸懷天下大志，率領自創親衛兵團踏上征伐霸道！`,
    };

    onSaveOfficer(newGeneral);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-stone-900 border-2 border-amber-600 rounded-3xl p-6 shadow-2xl text-stone-200 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold font-serif text-amber-200">自創武將殿堂 (Custom Officer Creator)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 mt-4">
          {/* Identity & Mon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-stone-400 font-serif block mb-1">武將尊名:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm font-serif text-amber-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 font-serif block mb-1">霸業稱號:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm font-serif text-stone-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 font-serif block mb-1">戰國職位身分:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm font-serif text-stone-300 focus:outline-none focus:border-amber-500"
              >
                <option value="Daimyo">獨立大名 (Daimyo)</option>
                <option value="General">軍團大將 (General)</option>
                <option value="Strategist">幕府軍師 (Strategist)</option>
              </select>
            </div>
          </div>

          {/* Mon Crest Selector */}
          <div>
            <label className="text-xs text-stone-400 font-serif block mb-1.5">專屬家紋 / 旗印紋章:</label>
            <div className="flex flex-wrap gap-2">
              {monOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setMon(m);
                  }}
                  className={`w-9 h-9 rounded-full border text-sm font-serif font-bold transition flex items-center justify-center ${
                    mon === m
                      ? 'border-amber-400 bg-amber-600 text-stone-950 shadow-lg ring-2 ring-amber-400'
                      : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 5 Stats Sliders */}
          <div className="bg-stone-950/80 p-4 rounded-2xl border border-stone-800 space-y-3">
            <span className="text-xs text-amber-400 font-serif font-bold block mb-2">武將五維天賦數值:</span>

            <div className="flex items-center gap-4 text-xs font-serif">
              <span className="w-16 text-stone-400">統率 (隊伍):</span>
              <input
                type="range"
                min="50"
                max="100"
                value={command}
                onChange={(e) => setCommand(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className="font-mono font-bold text-amber-300 w-8">{command}</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-serif">
              <span className="w-16 text-stone-400">武力 (個人):</span>
              <input
                type="range"
                min="50"
                max="100"
                value={martial}
                onChange={(e) => setMartial(Number(e.target.value))}
                className="flex-1 accent-red-500"
              />
              <span className="font-mono font-bold text-red-400 w-8">{martial}</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-serif">
              <span className="w-16 text-stone-400">智略 (計策):</span>
              <input
                type="range"
                min="50"
                max="100"
                value={intellect}
                onChange={(e) => setIntellect(Number(e.target.value))}
                className="flex-1 accent-sky-500"
              />
              <span className="font-mono font-bold text-sky-400 w-8">{intellect}</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-serif">
              <span className="w-16 text-stone-400">政治 (內政):</span>
              <input
                type="range"
                min="50"
                max="100"
                value={politics}
                onChange={(e) => setPolitics(Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="font-mono font-bold text-emerald-400 w-8">{politics}</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-serif">
              <span className="w-16 text-stone-400">魅力 (登用):</span>
              <input
                type="range"
                min="50"
                max="100"
                value={charisma}
                onChange={(e) => setCharisma(Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="font-mono font-bold text-purple-400 w-8">{charisma}</span>
            </div>
          </div>

          {/* Signature Active Skill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400 font-serif block mb-1">專屬奧義絕技名稱 [Q]:</label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm font-serif text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 font-serif block mb-1">戰場奧義型態:</label>
              <select
                value={skillType}
                onChange={(e) => setSkillType(e.target.value as any)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm font-serif text-stone-300 focus:outline-none focus:border-amber-500"
              >
                <option value="charge">突擊型 (瞬間衝破前方敵陣)</option>
                <option value="volley">齊射型 (連環火槍雷霆轟擊)</option>
                <option value="buff">聖護型 (金剛不壞無敵聖光)</option>
              </select>
            </div>
          </div>

          {/* Treasure / Katana */}
          <div>
            <label className="text-xs text-stone-400 font-serif block mb-1">配備戰國名刃與名物寶器:</label>
            <select
              value={equippedItem}
              onChange={(e) => setEquippedItem(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm font-serif text-amber-200 focus:outline-none focus:border-amber-500"
            >
              {items.map((it) => (
                <option key={it} value={it}>
                  {it}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-serif text-xs transition"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-serif font-bold text-xs tracking-wider transition shadow-lg flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-stone-950" />
            <span>創立武將 · 登錄大名冊</span>
          </button>
        </div>
      </div>
    </div>
  );
};
