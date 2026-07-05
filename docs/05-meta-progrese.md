# 05 – Meta-progrese, ekonomika a struktura runu

Tohle je roguelike vrstva „mezi koly" — motor, který dává důvod hrát dál. Vychází z Balatro / Slay the Spire / Super Auto Pets, ohnutý na naši hru.

---

## 1. Struktura runu

- Run = **série soubojů** proti botům rostoucí obtížnosti.
- Mezi souboji přijde **fáze obchodu** (nákup, upgrade, úprava balíčku).
- Obtížnost stoupá po „patrech" / „antech" — pozdější boti mají silnější balíčky, víc energie na start, nebo **bossové Královny** se signature schopností (viz níže).
- Run končí buď **prohrou** (padne tvoje Královna), nebo **dohráním poslední mety** (vítězství → odemyká se něco do meta-kolekce).

Návrh délky: ~8–12 soubojů na run, aby run trval desítky minut, ne hodiny.

---

## 2. Ekonomika

- Za výhru (a možná bonusy za styl — rychlá výhra, přežití Královny bez ztráty…) dostaneš **zlato**.
- Zlato utrácíš v obchodě mezi koly.

### Obchod nabízí:

| Akce | Efekt |
|---|---|
| **Koupit kartu** | přidá kartu do balíčku |
| **Vylepšit kartu** | zvedne Level karty (viz §3) |
| **Reroll** | přehodí nabídku obchodu (za zlato, cena roste) |
| **Odstranit kartu** | „ztenčení" balíčku — pryč se slabou kartou, ať častěji taháš to dobré |
| **Léčení Královny / relikvie** | pozdější rozšíření (meta perky) |

Nabídka obchodu se **škáluje s postupem**: čím dál v runu, tím vyšší šance na vzácnější karty (jako tiery v Super Auto Pets / balíčky v Balatro).

---

## 3. Vylepšování karet (Level) — *implementováno*

**Aktuální implementace (MVP):** v obchodě vylepšíš **druh karty** (ne jednotlivou kopii) → **+1 síla / +1 život** všem kopiím toho druhu v balíčku. Úrovně max 3, cena roste (3 → 6 → 9 zlata). Úroveň se aplikuje při instanciaci karty do souboje (`factory.ts`), engine ji drží per hráč (`PlayerState.levels`) — bot upgrady nemá.

Proč „na druh, ne na kopii": jednodušší datový model (balíček zůstává `string[]`), čitelnější UI a pořád platí ten správný trade-off — zlato do vylepšení = zlato, které nemáš na šířku balíčku.

**Budoucí rozšíření** (až bude potřeba hloubka):
- **posílení schopnosti** (Damage 2 → 3, Odpočet 3 → 2, Heal 1 → 2),
- na vyšší úrovni **odemknutí druhé schopnosti**,
- případně upgrade jednotlivé kopie (tall build) vedle druhového.

Pravidlo: upgrade je **volba, ne samozřejmost** — investice do síly vs. do šířky balíčku. Tenhle trade-off je jádro deckbuilderů.

---

## 4. Deck-building pravidla

- **Minimální/maximální velikost balíčku** (návrh: min 12, žádné tvrdé max, ale velký balíček ředí komba).
- **Kopie karet:** limit podle rarity, ale **velkoryse** (nechceme dusit buildy): common 4 / uncommon 3 / rare 3 / epic 2 / legendary 1. Přesná čísla doladíme podle toho, jak silná se ukážou komba.
- **Startovní balíček:** malý set common karet, ať mají všechny runy stejný čistý start a rozjezd dělá až obchod.

---

## 5. Bossové Královny (koření pozdějšího runu)

Aby run graduoval, pozdější soupeři mají **Královnu se signature schopností**, která mění pravidla souboje. Příklady:

- **Trnová Královna:** *Aura:* kdo na ni útočí zblízka, dostane 2 dmg.
- **Krvavá Královna:** za každou zničenou nepřátelskou kartu se vyléčí o 2.
- **Rojová Královna:** *Úsvit:* přivolá 1/1 token vedle sebe.
- **Zrcadlová Královna:** první poškození za tah odrazí zpět.

Tohle dává „bossům" osobitost a nutí měnit strategii — přesně jako elity/bossové ve Spire.

---

## 6. Meta mezi runy (dlouhodobý hák, pozdější fáze)

Až bude jádro hotové, můžeme přidat progresi *napříč* runy (odemyká se hraním, ne za reálné peníze):

- **Odemykání nových karet** do globálního poolu.
- **Volitelná Královna** na start runu (různé signature schopnosti = různé archetypy).
- **Výzvy / mutátory** pro znovuhratelnost.

Není to MVP — je to „proč se vrátit za měsíc". Zapisujeme, ať se na to nezapomene.
