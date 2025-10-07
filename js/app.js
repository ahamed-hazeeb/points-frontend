// DESIGN PATTERN: Container/Presenter Pattern + State Management
const { createApp } = Vue;

const App = {
  template: `
        <div class="container">
        
            <h1 style="color: white; text-align: center; margin-bottom: 30px;">Virtual Points Transfer</h1>
            
            <!-- USER INFO COMPONENT: Conditional rendering based on authentication -->
              <button @click="forceRefreshPoints" class="refresh-corner-button" title="Refresh points">
        Refresh
    </button>
    
            <div v-if="currentUser" class="user-info">
                <p>Welcome, <strong>{{ currentUser.name }}</strong>!</p>
                <p>Your Points: <span class="points">{{ currentUser.points }}</span></p>
                <button @click="logout" style="background: #dc3545; margin-top: 10px;">Logout</button>
            
                </div>

            <!-- NAVIGATION COMPONENT: Router-like view switching -->
            <div class="nav">
                <button @click="switchView('login')" :style="currentView === 'login' ? 'background: #764ba2;' : ''">
                    Login
                </button>
                <button @click="switchView('register')" :style="currentView === 'register' ? 'background: #764ba2;' : ''">
                    Register
                </button>
                <button @click="switchView('transfer')" :style="currentView === 'transfer' ? 'background: #764ba2;' : ''">
                    Send Points
                </button>
                <button @click="loadUserTransfers(); switchView('transfers')" :style="currentView === 'transfers' ? 'background: #764ba2;' : ''">
                    My Transfers
                </button>
                <button @click="handleClaimView()" :style="currentView === 'claim' ? 'background: #764ba2;' : ''">
                    Claim Points
                </button>
            </div>

            <!-- DYNAMIC COMPONENT RENDERING: Presenter components -->
            <login-form 
                v-if="currentView === 'login'"
                :current-view="currentView"
                @login-success="handleLoginSuccess"
                @show-message="showMessage">
            </login-form>

            <register-form 
                v-if="currentView === 'register'"
                @register-success="handleRegisterSuccess"
                @show-message="showMessage">
            </register-form>

            <transfer-form 
                v-if="currentView === 'transfer'"
                :current-user="currentUser"
                @transfer-success="handleTransferSuccess"
                @show-message="showMessage"
                @refresh-user="refreshUser"
                @refresh-transfers="loadUserTransfers">
            </transfer-form>

            <transfers-list 
                v-if="currentView === 'transfers'"
                :current-user="currentUser"
                :transfers="transfers"
                :loading="loading">
            </transfers-list>

            <claim-points 
                v-if="currentView === 'claim'"
                :current-user="currentUser"
                :claim-transfer="claimTransfer"
                :claim-error="claimError"
                :loading="loading"
                @claim-points="claimPoints"
                @decline-points="declinePoints"
                @switch-view="switchView"
                @logout="logout"
                @show-message="showMessage"
                @refresh-user="refreshUser">
            </claim-points>
        </div>
    `,

  //  COMPONENT REGISTRATION: Factory Pattern for component creation
  components: {
    "login-form": LoginForm,
    "register-form": RegisterForm,
    "transfer-form": TransferForm,
    "transfers-list": TransfersList,
    "claim-points": ClaimPoints,
  },

  //  REACTIVE STATE MANAGEMENT: Observer Pattern
  data() {
    return {
      currentView: "login", // Current active view
      currentUser: null, // Authenticated user data
      transfers: [], // User's transfer history
      claimTransfer: null, // Transfer being claimed
      claimError: null, // Claim process errors
      loading: false, // Loading state for async operations
      message: "", // User feedback messages
      messageType: "", // Message type (success/error)
    };
  },

  //  LIFECYCLE HOOKS: Component initialization
  mounted() {
    this.handleRouting(); // Handle URL routing

    //  PERSISTENCE PATTERN: Restore user session from localStorage
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.currentView = "transfer"; // Redirect to transfer view
    }
  },

  //  APPLICATION METHODS: Business logic and state management
  methods: {
    //  ROUTING HANDLER: Client-side routing for claim links
    handleRouting() {
      const hash = window.location.hash;
      console.log("Current hash:", hash);

      // Handle hash-based routing (SPA pattern)
      if (hash.startsWith("#/claim/")) {
        const token = hash.split("/")[2];
        console.log("Hash claim token detected:", token);
        this.loadClaimTransfer(token);
        this.currentView = "claim";
        return;
      }

      // Fallback to path-based routing
      const path = window.location.pathname;
      if (path.startsWith("/claim/")) {
        const token = path.split("/")[2];
        console.log("Path claim token detected:", token);
        this.loadClaimTransfer(token);
        this.currentView = "claim";
      }
    },
    //  TRANSFER SUCCESS HANDLER: Called when transfer is created successfully
    handleTransferSuccess(transferData) {
      console.log("Transfer created successfully:", transferData);

      // Show success message
      this.showMessage(
        `Transfer initiated! ${transferData.points} points will be sent to ${transferData.receiver_email}`,
        "success"
      );

      // Refresh user data to update points balance (if needed)
      this.refreshUser();

      // Refresh transfers list to show the new transfer
      this.loadUserTransfers();
    },
    //  VIEW MANAGEMENT: Simple router implementation
    switchView(view) {
      this.currentView = view;
    },

    // CLAIM VIEW VALIDATION: Guard pattern for claim access
    handleClaimView() {
      if (!this.claimTransfer) {
        this.showMessage(
          "No active transfer to claim. Please use a claim link from your email.",
          "error"
        );
        return;
      }
      this.currentView = "claim";
    },

    //  AUTHENTICATION HANDLERS: State updates for auth flows
    handleLoginSuccess(authData) {
      this.currentUser = authData.user;
      //  PERSISTENCE: Save user session
      localStorage.setItem("currentUser", JSON.stringify(authData.user));
      localStorage.setItem("authToken", authData.token);

      //  CONTEXT-AWARE REDIRECTION: Stay on claim view if applicable
      if (this.currentView === "claim") {
        console.log(
          " User logged in while in claim view - ready to claim points"
        );
        this.showMessage(
          "Login successful! You can now claim your points.",
          "success"
        );
      } else {
        this.currentView = "transfer";
      }
    },

    handleRegisterSuccess(authData) {
      this.currentUser = authData.user;
      localStorage.setItem("currentUser", JSON.stringify(authData.user));
      localStorage.setItem("authToken", authData.token);

      if (this.currentView === "claim") {
        console.log(
          " User registered while in claim view - ready to claim points"
        );
        this.showMessage(
          " Registration successful! You can now claim your points.",
          "success"
        );
      } else {
        this.currentView = "transfer";
      }
    },

    //  TRANSFER OPERATIONS: Async data operations
    async loadClaimTransfer(token) {
      try {
        this.loading = true;
        console.log("Loading transfer details for token:", token);

        //  FACADE PATTERN: Simple API call through service
        const data = await ApiService.getTransferDetails(token);

        if (data.success) {
          this.claimTransfer = data.data;
          console.log("Claim transfer loaded:", this.claimTransfer);
        } else {
          this.claimError = data.error || "Failed to load transfer";
        }
      } catch (error) {
        this.claimError = "Failed to load transfer details.";
        console.error("Claim load error:", error);
      } finally {
        this.loading = false;
      }
    },

    //  SAGA PATTERN: Frontend coordination of claim process
    async claimPoints(token, userEmail) {
      try {
        this.loading = true;
        const data = await ApiService.claimPoints(token, userEmail);

        if (data.success) {
          //  STATE SYNCHRONIZATION: Refresh user data after claim
          await this.refreshUser();
          this.showMessage(
            ` Success! ${this.claimTransfer.points} points have been claimed!`,
            "success"
          );

          //  AUTOMATIC REDIRECTION: Navigate to transfers after success
          setTimeout(() => {
            this.claimTransfer = null;
            this.claimError = null;
            this.currentView = "transfers";
            window.history.replaceState({}, document.title, "/"); // Clean URL
          }, 3000);
        } else {
          this.showMessage(data.error || "Failed to claim points", "error");
        }
      } catch (error) {
        console.error("🔧 Claim points error:", error);
        this.showMessage("Failed to claim points. Please try again.", "error");
      } finally {
        this.loading = false;
      }
    },

    //  DATA LOADING: User transfer history
    async loadUserTransfers() {
      if (!this.currentUser) return;

      try {
        this.loading = true;
        console.log("Loading transfers for user:", this.currentUser.id);

        const data = await ApiService.getUserTransfers(this.currentUser.id);

        if (data.success) {
          this.transfers = data.data;
          console.log("Transfers loaded:", this.transfers);
        } else {
          this.showMessage("Failed to load transfers", "error");
        }
      } catch (error) {
        console.error("Error loading transfers:", error);
        this.showMessage("Error loading transfers", "error");
      } finally {
        this.loading = false;
      }
    },

    //  DECLINE OPERATION: Alternative claim flow
    async declinePoints(token, userEmail) {
      try {
        this.loading = true;
        const data = await ApiService.declinePoints(token, userEmail);

        if (data.success) {
          this.showMessage(
            " Transfer declined. Points remain with the sender.",
            "success"
          );

          setTimeout(() => {
            this.claimTransfer = null;
            this.claimError = null;
            this.currentView = "transfers";
            window.history.replaceState({}, document.title, "/");
          }, 3000);
        } else {
          this.showMessage(data.error || "Failed to decline transfer", "error");
        }
      } catch (error) {
        console.error("🔧 Decline points error:", error);
        this.showMessage(
          "Failed to decline transfer. Please try again.",
          "error"
        );
      } finally {
        this.loading = false;
      }
    },

    //  DATA REFRESH: Synchronize with server state
    async refreshUser() {
      if (this.currentUser) {
        try {
          const data = await ApiService.getUser(this.currentUser.id);
          if (data.success) {
            this.currentUser = data.data;
            localStorage.setItem("currentUser", JSON.stringify(data.data));
            console.log("User data refreshed:", this.currentUser);
          }
        } catch (error) {
          console.error("Failed to refresh user data:", error);
        }
      }
    },

    // SESSION MANAGEMENT: Logout and cleanup
    logout() {
      this.currentUser = null;
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
      this.currentView = "login";
      this.showMessage("Logged out successfully", "success");
    },
    //  MANUAL REFRESH: Force update points balance
    async forceRefreshPoints() {
      if (this.currentUser) {
        try {
          await this.refreshUser();
          this.showMessage("Points balance updated", "success");
        } catch (error) {
          console.error("Failed to refresh points:", error);
        }
      }
    },
    //  USER FEEDBACK: Message display system
    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
      setTimeout(() => {
        this.message = "";
        this.messageType = "";
      }, 5000);
    },
  },
};

//  APPLICATION BOOTSTRAP: Create and mount Vue application
createApp(App).mount("#app");
