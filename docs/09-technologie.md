# 09 – Technologie a platformy

## Plán v čase

1. **MVP na webu → itch.io** jako **jeden self-contained HTML soubor** (rychlý test nápadu, sdílíš odkazem).
2. **Plná verze na Steam** v **C#/Unity** (pokud MVP zafunguje).
3. **Multiplayer + ELO** až později, na Steamu.

Solo vs. bot je celý MVP i první část Steam verze. MP je budoucnost.

---

## MVP: jeden HTML soubor

- **Jazyk:** TypeScript. Typová bezpečnost se u pravidlového enginu (řešení efektů, stavy karet) vyplatí.
- **Vykreslování:** „jen kartičky se schopnostmi" → **stačí DOM + CSS**, není potřeba herní engine ani Canvas/WebGL. Karta = HTML prvek s texty statů a schopností; deska = CSS grid 7×6. Nejjednodušší, nejčitelnější, nejrychleji hotové.
- **Build → jeden soubor:** bundler (**Vite + `vite-plugin-singlefile`**, nebo esbuild) slepí JS, CSS i data karet do jednoho `index.html`. Ten nahraješ na itch.io jako „HTML hru" (itch to umí spustit v iframe).
- **Žádný backend.** Vše běží v prohlížeči. Ukládání runu klidně do `localStorage`.

---

## Architektura (klíčová pro pozdější port do C#)

Aby pozdější přepis na Steam nebyl „napiš to celé znovu":

- **Oddělit ENGINE od RENDERU.** Engine = čistá logika: stav hry, legální tahy, řešení efektů (Trigger→Efekt→Cíl). Nezná DOM ani Unity. Render jen čte stav a kreslí + posílá akce zpět.
- **Karty jsou data (JSON), ne kód** — viz [datové schéma](04-seznam-karet.md). Přenese se do C# **1:1**, přepisuje se jen engine, obsah zůstává.
- **Engine deterministický** (seedovaná náhoda). Výhody: opakovatelné testy, replaye, a hlavně **snadný pozdější multiplayer** (autoritativní simulace, posílají se jen akce).

Když tohle dodržíme, port na Steam = přepsat relativně malý čistý engine do C#, ne celou hru.

---

## Full verze: Steam (C#/Unity)

- **Unity** kvůli distribuci na Steam, buildům na Win/Mac/Linux, vstupům a pohodlnému UI.
- Engine se přepíše do **C#**; JSON karet se recykluje beze změny.
- Render v Unity může být pořád „jen kartičky" (UI Toolkit / uGUI) — vizuál zůstává jednoduchý dle tvého zadání.

> Alternativa k Unity by byl **Godot (C#)** — lehčí, open-source, taky umí Steam. Rozhodneme, až tam budeme; teď to není potřeba řešit.

---

## Multiplayer + ELO (budoucnost)

- Díky deterministickému enginu: **autoritativní server** nebo lockstep — po síti jen **akce hráčů**, ne celý stav.
- Postup: nejdřív klidně **asynchronní / hot-seat**, pak **realtime 1v1**.
- **ELO/MMR** párování + žebříčky + sezóny. Řeší se, až je jádro a obsah hotové a odladěné.

---

## Zásada

**Nestavět Unity port ani multiplayer dřív, než je webové solo MVP zábavné a vyvážené.** Jinak děláme dvakrát práci na designu, který ještě není hotový. Web MVP je levná sonda, jestli nápad „drží" — teprve pak se investuje do Steam verze.
