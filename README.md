# novel-content-purifier-ts

> A lightweight TypeScript text purifier for web novel platforms.  
> Strips out advertisement lines, pop-up text, and formatting artifacts commonly found in scraped Chinese web novel content.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-blue)](https://www.typescriptlang.org/)

---

## Features

| Rule                 | Description                                                                 | Default |
| -------------------- | --------------------------------------------------------------------------- | ------- |
| **Ad filtering**    | Removes entire lines containing common ad/promotion keywords (打赏, 广告, 推荐票, VIP章节, 下载APP, etc.) | ✅ on    |
| **Smart indentation** | Automatically indents the first line of each paragraph with 2 spaces        | ✅ on    |
| **Paragraph formatting** | Normalizes paragraph spacing — ensures exactly one blank line between paragraphs, removes leading/trailing blanks | ✅ on    |
| **Punctuation normalization** | Replaces repeated punctuation (!!! → !, ??? → ?, 。。。 → 。) | ✅ on    |
| **Custom patterns** | Users can supply additional RegExp patterns for project‑specific filtering   | optional |

---

## Installation

```bash
npm install novel-content-purifier-ts
```

Or clone the repository directly:

```bash
git clone https://github.com/cuix9561-code/novel-content-purifier-ts.git
cd novel-content-purifier-ts
npm install
```

> **Note:** The package has zero runtime dependencies — only Node.js built‑ins and TypeScript for development.

---

## Quick Start

```typescript
import { purify, cleanNovelText } from 'novel-content-purifier-ts';

const rawText = `
欢迎来到小说网阅读最新章节！
【广告】下载APP畅享无广告阅读

她推开门，走了进去。

　　房间里很安静，只有时钟在滴答作响。
`;

// Option A: Full result with statistics
const result = purify(rawText);
console.log(result.purified);
// 欢迎来到小说网阅读最新章节！
//
// 她推开门，走了进去。
//
//   房间里很安静，只有时钟在滴答作响。

console.log(`Removed ${result.stats.adsRemoved} ad lines`);
// Removed 1 ad lines

// Option B: Quick one‑liner
const clean = cleanNovelText(rawText);
console.log(clean);
```

---

## API

### `purify(text: string, options?: PurifierOptions): PurifyResult`

Main purification function. Applies all enabled cleaning steps in order:

1. Remove ad lines (keyword‑based line filtering)
2. Apply custom regex patterns (if any)
3. Fix paragraph spacing
4. Apply smart indentation
5. Normalize repeated punctuation

#### `PurifierOptions`

| Option                      | Type      | Default | Description                                              |
| --------------------------- | --------- | ------- | -------------------------------------------------------- |
| `removeAdLines`             | `boolean` | `true`  | Remove lines containing advertisement keywords           |
| `smartIndent`               | `boolean` | `true`  | Indent first line of each paragraph with 2 spaces        |
| `fixParagraphs`             | `boolean` | `true`  | Normalize paragraph spacing (exactly one blank line between) |
| `removeRepeatedPunctuation` | `boolean` | `true`  | Replace repeated punctuation with single character       |
| `customPatterns`            | `RegExp[]`| `[]`    | User‑defined additional regex patterns for line removal  |

#### `PurifyResult`

| Property       | Type          | Description                                  |
| -------------- | ------------- | -------------------------------------------- |
| `original`     | `string`      | The input text unchanged                     |
| `purified`     | `string`      | The cleaned output text                      |
| `removedLines` | `number`      | Total number of lines removed                |
| `stats`        | `PurifyStats` | Detailed breakdown of cleaning operations    |

#### `PurifyStats`

| Property             | Type     | Description                       |
| -------------------- | -------- | --------------------------------- |
| `adsRemoved`         | `number` | Lines removed by ad keyword match |
| `paragraphsFormatted`| `number` | Paragraphs affected by spacing fix |
| `indentsApplied`     | `number` | Indents added to paragraphs       |

---

### `cleanNovelText(text: string): string`

A convenience wrapper around `purify()` that returns only the purified text string.

---

## Test Examples

| Input                                                             | Expected Output                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| `"欢迎阅读【打赏】支持作者！"`                                        | `"欢迎阅读支持作者！"`                                         |
| `"下载APP获取最新章节\n\n正文内容"`                                     | `"正文内容"`                                                |
| `"！！！这是什么？？？"`                                               | `"！这是什么？"`                                             |
| `"第一段\n\n\n\n第二段"`                                              | `"第一段\n\n  第二段"`                                      |
| `"【广告】点击这里领取福利\n正文"`                                      | `"正文"`                                                   |
| `"推荐票\n月票\n投推荐票\n\n真正的章节内容开始"`                         | `"真正的章节内容开始"`                                        |

---

## Advanced Usage

### Custom filtering patterns

```typescript
import { purify } from 'novel-content-purifier-ts';

const text = '加群领福利: 123456\n正文内容';
const result = purify(text, {
  customPatterns: [/加群领福利/i],
});
// result.purified === '正文内容'
```

### Disable specific features

```typescript
const result = purify(text, {
  removeAdLines: true,
  smartIndent: false,       // skip indentation
  fixParagraphs: false,     // keep original spacing
  removeRepeatedPunctuation: false,
});
```

---

## Development

```bash
git clone https://github.com/cuix9561-code/novel-content-purifier-ts.git
cd novel-content-purifier-ts
npm install          # installs dev dependencies (TypeScript, etc.)
npx tsc             # type‑check the project
node dist/index.js  # run (after build)
```

---

## License

[MIT](LICENSE) © 2026 cuix9561-code
