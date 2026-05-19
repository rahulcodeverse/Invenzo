const isLocalhost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const environment = {
  production: false,
  apiUrl: isLocalhost
    ? 'http://localhost:3000/api/v1'
    : 'https://invenzo-diod.onrender.com/api/v1'
};

