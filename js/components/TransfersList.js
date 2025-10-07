const TransfersList = {
  template: `
        <div class="card">
            <h2>My Transfer History</h2>
            <div v-if="!currentUser">
                <p style="color: #666; text-align: center;">Please login first to view your transfers.</p>
            </div>
            <div v-else>
                <div v-if="loading" class="loading">Loading transfers...</div>
                <div v-else-if="!transfers.sent?.length && !transfers.received?.length">
                    <p style="color: #666; text-align: center;">No transfers found.</p>
                </div>
                <div v-else>
                    <!-- SENT TRANSFERS -->
                    <div v-if="transfers.sent?.length" style="margin-bottom: 30px;">
                        <h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 5px;">
                             Sent Transfers
                        </h3>
                        <div v-for="transfer in transfers.sent" :key="transfer.id + '-sent'" class="transfer-item">
                            <p><strong>To:</strong> {{ transfer.receiver_name }} ({{ transfer.receiver_email }})</p>
                            <p><strong>Points:</strong> <span class="points">{{ transfer.points }}</span></p>
                            <p><strong>Status:</strong> <span :style="getStatusStyle(transfer.status)">{{ transfer.status }}</span></p>
                            <p><strong>Date:</strong> {{ new Date(transfer.created_at).toLocaleDateString() }}</p>
                        </div>
                    </div>

                    <!-- RECEIVED TRANSFERS -->
                    <div v-if="transfers.received?.length">
                        <h3 style="color: #28a745; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 5px;">
                             Received Transfers
                        </h3>
                        <div v-for="transfer in transfers.received" :key="transfer.id + '-received'" class="transfer-item">
                            <p><strong>From:</strong> {{ transfer.sender_email }}</p>
                            <p><strong>Points:</strong> <span class="points">{{ transfer.points }}</span></p>
                            <p><strong>Status:</strong> <span :style="getStatusStyle(transfer.status)">{{ transfer.status }}</span></p>
                            <p><strong>Date:</strong> {{ new Date(transfer.created_at).toLocaleDateString() }}</p>
                        </div>
                    </div>

                    <!-- SUMMARY -->
                    <div v-if="transfers.sent?.length || transfers.received?.length" 
                         style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h4> Summary</h4>
                        <p><strong>Total Sent:</strong> {{ calculateTotalSent() }} points</p>
                        <p><strong>Total Received:</strong> {{ calculateTotalReceived() }} points</p>
                    </div>
                </div>
            </div>
        </div>
    `,

  props: ["currentUser", "transfers", "loading"],

  methods: {
    getStatusStyle(status) {
      const styles = {
        pending: "color: #ffc107;",
        completed: "color: #28a745;",
        expired: "color: #dc3545;",
        declined: "color: #6c757d;",
      };
      return styles[status] || "";
    },

    calculateTotalSent() {
      return (this.transfers.sent || [])
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.points, 0);
    },

    calculateTotalReceived() {
      return (this.transfers.received || [])
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.points, 0);
    },
  },
};
