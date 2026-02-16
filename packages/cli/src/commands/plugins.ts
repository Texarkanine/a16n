import type { A16nEngine } from '@a16njs/engine';
import type { CommandIO } from './io.js';

/**
 * Execute the plugins command.
 *
 * Lists all available plugins registered in the engine.
 * Uses CommandIO for testability.
 *
 * @param engine - The a16n engine instance
 * @param io - I/O abstraction for output
 */
export function handlePlugins(
  engine: A16nEngine,
  io: CommandIO,
): void {
  const plugins = engine.listPlugins();

  io.log('Available plugins:\n');
  for (const plugin of plugins) {
    io.log(`  ${plugin.id}`);
    io.log(`    Name: ${plugin.name}`);
    io.log(`    Supports: ${plugin.supports.join(', ')}\n`);
  }
}
