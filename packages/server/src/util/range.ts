import type { lsp } from '@regex-radar/lsp-types';

/**
 * Test if range `a` is in range `b`. Check is inclusive (`>=`, `<=`).
 * Overlapping range will return `false`
 */
export function isInRange(a: lsp.Range, b: lsp.Range) {
    return (
        a.start.line >= b.start.line &&
        a.start.character >= b.start.character &&
        a.end.line <= b.end.line &&
        a.end.character <= b.end.character
    );
}
