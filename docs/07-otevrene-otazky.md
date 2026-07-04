# 07 – Otevřené otázky

Rozhodnutí, která je potřeba dořešit. U každého je **můj doporučený default** (co jsem prozatím zapsal do designu), ať se dá stavět dál, a alternativa. Jak je rozhodneme, přesune se pravidlo do příslušného dokumentu a otázka se odsud smaže.

| # | Otázka | Můj default | Alternativa / poznámka |
|---|---|---|---|
| 1 | **Sousedství pro pokládání** – 8 políček (i diagonály), nebo 4 (jen ortho)? | **8-sousedství** (ladí se směrovými schopnostmi) | 4-ortho zpomalí a zpřísní expanzi — možná lepší pro pomalejší, šachovější hru |
| 2 | **Velikost desky** | **7×6** | menší = rychlejší/agresivnější, větší = víc manévru; ladit playtestem |
| 3 | **Chodí karty po desce?** | **Ne** (statické, přesun jen schopnostmi) | pohyb (Duelyst-style) přidá hloubku, ale i mikromanagement a složitost |
| 4 | **Model zdrojů** | **Rampující energie** (1→10, HS-style) | pevná energie / mana-krystaly jako karty / action pointy |
| 5 | **Má Královna vlastní útok a schopnost?** | **Malý útok + volitelná signature schopnost** | úplně pasivní Královna = čistší, ale míň zajímavá |
| 6 | **Protiúder v boji zblízka** | **Ano** (obránce vrací sílu, jako HS) | bez protiúderu = agresivnější, jednodušší |
| 7 | **Únava z vyložení (summoning sickness)** | **Ano** (kromě keywordu *Nájezd*) | bez ní hrozí „vylož a hned zabij Královnu" |
| 8 | **Limit kopií karty v balíčku** | **Podle rarity** (common víc, legendary 1) | jednotný limit (např. max 2) je jednodušší |
| 9 | **Přetečení ruky** | **pálí se přebytek** (HS-style) | tvrdý zákaz dobrat / žádný limit |
| 10 | **Obě Královny padnou naráz** | **prohrává aktivní hráč** | remíza |
| 11 | **Jazyk názvů/keywordů v kódu** | **strojové id anglicky, UI/docs česky** | vše česky / vše anglicky |
| 12 | **Tech stack** | *nerozhodnuto* — viz níže | |

## K bodu 12 — technologie (až budeme u kódu)

Zatím nezavírám, ale pro tenhle typ hry (2D mřížka, data-driven karty, poběží ideálně i v prohlížeči) dávají smysl:

- **Web (TypeScript + Canvas/Pixi.js, nebo React pro UI + herní plátno)** — nejsnadnější sdílení, hraje se v prohlížeči, rychlá iterace. **Můj tip pro prototyp.**
- **Godot** — pokud chceme nativní/desktopové vydání a pohodlný editor scén.
- **Unity** — nejvíc možností, ale těžší a pomalejší iterace pro malý projekt.

Doporučení: **prototyp v TypeScriptu na webu** — jádro (deska, přiléhavost, souboj) se dá ověřit ve dnech a hraje se odkudkoli. Rozhodneme, až budeme opouštět fázi designu.

---

## Otázky na tebe (Honzo)

Tyhle bych rád slyšel od tebe, ať míříme správně:

1. **Ladíš spíš k rychlé agresivní hře, nebo k pomalejší „šachové" taktice?** (ovlivní body 1–3, 6)
2. **Cílová platforma** — hraješ si s tím pro sebe / web / mobil / Steam? (ovlivní tech i rozsah)
3. **Solo hra proti botovi je cíl, nebo časem i multiplayer** hráč vs. hráč?
4. **Vizuální styl** — „klasické hrací karty s vlastnostmi" (jak jsi psal) vs. ilustrované jednotky. Máš představu?
