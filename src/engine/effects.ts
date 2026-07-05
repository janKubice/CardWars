import { registerEffect } from './registries.ts';
import { neighbors8, isEmpty } from './board.ts';
import { opponent } from './factory.ts';
import type { EffectAPI } from './events.ts';
import type { CardInstance } from './types.ts';

// Vestavěné efekty. Přidání nového efektu = jeden registerEffect níže,
// žádný zásah do fronty událostí ani do řešení triggerů.

function num(params: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    if (params[k] != null) return Number(params[k]);
  }
  return 1;
}

registerEffect('damage', (api, params, targets, sourceUid) => {
  const value = num(params, 'value', 'amount', 'damage');
  for (const t of targets) api.damage(t.uid, value, sourceUid);
});

registerEffect('heal', (api, params, targets) => {
  const value = num(params, 'value', 'amount', 'heal');
  for (const t of targets) api.heal(t.uid, value);
});

registerEffect('shield', (api, params, targets) => {
  const value = num(params, 'value', 'amount', 'shield');
  for (const t of targets) api.shield(t.uid, value);
});

registerEffect('buff', (api, params, targets) => {
  const atk = Number(params.atk ?? 0);
  const hp = Number(params.hp ?? 0);
  for (const t of targets) api.buff(t.uid, atk, hp);
});

registerEffect('destroy', (api, _params, targets) => {
  for (const t of targets) api.destroy(t.uid);
});

// Terén: položí stav (např. minu) na okolní VOLNÁ políčka zdroje.
// Tento efekt pracuje s buňkami, ne s kartami — proto si cíle řeší sám.
registerEffect('terrain', (api, params, _targets, sourceUid) => {
  const state = api.state;
  const c = state.cards.get(sourceUid);
  if (!c?.pos) return;
  const type = String(params.terrain ?? 'mine');
  const damage = num(params, 'damage', 'value');
  for (const p of neighbors8(state, c.pos)) {
    if (isEmpty(state, p)) api.setTerrain(p, type, { damage });
  }
  api.log('terrain', { card: c.defId, t: type });
});

// Zahodí náhodnou kartu z ruky protivníka zdroje.
registerEffect('discardRandom', (api, _params, _targets, sourceUid) => {
  const c = api.state.cards.get(sourceUid);
  if (!c) return;
  api.discardRandomFromHand(opponent(c.owner));
});

registerEffect('draw', (api, params, _targets, sourceUid) => {
  const c = api.state.cards.get(sourceUid);
  if (!c) return;
  api.draw(c.owner, num(params, 'value', 'count'));
});

// Odstrčení: posune cíl o 1 políčko směrem OD zdroje (pull = k zdroji).
function shove(api: EffectAPI, targets: CardInstance[], sourceUid: number, toward: boolean): void {
  const src = api.state.cards.get(sourceUid);
  if (!src?.pos) return;
  for (const t of targets) {
    if (!t.pos) continue;
    const dr = Math.sign(t.pos.row - src.pos.row) * (toward ? -1 : 1);
    const dc = Math.sign(t.pos.col - src.pos.col) * (toward ? -1 : 1);
    if (dr === 0 && dc === 0) continue;
    api.move(t.uid, { row: t.pos.row + dr, col: t.pos.col + dc });
  }
}
registerEffect('push', (api, _params, targets, sourceUid) => shove(api, targets, sourceUid, false));
registerEffect('pull', (api, _params, targets, sourceUid) => shove(api, targets, sourceUid, true));

// Vrátí cíl do ruky majitele (tempo).
registerEffect('bounce', (api, _params, targets) => {
  for (const t of targets) api.bounce(t.uid);
});

// Umlčení: odstraní schopnosti cíle.
registerEffect('silence', (api, _params, targets) => {
  for (const t of targets) api.silence(t.uid);
});

// Přivolá token na první volné políčko "vpřed" (nebo do okolí) od zdroje.
registerEffect('summon', (api, params, _targets, sourceUid) => {
  const state = api.state;
  const c = state.cards.get(sourceUid);
  if (!c?.pos) return;
  const defId = String(params.defId ?? '');
  if (!defId) return;
  for (const p of neighbors8(state, c.pos)) {
    if (isEmpty(state, p)) {
      api.spawn(defId, c.owner, p);
      return;
    }
  }
});
