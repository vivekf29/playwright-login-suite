export const sauceUsers = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
  invalid: { username: 'invalid_user', password: 'wrong_password' },
} as const;

export const sauceErrors = {
  lockedOut: 'Sorry, this user has been locked out.',
  mismatch: 'Username and password do not match any user in this service',
  usernameRequired: 'Username is required',
  passwordRequired: 'Password is required',
} as const;

export const apiUser = {
  username: 'emilys',
  password: 'emilyspass',
} as const;
