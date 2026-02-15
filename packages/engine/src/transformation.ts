import type { AgentCustomization, A16nPlugin, EmitResult, Warning } from '@a16njs/models';
import { buildMapping, rewriteContent, detectOrphans } from './path-rewriter.js';

/**
 * Context provided to a content transformation during the conversion pipeline.
 */
export interface TransformationContext {
  /** The items to transform */
  items: AgentCustomization[];
  /** The source plugin */
  sourcePlugin: A16nPlugin;
  /** The target plugin */
  targetPlugin: A16nPlugin;
  /** Root directory for source (discovery) */
  sourceRoot: string;
  /** Root directory for target (emission) */
  targetRoot: string;
  /**
   * Perform a trial emission (dry-run) to discover file mapping.
   * Only available when dryRun is false; stateful transformations
   * like path rewriting use this to know target paths without
   * actually writing files.
   */
  trialEmit: (items: AgentCustomization[]) => Promise<EmitResult>;
}

/**
 * Result of applying a content transformation.
 */
export interface TransformationResult {
  /** The transformed items */
  items: AgentCustomization[];
  /** Warnings produced by this transformation */
  warnings: Warning[];
}

/**
 * A composable content transformation in the conversion pipeline.
 *
 * Transformations receive discovered items and produce transformed items.
 * They run in sequence between discovery and final emission, enabling
 * composable, extensible processing without double emission.
 *
 * @example
 * ```typescript
 * const transform: ContentTransformation = {
 *   id: 'path-rewriting',
 *   name: 'Path Reference Rewriting',
 *   transform: async (context) => {
 *     // Transform items...
 *     return { items: transformedItems, warnings: [] };
 *   },
 * };
 * ```
 */
export interface ContentTransformation {
  /** Unique identifier for this transformation */
  id: string;
  /** Human-readable name */
  name: string;
  /**
   * Apply this transformation to the items.
   * @param context - The transformation context with items, plugins, and trial emit
   * @returns Transformed items and any warnings
   */
  transform(context: TransformationContext): Promise<TransformationResult>;
}

/**
 * Path rewriting transformation.
 *
 * Rewrites file path references in content during format conversion.
 * Uses a trial emission to discover the source-to-target path mapping,
 * then rewrites all path references in content. Also detects orphan
 * references (paths that weren't converted) using plugin-provided
 * path patterns.
 *
 * This replaces the hardcoded path rewriting logic that was previously
 * embedded in the engine's convert() method, eliminating the need for
 * double emission and removing hardcoded plugin knowledge.
 *
 * @example
 * ```typescript
 * const transform = new PathRewritingTransformation();
 * engine.convert({
 *   source: 'cursor',
 *   target: 'claude',
 *   root: '/project',
 *   transformations: [transform],
 * });
 * ```
 */
export class PathRewritingTransformation implements ContentTransformation {
  readonly id = 'path-rewriting';
  readonly name = 'Path Reference Rewriting';

  async transform(context: TransformationContext): Promise<TransformationResult> {
    const warnings: Warning[] = [];

    // Trial emit to discover the path mapping
    const trialResult = await context.trialEmit(context.items);

    if (trialResult.written.length === 0) {
      // No files would be written → no mapping → return cloned items
      return {
        items: context.items.map((item) => ({ ...item })),
        warnings,
      };
    }

    // Build mapping from source paths to target paths
    const mapping = buildMapping(
      context.items,
      trialResult.written,
      context.sourceRoot,
      context.targetRoot,
    );

    // Rewrite path references in content
    const rewriteResult = rewriteContent(context.items, mapping);

    // Detect orphan references using plugin-provided path patterns
    const patterns = context.sourcePlugin.pathPatterns;
    if (patterns && patterns.prefixes.length > 0 && patterns.extensions.length > 0) {
      const orphanWarnings = detectOrphans(
        rewriteResult.items,
        mapping,
        patterns.prefixes,
        patterns.extensions,
      );
      warnings.push(...orphanWarnings);
    }

    return {
      items: rewriteResult.items,
      warnings,
    };
  }
}
