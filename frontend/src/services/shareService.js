// src/services/shareService.js

const shareService = {
  /**
   * Create a public share link for a document.
   * @param {string} API_URL
   * @param {string} token - JWT auth token
   * @param {number} documentId
   * @param {number} expiresInHours - 1 to 168
   */
  async createShareLink(API_URL, token, documentId, expiresInHours = 24) {
    const response = await fetch(`${API_URL}/api/share/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: documentId,
        expires_in_hours: expiresInHours,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create share link');
    }

    return response.json(); // { share_token, share_url, expires_at, document_name }
  },

  /**
   * Revoke a share link.
   * @param {string} API_URL
   * @param {string} token - JWT auth token
   * @param {string} shareToken
   */
  async revokeShareLink(API_URL, token, shareToken) {
    const response = await fetch(`${API_URL}/api/share/${shareToken}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to revoke share link');
    }
  },

  /** Build the public view URL for a share token */
  getViewUrl(API_URL, shareToken) {
    return `${API_URL}/api/share/view/${shareToken}`;
  },

  /** Get metadata for a shared link */
  async getShareInfo(API_URL, shareToken) {
    const response = await fetch(`${API_URL}/api/share/info/${shareToken}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Link is invalid or has expired');
    }
    return response.json();
  }
};

export default shareService;