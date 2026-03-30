const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Handle specific error types
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Invalid input format' });
  }
  
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  // Default error
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
};

module.exports = errorHandler;