/**
 * novel-content-purifier-ts
 * =========================
 * A lightweight TypeScript text purifier for web novel platforms.
 * 用于网文平台的轻量级 TypeScript 文本净化工具库。
 *
 * This module re-exports all public APIs from the purifier and provides
 * a convenient quick‑entry function `cleanNovelText`.
 *
 * @module index
 */

export { purify, PurifierOptions, PurifyResult, PurifyStats } from './purifier';

/**
 * Convenience function to quickly purify a piece of web novel text.
 * Uses default options (ad removal, smart indent, paragraph fixing,
 * punctuation normalization all enabled).
 *
 * 便捷函数：快速净化一段网文文本。使用全部默认选项（广告移除、智能缩进、
 * 段落修复、标点规范化均已启用）。
 *
 * @param text - The raw text to purify. / 待净化的原始文本。
 * @returns The purified text string only (no stats). / 仅返回净化后的文本字符串（不含统计信息）。
 *
 * @example
 * ```typescript
 * import { cleanNovelText } from 'novel-content-purifier-ts';
 *
 * const clean = cleanNovelText('欢迎阅读【下载APP】获取更多章节...');
 * // Returns: '欢迎阅读获取更多章节...'
 * ```
 */
export function cleanNovelText(text: string): string {
  return purify(text).purified;
}
