# 10 – Architektura kódu (a jak snadno přidávat obsah)

Tenhle dokument je praktický: **jak je kód postavený, aby šlo přidat nový efekt / trigger / kartu bez sahání do jádra.** To byl explicitní požadavek — modularita nade vše.

## Vrstvy (striktně oddělené)

```
src/
  engine/     ČISTÁ LOGIKA — bez DOM, bez Vite. Pravidla, fronta událostí, registry.
  content/    DATA — definice karet a balíčků. Žádná logika.
  ai/         BOT — heuristika nad enginem (jen čte stav a volá akce).
  ui/         RENDER + vstup — jen zobrazuje stav a posílá akce zpět.
  main.ts     Slepení UI + engine.
scripts/      Testy mimo browser (smoke = bot vs bot, uicheck = Playwright).
```

**Pravidlo:** `engine/` nikdy neimportuje z `ui/`, `content/` ani `ai/`. Díky tomu se dá engine 1:1 přepsat do C# (Steam verze) a data karet recyklovat beze změny. Viz [09-technologie](09-technologie.md).

## Tři pilíře modularity

### 1. Trigger → Efekt → Cíl (schopnost = data)

Každá schopnost je jen trojice (viz [03](03-karty-a-klicova-slova.md)):

```ts
{ trigger: 'deploy', effect: 'shield', target: 'lowestHpAlly', params: { value: 3 } }
```

`effect` a `target` jsou **klíče do registru**. Engine je jen vyhledá a zavolá.

### 2. Registry (`engine/registries.ts`)

Efekty a cíle se **registrují pod klíčem**. Engine je nikdy nezná napevno — jen sáhne do mapy. Přidat nový efekt = přidat handler, nic víc.

### 3. Fronta událostí (`engine/events.ts`) — řetězení bez rekurze

Vše (poškození, léčení, smrt, trigger, běh schopnosti) je **událost ve frontě**. Efekty jen vkládají další události; smyčka je odbavuje jednu po druhé. Combo řetěz (A zabije B → *Skon* B zraní C → reakce C…) tak proběhne deterministicky a nespadne na hloubce zásobníku.

---

## Kuchařka: „chci přidat…"

### ➕ Novou kartu

Jen přidat záznam do `src/content/cards.ts` (a případně do balíčku v `decks.ts`). Žádný kód.

```ts
{ id: 'sniper', name: 'Odstřelovač', rarity: 'rare', cost: 4, hp: 2, attack: 5, range: 4 }
```

### ➕ Nový efekt (např. „přitáhni nepřítele o 1")

1. V `src/engine/effects.ts` přidej:
   ```ts
   registerEffect('pull', (api, params, targets, sourceUid) => {
     // ... vlastní logika, používej api.damage / api.swap / api.state ...
   });
   ```
2. Použij ho na kartě: `{ trigger:'deploy', effect:'pull', target:'direction', params:{ direction:'forward' } }`.

Hotovo. Fronta událostí, triggery ani UI se nemění.

### ➕ Nový cíl / tvar (např. „celý sloupec vpřed")

1. V `src/engine/targeting.ts`:
   ```ts
   registerTarget('column', (state, sourceUid, params) => { /* vrať CardInstance[] */ });
   ```
2. Použij `target: 'column'` na schopnosti.

### ➕ Nový trigger (např. „on-spend-energy")

Triggery jsou stringy — stačí je **vypálit** na správném místě v enginu:
```ts
runner.enqueue({ type: 'fireTrigger', uid, trigger: 'onSpendEnergy' });
```
Přidej ho do konstanty `TRIGGERS` (`engine/types.ts`) pro přehled a do popisovače v `ui/describe.ts`. Karty ho pak používají jako `trigger: 'onSpendEnergy'`.

### ➕ Nový pasivní keyword (např. „nedá se léčit")

Keywordy jsou stringy na kartě (`keywords: ['noHeal']`). Zohledni je tam, kde dává smysl — např. v `resolveHeal` (`engine/events.ts`) přeskoč léčení, pokud `card.keywords.includes('noHeal')`. Pak je přidej do popisu v `describe.ts`.

---

## Determinismus

RNG je seedovaný (`engine/rng.ts`) a všechna náhoda jde přes něj. Stejný seed + stejné akce = stejný průběh. To dává:
- opakovatelné testy (`npm run smoke` hraje 20 partií na pevných seedech),
- replaye,
- snadný pozdější **autoritativní multiplayer** (po síti stačí posílat akce, ne stav).

**Nikdy nevolej `Math.random()` v enginu** — jen `nextInt(state.rng, …)`.

---

## Jak to spustit / ověřit

```bash
npm install
npm run dev        # vývojový server (hraní v prohlížeči)
npm run build      # -> dist/index.html (jeden soubor pro itch.io)
npm run smoke      # headless: bot vs bot, 20 partií musí dojet do konce
node scripts/uicheck.mjs   # Playwright: ověří, že build reálně běží v prohlížeči
```

## Mapa souborů enginu

| Soubor | Zodpovědnost |
|---|---|
| `types.ts` | datové typy (CardDef, CardInstance, GameState…) |
| `rng.ts` | seedovaný RNG |
| `directions.ts` | směry relativní k majiteli (vpřed = k nepříteli) |
| `board.ts` | geometrie mřížky, sousedství, vzdálenosti |
| `registries.ts` | registry efektů a cílů (jádro modularity) |
| `events.ts` | fronta událostí + EffectAPI + dobírání/únava |
| `effects.ts` | vestavěné efekty (damage, heal, shield, terrain…) |
| `targeting.ts` | vestavěné cíle (self, neighbor, around, direction…) |
| `factory.ts` | vytváření instancí karet z definic |
| `game.ts` | pravidla tahů: play / attack / endTurn, legální akce, výhra |
