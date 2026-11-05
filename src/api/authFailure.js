// The server tags 401 responses that mean "your session is no longer valid"
// (missing/invalid token, or the account was deactivated or deleted) with
// this code. Other 401s, such as a wrong password on login or on change
// password, must NOT log the user out.
export const SESSION_INVALID_CODE = 'AUTH_REQUIRED';

export const isSessionInvalid = (error) =>
  error?.response?.status === 401 &&
  error?.response?.data?.code === SESSION_INVALID_CODE;
