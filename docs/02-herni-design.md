# 02 – Herní design (jádro)

Tenhle dokument popisuje, jak se hra reálně hraje. Čísla (velikost desky, výše energie…) jsou **výchozí návrh k vyladění**, ne posvátná — laděním se budeme zabývat při balancování.

> **Severka pro ladění: rychlejší, agresivnější hra.** Cílíme na svižné partie s tlakem na frontu, ne na pomalou šachovinu. Když se při balancování rozhodujeme mezi „bezpečnější/pomalejší" a „agresivnější/rychlejší", volíme to druhé — spíš dostupné útočné karty a Královna ne příliš tanková, aby hry **končily**, ne aby se táhly.

---

## 1. Deska

- **Jedna sdílená mřížka** pro oba hráče. Armády koexistují na stejné ploše a střetnou se uprostřed.
- Výchozí velikost: **7 sloupců × 6 řad** (tunable). Dost místa na manévr, dost malé na rychlou partii.
- Každý hráč má svůj **domovský okraj** (spodní vs. horní řada). Královna startuje na svém domovském okraji.
- Políčko drží maximálně **jednu kartu**. Kromě karty může mít políčko **stavy terénu** (mina, buff-zóna…) — viz [klíčová slova](03-karty-a-klicova-slova.md).

### Směr a „vpřed"

Aby směrové schopnosti dávaly na sdílené desce smysl, jsou **relativní k majiteli karty**:

- **Vpřed** = směrem k nepřátelskému domovskému okraji.
- **Vzad** = ke svému.
- **Boky / diagonály** se odvozují od toho.

Takže „diagonálně vpřed-vpravo dá 2 dmg" znamená pro každého hráče intuitivně „šikmo dopředu doprava", i když na absolutní mřížce míří opačně. Karta je vždy „otočená" k nepříteli.

---

## 2. Průběh partie

1. Na desce startují jen **dvě Královny** (každá na svém domovském okraji).
2. Hráči se **střídají v tazích**.
3. Během svého tahu hráč utrácí **energii** za akce (viz níže), dokud energii nevyčerpá nebo tah dobrovolně neukončí.
4. Partie končí ve chvíli, kdy **jedné Královně klesne život na 0**. Její majitel prohrál.

Volitelné remízové pravidlo: pokud padnou obě Královny naráz (např. plošný výbuch), rozhoduje, kdo tah provedl → hru vyhodnotíme jako prohru aktivního hráče (nebo prostě remíza — [otevřená otázka](07-otevrene-otazky.md)).

---

## 3. Energie (zdroj tempa)

Model po vzoru Hearthstone, protože dává „křivce" balíčku smysl a paceuje partii:

- Hráč začíná s **1 energií** za tah.
- Každý tah se **maximum zvýší o 1**, strop **10**.
- Energie se na začátku tahu **doplní na aktuální maximum** (nepřenáší se — utrať, nebo propadne).

Za co se energie platí:

| Akce | Cena |
|---|---|
| **Vyložení karty** | rovna `cost` karty |
| **Aktivní schopnost** (Active) | rovna ceně schopnosti (často 0–2) |
| **Útok kartou** | zdarma (ale limitováno pravidly útoku, viz §5) |

Tenhle mix znamená, že v jednom tahu můžeš buď vyložit jednu drahou kartu, nebo pár levných, nebo nevyložit nic a jen útočit/aktivovat. To je přesně ta volba, kterou chceme.

---

## 4. Pravidlo přiléhavého pokládání (srdce hry)

> **Novou kartu smíš položit jen na volné políčko, které sousedí s některou tvojí už vyloženou kartou (včetně Královny).**

- Sousedství = **8 okolních políček** (ortogonálně i diagonálně). Diagonály bereme proto, že směrové schopnosti s diagonálami počítají.
- Královna se počítá jako tvá karta → je to tvůj **výchozí „spawn point".**
- Když přijdeš o všechny karty kolem, expanduješ zase jen od Královny (a od čehokoli, co ještě stojí).

**Důsledky, které dělají hru zajímavou:**

- K nepřátelské Královně se musíš **prostavět** — vzniká řetěz/fronta.
- Můžeš být **odříznut**: když ti soupeř sebere karty na okraji tvé expanze, scvrkneš se.
- Repozicování (swap, posun) je **prémiové**, protože běžně kartu nepřesuneš.
- Vzniká přirozený **tlak na obranu Královny** — je to tvůj kotevní bod i tvůj slabý bod.

**Otevřená varianta:** ortogonální-only sousedství (4 políčka) by hru zpomalilo a zpřísnilo. Zatím jdeme s 8-sousedstvím, viz [otevřené otázky](07-otevrene-otazky.md).

---

## 5. Souboj

Karty jsou po vyložení **v zásadě statické** — nechodí po desce jako v RTS. Boj probíhá „z místa" pomocí síly a dostřelu. Přesuny dělají jen schopnosti (swap, „posuň se o 1"). Tím zůstává jádrem pokládání, ne mikromanagement.

### Statistiky relevantní pro boj

- **HP (život)** – kolik dmg karta vydrží.
- **Síla (attack)** – kolik dmg rozdá útokem.
- **Dostřel (range)** – na jakou vzdálenost umí útočit. `range 1` = jen sousední; vyšší = útok „přes" políčka (lučištník, dělo).

### Pravidla útoku

- Karta smí **jednou za tah zaútočit** na cíl v dosahu (nepřátelská karta, nebo Královna).
- **Únava z vyložení („summoning sickness"):** kartu vyloženou tento tah nelze týž tah použít k útoku (výjimka: keyword *Nájezd/Charge*). Dává to tempu smysl a brání to „vyložím a hned zabiju Královnu".
- Útok na sousedící kartu (`range 1`) obvykle znamená **protiúder**: obránce vrátí svou sílu útočníkovi (jako v HS). Útok na dálku (`range ≥ 2` na vzdálenější cíl) protiúder nevyvolá. → čitelná výhoda střelců, čitelná nevýhoda (nízké HP).
- Když kartě klesne HP na 0, je **zničena** (spustí případné *Skon*/Death efekty).

### Ničení vlastních karet

**Povoleno a záměrně.** Otevírá to combo prostor: obětuj kartu, abys spustil její *Skon* efekt, odpálil odpočítávanou bombu ve správný moment, uvolnil políčko, přerušil nepřátelskou auru… „Friendly fire" je feature, ne bug.

---

## 6. Karty v ruce a dobírání

- Hráč má **ruku** (skryté karty) a **balíček** (dobírací).
- Na začátku tahu **dobíráš** (výchozí: 1 karta/tah; některé karty a komba dobírání zrychlují).
- Strop ruky (výchozí ~10); přeteklé karty se pálí (nebo je nelze dobrat) — [otevřená otázka](07-otevrene-otazky.md).
- **Combo pokládání:** některé karty říkají „*Vylož: můžeš tento tah položit další kartu*" nebo vrací energii → řetězení více vyložení za tah. To je herní ekvivalent Balatro komb.

---

## 7. Královna

Královna není jen „terč s životem" — je to tvůj pilíř:

- Má **HP** (výrazně víc než běžná karta, výchozí ~30).
- Slouží jako **kotevní bod** pro přiléhavé pokládání.
- Návrhově zvažujeme, že má **malou vlastní sílu** (umí se bránit) a případně **jednu signature schopnost** (mohla by se lišit run od runu / být volitelná — hák pro meta-progresi, viz [05](05-meta-progrese.md)).
- Když padne, partie končí. **Veškerá obrana i útok se točí kolem těchto dvou figur.**

---

## 8. Shrnutí jednoho tahu (pseudo-flow)

```
ZAČÁTEK TAHU
  1. Zvyš max energie o 1 (strop 10), doplň energii.
  2. Vyřeš efekty „začátek tahu" a odpočty (Countdown -1, výbuchy…).
  3. Dober kartu/karty.
AKCE (opakuj, dokud máš energii / chuť):
  - Vylož kartu na přiléhavé políčko (zaplať cost).
  - Použij aktivní schopnost (zaplať cenu).
  - Zaútoč kartou (zdarma, 1×/kartu, ne s únavou z vyložení).
KONEC TAHU
  4. Vyřeš efekty „konec tahu".
  5. Předej tah soupeři.
```
