// DESIGN PATTERN: Presenter Component + Form Handling
const LoginForm = {
  template: `
        <div class="card">
            <h2>Login to Your Account</h2>
            <div class="form-group">
                <label>Email:</label>
                <input type="email" v-model="loginForm.email" placeholder="Enter your email">
            </div>
            <div class="form-group">
                <label>Password:</label>
                <input type="password" v-model="loginForm.password" placeholder="Enter your password">
            </div>
            <button @click="login">Login</button>
            
            <div v-if="message" :class="['message', messageType]">
                {{ message }}
            </div>
        </div>
    `,

  // PROPS: Input from parent (Container)
  props: ["currentView"],

  //  EVENTS: Output to parent (Observer Pattern)
  emits: ["login-success", "show-message"],

  // LOCAL STATE: Component-specific data
  data() {
    return {
      loginForm: {
        email: "",
        password: "",
      },
      message: "",
      messageType: "",
    };
  },

  // COMPONENT METHODS: Local behavior
  methods: {
    async login() {
      try {
        //  FACADE PATTERN: Simple API call
        const data = await ApiService.login(this.loginForm);

        if (data.success) {
          //  EVENT EMISSION: Notify parent of success
          this.$emit("login-success", data.data);
          this.showMessage("Login successful!", "success");
          this.loginForm = { email: "", password: "" }; // 🧹 Reset form
        } else {
          this.showMessage(data.error, "error");
        }
      } catch (error) {
        console.error("Login error:", error);
        this.showMessage("Login failed. Please try again.", "error");
      }
    },

    // LOCAL MESSAGING: Component-level feedback
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
