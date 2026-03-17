const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customer: {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true },
    phone:     { type: String, required: true }
  },
  address: {
    street:     { type: String, required: true },
    city:       { type: String, required: true },
    state:      { type: String, required: true },
    postalCode: { type: String, required: true },
    country:    { type: String, required: true }
  },
  product: { type: String, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Pending', 'In progress', 'Completed'],
    default: 'Pending'
  },
  createdBy: {
    type: String,
    enum: [
      'Mr. Michael Harris',
      'Mr. Ryan Cooper',
      'Ms. Olivia Carter',
      'Mr. Lucas Martin'
    ],
    default: 'Mr. Michael Harris'
  }
}, { timestamps: true });

OrderSchema.virtual('totalAmount').get(function () {
  return this.quantity * this.unitPrice;
});

OrderSchema.set('toJSON',   { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', OrderSchema);