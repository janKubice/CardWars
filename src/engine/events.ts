import type { AbilityDef, CardInstance, GameState, PlayerId, Position } from './types.ts';
import { TRIGGERS } from './types.ts';
import { placeOnGrid, removeFromGrid, isEmpty, key } from './board.ts';
import { getEffect, getTarget } from './registries.ts';
import type { TriggerData } from './registries.ts';
import { instantiate, opponent } from './factory.ts';
import { nextInt } from './rng.ts';
import { pushLog } from './log.ts';
import { recomputeAuras } from './auras.ts';

// ─────────────────────────────────────────────────────────────────────────
//  FRONTA UDÁLOSTÍ — řetězení efektů BEZ rekurze.
//  Vše (poškození, léčení, smrt, triggery, běh schopnosti) je událost.
//  Efekty jen vkládají další události; smyčka je odbavuje jednu po druhé.
//  Díky tomu combo řetězce (A zabije B -> Skon B zraní C -> reakce C ...)
//  probíhají deterministicky a nespadnou na hloubce zásobníku.
// ─────────────────────────────────────────────────────────────────────────

export type GameEvent =
  | { type: 'damage'; uid: number; amount: number; sourceUid?: number }
  | { type: 'heal'; uid: number; amount: number }
  | { type: 'shield'; uid: number; amount: number }
  | { type: 'buff'; uid: number; atk?: number; hp?: number }
  | { type: 'destroy'; uid: number; sourceUid?: number; reason?: string }
  | { type: 'fireTrigger'; uid: number; trigger: string; data?: TriggerData }
  | { type: 'runAbility'; ability: AbilityDef; sourceUid: number; data?: TriggerData };

/** API, které efekty dostávají. Metody vkládají primitivní události do fronty. */
export interface EffectAPI {
  state: GameState;
  sourceUid: number;
  damage(uid: number, amount: number, sourceUid?: number): void;
  heal(uid: number, amount: number): void;
  shield(uid: number, amount: number): void;
  buff(uid: number, atk: number, hp: number): void;
  destroy(uid: number, sourceUid?: number): void;
  spawn(defId: string, owner: PlayerId, pos: Position): CardInstance | null;
  setTerrain(pos: Position, type: string, params?: Record<string, unknown>): void;
  discardRandomFromHand(owner: PlayerId): void;
  draw(owner: PlayerId, count: number): void;
  swap(uidA: number, uidB: number): void;
  rngInt(n: number): number;
  log(code: string, params?: Record<string, string | number>): void;
}

export class EffectRunner {
  state: GameState;
  private queue: GameEvent[] = [];

  constructor(state: GameState) {
    this.state = state;
  }

  enqueue(ev: GameEvent): void {
    this.queue.push(ev);
  }

  /** Odbaví celou frontu (i nově přibylé události). Zastaví se při vítězství. */
  drain(): void {
    let guard = 0;
    while (this.queue.length > 0) {
      if (this.state.winner) break;
      if (guard++ > 20000) {
        pushLog(this.state, 'guard');
        break;
      }
      const ev = this.queue.shift() as GameEvent;
      this.resolve(ev);
    }
    // po vyřešení všech událostí přepočítej aury (deska se mohla změnit)
    recomputeAuras(this.state);
  }

  private card(uid: number): CardInstance | undefined {
    return this.state.cards.get(uid);
  }

  private resolve(ev: GameEvent): void {
    switch (ev.type) {
      case 'damage':
        this.resolveDamage(ev.uid, ev.amount, ev.sourceUid);
        break;
      case 'heal':
        this.resolveHeal(ev.uid, ev.amount);
        break;
      case 'shield': {
        const c = this.card(ev.uid);
        if (!c || c.zone !== 'board') break;
        c.shield += ev.amount;
        this.enqueue({ type: 'fireTrigger', uid: ev.uid, trigger: TRIGGERS.onShield, data: { amount: ev.amount } });
        break;
      }
      case 'buff': {
        const c = this.card(ev.uid);
        if (!c || c.zone === 'dead') break;
        // trvalý buff útoku jde do baseAttack (aury se dopočítají zvlášť)
        if (ev.atk) c.baseAttack = Math.max(0, c.baseAttack + ev.atk);
        if (ev.hp) {
          c.maxHp += ev.hp;
          c.hp += ev.hp;
        }
        break;
      }
      case 'destroy':
        this.resolveDestroy(ev.uid, ev.sourceUid);
        break;
      case 'fireTrigger':
        this.resolveTrigger(ev.uid, ev.trigger, ev.data);
        break;
      case 'runAbility':
        this.resolveAbility(ev.ability, ev.sourceUid, ev.data);
        break;
    }
  }

  private resolveDamage(uid: number, rawAmount: number, sourceUid?: number): void {
    const c = this.card(uid);
    if (!c || c.zone !== 'board' || rawAmount <= 0) return;

    let amount = rawAmount;
    if (c.keywords.includes('fragile')) amount += 1; // Křehkost

    const absorbed = Math.min(c.shield, amount);
    c.shield -= absorbed;
    const dealt = amount - absorbed;
    if (dealt <= 0) {
      pushLog(this.state, 'shieldAbsorb', { card: c.defId, n: absorbed });
      return;
    }
    c.hp -= dealt;
    pushLog(this.state, 'damage', { card: c.defId, n: dealt });
    this.enqueue({ type: 'fireTrigger', uid, trigger: TRIGGERS.wound, data: { amount: dealt, sourceUid } });
    if (c.hp <= 0) this.enqueue({ type: 'destroy', uid, sourceUid, reason: 'zabit' });
  }

  private resolveHeal(uid: number, amount: number): void {
    const c = this.card(uid);
    if (!c || c.zone !== 'board' || amount <= 0) return;
    const before = c.hp;
    c.hp = Math.min(c.maxHp, c.hp + amount);
    const healed = c.hp - before;
    if (healed > 0) {
      pushLog(this.state, 'heal', { card: c.defId, n: healed });
      this.enqueue({ type: 'fireTrigger', uid, trigger: TRIGGERS.onHeal, data: { amount: healed } });
    }
  }

  private resolveDestroy(uid: number, sourceUid?: number): void {
    const c = this.card(uid);
    if (!c || c.zone === 'dead') return;
    c.zone = 'dead';
    if (c.pos) removeFromGrid(this.state, c.pos);
    const deadPos = c.pos;
    c.pos = null;
    pushLog(this.state, 'destroy', { card: c.defId });

    // Skon (deathrattle)
    this.enqueue({ type: 'fireTrigger', uid, trigger: TRIGGERS.death, data: { pos: deadPos } });

    // Zabití (on-kill) pro zdroj
    if (sourceUid != null && sourceUid !== uid) {
      const src = this.card(sourceUid);
      if (src && src.zone === 'board') {
        this.enqueue({ type: 'fireTrigger', uid: sourceUid, trigger: TRIGGERS.kill, data: { victimUid: uid, pos: deadPos } });
      }
    }

    // Vítězná podmínka: padla Královna.
    if (c.isQueen) {
      this.state.winner = opponent(c.owner);
      pushLog(this.state, 'queenFell', { owner: c.owner, winner: this.state.winner });
    }
  }

  private resolveTrigger(uid: number, trigger: string, data?: TriggerData): void {
    const c = this.card(uid);
    if (!c || c.zone === 'dead') return;
    for (const ability of c.abilities) {
      if (ability.trigger === trigger) {
        this.enqueue({ type: 'runAbility', ability, sourceUid: uid, data });
      }
    }
  }

  private resolveAbility(ability: AbilityDef, sourceUid: number, data?: TriggerData): void {
    const resolver = getTarget(ability.target);
    const effect = getEffect(ability.effect);
    if (!resolver) {
      pushLog(this.state, 'unknownTarget', { name: ability.target });
      return;
    }
    if (!effect) {
      pushLog(this.state, 'unknownEffect', { name: ability.effect });
      return;
    }
    const params = ability.params ?? {};
    const targets = resolver(this.state, sourceUid, params, data);
    effect(this.makeApi(sourceUid), params, targets, sourceUid, data);
  }

  /** Sestaví EffectAPI navázané na zdrojovou kartu (výchozí zdroj poškození). */
  makeApi(sourceUid: number): EffectAPI {
    const runner = this;
    const state = this.state;
    return {
      state,
      sourceUid,
      damage(uid, amount, src) {
        runner.enqueue({ type: 'damage', uid, amount, sourceUid: src ?? sourceUid });
      },
      heal(uid, amount) {
        runner.enqueue({ type: 'heal', uid, amount });
      },
      shield(uid, amount) {
        runner.enqueue({ type: 'shield', uid, amount });
      },
      buff(uid, atk, hp) {
        runner.enqueue({ type: 'buff', uid, atk, hp });
      },
      destroy(uid, src) {
        runner.enqueue({ type: 'destroy', uid, sourceUid: src ?? sourceUid, reason: 'efekt' });
      },
      spawn(defId, owner, pos) {
        if (!isEmpty(state, pos)) return null;
        const inst = instantiate(state, defId, owner, 'board');
        placeOnGrid(state, inst.uid, pos);
        runner.enqueue({ type: 'fireTrigger', uid: inst.uid, trigger: TRIGGERS.deploy });
        pushLog(state, 'summon', { card: inst.defId });
        return inst;
      },
      setTerrain(pos, type, params) {
        state.terrain.set(key(pos), { type, params });
      },
      discardRandomFromHand(owner) {
        const p = state.players[owner];
        if (p.hand.length === 0) return;
        const idx = nextInt(state.rng, p.hand.length);
        const uid = p.hand[idx];
        p.hand.splice(idx, 1);
        const c = state.cards.get(uid);
        if (c) c.zone = 'dead';
        pushLog(state, 'discard', { owner, card: c?.defId ?? 'queen' });
      },
      draw(owner, count) {
        drawCards(state, owner, count);
      },
      swap(uidA, uidB) {
        const a = state.cards.get(uidA);
        const b = state.cards.get(uidB);
        if (!a?.pos || !b?.pos) return;
        const pa = a.pos;
        const pb = b.pos;
        placeOnGrid(state, uidA, pb);
        placeOnGrid(state, uidB, pa);
        pushLog(state, 'swap', { src: a.defId, tgt: b.defId });
      },
      rngInt(n) {
        return nextInt(state.rng, n);
      },
      log(code, params) {
        pushLog(state, code, params);
      },
    };
  }
}

/** Dobírání karet z balíčku do ruky (respektuje limit — přebytek se pálí). */
export function drawCards(state: GameState, owner: PlayerId, count: number): void {
  const p = state.players[owner];
  for (let i = 0; i < count; i++) {
    const defId = p.deck.shift();
    if (!defId) return; // prázdný balíček — MVP bez únavy
    const inst = instantiate(state, defId, owner, 'hand');
    if (p.hand.length >= p.handLimit) {
      inst.zone = 'dead';
      pushLog(state, 'burn', { card: inst.defId });
      continue;
    }
    p.hand.push(inst.uid);
  }
}
