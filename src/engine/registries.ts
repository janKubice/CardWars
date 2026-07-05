import type { CardInstance, GameState } from './types.ts';
import type { EffectAPI } from './events.ts';

// ─────────────────────────────────────────────────────────────────────────
//  REGISTRY = jádro modularity.
//  Nový efekt / nový cíl = zaregistruj handler pod klíčem. Nikdy se nesahá
//  do enginu (fronta událostí, řešení triggerů) — ten jen volá registr.
// ─────────────────────────────────────────────────────────────────────────

/** Data předaná efektu z kontextu triggeru (např. uid oběti u 'kill'). */
export type TriggerData = Record<string, unknown> | undefined;

/**
 * Efekt: dostane API (helpery, které vkládají primitivní události do fronty),
 * parametry karty, vyřešené cíle a uid zdroje. Nic nevrací — jen enqueue/mutace.
 */
export type EffectHandler = (
  api: EffectAPI,
  params: Record<string, unknown>,
  targets: CardInstance[],
  sourceUid: number,
  data: TriggerData,
) => void;

/** Cíl: z herního stavu + zdroje + parametrů vrátí seznam zasažených karet. */
export type TargetResolver = (
  state: GameState,
  sourceUid: number,
  params: Record<string, unknown>,
  data: TriggerData,
) => CardInstance[];

const effects = new Map<string, EffectHandler>();
const targets = new Map<string, TargetResolver>();

export function registerEffect(keyName: string, handler: EffectHandler): void {
  if (effects.has(keyName)) throw new Error(`Efekt '${keyName}' je už zaregistrovaný`);
  effects.set(keyName, handler);
}

export function registerTarget(keyName: string, resolver: TargetResolver): void {
  if (targets.has(keyName)) throw new Error(`Cíl '${keyName}' je už zaregistrovaný`);
  targets.set(keyName, resolver);
}

export function getEffect(keyName: string): EffectHandler | undefined {
  return effects.get(keyName);
}

export function getTarget(keyName: string): TargetResolver | undefined {
  return targets.get(keyName);
}

export function knownEffects(): string[] {
  return [...effects.keys()];
}

export function knownTargets(): string[] {
  return [...targets.keys()];
}
