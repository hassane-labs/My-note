/* ==========================================================================
   My Note - Tests unitaires (node --test)
   ========================================================================== */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  countWords,
  countChars,
  readingTime,
  formatDate,
  escapeHtml,
  truncate,
  fuzzyMatch,
  normalizeForSearch,
  extractSnippets,
  highlightMatches,
  getLineCol,
  getCursorPos,
  generateLineNumbers,
  toggleIndent,
  parseTaskLine,
  toggleTaskLine,
  deepClone,
  shallowEqual,
  formatBytes,
  slugify,
  safeParseJSON
} from '../js/utils.js';

describe('Utils - Text stats', () => {
  test('countWords', () => {
    assert.strictEqual(countWords(''), 0);
    assert.strictEqual(countWords('   '), 0);
    assert.strictEqual(countWords('Hello world'), 2);
    assert.strictEqual(countWords('Un   deux\trois\nquatre'), 4);
    assert.strictEqual(countWords('Hello, world! How are you?'), 5);
  });
  
  test('countChars', () => {
    assert.strictEqual(countChars(''), 0);
    assert.strictEqual(countChars('Hello'), 5);
    assert.strictEqual(countChars('Hello world', false), 10);
    assert.strictEqual(countChars('Hello world', true), 11);
  });
  
  test('readingTime', () => {
    assert.strictEqual(readingTime(''), 1);
    assert.strictEqual(readingTime('a '.repeat(100)), 1); // 100 mots = 0.5 min -> 1 min min
    assert.strictEqual(readingTime('a '.repeat(400)), 2); // 400 mots = 2 min
    assert.strictEqual(readingTime('a '.repeat(1000)), 5);
  });
});

describe('Utils - Date formatting', () => {
  test('formatDate', () => {
    const iso = '2024-01-15T14:30:00.000Z';
    const result = formatDate(iso);
    assert.ok(result.includes('janv') || result.includes('Jan') || result.includes('15'));
  });
});

describe('Utils - HTML escaping', () => {
  test('escapeHtml', () => {
    assert.strictEqual(escapeHtml('<script>alert(1)</script>'), '<script>alert(1)</script>');
    assert.strictEqual(escapeHtml('Tom & Jerry'), 'Tom & Jerry');
    assert.strictEqual(escapeHtml('"quotes"'), '"quotes"');
    assert.strictEqual(escapeHtml("'single'"), '&#039;single&#039;');
  });
});

describe('Utils - String utilities', () => {
  test('truncate', () => {
    assert.strictEqual(truncate('Hello world', 20), 'Hello world');
    // ellipsis is 1 char, so 8 chars = 7 + ellipsis
    assert.strictEqual(truncate('Hello world', 8), 'Hello w…');
    assert.strictEqual(truncate('Hi', 5), 'Hi');
  });
  
  test('fuzzyMatch', () => {
    assert.strictEqual(fuzzyMatch('', 'anything'), 1);
    assert.strictEqual(fuzzyMatch('abc', ''), 0);
    assert.strictEqual(fuzzyMatch('note', 'My note'), 1);
    assert.strictEqual(fuzzyMatch('nt', 'note'), 0.5 + 0.5 * (2/4)); // subsequence match
    assert.ok(fuzzyMatch('nte', 'note') > 0);
  });
  
  test('normalizeForSearch', () => {
    assert.strictEqual(normalizeForSearch('Café'), 'cafe');
    assert.strictEqual(normalizeForSearch('HELLO WORLD'), 'hello world');
    assert.strictEqual(normalizeForSearch('Test-Épreuve'), 'test-epreuve');
  });
});

describe('Utils - Search snippets', () => {
  test('extractSnippets', () => {
    const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.';
    const snippets = extractSnippets(text, 'ipsum', 20);
    assert.ok(snippets.length > 0);
    assert.ok(snippets[0].includes('ipsum'));
  });
  
  test('highlightMatches', () => {
    const result = highlightMatches('Hello world', 'world');
    assert.ok(result.includes('<mark class="search-highlight">world</mark>'));
    assert.ok(result.includes('Hello '));
  });
});

describe('Utils - Line/Column', () => {
  test('getLineCol', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    assert.deepStrictEqual(getLineCol(text, 0), { line: 1, col: 1 });
    assert.deepStrictEqual(getLineCol(text, 6), { line: 1, col: 7 });
    assert.deepStrictEqual(getLineCol(text, 7), { line: 2, col: 1 });
    assert.deepStrictEqual(getLineCol(text, 13), { line: 2, col: 7 });
  });
  
  test('getCursorPos', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    assert.strictEqual(getCursorPos(text, 1, 1), 0);
    assert.strictEqual(getCursorPos(text, 1, 4), 3);
    assert.strictEqual(getCursorPos(text, 2, 1), 7);
    assert.strictEqual(getCursorPos(text, 3, 5), 18);
  });
  
  test('generateLineNumbers', () => {
    const lines = generateLineNumbers('Line 1\nLine 2\nLine 3');
    assert.deepStrictEqual(lines, ['1', '2', '3']);
  });
});

describe('Utils - Indentation', () => {
  test('toggleIndent - indent', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const result = toggleIndent(text, 0, text.length, true);
    assert.ok(result.text.startsWith('\tLine 1\n\tLine 2\n\tLine 3'));
  });
  
  test('toggleIndent - unindent', () => {
    const text = '\tLine 1\n\tLine 2\n\tLine 3';
    const result = toggleIndent(text, 0, text.length, false);
    assert.strictEqual(result.text, 'Line 1\nLine 2\nLine 3');
  });
});

describe('Utils - Task lines', () => {
  test('parseTaskLine', () => {
    const unchecked = parseTaskLine('- [ ] Task');
    assert.deepStrictEqual(unchecked, { isTask: true, checked: false, content: '- [ ] Task' });
    
    const checked = parseTaskLine('- [x] Done');
    assert.deepStrictEqual(checked, { isTask: true, checked: true, content: '- [x] Done' });
    
    const notTask = parseTaskLine('Just text');
    assert.deepStrictEqual(notTask, { isTask: false, checked: false, content: 'Just text' });
  });
  
  test('toggleTaskLine', () => {
    assert.strictEqual(toggleTaskLine('- [ ] Task'), '- [x] Task');
    assert.strictEqual(toggleTaskLine('- [x] Done'), '- [ ] Done');
    assert.strictEqual(toggleTaskLine('Not a task'), 'Not a task');
  });
});

describe('Utils - Object utilities', () => {
  test('deepClone', () => {
    const obj = { a: 1, b: { c: 2 }, d: [3, 4] };
    const cloned = deepClone(obj);
    assert.deepStrictEqual(cloned, obj);
    assert.notStrictEqual(cloned, obj);
    assert.notStrictEqual(cloned.b, obj.b);
  });
  
  test('shallowEqual', () => {
    assert.ok(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }));
    assert.ok(!shallowEqual({ a: 1 }, { a: 1, b: 2 }));
    assert.ok(!shallowEqual({ a: 1 }, { a: 2 }));
  });
});

describe('Utils - Formatting', () => {
  test('formatBytes', () => {
    assert.strictEqual(formatBytes(0), '0 B');
    assert.strictEqual(formatBytes(512), '512 B');
    assert.strictEqual(formatBytes(1024), '1 KB');
    assert.strictEqual(formatBytes(1536), '1.5 KB');
    assert.strictEqual(formatBytes(1024 * 1024), '1 MB');
  });
  
  test('slugify', () => {
    assert.strictEqual(slugify('Hello World'), 'hello-world');
    assert.strictEqual(slugify('Café'), 'cafe');
    assert.strictEqual(slugify('Test 123!@#'), 'test-123');
    assert.strictEqual(slugify('---test---'), 'test');
  });
  
  test('safeParseJSON', () => {
    assert.deepStrictEqual(safeParseJSON('{"a":1}'), { a: 1 });
    assert.strictEqual(safeParseJSON('invalid'), null);
    assert.strictEqual(safeParseJSON(''), null);
  });
});