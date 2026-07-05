# 04 – Datové schéma a ukázkový set karet

Cílem je **datově řízený** obsah: karty jsou data, ne kód. Přidání karty = přidání záznamu, ne psaní nové logiky. Engine umí sadu triggerů/efektů/cílů z [dok. 03](03-karty-a-klicova-slova.md) a karty jen skládají existující dílky.

---

## 1. Datové schéma karty (návrh)

```jsonc
{
  "id": "minelayer",              // unikátní strojový klíč
  "name": "Minér",
  "rarity": "uncommon",           // common | uncommon | rare | epic | legendary
  "cost": 3,                      // energie za vyložení
  "hp": 4,
  "attack": 2,
  "range": 1,
  "move": 0,                      // volitelné, výchozí 0 (statická karta)
  "tags": ["Explosive"],
  "abilities": [
    {
      "trigger": "deploy",        // deploy|death|wound|attack|kill|upkeep|countdown|aura|active
      "effect": "terrain",        // damage|heal|shield|buff|debuff|swap|push|summon|discard|destroy|terrain|draw|energy|silence|bounce
      "value": { "terrain": "mine", "damage": 2 },
      "target": "around",         // self|neighbor|diagonal|line|around|random_enemy|chosen|all
      "params": {}                // směr, dostřel, N u countdownu, cena u active…
    }
  ],
  "flavor": "Šlápneš – bum."
}
```

Poznámky:
- `value` je flexibilní podle efektu (číslo pro damage/heal, objekt pro terrain apod.).
- `params` nese doplňky: `{ "direction": "forward_right" }`, `{ "range": 3 }`, `{ "count": 3 }` (odpočet), `{ "cost": 1 }` (cena aktivace)…
- Víc schopností = víc položek v `abilities`.

---

## 2. Ukázkový starter set

Reprezentativní řez napříč raritami — ne finální 100+, ale dost na to, aby šlo hrát a testovat jádro. Formát: **Jméno · Cost · HP/Síla (dostřel) · rarita** → schopnost.

### Common (páteř)

| Karta | Cost | HP/Síla (R) | Schopnost |
|---|---|---|---|
| **Rekrut** | 1 | 2/2 (1) | — (čistá statistika, plní frontu) |
| **Kopiník** | 2 | 3/2 (1) | *Nájezd* – smí útočit hned v kole vyložení |
| **Lučištník** | 2 | 2/2 (2) | Dostřel 2, bez protiúderu na dálku |
| **Zdravotník** | 2 | 3/0 (1) | *Úsvit:* Heal 1 sousedovi vpřed (**Ranhojič**) |
| **Křeček-zeď** | 3 | 6/0 (1) | jen vysoké HP – blokuje expanzi |

### Uncommon (drobné synergie)

| Karta | Cost | HP/Síla (R) | Schopnost |
|---|---|---|---|
| **Minér** | 3 | 4/2 (1) | *Vylož:* položí miny do okolí 3×3 (**Minér**) |
| **Kosec** | 3 | 3/2 (1) | *Úsvit:* Damage 2 diagonálně vpřed-vpravo (**Kosý zásah**) |
| **Ochránce** | 2 | 3/1 (1) | *Vylož:* Štít 3 zvolenému spojenci (**Ochránce**) |
| **Berserk** | 2 | 4/3 (1) | *Křehkost:* +1 přijaté dmg (levnější za nevýhodu) |
| **Kurýr** | 2 | 2/1 (1) | *Vylož:* Dober 1 kartu |
| **Mstivý strom** | 3 | 5/1 (1) | *Vyléčení:* Buff +1 síla natrvalo (roste, když ho léčíš) |
| **Runový štít** | 2 | 3/1 (1) | *Zaštítění:* Damage 1 vpřed (štít = spouštěč, ne jen obrana) |

### Rare (build-defining)

| Karta | Cost | HP/Síla (R) | Schopnost |
|---|---|---|---|
| **Rošádník** | 3 | 3/1 (1) | *Aktivace (1E):* Swap dvou zvolených karet (**Rošáda**) |
| **Mstitel** | 3 | 3/3 (1) | *Skon:* zahoď náhodnou kartu z ruky nepřítele (**Poslední pomsta**) |
| **Časovaná bomba** | 4 | 3/0 (1) | *Odpočet 3:* výbuch, Damage 4 do okolí 3×3. *Skon (zahozením):* majitel dostane 2 (**Časovaná bomba**) |
| **Dělo** | 4 | 3/4 (3) | Dostřel 3; nesmí útočit na sousedy (jen na dálku) |

### Epic (motory synergií)

| Karta | Cost | HP/Síla (R) | Schopnost |
|---|---|---|---|
| **Pyroman** | 5 | 4/2 (1) | *Zabití:* Damage 2 do okolí zabité karty (řetězí výbuchy) |
| **Velitel** | 5 | 5/2 (1) | *Aura:* sousední spojenci +1 síla |
| **Nekromant** | 5 | 4/1 (1) | *Skon spojence poblíž → Přivolej* 1/1 kostlivce na jeho místo |

### Legendary (hvězdy runu)

| Karta | Cost | HP/Síla (R) | Schopnost |
|---|---|---|---|
| **Generál Chaos** | 7 | 6/4 (1) | *Vylož:* smíš tento tah položit až 2 další karty zdarma-do-costu 2 (combo motor) |
| **Královražda** | 6 | 5/3 (2) | *Útok na Královnu:* dvojnásobné poškození |
| **Titán** | 8 | 10/6 (1) | *Křehkost* + *Nájezd*; obrovská páka, ale zranitelný |

---

## 3. Nápady na tokeny/terén (vytváří jiné karty)

- **Kostlivec** 1/1 (token Nekromanta)
- **Mina** (terén): karta položená sem dostane 2 dmg; pak mina mizí.
- **Zeď** (terén/token): blokuje políčko a expanzi, má HP, sílu 0.
- **Buff-zóna** (terén): karta stojící zde má +1 síla.

---

## 3b. Stav implementace

V kódu je zatím **~37 karet** (`src/content/cards.ts`) napříč všemi raritami a keywordy: Vylož, Skon, Úsvit, Zranění, Vyléčení, Zaštítění, Odpočet, Zabití, **Aura**, **Aktivace** (i s ručním cílením). Implementované efekty: damage, heal, shield, buff/debuff, terrain (miny), discard, draw, summon, **push/pull**, **bounce**, **silence**. Cíle: self, neighbor, direction, around, aroundVictim, lowestHpAlly, allEnemies, **randomEnemy**, chosen, enemyQueen.

Přidání další karty je čistě datové (viz [10-architektura](10-architektura.md)) — cesta ke 100+ vede skládáním těchto dílků.

## 4. Jak set poroste do 100–200

- Držet se **jazyka keywordů** — nové karty = nové kombinace, ne nová jednorázová pravidla.
- Vyplňovat **mřížku „rarita × cost × role"** (agro / obrana / support / combo / control), ať v každém segmentu je z čeho vybírat.
- Vždy si u nové karty položit otázku z [dok. 03 §7](03-karty-a-klicova-slova.md): *„Dělá tahle karta něco, co jiná neumí — nebo to dělá jinde na křivce?"* Pokud ne → ven.
- Cílová hrubá distribuce (návrh): ~40 % common, ~25 % uncommon, ~20 % rare, ~10 % epic, ~5 % legendary.
