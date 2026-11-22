// Turns text pasted from a spreadsheet (tab separated) or a CSV file into trivia questions.
// Columns, in order: Question | A | B | C | D | Correct answer | Explanation | Source
// "Correct answer" can be a letter (A-D), a number (1-4) or the exact text of the option.

export const parseDelimited = (text) => {
  const clean = String(text || '').replace(/^﻿/, '');
  if (!clean.trim()) return [];
  const delimiter = clean.includes('\t') ? '\t' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === '') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
};

const resolveCorrect = (raw, options) => {
  const value = String(raw || '').trim();
  if (!value) return -1;
  const letter = value.toUpperCase().replace(/[.)]$/, '');
  if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;
  if (/^[1-4]$/.test(value)) return Number(value) - 1;
  return options.findIndex((o) => o.toLowerCase() === value.toLowerCase());
};

// Returns [{ row, question?, error? }] where `row` is the line number in the pasted text.
export const rowsToQuestions = (rows) => {
  const body = rows.length && /^question/i.test((rows[0][0] || '').trim()) ? rows.slice(1) : rows;
  const offset = body === rows ? 1 : 2;
  return body.map((cols, i) => {
    const row = i + offset;
    const [question = '', a = '', b = '', c = '', d = '', answer = '', explanation = '', source = ''] = cols.map((x) =>
      String(x).trim()
    );
    const options = [a, b, c, d];
    while (options.length && options[options.length - 1] === '') options.pop();
    if (!question) return { row, error: 'Question is empty' };
    if (options.length < 2) return { row, error: 'Needs at least two options' };
    if (options.some((o) => o === '')) return { row, error: 'An option is blank between two filled ones' };
    const correct_index = resolveCorrect(answer, options);
    if (correct_index < 0 || correct_index >= options.length) {
      return { row, error: `Correct answer "${answer}" doesn't match an option` };
    }
    return { row, question: { question, options, correct_index, explanation, source } };
  });
};

export const parseQuestionsText = (text) => rowsToQuestions(parseDelimited(text));
