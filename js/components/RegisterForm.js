// DESIGN PATTERN: Presenter Component + Validation
const RegisterForm = {
  template: `
        <div class="card">
            <h2>Create New Account</h2>
            <div class="form-group">
                <label>Full Name:</label>
                <input type="text" v-model="registerForm.name" placeholder="Enter your full name">
            </div>
            <div class="form-group">
                <label>Email:</label>
                <input type="email" v-model="registerForm.email" placeholder="Enter your email">
            </div>
            <div class="form-group">
                <label>Password:</label>
                <input type="password" v-model="registerForm.password" placeholder="Create a password">
            </div>
            <button @click="register">Register</button>
            
            <div v-if="message" :class="['message', messageType]">
                {{ message }}
            </div>
        </div>
    `,

  emits: ["register-success", "show-message"],

  data() {
    return {
      registerForm: {
        name: "",
        email: "",
        password: "",
      },
      message: "",
      messageType: "",
    };
  },

  methods: {
    async register() {
      try {
        const data = await ApiService.register(this.registerForm);

        if (data.success) {
          this.$emit("register-success", data.data);
          this.showMessage("Registration successful!", "success");
          this.registerForm = { name: "", email: "", password: "" };
        } else {
          this.showMessage(data.error || "Registration failed", "error");
        }
      } catch (error) {
        console.error("Registration error:", error);
        this.showMessage("Registration failed. Please try again.", "error");
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
