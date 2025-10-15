import React, { useMemo, useState } from "react";
import { Globe2, Sword, Factory, Users, Wallet, Map, LogIn } from "lucide-react";

// === Tip Tanımları ===
type Stats = {
  level: number;
  strength: number;
  knowledge: number;
  endurance: number;
  nationBonus: number;
};

type WorkInputs = {
  userLevel: number;
  resourceKoef: number;
  factoryLevel: number;
  workExp: number;
  depOfRes: number;
  resourceType: "standard" | "gold" | "diamond" | "liquefaction" | "he3lab";
};

type BuildingLevels = {
  hospital: number;
  militaryBase: number;
  school: number;
  seaPort: number;
  missileSystem: number;
  powerPlant: number;
  spaceport: number;
  airport: number;
  refillStation: number;
};

type WarInputs = {
  militaryIndex: number;
  missileSystemDiff: number;
  seaPort: number;
  airport: number;
  militaryAcademy: number;
  troopsAlpha: number;
  applyDistancePenalty: boolean;
  distancePenaltyPct: number;
  randomness: boolean;
};

type TaxInputs = { taxRate: number };

// === Yardımcı Fonksiyonlar ===
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// === Formüller ===
function productivityFormula(w: WorkInputs) {
  const base = 0.2
    * Math.pow(w.userLevel, 0.8)
    * Math.pow(w.resourceKoef / 10, 0.8)
    * Math.pow(w.factoryLevel, 0.8)
    * Math.pow(w.workExp / 10, 0.6);

  const deptMultiplier = 1 + w.depOfRes / 100;

  let resourceMultiplier = 1;
  switch (w.resourceType) {
    case "gold":
      resourceMultiplier = 4;
      break;
    case "diamond":
      resourceMultiplier = 1 / 1000;
      break;
    case "liquefaction":
      resourceMultiplier = 1 / 5;
      break;
    case "he3lab":
      resourceMultiplier = 1 / 1000;
      break;
  }

  const productivity = base * deptMultiplier * resourceMultiplier;
  const withdrawnPoints = productivity / 40000000;
  return { productivity, withdrawnPoints };
}

function initialDefenceDamage(b: BuildingLevels) {
  const sum =
    b.hospital +
    2 * b.militaryBase +
    b.school +
    b.seaPort +
    b.missileSystem +
    b.powerPlant +
    b.spaceport +
    Math.max(b.airport, b.refillStation);
  return sum * 50000;
}

function damageFormula(stats: Stats, war: WarInputs) {
  const missileTerm = clamp(war.missileSystemDiff, -300, 9999) / 400;
  const core =
    1 +
    war.militaryIndex / 20 +
    missileTerm +
    war.seaPort / 400 +
    war.airport / 400 +
    war.militaryAcademy / 177.7 +
    stats.strength / 100 +
    stats.nationBonus * 3 +
    (stats.knowledge + stats.endurance + stats.level) / 200;

  let total = core * war.troopsAlpha;

  if (war.applyDistancePenalty) {
    total *= 1 - clamp(war.distancePenaltyPct, 0, 100) / 100;
  }

  if (war.randomness) {
    const delta = 0.125 * total;
    const min = total - delta;
    const max = total + delta;
    const seed =
      (stats.level +
        stats.strength +
        stats.knowledge +
        stats.endurance +
        war.troopsAlpha) %
      1000000;
    const rand = (Math.sin(seed) + 1) / 2;
    total = min + rand * (max - min);
  }

  return total;
}

function netIncome(productivity: number, tax: TaxInputs) {
  return productivity * (1 - clamp(tax.taxRate, 0, 100) / 100);
}

// === Basit Harita Bileşeni ===
function WorldMapMock({ onSelect }: { onSelect: (r: string) => void }) {
  const cities = ["Ankara", "İstanbul", "Berlin", "Paris", "Tokyo", "New York"];
  return (
    <div className="border rounded-xl p-4 text-center bg-white">
      <Globe2 className="mx-auto mb-2" />
      <p className="text-sm text-gray-500">Dünya Haritası (örnek) — Şehir seç</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {cities.map((r) => (
          <button
            key={r}
            onClick={() => onSelect(r)}
            className="px-2 py-1 text-sm bg-slate-100 hover:bg-blue-100 rounded-lg"
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

// === Ana Uygulama ===
export default function App() {
  const [region, setRegion] = useState("Ankara");
  const [stats, setStats] = useState<Stats>({
    level: 20,
    strength: 50,
    knowledge: 30,
    endurance: 40,
    nationBonus: 0.05,
  });
  const [work, setWork] = useState<WorkInputs>({
    userLevel: 20,
    resourceKoef: 80,
    factoryLevel: 10,
    workExp: 50,
    depOfRes: 10,
    resourceType: "standard",
  });
  const [buildings] = useState<BuildingLevels>({
    hospital: 5,
    militaryBase: 6,
    school: 5,
    seaPort: 4,
    missileSystem: 6,
    powerPlant: 7,
    spaceport: 0,
    airport: 6,
    refillStation: 0,
  });
  const [war] = useState<WarInputs>({
    militaryIndex: 10,
    missileSystemDiff: -100,
    seaPort: 4,
    airport: 6,
    militaryAcademy: 5,
    troopsAlpha: 150000,
    applyDistancePenalty: true,
    distancePenaltyPct: 15,
    randomness: true,
  });
  const [tax] = useState<TaxInputs>({ taxRate: 15 });

  const prod = useMemo(() => productivityFormula(work), [work]);
  const def = useMemo(() => initialDefenceDamage(buildings), [buildings]);
  const dmg = useMemo(() => damageFormula(stats, war), [stats, war]);
  const net = useMemo(() => netIncome(prod.productivity, tax), [prod.productivity, tax]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">
      <header className="sticky top-0 bg-white border-b py-3 px-4 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Ülkeler Yarışı — Rival Regions</h1>
        <span className="flex items-center gap-1 text-sm text-gray-600">
          <LogIn size={16} /> Giriş
        </span>
      </header>

      <main className="max-w-5xl mx-auto p-4 grid gap-6">
        {/* Profil */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
            <Users /> Profil
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Seviye
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={stats.level}
                onChange={(e) => setStats({ ...stats, level: +e.target.value })}
              />
            </label>
            <label className="text-sm">
              Güç
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={stats.strength}
                onChange={(e) => setStats({ ...stats, strength: +e.target.value })}
              />
            </label>
          </div>
        </section>

        {/* Çalışma */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
            <Factory /> Çalışma
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Üretkenlik: <b>{prod.productivity.toFixed(2)}</b>
          </p>
          <p className="text-sm text-gray-600">
            Withdrawn: <b>{prod.withdrawnPoints.toExponential(3)}</b>
          </p>
        </section>

        {/* Savaş */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
            <Sword /> Savaş
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Toplam Hasar: <b>{dmg.toFixed(0)}</b>
          </p>
          <p className="text-sm text-gray-600">
            Savunma Gücü: <b>{def.toLocaleString()}</b>
          </p>
        </section>

        {/* Harita */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
            <Map /> Harita
          </h2>
          <WorldMapMock onSelect={setRegion} />
          <p className="text-sm text-gray-700 mt-3">
            Aktif Bölge: <b>{region}</b>
          </p>
        </section>

        {/* Ekonomi */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3">
            <Wallet /> Ekonomi
          </h2>
          <p className="text-sm text-gray-600">Vergi: {tax.taxRate}%</p>
          <p className="text-sm text-gray-600">
            Net Gelir: <b>{net.toFixed(2)}</b>
          </p>
        </section>
      </main>
    </div>
  );
}
type WarInputs = {
  militaryIndex: number;
  missileSystemDiff: number;
  seaPort: number;
  airport: number;
  militaryAcademy: number;
  troopsAlpha: number;
  applyDistancePenalty: boolean;
  distancePenaltyPct: number;
  randomness: boolean;
};

type TaxInputs = { taxRate: number };

// === Yardımcı Fonksiyonlar ===
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// === Formüller ===
function productivityFormula(w: WorkInputs) {
  const base = 0.2
    * Math.pow(w.userLevel, 0.8)
    * Math.pow(w.resourceKoef / 10, 0.8)
    * Math.pow(w.factoryLevel, 0.8)
    * Math.pow(w.workExp / 10, 0.6);

  const deptMultiplier = 1 + (w.depOfRes / 100);

  let resourceMultiplier = 1;
  switch (w.resourceType) {
    case "gold": resourceMultiplier = 4; break;
    case "diamond": resourceMultiplier = 1 / 1000; break;
    case "liquefaction": resourceMultiplier = 1 / 5; break;
    case "he3lab": resourceMultiplier = 1 / 1000; break;
  }

  const productivity = base * deptMultiplier * resourceMultiplier;
  const withdrawnPoints = productivity / 40000000;
  return { productivity, withdrawnPoints };
}

function initialDefenceDamage(b: BuildingLevels) {
  const sum = b.hospital + 2 * b.militaryBase + b.school + b.seaPort +
    b.missileSystem + b.powerPlant + b.spaceport + Math.max(b.airport, b.refillStation);
  return sum * 50000;
}

function damageFormula(stats: Stats, war: WarInputs) {
  const missileTerm = clamp(war.missileSystemDiff, -300, 9999) / 400;
  const core = 1 + (war.militaryIndex / 20) + missileTerm
    + (war.seaPort / 400) + (war.airport / 400)
    + (war.militaryAcademy / 177.7)
    + (stats.strength / 100) + (stats.nationBonus * 3)
    + ((stats.knowledge + stats.endurance + stats.level) / 200);
  let total = core * war.troopsAlpha;
  if (war.applyDistancePenalty) total *= (1 - clamp(war.distancePenaltyPct, 0, 100) / 100);
  if (war.randomness) {
    const delta = 0.125 * total;
    const min = total - delta;
    const max = total + delta;
    const seed = (stats.level + stats.strength + stats.knowledge + stats.endurance + war.troopsAlpha) % 1000000;
    const rand = (Math.sin(seed) + 1) / 2;
    total = min + rand * (max - min);
  }
  return total;
}

function netIncome(productivity: number, tax: TaxInputs) {
  return productivity * (1 - clamp(tax.taxRate, 0, 100) / 100);
}

// === Harita ===
function WorldMapMock({ onSelect }: { onSelect: (r: string) => void }) {
  const cities = ["Ankara", "İstanbul", "Berlin", "Paris", "Tokyo", "New York"];
  return (
    <div className="border rounded-xl p-4 text-center bg-white">
      <Globe2 className="mx-auto mb-2" />
      <p className="text-sm text-gray-500">Dünya Haritası (örnek) - Şehir seç</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {cities.map((r) => (
          <button
            key={r}
            onClick={() => onSelect(r)}
            className="px-2 py-1 text-sm bg-slate-100 hover:bg-blue-100 rounded-lg"
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

// === Ana Uygulama ===
export default function App() {
  const [region, setRegion] = useState("Ankara");
  const [stats, setStats] = useState<Stats>({ level: 20, strength: 50, knowledge: 30, endurance: 40, nationBonus: 0.05 });
  const [work, setWork] = useState<WorkInputs>({ userLevel: 20, resourceKoef: 80, factoryLevel: 10, workExp: 50, depOfRes: 10, resourceType: "standard" });
  const [buildings, setBuildings] = useState<BuildingLevels>({ hospital: 5, militaryBase: 6, school: 5, seaPort: 4, missileSystem: 6, powerPlant: 7, spaceport: 0, airport: 6, refillStation: 0 });
  const [war, setWar] = useState<WarInputs>({ militaryIndex: 10, missileSystemDiff: -100, seaPort: 4, airport: 6, militaryAcademy: 5, troopsAlpha: 150000, applyDistancePenalty: true, distancePenaltyPct: 15, randomness: true });
  const [tax, setTax] = useState<TaxInputs>({ taxRate: 15 });

  const prod = useMemo(() => productivityFormula(work), [work]);
  const def = useMemo(() => initialDefenceDamage(buildings), [buildings]);
  const dmg = useMemo(() => damageFormula(stats, war), [stats, war]);
  const net = useMemo(() => netIncome(prod.productivity, tax), [prod.productivity, tax]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">
      <header className="sticky top-0 bg-white border-b py-3 px-4 flex items-center justify-between">
        <h1 className="font-semibold text-lg">Ülkeler Yarışı — Rival Regions</h1>
        <span className="flex items-center gap-1 text-sm text-gray-600"><LogIn size={16}/> Giriş</span>
      </header>

      <main className="max-w-5xl mx-auto p-4 grid gap-6">
        {/* Profil */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3"><Users /> Profil</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Seviye<input type="number" className="w-full border rounded px-2 py-1" value={stats.level} onChange={(e)=>setStats({...stats,level:+e.target.value})}/></label>
            <label className="text-sm">Güç<input type="number" className="w-full border rounded px-2 py-1" value={stats.strength} onChange={(e)=>setStats({...stats,strength:+e.target.value})}/></label>
          </div>
        </section>

        {/* Çalışma */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3"><Factory /> Çalışma</h2>
          <p className="text-sm text-gray-600 mb-2">Üretkenlik: <b>{prod.productivity.toFixed(2)}</b></p>
          <p className="text-sm text-gray-600">Withdrawn: <b>{prod.withdrawnPoints.toExponential(3)}</b></p>
        </section>

        {/* Savaş */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3"><Sword /> Savaş</h2>
          <p className="text-sm text-gray-600 mb-2">Toplam Hasar: <b>{dmg.toFixed(0)}</b></p>
          <p className="text-sm text-gray-600">Savunma Gücü: <b>{def.toLocaleString()}</b></p>
        </section>

        {/* Harita */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3"><Map /> Harita</h2>
          <WorldMapMock onSelect={setRegion}/>
          <p className="text-sm text-gray-700 mt-3">Aktif Bölge: <b>{region}</b></p>
        </section>

        {/* Ekonomi */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-lg mb-3"><Wallet /> Ekonomi</h2>
          <p className="text-sm text-gray-600">Vergi: {tax.taxRate}%</p>
          <p className="text-sm text-gray-600">Net Gelir: <b>{net.toFixed(2)}</b></p>
        </section>
      </main>
    </div>
  );
                                             }    Parlamento, Devlet, Diplomasi, Departmanlar, Pazar, Görev, Medya
  • Formüller RivalRegions Wiki ve blog kaynaklarından alınmıştır
*/

// === Tip Tanımları ===
type Stats = {
  level: number;
  strength: number;
  knowledge: number;
  endurance: number;
  nationBonus: number; // 0..1 arası oran
};

type WorkInputs = {
  userLevel: number;
  resourceKoef: number;
  factoryLevel: number;
  workExp: number;
  depOfRes: number;
  resourceType: "standard" | "gold" | "diamond" | "liquefaction" | "he3lab";
};

type BuildingLevels = {
  hospital: number;
  militaryBase: number;
  school: number;
  seaPort: number;
  missileSystem: number;
  powerPlant: number;
  spaceport: number;
  airport: number;
  refillStation: number;
};

type WarInputs = {
  militaryIndex: number;
  missileSystemDiff: number;
  seaPort: number;
  airport: number;
  militaryAcademy: number;
  troopsAlpha: number;
  applyDistancePenalty: boolean;
  distancePenaltyPct: number;
  randomness: boolean;
};

type TaxInputs = {
  taxRate: number;
};

// === Yardımcı Fonksiyonlar ===
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// === Formüller ===

// 1. Çalışma / Üretkenlik
function productivityFormula(w: WorkInputs) {
  const base = 0.2
    * Math.pow(w.userLevel, 0.8)
    * Math.pow(w.resourceKoef / 10, 0.8)
    * Math.pow(w.factoryLevel, 0.8)
    * Math.pow(w.workExp / 10, 0.6);

  const deptMultiplier = 1 + (w.depOfRes / 100);

  let resourceMultiplier = 1;
  switch (w.resourceType) {
    case "gold":
      resourceMultiplier = 4;
      break;
    case "diamond":
      resourceMultiplier = 1 / 1000;
      break;
    case "liquefaction":
      resourceMultiplier = 1 / 5;
      break;
    case "he3lab":
      resourceMultiplier = 1 / 1000;
      break;
  }

  const productivity = base * deptMultiplier * resourceMultiplier;
  const withdrawnPoints = productivity / 40000000;
  return { productivity, withdrawnPoints };
}

// 2. Bina Savunması
function initialDefenceDamage(b: BuildingLevels) {
  const sum = b.hospital
    + 2 * b.militaryBase
    + b.school
    + b.seaPort
    + b.missileSystem
    + b.powerPlant
    + b.spaceport
    + Math.max(b.airport, b.refillStation);
  return sum * 50000;
}

// 3. Savaş Hasarı
function damageFormula(stats: Stats, war: WarInputs) {
  const missileTerm = clamp(war.missileSystemDiff, -300, 9999) / 400;

  const core = 1
    + (war.militaryIndex / 20)
    + missileTerm
    + (war.seaPort / 400)
    + (war.airport / 400)
    + (war.militaryAcademy / 177.7)
    + (stats.strength / 100)
    + (stats.nationBonus * 3)
    + ((stats.knowledge + stats.endurance + stats.level) / 200);

  let total = core * war.troopsAlpha;

  if (war.applyDistancePenalty) {
    total *= (1 - clamp(war.distancePenaltyPct, 0, 100) / 100);
  }

  if (war.randomness) {
    const delta = 0.125 * total;
    const min = total - delta;
    const max = total + delta;
    const seed = (stats.level + stats.strength + stats.knowledge + stats.endurance + war.troopsAlpha) % 1000000;
    const rand = (Math.sin(seed) + 1) / 2;
    total = min + rand * (max - min);
  }

  return total;
}

// 4. Gelir (Vergi Sonrası)
function netIncome(productivity: number, tax: TaxInputs) {
  return productivity * (1 - clamp(tax.taxRate, 0, 100) / 100);
}
// === Harita Bileşeni (Basitleştirilmiş Dünya Görünümü) ===
function WorldMapMock({ onSelectRegion }: { onSelectRegion: (r: string) => void }) {
  return (
    <div className="w-full aspect-[16/9] rounded-2xl border border-dashed grid place-items-center text-center p-4">
      <div>
        <Globe2 className="mx-auto mb-2" />
        <p className="text-sm opacity-70">Dünya Haritası (örnek). Şehir seçmek için tıklayın.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["Ankara", "İstanbul", "Berlin", "Paris", "Tokyo", "New York"].map((r) => (
            <Badge key={r} onClick={() => onSelectRegion(r)} className="cursor-pointer select-none">
              {r}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Ana Uygulama Bileşeni ===
export default function App() {
  // --- Oyuncu Durumları ---
  const [activeRegion, setActiveRegion] = useState("Ankara");
  const [citizenship, setCitizenship] = useState("TR");

  const [stats, setStats] = useState<Stats>({
    level: 20,
    strength: 50,
    knowledge: 30,
    endurance: 40,
    nationBonus: 0.05,
  });

  const [work, setWork] = useState<WorkInputs>({
    userLevel: 20,
    resourceKoef: 80,
    factoryLevel: 10,
    workExp: 50,
    depOfRes: 10,
    resourceType: "standard",
  });

  const [buildings, setBuildings] = useState<BuildingLevels>({
    hospital: 5,
    militaryBase: 6,
    school: 5,
    seaPort: 4,
    missileSystem: 6,
    powerPlant: 7,
    spaceport: 0,
    airport: 6,
    refillStation: 0,
  });

  const [war, setWar] = useState<WarInputs>({
    militaryIndex: 10,
    missileSystemDiff: -100,
    seaPort: 4,
    airport: 6,
    militaryAcademy: 5,
    troopsAlpha: 150000,
    applyDistancePenalty: true,
    distancePenaltyPct: 15,
    randomness: true,
  });

  const [tax, setTax] = useState<TaxInputs>({ taxRate: 15 });

  // --- Hesaplamalar ---
  const workOut = useMemo(() => productivityFormula(work), [work]);
  const defence = useMemo(() => initialDefenceDamage(buildings), [buildings]);
  const damage = useMemo(() => damageFormula(stats, war), [stats, war]);
  const net = useMemo(() => netIncome(workOut.productivity, tax), [workOut.productivity, tax]);

  // --- Yardımcı Bileşenler ---
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid gap-2">
      <Label className="text-xs uppercase tracking-wide opacity-70">{label}</Label>
      {children}
    </div>
  );

  const NumberInput = ({
    value, onChange, min = 0, max = 9999, step = 1,
  }: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) => (
    <Input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
  );

  // --- Arayüz ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">
      {/* Üst Başlık */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-3">
          <h1 className="font-semibold text-lg sm:text-xl flex-1">
            Ülkeler Yarışı — Rival Regions Web
          </h1>
          <Badge variant="secondary" className="gap-1">
            <LogIn size={14} /> Giriş
          </Badge>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="max-w-7xl mx-auto p-3 sm:p-6 grid gap-6">
        <section id="dashboard" className="grid gap-4">
          {/* Profil */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users /> Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Seviye">
                  <NumberInput value={stats.level} onChange={(v) => setStats((s) => ({ ...s, level: v }))} />
                </Field>
                <Field label="Vatandaşlık">
                  <Input value={citizenship} onChange={(e) => setCitizenship(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="STR">
                  <NumberInput value={stats.strength} onChange={(v) => setStats((s) => ({ ...s, strength: v }))} />
                </Field>
                <Field label="KNW">
                  <NumberInput value={stats.knowledge} onChange={(v) => setStats((s) => ({ ...s, knowledge: v }))} />
                </Field>
                <Field label="END">
                  <NumberInput value={stats.endurance} onChange={(v) => setStats((s) => ({ ...s, endurance: v }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ulus Bonusu">
                  <NumberInput step={0.01} value={stats.nationBonus} onChange={(v) => setStats((s) => ({ ...s, nationBonus: v }))} />
                </Field>
                <Field label="Aktif Bölge">
                  <Input value={activeRegion} onChange={(e) => setActiveRegion(e.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>
          {/* Çalışma */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Factory /> Çalışma
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kullanıcı Lv">
                  <NumberInput value={work.userLevel} onChange={(v) => setWork((w) => ({ ...w, userLevel: v }))} />
                </Field>
                <Field label="Fabrika Lv">
                  <NumberInput value={work.factoryLevel} onChange={(v) => setWork((w) => ({ ...w, factoryLevel: v }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Res. Koef (0-100)">
                  <NumberInput value={work.resourceKoef} onChange={(v) => setWork((w) => ({ ...w, resourceKoef: v }))} />
                </Field>
                <Field label="Work Exp (0-100)">
                  <NumberInput value={work.workExp} onChange={(v) => setWork((w) => ({ ...w, workExp: v }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dept. of Res %">
                  <NumberInput value={work.depOfRes} onChange={(v) => setWork((w) => ({ ...w, depOfRes: v }))} />
                </Field>
                <Field label="Kaynak Türü">
                  <Select value={work.resourceType} onValueChange={(val) => setWork((w) => ({ ...w, resourceType: val as WorkInputs["resourceType"] }))}>
                    <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standart</SelectItem>
                      <SelectItem value="gold">Altın</SelectItem>
                      <SelectItem value="diamond">Elmas</SelectItem>
                      <SelectItem value="liquefaction">Sıvılaştırma</SelectItem>
                      <SelectItem value="he3lab">He-3 Lab</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs opacity-60">Üretkenlik</div>
                  <div className="text-2xl font-semibold tabular-nums">{workOut.productivity.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Withdrawn Puan</div>
                  <div className="text-2xl font-semibold tabular-nums">{workOut.withdrawnPoints.toExponential(3)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Savaş */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Sword /> Savaş
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Military Index">
                  <NumberInput value={war.militaryIndex} onChange={(v) => setWar((x) => ({ ...x, militaryIndex: v }))} />
                </Field>
                <Field label="Missile Farkı (-300..)">
                  <NumberInput value={war.missileSystemDiff} onChange={(v) => setWar((x) => ({ ...x, missileSystemDiff: v }))} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Sea Port Lv">
                  <NumberInput value={war.seaPort} onChange={(v) => setWar((x) => ({ ...x, seaPort: v }))} />
                </Field>
                <Field label="Airport Lv">
                  <NumberInput value={war.airport} onChange={(v) => setWar((x) => ({ ...x, airport: v }))} />
                </Field>
                <Field label="Mil. Academy Lv">
                  <NumberInput value={war.militaryAcademy} onChange={(v) => setWar((x) => ({ ...x, militaryAcademy: v }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Birlik α-Hasarı">
                  <NumberInput value={war.troopsAlpha} onChange={(v) => setWar((x) => ({ ...x, troopsAlpha: v }))} />
                </Field>
                <Field label="Mesafe Cezası %">
                  <div className="flex items-center gap-3">
                    <Switch checked={war.applyDistancePenalty} onCheckedChange={(c) => setWar((x) => ({ ...x, applyDistancePenalty: c }))} />
                    <Slider value={[war.distancePenaltyPct]} onValueChange={(v) => setWar((x) => ({ ...x, distancePenaltyPct: v[0] }))} max={50} step={1} />
                    <span className="w-10 text-right tabular-nums">{war.distancePenaltyPct}%</span>
                  </div>
                </Field>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={war.randomness} onCheckedChange={(c) => setWar((x) => ({ ...x, randomness: c }))} />
                  <span className="text-sm">Rastgelelik (±12.5%)</span>
                </div>
                <Button variant="secondary" onClick={() => setWar((x) => ({ ...x }))}>Hesapla</Button>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs opacity-60">Toplam Hasar</div>
                  <div className="text-2xl font-semibold tabular-nums">{damage.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Savunma Hasarı</div>
                  <div className="text-2xl font-semibold tabular-nums">{defence.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Harita ve Gelir */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Map /> Harita & Gelir
              </CardTitle>
            </CardHeader>
            <CardContent className="grid lg:grid-cols-2 gap-4">
              <WorldMapMock onSelectRegion={setActiveRegion} />
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Aktif Bölge">
                    <Input value={activeRegion} onChange={(e) => setActiveRegion(e.target.value)} />
                  </Field>
                  <Field label="Vatandaşlık">
                    <Input value={citizenship} onChange={(e) => setCitizenship(e.target.value)} />
                  </Field>
                </div>
                <Tabs defaultValue="income">
                  <TabsList className="flex flex-wrap">
                    <TabsTrigger value="income" className="gap-2"><Wallet size={16} /> Gelir</TabsTrigger>
                  </TabsList>
                  <TabsContent value="income" className="mt-4 grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Vergi %">
                        <NumberInput value={tax.taxRate} onChange={(v) => setTax({ taxRate: v })} />
                      </Field>
                      <div>
                        <div className="text-xs opacity-60">Net Gelir</div>
                        <div className="text-2xl font-semibold tabular-nums">{net.toFixed(2)}</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
