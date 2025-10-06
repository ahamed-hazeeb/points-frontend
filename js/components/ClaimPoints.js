// DESIGN PATTERN: Presenter Component + Multi-step Workflow + State Machine
const ClaimPoints = {
  template: `
      <div class="card">
          <h2>Claim Your Points</h2>
          
          <!-- LOADING STATE: Loading Pattern -->
          <div v-if="loading" class="loading">Processing...</div>
          
          <!--  ERROR STATE: Error Boundary Pattern -->
          <div v-else-if="claimError" class="message error">
              {{ claimError }}
          </div>
          
          <!--  TRANSFER DETAILS: Data Display Pattern -->
          <div v-else-if="claimTransfer">
              <div class="claim-info">
                  
                  <!--  TRANSFER INFORMATION: Details Presentation -->
                  <div class="transfer-details">
                      <h3 style="color: #667eea; margin-bottom: 15px;">Transfer Details</h3>
                      <p><strong>From:</strong> {{ claimTransfer.sender_email }}</p>
                      <p><strong>Points:</strong> <span class="points">{{ claimTransfer.points }}</span></p>
                      <p><strong>Expires:</strong> {{ new Date(claimTransfer.expires_at).toLocaleString() }}</p>
                  </div>
                  
                  <!--  MULTI-STEP WORKFLOW: State Machine Pattern -->
                  
                  <!-- STEP 1: AUTHENTICATION REQUIRED - Guard Pattern -->
                  <div v-if="!currentUser" class="auth-required">
                      <div class="info-box">
                          <p><strong>Step 1:</strong> Login or Register to claim your points</p>
                          <p><strong>Important:</strong> You must use 
                              <strong>{{ claimTransfer.receiver_email }}</strong> as your email address.
                          </p>
                      </div>
                      <div class="auth-buttons">
                          <!--  NAVIGATION: Router Pattern through events -->
                          <button @click="$emit('switch-view', 'login')">
                              Login
                          </button>
                          <button @click="$emit('switch-view', 'register')" 
                                  style="background: #28a745;">
                              Register
                          </button>
                      </div>
                  </div>
                  
                  <!-- STEP 2: READY FOR ACTION - Presenter Pattern -->
                  <div v-else class="claim-ready">
                      
                      <!--  VALID STATE: Success Presentation -->
                      <div v-if="canClaimPoints" class="message success" style="margin-bottom: 20px;">
                          <p><strong>Step 2:</strong> Choose to accept or decline the points</p>
                          <p> Email verified: <strong>{{ currentUser.email }}</strong></p>
                          <p>Current balance: <strong>{{ currentUser.points }} points</strong></p>
                      </div>
                      
                      <!--  INVALID STATE: Error Presentation -->
                      <div v-else class="message error" style="margin-bottom: 20px;">
                          <p> Email mismatch!</p>
                          <p>You are logged in as: <strong>{{ currentUser.email }}</strong></p>
                          <p>This transfer is for: <strong>{{ claimTransfer.receiver_email }}</strong></p>
                          <p>
                              Please 
                              <!--  SESSION MANAGEMENT: Logout action -->
                              <button @click="$emit('logout')" 
                                      style="background: #dc3545; padding: 5px 10px; border: none; 
                                             color: white; border-radius: 3px; cursor: pointer; 
                                             margin: 0 5px;">
                                  logout
                              </button> 
                              and login with the correct email.
                          </p>
                      </div>
                      
                      <!--  ACTION INTERFACE: Dual Action Pattern -->
                      <div v-if="canClaimPoints" class="confirmation-box">
                          <h4 style="color: #28a745; margin-bottom: 15px;">
                              Do you want to accept these points?
                          </h4>
                          
                          <!--  POINTS INFORMATION: Data Presentation -->
                          <p style="font-size: 18px; margin-bottom: 20px;">
                              You will receive 
                              <span class="points">{{ claimTransfer.points }}</span> 
                              points from {{ claimTransfer.sender_email }}
                          </p>
                          
                          <!-- BALANCE PROJECTION: Computed Property Display -->
                          <p style="color: #6c757d; margin-bottom: 20px;">
                              Your new balance will be: <strong>{{ newBalance }} points</strong>
                          </p>
                          
                          <!--  ACTION BUTTONS: Strategy Pattern for different actions -->
                          <div style="display: flex; gap: 15px; justify-content: center; margin: 20px 0;">
                              
                              <!--  ACCEPT ACTION: Primary positive action -->
                              <button @click="acceptPoints" 
                                      style="background: #28a745; padding: 15px 30px; border: none; 
                                             color: white; border-radius: 8px; cursor: pointer; 
                                             font-size: 18px; font-weight: bold; flex: 1;">
                                   Accept {{ claimTransfer.points }} Points
                              </button>
                              
                              <!--  DECLINE ACTION: Secondary negative action -->
                              <button @click="declinePoints" 
                                      style="background: #dc3545; padding: 15px 30px; border: none; 
                                             color: white; border-radius: 8px; cursor: pointer; 
                                             font-size: 18px; font-weight: bold; flex: 1;">
                                  Decline Transfer
                              </button>
                          </div>
                          
                          <!--  USER EDUCATION: Informational text -->
                          <p style="color: #6c757d; font-size: 14px; margin-top: 10px;">
                              If you decline, the points will remain with the sender
                          </p>
                      </div>
                  </div>
              </div>
          </div>
          
          <!--  EMPTY STATE: Null Object Pattern -->
          <div v-else>
              <p>No transfer details available.</p>
          </div>
          
          <!--  USER FEEDBACK: Message Display Pattern -->
          <div v-if="message" :class="['message', messageType]">
              {{ message }}
          </div>
      </div>
  `,

  //  PROPS INTERFACE: Input contract from parent (Dependency Injection)
  props: ["currentUser", "claimTransfer", "claimError", "loading"],

  //  EVENT INTERFACE: Output contract to parent (Observer Pattern)
  emits: [
    "claim-points", // Points claiming action
    "decline-points", // Transfer declining action
    "switch-view", // Navigation between views
    "logout", // User logout action
    "show-message", // User feedback messages
    "refresh-user", // Data refresh request
  ],

  //  COMPUTED PROPERTIES: Reactive derived state (Computed Pattern)
  computed: {
    /**
     *  VALIDATION: Check if user can claim points
     * Implements Guard Pattern + Business Rule Validation
     */
    canClaimPoints() {
      //  NULL CHECK: Guard against missing data
      if (!this.currentUser || !this.claimTransfer) return false;

      //  BUSINESS RULE: Email must match exactly (case-insensitive)
      return (
        this.currentUser.email.toLowerCase() ===
        this.claimTransfer.receiver_email.toLowerCase()
      );
    },

    /**
     *  BALANCE PROJECTION: Calculate new balance after claim
     * Implements Strategy Pattern for different calculation scenarios
     */
    newBalance() {
      //  NULL CHECK: Guard against missing data
      if (!this.currentUser || !this.claimTransfer) return 0;

      //  BUSINESS LOGIC: Simple addition for balance projection
      return this.currentUser.points + this.claimTransfer.points;
    },
  },

  //  LOCAL STATE: Component-specific reactive data
  data() {
    return {
      message: "", // Local feedback message
      messageType: "", // Message type (success/error/info)
    };
  },

  //  COMPONENT METHODS: Local behavior and actions
  methods: {
    /**
     *  ACCEPT POINTS: Handle points claiming action
     * Implements Command Pattern + Validation + Event Delegation
     */
    async acceptPoints() {
      try {
        console.log(" Accepting points...");
        console.log("Current user:", this.currentUser);
        console.log("Claim transfer:", this.claimTransfer);

        //  PRE-VALIDATION: Guard Pattern for business rules
        if (!this.canClaimPoints) {
          this.showMessage(
            ` Email mismatch! You are logged in as ${this.currentUser.email} but this transfer is for ${this.claimTransfer.receiver_email}.`,
            "error"
          );
          return;
        }

        //  EVENT DELEGATION: Delegate to parent for actual processing
        // Implements Observer Pattern for loose coupling
        this.$emit(
          "claim-points", // Event name
          this.claimTransfer.token, // Transfer identifier
          this.currentUser.email // User verification
        );
      } catch (error) {
        //  ERROR HANDLING: Local error management
        console.error("🔧 Accept points error:", error);
        this.showMessage("Failed to accept points. Please try again.", "error");
      }
    },

    /**
     *  DECLINE POINTS: Handle transfer declining action
     * Implements Command Pattern + Validation + Event Delegation
     */
    async declinePoints() {
      try {
        console.log(" Declining points...");

        //  PRE-VALIDATION: Guard Pattern for business rules
        if (!this.canClaimPoints) {
          this.showMessage(`❌ Email mismatch!`, "error");
          return;
        }

        //  EVENT DELEGATION: Delegate to parent for actual processing
        this.$emit(
          "decline-points", // Event name
          this.claimTransfer.token, // Transfer identifier
          this.currentUser.email // User verification
        );
      } catch (error) {
        //  ERROR HANDLING: Local error management
        console.error(" Decline points error:", error);
        this.showMessage(
          "Failed to decline points. Please try again.",
          "error"
        );
      }
    },

    /**
     * SHOW MESSAGE: Local feedback system
     * Implements Template Method Pattern for consistent messaging
     */
    showMessage(text, type) {
      //  STATE UPDATE: Set message content and type
      this.message = text;
      this.messageType = type;

      //  AUTO-CLEAR: Set timeout to clear message (5 seconds)
      setTimeout(() => {
        this.message = "";
        this.messageType = "";
      }, 5000);
    },
  },
};
