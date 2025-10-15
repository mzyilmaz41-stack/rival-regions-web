import React, { useMemo, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/ui/alert";
import {
  Menu, Map, Sword, Factory, Users, Newspaper,
  Building, Wallet, Medal, Globe2, Settings,
  Database, ShieldHalf, LogIn, Scale, BadgeCheck,
} from "lucide-react";

/*
  ÜLKELER YARIŞI (Rival Regions Web)
  -----------------------------------
  • Tüm modern tarayıcılarda çalışır (React + Tailwind + shadcn/ui)
  • Mobil cihazlarda alt menü çubuğu ve responsive arayüz
  • Aşağıdaki modüller entegre edilmiştir:
    Profil, Çalışma & Ekonomi, Savaş, Harita & Bölgeler, Binalar,
    Parlamento, Devlet, Diplomasi, Departmanlar, Pazar, Görev, Medya
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
