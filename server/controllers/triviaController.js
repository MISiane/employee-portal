const pool = require('../config/database');

// All trivia days are Philippine calendar days, whatever time zone the server runs in.
const TZ = 'Asia/Manila';
const TODAY_SQL = `(now() AT TIME ZONE '${TZ}')::date`;
const LEADERBOARD_LIMIT = 20;

const dateStr = (d) => {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  // pg returns DATE columns as local-midnight Date objects
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getToday = async (db = pool) => dateStr((await db.query(`SELECT ${TODAY_SQL} AS d`)).rows[0].d);

// ---------- validation ----------

const isDateStr = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

// Returns { error } or { value }. Used by create, update and import.
const normalizeQuestion = (input) => {
  if (!input || typeof input !== 'object') return { error: 'Invalid question' };
  const question = typeof input.question === 'string' ? input.question.trim() : '';
  if (question.length < 5) return { error: 'Question is too short' };
  if (question.length > 500) return { error: 'Question must be 500 characters or fewer' };

  if (!Array.isArray(input.options)) return { error: 'Options are missing' };
  const options = input.options.map((o) => (typeof o === 'string' ? o.trim() : ''));
  if (options.some((o) => !o)) return { error: 'Options cannot be empty' };
  if (options.length < 2 || options.length > 4) return { error: 'A question needs 2 to 4 options' };
  if (options.some((o) => o.length > 200)) return { error: 'Each option must be 200 characters or fewer' };
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
    return { error: 'Options must be different from each other' };
  }

  const correct = Number(input.correct_index);
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
    return { error: 'Pick which option is correct' };
  }

  const explanation = typeof input.explanation === 'string' ? input.explanation.trim() : '';
  if (explanation.length > 400) return { error: 'Explanation must be 400 characters or fewer' };
  const source = typeof input.source === 'string' ? input.source.trim() : '';
  if (source.length > 160) return { error: 'Source must be 160 characters or fewer' };

  let status = input.status === undefined ? 'approved' : input.status;
  if (!['approved', 'draft', 'retired'].includes(status)) return { error: 'Invalid status' };

  let scheduled = input.scheduled_date;
  if (scheduled === '' || scheduled === undefined) scheduled = null;
  if (scheduled !== null && !isDateStr(scheduled)) return { error: 'Invalid date' };

  return {
    value: {
      question,
      options,
      correct_index: correct,
      explanation: explanation || null,
      source: source || null,
      status,
      scheduled_date: scheduled,
    },
  };
};

// ---------- streaks ----------

// "Question days" are the days that had an approved question, up to today.
// A streak counts consecutive question days a person answered, so a day with no
// question never breaks it. Today's question stays open until the day ends, so an
// unanswered today does not break a streak yet.
const computeStreaks = (questionDays, answeredSet, today) => {
  const days = [...questionDays].sort(); // ascending
  let best = 0;
  let run = 0;
  for (const d of days) {
    if (answeredSet.has(d)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (answeredSet.has(d)) current += 1;
    else if (d === today && current === 0) continue; // still open
    else break;
  }
  return { current, best };
};

const questionDays = async (today) => {
  const r = await pool.query(
    `SELECT scheduled_date AS d FROM trivia_questions
     WHERE status = 'approved' AND scheduled_date IS NOT NULL AND scheduled_date <= $1::date`,
    [today]
  );
  return r.rows.map((row) => dateStr(row.d));
};

const userStats = async (userId, today) => {
  const [days, answers] = await Promise.all([
    questionDays(today),
    pool.query(
      `SELECT answer_date AS d, is_correct FROM trivia_answers WHERE user_id = $1`,
      [userId]
    ),
  ]);
  const answeredSet = new Set(answers.rows.map((a) => dateStr(a.d)));
  const { current, best } = computeStreaks(days, answeredSet, today);
  return {
    current_streak: current,
    best_streak: best,
    answered: answers.rows.length,
    correct: answers.rows.filter((a) => a.is_correct).length,
    questions_so_far: days.length,
  };
};

// ---------- employee endpoints ----------

const getTodayQuestion = async (req, res) => {
  try {
    const today = await getToday();
    const qr = await pool.query(
      `SELECT id, question, options, correct_index, explanation, source
       FROM trivia_questions
       WHERE status = 'approved' AND scheduled_date = $1::date`,
      [today]
    );
    const stats = await userStats(req.user.id, today);
    const base = { today, stats };

    if (qr.rows.length === 0) {
      const next = await pool.query(
        `SELECT MIN(scheduled_date) AS d FROM trivia_questions
         WHERE status = 'approved' AND scheduled_date > $1::date`,
        [today]
      );
      return res.json({ ...base, question: null, next_date: dateStr(next.rows[0].d) });
    }

    const q = qr.rows[0];
    const ar = await pool.query(
      'SELECT answer_index, is_correct FROM trivia_answers WHERE user_id = $1 AND question_id = $2',
      [req.user.id, q.id]
    );
    const answered = ar.rows.length > 0;
    const out = { id: q.id, question: q.question, options: q.options };
    // The answer is only revealed after the person has answered.
    if (answered) {
      out.correct_index = q.correct_index;
      out.explanation = q.explanation;
      out.source = q.source;
    }
    res.json({
      ...base,
      question: out,
      answered,
      my_answer: answered ? { answer_index: ar.rows[0].answer_index, is_correct: ar.rows[0].is_correct } : null,
    });
  } catch (error) {
    console.error('Error in getTodayQuestion:', error);
    res.status(500).json({ error: 'Could not load today\'s question' });
  }
};

const submitAnswer = async (req, res) => {
  const idx = Number(req.body?.answer_index);
  try {
    const today = await getToday();
    const qr = await pool.query(
      `SELECT id, options, correct_index, explanation, source
       FROM trivia_questions
       WHERE status = 'approved' AND scheduled_date = $1::date`,
      [today]
    );
    if (qr.rows.length === 0) return res.status(404).json({ error: 'There is no question today' });
    const q = qr.rows[0];
    if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) {
      return res.status(400).json({ error: 'Choose one of the answers' });
    }
    const isCorrect = idx === q.correct_index;
    const ins = await pool.query(
      `INSERT INTO trivia_answers (user_id, question_id, answer_index, is_correct, answer_date)
       VALUES ($1, $2, $3, $4, $5::date)
       ON CONFLICT (user_id, question_id) DO NOTHING
       RETURNING answer_index, is_correct`,
      [req.user.id, q.id, idx, isCorrect, today]
    );
    if (ins.rows.length === 0) {
      return res.status(409).json({ error: 'You already answered today\'s question' });
    }
    const stats = await userStats(req.user.id, today);
    res.json({
      success: true,
      is_correct: isCorrect,
      correct_index: q.correct_index,
      explanation: q.explanation,
      source: q.source,
      my_answer: { answer_index: idx, is_correct: isCorrect },
      stats,
    });
  } catch (error) {
    console.error('Error in submitAnswer:', error);
    res.status(500).json({ error: 'Could not save your answer' });
  }
};

const getLeaderboard = async (req, res) => {
  const period = req.query.period === 'month' ? 'month' : 'all';
  try {
    const today = await getToday();
    const monthStart = `${today.slice(0, 7)}-01`;
    const days = await questionDays(today);

    const people = await pool.query(
      `SELECT u.id, u.avatar_url, ep.first_name, ep.last_name, ep.department
       FROM users u
       JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE u.is_active = true`
    );
    const answers = await pool.query(
      `SELECT user_id, answer_date AS d, is_correct FROM trivia_answers`
    );

    const byUser = new Map();
    for (const a of answers.rows) {
      if (!byUser.has(a.user_id)) byUser.set(a.user_id, []);
      byUser.get(a.user_id).push({ d: dateStr(a.d), ok: a.is_correct });
    }

    const rows = [];
    for (const p of people.rows) {
      const mine = byUser.get(p.id) || [];
      const inPeriod = period === 'month' ? mine.filter((a) => a.d >= monthStart) : mine;
      if (inPeriod.length === 0) continue;
      const { current } = computeStreaks(days, new Set(mine.map((a) => a.d)), today);
      rows.push({
        user_id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        department: p.department,
        avatar_url: p.avatar_url,
        correct: inPeriod.filter((a) => a.ok).length,
        answered: inPeriod.length,
        current_streak: current,
      });
    }

    rows.sort(
      (a, b) =>
        b.correct - a.correct ||
        b.current_streak - a.current_streak ||
        a.name.localeCompare(b.name)
    );
    // Equal scores share a rank (1, 2, 2, 4)
    rows.forEach((r, i) => {
      r.rank = i > 0 && rows[i - 1].correct === r.correct ? rows[i - 1].rank : i + 1;
    });

    const me = rows.find((r) => r.user_id === req.user.id) || null;
    res.json({
      period,
      total_players: rows.length,
      leaders: rows.slice(0, LEADERBOARD_LIMIT),
      me,
    });
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    res.status(500).json({ error: 'Could not load the leaderboard' });
  }
};

// ---------- admin endpoints ----------

const listQuestions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.*,
              COUNT(a.id)::int AS answered_count,
              COUNT(a.id) FILTER (WHERE a.is_correct)::int AS correct_count
       FROM trivia_questions q
       LEFT JOIN trivia_answers a ON a.question_id = q.id
       GROUP BY q.id
       ORDER BY q.scheduled_date ASC NULLS LAST, q.id ASC`
    );
    const today = await getToday();
    const questions = result.rows.map((q) => ({ ...q, scheduled_date: dateStr(q.scheduled_date) }));
    const upcoming = questions.filter(
      (q) => q.status === 'approved' && q.scheduled_date && q.scheduled_date >= today
    );
    res.json({
      today,
      questions,
      summary: {
        total: questions.length,
        unscheduled: questions.filter((q) => q.status === 'approved' && !q.scheduled_date).length,
        upcoming: upcoming.length,
        last_scheduled_date: upcoming.length ? upcoming[upcoming.length - 1].scheduled_date : null,
      },
    });
  } catch (error) {
    console.error('Error in listQuestions:', error);
    res.status(500).json({ error: 'Could not load questions' });
  }
};

const dateTakenMessage = 'Another question is already scheduled for that date';

const createQuestion = async (req, res) => {
  const { error, value } = normalizeQuestion(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const r = await pool.query(
      `INSERT INTO trivia_questions
         (question, options, correct_index, explanation, source, status, scheduled_date, created_by)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [value.question, JSON.stringify(value.options), value.correct_index, value.explanation,
       value.source, value.status, value.scheduled_date, req.user.id]
    );
    res.status(201).json({ success: true, id: r.rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: dateTakenMessage });
    console.error('Error in createQuestion:', err);
    res.status(500).json({ error: 'Could not save the question' });
  }
};

const updateQuestion = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid question' });
  const { error, value } = normalizeQuestion(req.body);
  if (error) return res.status(400).json({ error });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query('SELECT options FROM trivia_questions WHERE id = $1 FOR UPDATE', [id]);
    if (cur.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Question not found' });
    }
    const answers = await client.query('SELECT COUNT(*)::int AS n FROM trivia_answers WHERE question_id = $1', [id]);
    // Once people have answered, the number of options is fixed so their picks stay meaningful.
    if (answers.rows[0].n > 0 && cur.rows[0].options.length !== value.options.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Staff have already answered, so the number of options cannot change' });
    }
    await client.query(
      `UPDATE trivia_questions
       SET question = $2, options = $3::jsonb, correct_index = $4, explanation = $5,
           source = $6, status = $7, scheduled_date = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, value.question, JSON.stringify(value.options), value.correct_index, value.explanation,
       value.source, value.status, value.scheduled_date]
    );
    // If the answer key was corrected, regrade earlier answers.
    await client.query(
      'UPDATE trivia_answers SET is_correct = (answer_index = $2) WHERE question_id = $1',
      [id, value.correct_index]
    );
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') return res.status(409).json({ error: dateTakenMessage });
    console.error('Error in updateQuestion:', err);
    res.status(500).json({ error: 'Could not save the question' });
  } finally {
    client.release();
  }
};

const deleteQuestion = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid question' });
  try {
    const answers = await pool.query('SELECT COUNT(*)::int AS n FROM trivia_answers WHERE question_id = $1', [id]);
    if (answers.rows[0].n > 0) {
      // Keep the history that scores and streaks depend on; just take it off the schedule.
      const r = await pool.query(
        `UPDATE trivia_questions SET status = 'retired', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
        [id]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
      return res.json({ success: true, retired: true });
    }
    const r = await pool.query('DELETE FROM trivia_questions WHERE id = $1 RETURNING id', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    res.json({ success: true, retired: false });
  } catch (error) {
    console.error('Error in deleteQuestion:', error);
    res.status(500).json({ error: 'Could not delete the question' });
  }
};

// Validates every row first; nothing is saved unless all rows are valid.
const importQuestions = async (req, res) => {
  const rows = req.body?.questions;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No questions to import' });
  }
  if (rows.length > 500) return res.status(400).json({ error: 'Import up to 500 questions at a time' });

  const values = [];
  const errors = [];
  rows.forEach((row, i) => {
    const { error, value } = normalizeQuestion({ ...row, scheduled_date: null });
    if (error) errors.push({ row: i + 1, error });
    else values.push(value);
  });
  if (errors.length) return res.status(400).json({ error: 'Some rows need fixing', errors });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const v of values) {
      await client.query(
        `INSERT INTO trivia_questions (question, options, correct_index, explanation, source, status, created_by)
         VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7)`,
        [v.question, JSON.stringify(v.options), v.correct_index, v.explanation, v.source, v.status, req.user.id]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ success: true, imported: values.length });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error in importQuestions:', error);
    res.status(500).json({ error: 'Could not import the questions' });
  } finally {
    client.release();
  }
};

// Gives every approved question that has no date its own day, in the order they were added,
// starting at start_date and skipping days that already have a question.
const scheduleQuestions = async (req, res) => {
  const start = req.body?.start_date;
  if (!isDateStr(start)) return res.status(400).json({ error: 'Pick a start date' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE trivia_questions IN SHARE ROW EXCLUSIVE MODE');
    const taken = await client.query(
      `SELECT scheduled_date AS d FROM trivia_questions WHERE status = 'approved' AND scheduled_date IS NOT NULL`
    );
    const takenSet = new Set(taken.rows.map((r) => dateStr(r.d)));
    const todo = await client.query(
      `SELECT id FROM trivia_questions WHERE status = 'approved' AND scheduled_date IS NULL ORDER BY id`
    );

    const [y, m, d] = start.split('-').map(Number);
    const cursor = new Date(Date.UTC(y, m - 1, d));
    const fmt = (dt) => dt.toISOString().slice(0, 10);
    let first = null;
    let last = null;
    for (const row of todo.rows) {
      while (takenSet.has(fmt(cursor))) cursor.setUTCDate(cursor.getUTCDate() + 1);
      const day = fmt(cursor);
      await client.query('UPDATE trivia_questions SET scheduled_date = $2::date WHERE id = $1', [row.id, day]);
      takenSet.add(day);
      first = first || day;
      last = day;
    }
    await client.query('COMMIT');
    res.json({ success: true, scheduled: todo.rows.length, first_date: first, last_date: last });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error in scheduleQuestions:', error);
    res.status(500).json({ error: 'Could not schedule the questions' });
  } finally {
    client.release();
  }
};

module.exports = {
  getTodayQuestion,
  submitAnswer,
  getLeaderboard,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestions,
  scheduleQuestions,
  // exported for tests
  normalizeQuestion,
  computeStreaks,
};
