// backend/common/src/index.js
const { supabase } = require('./database');
const { AppError, handleError } = require('./errors');

module.exports = {
  supabase,
  AppError,
  handleError
};