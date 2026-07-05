# 08 – Roadmapa

Vývojová strategie stojí na jednom principu: **nejdřív dokázat, že jádro je zábavné, teprve pak stavět nadstavbu.** Největší riziko projektu je rozsah (viz [vize – rizika](01-vize.md)). Roadmapa je proti tomu obrana.

---

## Fáze 0 – Design (teď)

- [x] Sepsat vizi, jádro, systém karet, meta, AI, otevřené otázky.
- [x] Rozhodnout [otevřené otázky](07-otevrene-otazky.md) 1–12 (jádro dořešeno).
- [x] Zvolit tech stack — **web MVP jako jeden HTML soubor (TS), pak C#/Unity na Steam** (viz [09](09-technologie.md)).

**Výstup:** shoda na tom, co stavíme. ✅ Můžeme do Fáze 1.

---

## Fáze 1 – MVP jádra („je to vůbec zábava?")

Cíl: **jeden hratelný souboj** na desce 7×6, žádná ekonomika, pevný balíček. Postaveno jako web (TS + DOM/CSS), s **oddělením engine od renderu** od prvního dne (viz [09](09-technologie.md)).

- [ ] Kostra projektu: TS + Vite, engine (čistá logika) oddělený od renderu.
- [ ] Deska 7×6 + vykreslení mřížky (CSS grid), dvě Královny.
- [ ] Pravidlo přiléhavého pokládání (8-sousedství).
- [ ] Energie + tahy.
- [ ] Souboj: útok, dostřel, protiúder, ničení, HP, únava z vyložení.
- [ ] ~15–20 karet z [ukázkového setu](04-seznam-karet.md) (jen základní keywordy: Vylož, Skon, Úsvit, Damage/Heal/Štít).
- [ ] Vítězná podmínka (padne Královna).
- [ ] Nejjednodušší bot (skóruje 1 akci dopředu).
- [ ] Export do **jednoho HTML souboru** a nahrání na **itch.io** k testu.

**Test úspěchu:** *„Chce se mi hrát druhou partii?"* Pokud ne → ladíme jádro, **nepřidáváme obsah.**

---

## Fáze 2 – Roguelike smyčka („je důvod hrát dál?")

- [ ] Obchod mezi koly: koupit / odstranit / reroll.
- [ ] Zlato a odměny za výhru.
- [ ] Vylepšování karet (Level).
- [ ] Struktura runu (série soubojů, rostoucí obtížnost).
- [ ] Rozšíření na ~40–50 karet + pokročilé keywordy (Odpočet, Aura, Aktivace, Teren/miny).

**Test úspěchu:** *„Chce se mi dokončit run?"*

---

## Fáze 3 – Hloubka a šťáva

- [ ] Bossové Královny se signature schopnostmi.
- [ ] Combo motory (extra pokládání, řetězení výbuchů).
- [ ] Chytřejší bot (mělké prohledávání, obtížnostní páky).
- [ ] Dotáhnout pool ke 100+ kartám.
- [ ] Zpětná vazba UI: animace zásahů, telegrafování směrových efektů, náhledy dosahu.

---

## Fáze 4 – Meta a leštění (dokončení webové solo verze)

- [ ] Progrese mezi runy (odemykání karet, volitelné Královny).
- [ ] Výzvy / mutátory.
- [ ] Balancování celého poolu, tuning ekonomiky.

**Milník:** hotová, vyladěná **solo hra na webu**. Tady se rozhoduje, jestli se jde na Steam.

---

## Fáze 5 – Steam verze (C#/Unity)

Až je web solo verze zábavná a vyladěná — teprve pak se investuje do portu.

- [ ] Přepis **enginu do C#** (JSON karet se recykluje 1:1).
- [ ] Render v Unity (pořád „jen kartičky"), UI, nastavení, ukládání.
- [ ] Buildy Win/Mac/Linux, integrace Steamu (achievementy, cloud saves).

---

## Fáze 6 – Multiplayer + ELO (nejzazší)

- [ ] Síťová vrstva nad deterministickým enginem (autoritativní sim, posílají se jen akce).
- [ ] Nejdřív async / hot-seat, pak realtime 1v1.
- [ ] ELO/MMR párování, žebříčky, sezóny.

---

## Průřezová zásada

Po celou dobu: **karty jsou data, ne kód** (viz [schéma](04-seznam-karet.md)). Engine umí konečnou sadu triggerů/efektů/cílů; přidání karty nikdy nesmí znamenat psaní nové speciální logiky. Tohle je to, co umožní dojít ke 100–200 kartám, aniž se projekt zhroutí pod vlastní vahou.
