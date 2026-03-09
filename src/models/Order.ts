import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  code: string;
  customer: mongoose.Types.ObjectId;
  products: {
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number; // Snapshot of price at time of sale
  }[];
  status: 'pending' | 'completed' | 'cancelled';
  totalAmount: number;
  pointsUsed: number;
  discountAmount: number;
  note?: string;
}

const OrderSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
  products: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  totalAmount: { type: Number, required: true },
  pointsUsed: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  note: { type: String },
}, { 
  timestamps: true,
  collection: 'orders' // Explicitly set collection name
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
