export const ENV = {
  appName: 'Numora Admin',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
} as const;
