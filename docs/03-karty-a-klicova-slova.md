# 03 – Karty a klíčová slova

Aby se dalo vytvořit 100–200 karet a ještě je udržet vyvážené a čitelné, **neděláme každou schopnost ručně od nuly.** Místo toho máme malý „jazyk" ze tří stavebních kamenů:

> **TRIGGER** (kdy se to stane) → **EFEKT** (co se stane) → **CÍL / TVAR** (na koho / kam)

Skoro každá schopnost ve hře je jen kombinace těchto tří věcí. Tím pádem je snadné navrhovat nové karty, číst je a hlavně je **datově popsat** (viz [datové schéma](04-seznam-karet.md)).

---

## 1. Anatomie karty

| Pole | Popis |
|---|---|
| **Jméno** | název karty |
| **Cost** | kolik energie stojí vyložení |
| **HP** | život |
| **Síla** | kolik dmg rozdá útokem (0 = nebojová/support karta) |
| **Dostřel** | na jakou vzdálenost útočí (výchozí 1) |
| **Rarita** | common / uncommon / rare / epic / legendary |
| **Tagy** | frakce/typy pro synergie (např. `Explosive`, `Undead`, `Machine`) |
| **Schopnosti** | seznam trojic Trigger→Efekt→Cíl |
| **Flavor** | vtipná/atmosférická hláška (nepovinné) |

Volitelná/pozdější pole: `Move` (kolik políček se umí posunout, výchozí 0 — karty jsou standardně statické), `Level` (pro upgrady, viz [meta](05-meta-progrese.md)).

---

## 2. TRIGGERY — *kdy*

| Keyword | Kdy se spustí |
|---|---|
| **Vylož** (Deploy) | ve chvíli vyložení karty na desku |
| **Skon** (Death) | když je karta zničena (i vlastní rukou!) |
| **Zranění** (Wound) | když tato karta utrpí poškození |
| **Útok** (On-Attack) | když tato karta útočí |
| **Zabití** (On-Kill) | když tato karta něco zničí |
| **Úsvit / Soumrak** (Upkeep) | na začátku / konci tvého tahu |
| **Odpočet N** (Countdown) | po N tvých tazích se spustí efekt (počítadlo klesá o 1 za tah) |
| **Aura** | trvale, dokud karta stojí (pasivní efekt v nějaké oblasti) |
| **Aktivace** (Active) | ručně spustíš ve svém tahu (typicky za energii, často 1×/tah) |

---

## 3. EFEKTY — *co*

| Keyword | Co dělá |
|---|---|
| **Damage X** | způsobí X poškození |
| **Heal X** | vyléčí X životů |
| **Štít X** (Shield) | pohltí příští X poškození |
| **Buff +A/+H** | přidá sílu/život |
| **Debuff −A/−H** | ubere sílu/život |
| **Swap** | prohodí pozice dvou karet |
| **Posun / Táhni** (Push/Pull) | odsune / přitáhne kartu o políčko |
| **Přivolej** (Summon) | vytvoří token/kartu na políčko |
| **Zahoď** (Discard) | odstraní kartu ze soupeřovy ruky |
| **Znič** (Destroy) | přímo zničí kartu (bez ohledu na HP) |
| **Teren** (Terrain) | položí stav na políčko (mina, buff-zóna, zeď…) |
| **Dober** (Draw) | dobere karty |
| **Energie +X** (Ramp) | přidá energii tento tah |
| **Umlči** (Silence) | odstraní schopnosti cílové karty |
| **Vrať** (Bounce) | vrátí vyloženou kartu do ruky |

---

## 4. CÍLE a TVARY — *kam / na koho*

| Keyword | Oblast |
|---|---|
| **Já** (Self) | tato karta |
| **Soused** | přilehlé políčko (lze upřesnit směr: vpřed, vzad, vlevo, vpravo) |
| **Diagonála** | šikmé sousední políčko (upřesnitelný směr, např. vpřed-vpravo) |
| **Směr + dostřel** | rovná linie určitým směrem do vzdálenosti N |
| **Okolí 3×3** | všech 8 políček kolem |
| **Náhodný nepřítel** | náhodná nepřátelská karta (nebo z ruky) |
| **Zvolený** | hráč cíl vybere (spojenec/nepřítel dle schopnosti) |
| **Všichni / všude** | plošně |

Směry jsou vždy **relativní k majiteli** (vpřed = k nepříteli), viz [herní design §1](02-herni-design.md).

---

## 5. Tvých 10 schopností přeložených do systému

Aby bylo vidět, že jazyk je dost výrazný, tady je **tvých 10 původních příkladů** namapovaných na Trigger→Efekt→Cíl. (Jméno keywordu je návrh; klidně přejmenujeme.)

| # | Původní popis | Trigger | Efekt | Cíl / tvar | Návrh keywordu |
|---|---|---|---|---|---|
| 1 | Heal kartu napravo | Úsvit | Heal X | Soused: vpravo | **Ranhojič** |
| 2 | Diagonálně vpřed-vpravo dá 2 dmg | Úsvit *(nebo Útok)* | Damage 2 | Diagonála: vpřed-vpravo | **Kosý zásah** |
| 3 | Swapne pozice karet | Aktivace | Swap | 2× Zvolený | **Rošáda** |
| 4 | Po zničení zahodí random kartu nepřítele | Skon | Zahoď | Náhodný nepřítel (ruka) | **Poslední pomsta** |
| 5 | Kolem sebe vytvoří minové pole | Vylož | Teren: mina | Okolí 3×3 | **Minér** |
| 6 | Za 3 kola exploduje (plošné dmg); když zahozena, vlastník dostane dmg | Odpočet 3 (+ Skon) | Damage (výbuch) / Damage majiteli | Okolí 3×3 / Majitel | **Časovaná bomba** |
| 7 | Při zranění může hráč vzít vyloženou kartu a zahodit ji | Zranění | Vrať/Zahoď | Zvolený (vlastní) | **Nervy** |
| 8 | Při zranění dostane +1 dmg navíc | Zranění *(pasivně)* | modifikátor: +1 přijaté dmg | Já | **Křehkost** (nevýhoda) |
| 9 | Při útoku zraní za 3 | — | — | — | jen `Síla = 3` (statistika, ne keyword) |
| 10 | Aplikuje štít na zvolenou kartu | Vylož *(nebo Aktivace)* | Štít X | Zvolený (spojenec) | **Ochránce** |

Zajímavé postřehy z tohoto cvičení:

- **#9 vůbec není schopnost** — je to prostě `Síla`. Dobré rozlišovat, co je statistika a co keyword, ať karty nezhoustnou zbytečným textem.
- **#6 je vlastně dvě schopnosti** (odpočet-výbuch + trest-při-zahození). Systém to zvládá jako kartu se dvěma trojicemi. Zároveň je to skvělé combo-jádro: chceš ji odpálit sám ve správný moment, ale zahodit ji tě bolí → napětí.
- **#8 je nevýhoda** — a to je dobře. Vyvážené karty mají mít i mínusy (levnější, silnější jinde). Nevýhody = designový nástroj i combo materiál (schválně si dej Křehkost na obětní kartu).

---

## 6. Rarity

Rarita ovlivňuje sílu, cenu v obchodě a šanci na výskyt.

| Rarita | Role | Charakter |
|---|---|---|
| **Common** | páteř balíčku | jednoduché, jedna schopnost nebo čistá statistika |
| **Uncommon** | drobné synergie | jeden zajímavý keyword |
| **Rare** | build-defining | silnější efekty, začátky komb |
| **Epic** | motory synergií | kombinace triggerů, mění styl hry |
| **Legendary** | „hvězdy" runu | unikátní, pravidla-ohýbající efekty; jich je málo |

Pravidlo palce pro balanc: **čím vzácnější, tím spíš *umožňuje* strategii, než aby byla jen „vyšší čísla".** Legendární karta by neměla být prostě 8/8 — má být 8/8, *která dělá něco, co jinak nejde*.

---

## 7. Zásady, aby se pool 100–200 karet nezvrhl

- **Znovupoužívej keywordy.** Nový obsah = nové *kombinace* existujících triggerů/efektů, ne nekonečně nových jednorázových pravidel. Udrží to hru čitelnou a kód jednoduchý.
- **Každá karta má mít „důvod".** Buď dělá něco nového, nebo to dělá jinak/levněji/na jiném místě křivky. Duplicity ven.
- **Nevýhody jsou koření.** Rozdávej je — dělají karty levnějšími a otevírají komba.
- **Text ať se vejde na kartu.** Když schopnost potřebuje odstavec, je nejspíš špatně navržená.
