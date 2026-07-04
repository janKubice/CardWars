# 08 – Roadmapa

Vývojová strategie stojí na jednom principu: **nejdřív dokázat, že jádro je zábavné, teprve pak stavět nadstavbu.** Největší riziko projektu je rozsah (viz [vize – rizika](01-vize.md)). Roadmapa je proti tomu obrana.

---

## Fáze 0 – Design (teď)

- [x] Sepsat vizi, jádro, systém karet, meta, AI, otevřené otázky.
- [ ] Rozhodnout [otevřené otázky](07-otevrene-otazky.md) 1–7 (mění jádro).
- [ ] Zvolit tech stack.

**Výstup:** shoda na tom, co stavíme.

---

## Fáze 1 – MVP jádra („je to vůbec zábava?")

Cíl: **jeden hratelný souboj** na malé desce, žádná ekonomika, pevný balíček.

- [ ] Deska + vykreslení mřížky, dvě Královny.
- [ ] Pravidlo přiléhavého pokládání.
- [ ] Energie + tahy.
- [ ] Souboj: útok, dostřel, protiúder, ničení, HP.
- [ ] ~15–20 karet z [ukázkového setu](04-seznam-karet.md) (jen základní keywordy: Vylož, Skon, Úsvit, Damage/Heal/Štít).
- [ ] Vítězná podmínka (padne Královna).
- [ ] Nejjednodušší bot (skóruje 1 akci dopředu).

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

## Fáze 4 – Meta a leštění

- [ ] Progrese mezi runy (odemykání karet, volitelné Královny).
- [ ] Výzvy / mutátory.
- [ ] Balancování celého poolu, tuning ekonomiky.
- [ ] (Volitelně) multiplayer hráč vs. hráč.

---

## Průřezová zásada

Po celou dobu: **karty jsou data, ne kód** (viz [schéma](04-seznam-karet.md)). Engine umí konečnou sadu triggerů/efektů/cílů; přidání karty nikdy nesmí znamenat psaní nové speciální logiky. Tohle je to, co umožní dojít ke 100–200 kartám, aniž se projekt zhroutí pod vlastní vahou.
