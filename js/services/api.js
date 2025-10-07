// DESIGN PATTERN: Facade Pattern + Service Layer + Singleton-like
const API_BASE = {
  auth: "http://localhost:8001", // Authentication service
  sender: "http://localhost:8002", // Transfer initiation service
  receiver: "http://localhost:8003", // Points claiming service
};

class ApiService {
  //  AUTHENTICATION ENDPOINTS: User management operations
  static async login(credentials) {
    const response = await fetch(`${API_BASE.auth}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse(response); //  FACADE: Hide HTTP details
  }

  static async register(userData) {
    const response = await fetch(`${API_BASE.auth}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  }

  static async getUser(userId) {
    const response = await fetch(`${API_BASE.auth}/users/${userId}`);
    return this.handleResponse(response);
  }

  static async getUserByEmail(email) {
    const response = await fetch(`${API_BASE.auth}/users/email/${email}`);
    return this.handleResponse(response);
  }

  static async updateUserPoints(userId, points) {
    const response = await fetch(`${API_BASE.auth}/users/${userId}/points`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });
    return this.handleResponse(response);
  }

  //  TRANSFER ENDPOINTS: Point sending operations
  static async sendTransfer(userId, transferData) {
    const response = await fetch(`${API_BASE.sender}/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId, //  CONTEXT PATTERN: User identification
      },
      body: JSON.stringify(transferData),
    });
    return this.handleResponse(response);
  }
  //  GET USER CLAIMS: Received transfers
  static async getUserClaims(userId) {
    // First get user email, then get claims by email
    const userData = await this.getUser(userId);
    if (!userData.success) {
      throw new Error("User not found");
    }

    const userEmail = userData.data.email;
    const response = await fetch(
      `${API_BASE.receiver}/claims/${encodeURIComponent(userEmail)}`
    );
    return this.handleResponse(response);
  }

  //  GET ALL TRANSFERS: Both sent and received
  static async getAllUserTransfers(userId) {
    try {
      const [sentData, receivedData] = await Promise.all([
        this.getUserTransfers(userId),
        this.getUserClaims(userId),
      ]);

      return {
        success: true,
        data: {
          sent: sentData.success ? sentData.data : [],
          received: receivedData.success ? receivedData.data : [],
        },
      };
    } catch (error) {
      console.error("Error fetching all transfers:", error);
      throw error;
    }
  }

  static async getUserTransfers(userId) {
    const response = await fetch(`${API_BASE.sender}/transfers/${userId}`);
    return this.handleResponse(response);
  }

  //  CLAIM ENDPOINTS: Points claiming operations
  static async getTransferDetails(token) {
    const response = await fetch(`${API_BASE.receiver}/transfer/${token}`);
    return this.handleResponse(response);
  }

  static async declinePoints(token, userEmail) {
    const response = await fetch(
      `${API_BASE.receiver}/transfer/${token}/decline`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail }),
      }
    );
    return this.handleResponse(response);
  }

  static async claimPoints(token, userEmail) {
    const response = await fetch(
      `${API_BASE.receiver}/transfer/${token}/claim`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail }),
      }
    );
    return this.handleResponse(response);
  }

  //  RESPONSE HANDLER: Centralized error handling (Template Method)
  static async handleResponse(response) {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json(); //  FACADE: Always return parsed JSON
  }
}
