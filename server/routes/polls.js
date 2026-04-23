const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Helper middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Get poll for an announcement
router.get('/announcement/:announcementId', async (req, res) => {
  const { announcementId } = req.params;
  const userId = req.user.id;

  try {
    // Get poll
    const pollResult = await pool.query(
      `SELECT * FROM polls WHERE announcement_id = $1 AND is_active = true`,
      [announcementId]
    );

    if (pollResult.rows.length === 0) {
      return res.json({ hasPoll: false });
    }

    const poll = pollResult.rows[0];
    
    // Check if poll is expired
    const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

    // Get options
    const optionsResult = await pool.query(
      `SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id`,
      [poll.id]
    );

    // Check if user has voted
    const voteResult = await pool.query(
      `SELECT option_id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
      [poll.id, userId]
    );

    const hasVoted = voteResult.rows.length > 0;
    const userVote = hasVoted ? voteResult.rows[0].option_id : null;

    // Get total votes
    const totalVotesResult = await pool.query(
      `SELECT COUNT(*) FROM poll_votes WHERE poll_id = $1`,
      [poll.id]
    );

    res.json({
      hasPoll: true,
      poll: {
        id: poll.id,
        question: poll.question,
        expires_at: poll.expires_at,
        is_expired: isExpired,
        options: optionsResult.rows,
        hasVoted,
        userVote,
        totalVotes: parseInt(totalVotesResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error getting poll:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create poll for announcement (admin only)
router.post('/announcement/:announcementId', isAdmin, async (req, res) => {
  const { announcementId } = req.params;
  const { question, options, expires_at } = req.body;

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ error: 'Question and at least 2 options are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if announcement exists
    const announcementCheck = await client.query(
      'SELECT id FROM announcements WHERE id = $1',
      [announcementId]
    );

    if (announcementCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Delete existing poll for this announcement
    await client.query('DELETE FROM polls WHERE announcement_id = $1', [announcementId]);

    // Create new poll
    const pollResult = await client.query(
      `INSERT INTO polls (announcement_id, question, expires_at, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [announcementId, question, expires_at || null, req.user.id]
    );

    const pollId = pollResult.rows[0].id;

    // Insert options
    for (const optionText of options) {
      if (optionText && optionText.trim()) {
        await client.query(
          `INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2)`,
          [pollId, optionText.trim()]
        );
      }
    }

    await client.query('COMMIT');

    res.json({ success: true, poll: pollResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    client.release();
  }
});

// Vote on a poll
router.post('/:pollId/vote', async (req, res) => {
  const { pollId } = req.params;
  const { optionId } = req.body;
  const userId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if poll exists and is active
    const pollResult = await client.query(
      `SELECT * FROM polls WHERE id = $1 AND is_active = true`,
      [pollId]
    );

    if (pollResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Poll not found' });
    }

    const poll = pollResult.rows[0];

    // Check if poll is expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Poll has expired' });
    }

    // Check if user already voted
    const existingVote = await client.query(
      `SELECT id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
      [pollId, userId]
    );

    if (existingVote.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already voted on this poll' });
    }

    // Check if option exists
    const optionResult = await client.query(
      `SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2`,
      [optionId, pollId]
    );

    if (optionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Option not found' });
    }

    // Record vote
    await client.query(
      `INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES ($1, $2, $3)`,
      [pollId, optionId, userId]
    );

    // Update vote count
    await client.query(
      `UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = $1`,
      [optionId]
    );

    await client.query('COMMIT');

    // Get updated results
    const updatedOptions = await pool.query(
      `SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id`,
      [pollId]
    );

    const totalVotes = await pool.query(
      `SELECT COUNT(*) FROM poll_votes WHERE poll_id = $1`,
      [pollId]
    );

    res.json({
      success: true,
      options: updatedOptions.rows,
      totalVotes: parseInt(totalVotes.rows[0].count),
      userVote: optionId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error voting:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    client.release();
  }
});

// Update poll (admin only)
router.put('/:pollId', isAdmin, async (req, res) => {
  const { pollId } = req.params;
  const { question, options, expires_at } = req.body;

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ error: 'Question and at least 2 options are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update poll question and expiration
    await client.query(
      `UPDATE polls 
       SET question = $1, expires_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [question, expires_at || null, pollId]
    );

    // Get existing options
    const existingOptions = await client.query(
      `SELECT id, option_text, vote_count FROM poll_options WHERE poll_id = $1`,
      [pollId]
    );

    const existingOptionsMap = new Map();
    existingOptions.rows.forEach(opt => {
      existingOptionsMap.set(opt.option_text, opt);
    });

    const newOptionsSet = new Set(options);

    // Update or insert new options
    for (const optionText of options) {
      if (!optionText.trim()) continue;
      
      const existingOpt = existingOptionsMap.get(optionText);
      if (existingOpt) {
        // Option exists, keep it (preserve vote count)
        existingOptionsMap.delete(optionText);
      } else {
        // New option, insert with 0 votes
        await client.query(
          `INSERT INTO poll_options (poll_id, option_text, vote_count) 
           VALUES ($1, $2, 0)`,
          [pollId, optionText.trim()]
        );
      }
    }

    // Delete removed options (and their votes)
    for (const [optionText, option] of existingOptionsMap) {
      await client.query(`DELETE FROM poll_options WHERE id = $1`, [option.id]);
    }

    await client.query('COMMIT');

    // Get updated poll data
    const updatedPoll = await client.query(
      `SELECT * FROM polls WHERE id = $1`,
      [pollId]
    );
    
    const updatedOptions = await client.query(
      `SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY id`,
      [pollId]
    );

    res.json({
      success: true,
      poll: updatedPoll.rows[0],
      options: updatedOptions.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating poll:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  } finally {
    client.release();
  }
});

// Get poll voters (admin only)
router.get('/:pollId/voters', isAdmin, async (req, res) => {
  const { pollId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT 
        pv.id,
        pv.voted_at,
        po.option_text,
        u.id as user_id,
        ep.first_name,
        ep.last_name,
        ep.employee_code,
        ep.department,
        ep.position
      FROM poll_votes pv
      JOIN poll_options po ON pv.option_id = po.id
      JOIN users u ON pv.user_id = u.id
      JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE pv.poll_id = $1
      ORDER BY pv.voted_at DESC`,
      [pollId]
    );
    
    // Get summary stats
    const summary = await pool.query(
      `SELECT 
        po.id as option_id,
        po.option_text,
        COUNT(pv.id) as vote_count
      FROM poll_options po
      LEFT JOIN poll_votes pv ON po.id = pv.option_id
      WHERE po.poll_id = $1
      GROUP BY po.id, po.option_text
      ORDER BY vote_count DESC`,
      [pollId]
    );
    
    res.json({
      success: true,
      voters: result.rows,
      summary: summary.rows,
      totalVotes: result.rows.length
    });
  } catch (error) {
    console.error('Error getting poll voters:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete poll (admin only)
router.delete('/:pollId', isAdmin, async (req, res) => {
  const { pollId } = req.params;

  try {
    const result = await pool.query('DELETE FROM polls WHERE id = $1 RETURNING id', [pollId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json({ success: true, message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;