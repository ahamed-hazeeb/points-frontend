// DESIGN PATTERN: Presenter Component + Business Rule Validation
const TransferForm = {
  template: `
        <div class="card">
            <h2>Send Virtual Points</h2>
            <div v-if="!currentUser">
                <p style="color: #666; text-align: center;">Please login first to send points.</p>
            </div>
            <div v-else>
                <div class="form-group">
                    <label>Receiver Email:</label>
                    <input type="email" v-model="transferForm.receiver_email" placeholder="Enter receiver's email">
                </div>
                <div class="form-group">
                    <label>Receiver Name:</label>
                    <input type="text" v-model="transferForm.receiver_name" placeholder="Enter receiver's name">
                </div>
                <div class="form-group">
                    <label>Points to Send:</label>
                    <input type="number" v-model="transferForm.points" placeholder="Enter points amount">
                </div>
                <button @click="sendTransfer">Send Points</button>
                
                <div v-if="message" :class="['message', messageType]">
                    {{ message }}
                </div>
            </div>
        </div>
    `,

  props: ["currentUser"],
  emits: [
    "transfer-success",
    "show-message",
    "refresh-user",
    "refresh-transfers",
  ],

  data() {
    return {
      transferForm: {
        receiver_email: "",
        receiver_name: "",
        points: 0,
      },
      message: "",
      messageType: "",
    };
  },

  methods: {
    async sendTransfer() {
      //  VALIDATION: Business rule enforcement
      if (!this.currentUser) {
        this.showMessage("Please login first", "error");
        return;
      }

      if (this.transferForm.points <= 0) {
        this.showMessage("Please enter a valid points amount", "error");
        return;
      }

      try {
        const data = await ApiService.sendTransfer(
          this.currentUser.id,
          this.transferForm
        );

        if (data.success) {
          //  USER EDUCATION: Explain Saga pattern flow
          this.showMessage(
            "Transfer initiated! Email sent to receiver. Points will be deducted only when receiver accepts.",
            "success"
          );
          this.transferForm = {
            receiver_email: "",
            receiver_name: "",
            points: 0,
          };
          //  STATE SYNCHRONIZATION: Request data refresh
          this.$emit("refresh-user");
          this.$emit("refresh-transfers");
        } else {
          this.showMessage(data.error, "error");
        }
      } catch (error) {
        console.error("Transfer error:", error);
        this.showMessage("Transfer failed. Please try again.", "error");
      }
    },

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
