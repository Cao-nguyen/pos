import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  code: string;
  customer: mongoose.Types.ObjectId;
  products: {
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number; 
  }[];
  status: 'pending' | 'completed' | 'cancelled';
  totalAmount: number; // Final total after everything
  subtotal: number;
  pointsUsed: number;
  pointsDiscount: number;
  customDiscount: number;
  shippingFee: number;
  vatRate: number;
  vatAmount: number;
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
  subtotal: { type: Number, default: 0 },
  pointsUsed: { type: Number, default: 0 },
  pointsDiscount: { type: Number, default: 0 },
  customDiscount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  vatRate: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 0 },
  note: { type: String },
}, { 
  timestamps: true,
  collection: 'orders'
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
