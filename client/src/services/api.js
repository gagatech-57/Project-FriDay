const API_BASE_URL = '/api/auth';

export async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Network Error: Unable to connect to backend server.'
    };
  }
}

export async function loginUser(credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Network Error: Unable to connect to backend server.'
    };
  }
}

export async function verifyPasskey(email, passkey) {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-passkey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, passkey })
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Network Error: Unable to connect to backend server.'
    };
  }
}

// File API Endpoints (MongoDB Backend)
export async function uploadFileApi(filePayload) {
  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filePayload)
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Network Error uploading file to database.'
    };
  }
}

export async function fetchFilesApi(email) {
  try {
    const url = email ? `/api/files?email=${encodeURIComponent(email)}` : '/api/files';
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      files: []
    };
  }
}

export async function deleteFileApi(fileId) {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Network Error deleting file.'
    };
  }
}

