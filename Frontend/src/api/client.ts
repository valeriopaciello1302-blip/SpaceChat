const API_URL = 'http://localhost:3000';

export const api = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && {
        Authorization: `Bearer ${token}`
      }),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Errore API');
  }

  return data;
};