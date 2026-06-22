/**
 * novel-content-purifier-ts — A lightweight TypeScript text purifier for web novel platforms.
 *
 * This module provides a core purification engine that strips out common advertisement
 * lines, pop-up text, and other unwanted artifacts found in scraped web novel content.
 * It supports smart indentation, paragraph formatting, and repeated punctuation cleanup.
 *
 * 网文内容净化核心模块 — 用于清除爬取网页小说时混入的广告、弹窗、推广等干扰文本。
 * 支持智能首行缩进、段落格式修复、重复标点清理等功能。
 *
 * @module purifier
 */

/**
 * Configuration options for the purify function.
 * 净化函数的配置选项接口。
 */
export interface PurifierOptions {
  /**
   * Whether to remove lines containing advertisement keywords. (default: true)
   * 是否移除包含广告关键词的行。（默认：true）
   */
  removeAdLines?: boolean;

  /**
   * Whether to apply smart first-line indentation (2 spaces) for each paragraph. (default: true)
   * 是否对每个段落应用智能首行缩进（2个空格）。（默认：true）
   */
  smartIndent?: boolean;

  /**
   * Whether to normalize paragraph spacing — ensures exactly one blank line between paragraphs. (default: true)
   * 是否规范化段落间距 — 确保段落之间有且只有一个空行。（默认：true）
   */
  fixParagraphs?: boolean;

  /**
   * Whether to remove repeated punctuation (e.g. !!! → !, ??? → ?, 。。。 → 。). (default: true)
   * 是否移除重复标点（如 !!! → !, ??? → ?, 。。。 → 。）。（默认：true）
   */
  removeRepeatedPunctuation?: boolean;

  /**
   * User-defined custom RegExp patterns for additional ad/filtering rules.
   * 用户自定义额外过滤规则的正则表达式数组。
   */
  customPatterns?: RegExp[];
}

/**
 * Statistics about the purification process.
 * 净化过程的详细统计信息。
 */
export interface PurifyStats {
  /** Number of advertisement lines removed / 被移除的广告行数 */
  adsRemoved: number;
  /** Number of paragraphs formatted / 被格式化的段落数 */
  paragraphsFormatted: number;
  /** Number of indents applied / 被应用的缩进数 */
  indentsApplied: number;
}

/**
 * Result object returned by the purify function.
 * purify 函数返回的结果对象。
 */
export interface PurifyResult {
  /** The original input text / 原始输入文本 */
  original: string;
  /** The purified output text / 净化后的输出文本 */
  purified: string;
  /** Total number of lines removed / 被移除的总行数 */
  removedLines: number;
  /** Detailed statistics / 详细统计信息 */
  stats: PurifyStats;
}

// ──────────────────────────────────────────────
// Built-in advertisement keyword patterns (Chinese)
// 内置中文广告/推广关键词模式列表
// ──────────────────────────────────────────────

/** 内置广告关键词模式（中文网文常见干扰文本） */
const AD_KEYWORDS: string[] = [
  '打赏',
  '催更',
  '加入书架',
  '收藏本站',
  '下载APP',
  '下载 App',
  '下载app',
  '手机阅读',
  '手机访问',
  '点击这里',
  '点击领取',
  '广告',
  '推广',
  '推荐票',
  '月票',
  '投推荐票',
  '投月票',
  '书友群',
  'VIP章节',
  'VIP 章节',
  '订阅',
  '自动订阅',
  '求订阅',
  '求推荐',
  '求收藏',
  '求打赏',
  '加更',
  '更新',
  '完本',
  '全本',
  '最新章节',
  '免费阅读',
  '最新章节',
  '首发',
  '最新章节',
  '请牢记',
  '本站域名',
  '章节错误',
  '点此举报',
  '无广告',
  '清爽阅读',
  '高速文字',
  '无弹窗',
  '返回书页',
  '上一章',
  '下一章',
  '目录',
  '首页',
  '看书就找',
  '下载txt',
  'txt下载',
  '电子书',
  '请安装',
  '客户端',
  '浏览器',
  'APP',
  'app',
  '扫码',
  '二维码',
  '微信公众号',
  '关注我们',
  '官方版',
  '网页版',
  '手机版',
];

/**
 * Build a single combined RegExp that matches any line containing at least one ad keyword.
 * The regex is anchored to match the entire line (with optional leading/trailing whitespace).
 * 构建一个组合正则表达式，匹配包含任意广告关键词的整行。
 */
function buildAdPattern(): RegExp {
  // Escape special regex chars in keywords
  const escaped = AD_KEYWORDS.map((kw) =>
    kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  // Match any keyword as a whole word / phrase — using word boundary approach for Chinese
  const pattern = `^\\s*(?:${escaped.join('|')}).*$`;
  return new RegExp(pattern, 'gim');
}

/** Cached combined ad pattern */
const AD_PATTERN = buildAdPattern();

/**
 * Regex to detect a line that is clearly just an ad/popup fragment.
 * Matches short lines consisting mostly of punctuation or numbers only.
 * 检测明显为广告/弹窗碎片的短行（纯标点或数字）。
 */
const JUNK_LINE_PATTERN = /^\s*[\d\s\-—·•*#@$%^&+=<>《》【】「」『』〔〕（）、，。！？：；""''.!,?:;'"…~·]{1,20}\s*$/gm;

/**
 * Regex to detect Chinese/English paragraph breaks.
 * 检测中英文段落分隔。
 */
const PARAGRAPH_BREAK = /\n\s*\n/g;

/**
 * Detect if a text block is likely a paragraph (contains at least some content characters).
 * 检测文本块是否为有效段落（包含至少一些内容字符）。
 */
function isContentLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // If it matches ad pattern, it's not content
  AD_PATTERN.lastIndex = 0;
  if (AD_PATTERN.test(trimmed)) return false;
  // If it's a junk line, it's not content
  JUNK_LINE_PATTERN.lastIndex = 0;
  if (JUNK_LINE_PATTERN.test(trimmed)) return false;
  return true;
}

/**
 * Remove lines that contain advertisement keywords.
 * 移除包含广告关键词的行。
 */
function removeAdLines(text: string): { result: string; removed: number } {
  const lines = text.split('\n');
  const kept: string[] = [];
  let removed = 0;

  for (const line of lines) {
    if (isContentLine(line)) {
      kept.push(line);
    } else {
      removed++;
    }
  }

  return { result: kept.join('\n'), removed };
}

/**
 * Apply smart indentation: prepend 2 spaces to the first line of each paragraph.
 * A paragraph is identified as a non-empty line preceded by a blank line or at the start.
 * 应用智能首行缩进：在每个段落的第一行前添加2个空格。
 */
function applySmartIndent(text: string): { result: string; indents: number } {
  const lines = text.split('\n');
  let indents = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Check if this is the first line of a paragraph:
    // (i === 0) OR previous line is empty OR previous line starts a new paragraph
    const isFirstLine = i === 0 || lines[i - 1].trim() === '';
    if (isFirstLine) {
      // Only indent if not already indented
      if (!lines[i].startsWith('  ') && !lines[i].startsWith('\t')) {
        lines[i] = '  ' + lines[i];
        indents++;
      }
    }
  }

  return { result: lines.join('\n'), indents };
}

/**
 * Fix paragraph spacing: ensure exactly one blank line between paragraphs.
 * Also removes leading/trailing blank lines.
 * 修复段落间距：确保段落之间有且只有一个空行。同时移除首尾空行。
 */
function fixParagraphSpacing(text: string): { result: string; formatted: number } {
  // Split by one or more blank lines to get paragraphs
  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const formatted = Math.max(0, paragraphs.length - 1);
  const result = paragraphs.join('\n\n');

  return { result, formatted };
}

/**
 * Remove repeated punctuation: replace 3+ consecutive identical punctuation marks with a single one.
 * 移除重复标点：将3个以上连续相同的标点替换为单个。
 */
function normalizePunctuation(text: string): string {
  return text
    // Chinese repeated punctuation
    .replace(/([！?？。，、；：]){3,}/g, '$1')
    // English repeated punctuation
    .replace(/([!?.,;:]){3,}/g, '$1')
    // Repeated ellipsis dots (。。。 or ...)
    .replace(/([.。]){4,}/g, '。。。')
    // Tilde repeats
    .replace(/([~～]){3,}/g, '$1')
    // Remove line-internal multiple spaces (but keep single spaces)
    .replace(/[ \t]{2,}/g, ' ');
}

/**
 * Purify web novel text by removing ads, fixing formatting, and normalizing punctuation.
 *
 * This is the main entry point for the purifier. It applies a series of cleaning steps
 * in a sensible order: ad removal → paragraph fixing → smart indent → punctuation cleanup.
 *
 * 净化网文文本：移除广告、修复格式、规范化标点。
 *
 * 这是净化器的主入口函数。按合理顺序应用一系列清洗步骤：
 * 广告移除 → 段落修复 → 智能缩进 → 标点清理。
 *
 * @param text - The raw input text containing potential ad artifacts. / 可能包含广告干扰的原始输入文本。
 * @param options - Optional configuration overrides. / 可选的配置覆盖项。
 * @returns A PurifyResult object with original, purified text, and statistics.
 *          包含原始文本、净化后文本和统计信息的 PurifyResult 对象。
 *
 * @example
 * ```typescript
 * import { purify } from 'novel-content-purifier-ts';
 *
 * const result = purify('欢迎阅读小说...【打赏】支持作者！', {
 *   removeAdLines: true,
 *   smartIndent: true,
 * });
 * console.log(result.purified); // Clean text without ad lines
 * console.log(result.stats.adsRemoved); // Number of ad lines removed
 * ```
 */
export function purify(
  text: string,
  options?: PurifierOptions
): PurifyResult {
  const opts: Required<PurifierOptions> = {
    removeAdLines: options?.removeAdLines ?? true,
    smartIndent: options?.smartIndent ?? true,
    fixParagraphs: options?.fixParagraphs ?? true,
    removeRepeatedPunctuation: options?.removeRepeatedPunctuation ?? true,
    customPatterns: options?.customPatterns ?? [],
  };

  let current = text;
  const stats: PurifyStats = {
    adsRemoved: 0,
    paragraphsFormatted: 0,
    indentsApplied: 0,
  };

  // Step 1: Remove advertisement lines (if enabled)
  // 步骤1：移除广告行
  if (opts.removeAdLines) {
    const adResult = removeAdLines(current);
    stats.adsRemoved = adResult.removed;
    current = adResult.result;
  }

  // Step 1.5: Apply user custom patterns (if any)
  // 步骤1.5：应用用户自定义模式
  if (opts.customPatterns.length > 0) {
    const lines = current.split('\n');
    const kept: string[] = [];
    let removed = 0;
    for (const line of lines) {
      let shouldRemove = false;
      for (const pattern of opts.customPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(line.trim())) {
          shouldRemove = true;
          break;
        }
      }
      if (shouldRemove) {
        removed++;
      } else {
        kept.push(line);
      }
    }
    stats.adsRemoved += removed;
    current = kept.join('\n');
  }

  // Step 2: Fix paragraph spacing (if enabled)
  // 步骤2：修复段落间距
  if (opts.fixParagraphs) {
    const fixResult = fixParagraphSpacing(current);
    stats.paragraphsFormatted = fixResult.formatted;
    current = fixResult.result;
  }

  // Step 3: Apply smart indentation (if enabled) — do this after paragraph fix
  // 步骤3：应用智能缩进（如果启用）— 在段落修复之后
  if (opts.smartIndent) {
    const indentResult = applySmartIndent(current);
    stats.indentsApplied = indentResult.indents;
    current = indentResult.result;
  }

  // Step 4: Remove repeated punctuation (if enabled)
  // 步骤4：移除重复标点（如果启用）
  if (opts.removeRepeatedPunctuation) {
    current = normalizePunctuation(current);
  }

  // Calculate total removed lines as the difference in line count
  const originalLines = text.split('\n').length;
  const purifiedLines = current.split('\n').length;
  const removedLines = originalLines - purifiedLines;

  return {
    original: text,
    purified: current,
    removedLines,
    stats,
  };
}
