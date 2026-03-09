import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer')
      .populate('products.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Create order
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, products, pointsUsed, totalAmount, discountAmount, status, note } = req.body;

    // 1. Validate Customer Points
    if (customerId && pointsUsed > 0) {
      const customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        throw new Error('Customer not found');
      }
      if (customer.points < pointsUsed) {
        throw new Error('Insufficient points');
      }
    }

    // 2. Create Order
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const randomLetter2 = letters.charAt(Math.floor(Math.random() * letters.length));
    const orderCode = `LTS${day}${month}${minute}${randomLetter1}${randomLetter2}`;

    const order = new Order({
      code: orderCode,
      customer: customerId,
      products: products.map((p: any) => ({
        product: p.productId,
        quantity: p.quantity,
        price: p.price
      })),
      totalAmount,
      pointsUsed,
      discountAmount,
      status: status || 'completed',
      note
    });

    await order.save({ session });

    // 3. Update Product Stock
    for (const item of products) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // 4. Update Customer Points
    if (customerId) {
      // Deduct used points
      if (pointsUsed > 0) {
        await Customer.findByIdAndUpdate(
          customerId,
          { $inc: { points: -pointsUsed } },
          { session }
        );
      }
      
      // Add new points ONLY if status is completed
      const finalStatus = status || 'completed';
      if (finalStatus === 'completed') {
        const pointsEarned = Math.floor(totalAmount / 1000);
        await Customer.findByIdAndUpdate(
          customerId,
          { $inc: { points: pointsEarned } },
          { session }
        );
      }
    }

    await session.commitTransaction();
    res.status(201).json(order);
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(400).json({ message: 'Error creating order' });
  } finally {
    session.endSession();
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status } = req.body; // 'pending', 'completed', 'cancelled'
    const order = await Order.findById(req.params.id).populate('products.product');
    
    if (!order) {
      throw new Error('Order not found');
    }

    const oldStatus = order.status;
    const newStatus = status;

    if (oldStatus !== newStatus) {
      const pointsEarned = Math.floor(order.totalAmount / 1000);

      // 1. Handle Stock and pointsUsed (Active vs Cancelled)
      if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
        // Deactivating order: Restore stock, refund pointsUsed
        for (const item of order.products) {
          if (item.product) {
            await Product.findByIdAndUpdate(
              item.product._id,
              { $inc: { stock: item.quantity } },
              { session }
            );
          }
        }
        if (order.customer && order.pointsUsed > 0) {
          await Customer.findByIdAndUpdate(
            order.customer,
            { $inc: { points: order.pointsUsed } },
            { session }
          );
        }
      } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
        // Reactivating order: Deduct stock, deduct pointsUsed
        for (const item of order.products) {
          if (item.product) {
            const product = await Product.findById(item.product._id).session(session);
            if (product && product.stock < item.quantity) {
               throw new Error(`Not enough stock for ${product.name}`);
            }
            await Product.findByIdAndUpdate(
              item.product._id,
              { $inc: { stock: -item.quantity } },
              { session }
            );
          }
        }
        if (order.customer && order.pointsUsed > 0) {
          const customer = await Customer.findById(order.customer).session(session);
          if (customer && customer.points < order.pointsUsed) {
            throw new Error('Customer does not have enough points to restore this order');
          }
          await Customer.findByIdAndUpdate(
            order.customer,
            { $inc: { points: -order.pointsUsed } },
            { session }
          );
        }
      }

      // 2. Handle pointsEarned (Completed vs Not Completed)
      if (order.customer) {
        if (oldStatus !== 'completed' && newStatus === 'completed') {
          // Becoming completed: Add pointsEarned
          await Customer.findByIdAndUpdate(
            order.customer,
            { $inc: { points: pointsEarned } },
            { session }
          );
        } else if (oldStatus === 'completed' && newStatus !== 'completed') {
          // No longer completed: Remove pointsEarned
          await Customer.findByIdAndUpdate(
            order.customer,
            { $inc: { points: -pointsEarned } },
            { session }
          );
        }
      }
    }

    order.status = newStatus;
    await order.save({ session });

    await session.commitTransaction();
    res.json(order);
  } catch (error: any) {
    await session.abortTransaction();
    console.error(error);
    res.status(400).json({ message: error.message || 'Error updating order' });
  } finally {
    session.endSession();
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(req.params.id).populate('products.product');
    
    if (!order) {
      throw new Error('Order not found');
    }

    // If order is active (not cancelled), we need to revert its effects
    if (order.status !== 'cancelled') {
      // Restore stock
      for (const item of order.products) {
        if (item.product) {
          await Product.findByIdAndUpdate(
            item.product._id,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }
      
      // Revert points
      if (order.customer) {
        // Refund used points
        if (order.pointsUsed > 0) {
          await Customer.findByIdAndUpdate(
            order.customer,
            { $inc: { points: order.pointsUsed } },
            { session }
          );
        }
        // Remove earned points ONLY if it was completed
        if (order.status === 'completed') {
          const pointsEarned = Math.floor(order.totalAmount / 1000);
          await Customer.findByIdAndUpdate(
            order.customer,
            { $inc: { points: -pointsEarned } },
            { session }
          );
        }
      }
    }

    await Order.findByIdAndDelete(req.params.id, { session });

    await session.commitTransaction();
    res.json({ message: 'Order deleted' });
  } catch (error: any) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: error.message || 'Error deleting order' });
  } finally {
    session.endSession();
  }
});

export default router;
