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
