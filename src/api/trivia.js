import api from './config';

export const getTodayTrivia = async () => (await api.get('/trivia/today')).data;
export const submitTriviaAnswer = async (answerIndex) =>
  (await api.post('/trivia/answer', { answer_index: answerIndex })).data;
export const getTriviaLeaderboard = async (period) =>
  (await api.get('/trivia/leaderboard', { params: { period } })).data;

// Admin (HR)
export const getTriviaQuestions = async () => (await api.get('/trivia/admin/questions')).data;
export const createTriviaQuestion = async (q) => (await api.post('/trivia/admin/questions', q)).data;
export const updateTriviaQuestion = async (id, q) => (await api.put(`/trivia/admin/questions/${id}`, q)).data;
export const deleteTriviaQuestion = async (id) => (await api.delete(`/trivia/admin/questions/${id}`)).data;
export const importTriviaQuestions = async (questions) =>
  (await api.post('/trivia/admin/import', { questions })).data;
export const scheduleTriviaQuestions = async (startDate) =>
  (await api.post('/trivia/admin/schedule', { start_date: startDate })).data;
