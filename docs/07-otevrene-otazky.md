# 07 – Rozhodnutá pravidla a otevřené otázky

Dřív seznam otevřených otázek; teď hlavně **záznam rozhodnutí** (decision log). Rozhodnutá pravidla jsou už promítnutá do příslušných designových dokumentů — tady zůstávají pro přehled „proč to tak je".

## Rozhodnuto (jádro)

| # | Otázka | Rozhodnutí |
|---|---|---|
| 1 | Sousedství pro pokládání | **8-sousedství** (ortogonálně + diagonály) |
| 2 | Velikost desky | **7×6** (ladit playtestem) |
| 3 | Chodí karty po desce? | **Ne** — statické, přesun jen schopnostmi (swap) |
| 4 | Model zdrojů | **Rampující energie** 1→10 (HS-style) |
| 5 | Královna | **malý vlastní útok + volitelná signature schopnost** |
| 6 | Protiúder v boji zblízka | **Ano** (obránce vrací sílu) |
| 7 | Únava z vyložení | **Ano** (kromě keywordu *Nájezd*) |
| 8 | Limit kopií v balíčku | **Podle rarity, ale velkoryse:** common 4 / uncommon 3 / rare 3 / epic 2 / legendary 1 |
| 9 | Přetečení ruky | **pálí se přebytek** |
| 9b | Prázdný balíček | **Únava (fatigue):** rostoucí zranění vlastní Královny — zaručuje konec hry *(přidáno při stavbě MVP, řešilo 1/20 zaseknutých botích partií)* |
| 10 | Obě Královny padnou naráz | **prohrává aktivní hráč** |
| 11 | Jazyk v kódu | **strojové id anglicky, UI/docs česky** |
| 12 | Tech / platformy | **MVP single-file HTML → itch; plná verze C#/Unity → Steam; MP+ELO později** (viz [09](09-technologie.md)) |

## Směr hry (Honzovy odpovědi)

- **Tempo:** spíš **rychlejší / agresivnější** než pomalá šachovina. → severka pro balancování, viz [herní design](02-herni-design.md).
- **Platforma:** **nejdřív web (itch), pak Steam.**
- **Multiplayer:** **nejdřív solo vs. bot; MP + ELO až později** na Steamu.
- **Vizuál:** **jen kartičky se schopnostmi** (klasické karty s vlastnostmi), žádné ilustrované jednotky. → render zvládne DOM/CSS, zrychluje MVP.

## Nové / zbývající otevřené otázky

Tyhle se budou řešit hlavně playtestem nebo až u konkrétní fáze:

| Téma | Poznámka |
|---|---|
| Přesné hodnoty tempa | HP Královny (~30?), start energie, ceny agro karet — doladit tak, aby hra **končila**, ne se táhla |
| „Hluchý" první tah | se startem 1 energie a málem 1-drop karet se často v 1. tahu nedá nic zahrát. Řešení: víc levných karet, mulligan, nebo start s víc energií. Doladit ve Fázi 2. |
| Přesná čísla limitů kopií | výše je návrh; upravit podle toho, jak silná se ukážou komba |
| Odměny / křivka ekonomiky | kolik zlata za výhru, ceny v obchodě, cena rerollu — až bude obchod (Fáze 2) |
| MP netcode | autoritativní server vs. lockstep — engine držíme deterministický, ať je to pak snadné (řeší se u Steam verze) |
| ELO/MMR detaily | párování, žebříčky, sezóny — až bude MP |
