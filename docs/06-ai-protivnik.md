# 06 – AI protivník (bot)

Bot má stejný cíl jako hráč: **zabít nepřátelskou Královnu a ubránit tu svoji.** Nemusí být geniální — musí být **čitelný, férový a slušný sparing partner**, který navíc s obtížností runu roste.

## 1. Přístup: heuristické skórování tahu

Ne strojové učení, ne hluboké prohledávání (aspoň ne v MVP). Bot v každém tahu:

1. **Vygeneruje legální akce** (kam smí položit karty dle přiléhavosti, koho může napadnout, co aktivovat).
2. **Ohodnotí** každou akci / krátkou sekvenci akcí skórovací funkcí.
3. **Zahraje** nejlépe ohodnocenou sekvenci, dokud má energii nebo dokud se skóre zlepšuje.

Tohle je levné, laditelné a dobře se odhaluje, proč bot něco udělal.

## 2. Skórovací funkce (co si bot cení)

Váhy jsou k ladění, ale směr:

- **+++ Poškození nepřátelské Královny** (hlavní cíl; blízko výhry ještě víc).
- **++ Výhodné trade** — zabít nepřátelskou kartu, aniž přijdu o svou (nebo za levnější).
- **+ Postup fronty** k nepřátelské Královně (přiléhavé pokládání směrem vpřed).
- **+ Tempo** — efektivně utracená energie (neplýtvat).
- **− Ohrožení vlastní Královny** (obrana, blokování políček kolem ní).
- **− Ztráta karty zadarmo** (nechat cennou kartu zabít bez protihodnoty).
- **kontextově:** hodnota keywordů (postavit Ochránce před ohroženou kartu, odpálit bombu, když stojí u nepřátel…).

## 3. Obtížnostní páky (jak bota zesilovat v runu)

Nejlíp škálovat **jednoduše a férově**, ne „bot cheatuje":

- **Kvalita balíčku bota** (silnější karty v pozdějších soubojích).
- **Hloubka plánování** (kolik akcí dopředu skóruje; 1 → krátké sekvence).
- **„Chybovost"** — u lehkých botů schválně s pravděpodobností zahraje druhou nejlepší akci (dělá je poраzitelnými a méně roboticky dokonalými).
- **Startovní zvýhodnění bossů** (víc energie / signature Královna, viz [meta](05-meta-progrese.md)) — férové, protože viditelné.

**Zásada:** raději bot, který dělá pochopitelné tahy a občas chybu, než neprůhledný „bůh". Frustrace z hry proti neférovému botu zabíjí roguelike.

## 4. Pozdější vylepšení (mimo MVP)

- Mělké prohledávání do hloubky (minimax/expectimax na pár tahů) pro těžké obtížnosti.
- Rozpoznání archetypu hráče a přizpůsobení.
- „Osobnosti" botů (agro / turtle / combo) pro pestrost soubojů.
