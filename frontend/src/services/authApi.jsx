const API_URL = 'http://localhost:5000/api/auth';

async function sendAuthRequest(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const signupApi = (userData) =>
  sendAuthRequest('/signup', userData);

export const loginApi = (credentials) =>
  sendAuthRequest('/login', credentials);