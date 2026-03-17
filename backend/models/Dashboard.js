const mongoose = require('mongoose');

const DashboardSchema = new mongoose.Schema({
  widgets: { type: mongoose.Schema.Types.Mixed, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Dashboard', DashboardSchema);