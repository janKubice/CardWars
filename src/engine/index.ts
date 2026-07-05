// Veřejné API enginu. Import tohoto souboru zaregistruje i vestavěné efekty/cíle.
export * from './types.ts';
export * from './board.ts';
export * from './directions.ts';
export * from './registries.ts';
export * from './events.ts';
export * from './factory.ts';
export * from './auras.ts';
export * from './game.ts';
export { makeRng, nextFloat, nextInt, pick } from './rng.ts';

// Side-effect: registrace vestavěných efektů a cílů.
import './effects.ts';
import './targeting.ts';
