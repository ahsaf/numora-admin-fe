/** Same rule as the server's PASSWORD_REGEX (thesuperappserver/src/auth/dto/register.dto.ts). */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,30}$/;

export const PASSWORD_HINT =
  '8–30 characters with an uppercase letter, a lowercase letter, a number and a special character. No spaces.';
