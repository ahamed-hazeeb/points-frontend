// DESIGN PATTERN: Presenter Component + Data Display
const TransfersList = {
  template: `
        <div class="card">
            <h2>My Transfer History</h2>
            <div v-if="!currentUser">
                <p style="color: #666; text-align: center;">Please login first to view your transfers.</p>
            </div>
            <div v-else>
                <div v-if="loading" class="loading">Loading transfers...</div>
                <div v-else-if="transfers.length === 0">
                    <p style="color: #666; text-align: center;">No transfers found.</p>
                </div>
                <div v-else>
                    <div v-for="transfer in transfers" :key="transfer.id" class="transfer-item">
                        <p><strong>To:</strong> {{ transfer.receiver_name }} ({{ transfer.receiver_email }})</p>
                        <p><strong>Points:</strong> <span class="points">{{ transfer.points }}</span></p>
                        <p><strong>Status:</strong> 
                            <span :style="getStatusStyle(transfer.status)">{{ transfer.status }}</span>
                        </p>
                        <p><strong>Date:</strong> {{ new Date(transfer.created_at).toLocaleDateString() }}</p>
                        <p><strong>Expires:</strong> {{ new Date(transfer.expires_at).toLocaleDateString() }}</p>
                    </div>
                </div>
            </div>
        </div>
    `,

  props: ["currentUser", "transfers", "loading"],

  methods: {
    //  STRATEGY PATTERN: Different styling based on status
    getStatusStyle(status) {
      const styles = {
        pending: "color: #ffc107;",
        completed: "color: #28a745;",
        expired: "color: #dc3545;",
      };
      return styles[status] || "";
    },
  },
};
