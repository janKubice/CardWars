# 01 – Vize

## Elevator pitch

> **CardWars** je roguelike deckbuilder, ve kterém pokládáš karty na sdílenou mřížku a expanduješ z vlastní Královny. Karty mají život, sílu, dostřel a směrové schopnosti. Nesmíš klást dál než jedno políčko od svých karet, takže mezi tebou a botem vzniká pohyblivá fronta. Cíl: zabít soupeřovu Královnu. Mezi souboji nakupuješ a vylepšuješ karty a stavíš stále silnější balíček.

## Z čeho hra vychází (a čím se liší)

Nápad nevznikl ve vzduchoprázdnu — sousedí s několika hrami. Důležité je vědět, **od čeho si co bereme** a **kde jsme jinde**, aby výsledek nebyl „levnější klon".

| Hra | Co si bereme | V čem jsme jinde |
|---|---|---|
| **Balatro** | Roguelike smyčka, mezi koly upgraduješ, eskalující obtížnost, radost z komb | Balatro je čistě skórovací poker bez desky a bez soupeře. My máme oboustranný souboj na mřížce. |
| **Hearthstone** | Karty s životem/silou, keywordy (deathrattle apod.), „zabij hrdinu", možnost ničit i vlastní karty | HS má prakticky nezáleží-na-pozici board (řada beze smyslu směru). U nás je **pozice a směr jádro hry**. |
| **Duelyst** (nejbližší příbuzný) | Jednotky na čtvercové mřížce, na pozici záleží, směrové efekty | Duelyst je klasické CCG s manou a stavěním balíčku předem. My přidáváme **roguelike ekonomiku** a hlavně **pravidlo přiléhavého pokládání** (expanze z Královny). |
| **Slay the Spire / Wildfrost** | Struktura runu, obchod, „build" kolem synergií | Ty jsou single-player proti vlnám. My máme symetrický cíl „zabij Královnu" i pro bota. |
| **Šachy / regicida** | Vítězíš sejmutím jedné klíčové figury (král/Královna) | K tomu přidáváme sbírání karet, schopnosti a náhodu balíčku. |
| **Blokus / area control** | „Nová karta musí navazovat na tvé území" | My z toho děláme bojovou mechaniku, ne jen zabírání ploch. |

**Závěr:** samotné střípky existují, ale **konkrétní kombinace** — territoriální expanze z Královny + směrové schopnosti + regicida + roguelike obchod — jako ucelená hra nikde 1:1 neběží. Nejblíž je Duelyst, ale ten nemá ani expanzní pokládání, ani roguelike vrstvu. Prostor tu je.

## Má to potenciál? (můj upřímný názor)

**Ano, a docela slušný — pod jednou podmínkou.** Silné stránky:

- **Pravidlo přiléhavosti je ta „jedna nová věc".** Každá dobrá hra má jeden mechanismus, který ji definuje. Tady je to expanze z Královny: nemůžeš teleportovat přes desku, musíš si cestu k nepříteli *prostavět*, a tím vzniká fronta, obklíčení, průlomy. To je čitelné na jednu větu a přitom hluboké.
- **Směrové schopnosti + volný souboj dávají obrovský prostor pro synergie.** Přesně to, na čem stojí replayability roguelike deckbuilderů. Combo potenciál (řetězení výbuchů, obětování vlastních karet kvůli deathrattle…) je tu přirozený.
- **„Zabij Královnu" je čitelný cíl.** Nováček to pochopí za tři vteřiny, veterán kolem toho staví strategie.
- **Roguelike smyčka řeší „proč hrát dál".** Sbírání a upgrady jsou osvědčený návykový motor.

**Riziko č. 1 (a jediné vážné): rozsah.** 100–200 karet + taktika na mřížce + roguelike ekonomika + slušná AI je *hodně*. Klasická past nezkušených herních projektů. Proto v [roadmapě](08-roadmapa.md) tlačím na tvrdé MVP: malá deska, ~20–30 karet, pevný balíček, jednoduchý bot. Až když je *jádro zábavné na 5 minut*, přidává se obchod a rozšiřuje se pool karet.

**Riziko č. 2: čitelnost.** Směrové schopnosti na sdílené desce se snadno stanou nečitelnými („co je vlastně vpřed?"). Řešíme to designově — směry jsou vždy **relativní k majiteli** (vpřed = k nepříteli). Viz [herní design](02-herni-design.md).

Kdybych měl vsadit: **jádro (deska + přiléhavost + souboj + Královna) může být zábavné hodně brzy.** To je dobré znamení — znamená to, že se dá rychle ověřit, jestli nápad „drží".

## Design pilíře

Tři věty, kterými poměřujeme každé budoucí rozhodnutí:

1. **Na pozici záleží.** Když nějaká mechanika ignoruje, kde karta stojí, je podezřelá.
2. **Expanze vytváří napětí.** Nemůžeš být všude. Rozhodnutí „kam růst" musí bolet.
3. **Kombo > síla jednotlivé karty.** Legendární karta není silná sama o sobě — je silná tím, co umožní.
