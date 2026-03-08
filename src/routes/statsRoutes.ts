import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { period } = req.query; // 'day', 'week', 'month', 'year'
    const now = new Date();
    let startDate = new Date();
    let groupByFormat = '';

    // Determine date range and grouping format
    switch (period) {
      case 'day': // Today, hourly
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = '%H:00';
        break;
      case 'week': // This week, daily
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = '%Y-%m-%d';
        break;
      case 'month': // This month, daily
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = '%Y-%m-%d';
        break;
      case 'year': // This year, monthly
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = '%Y-%m';
        break;
      default:
        // Default to month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = '%Y-%m-%d';
    }

    // 1. Get Summary Stats (Revenue, Profit, Count) - All time or filtered? 
    // Usually Dashboard summary is "Today" or "All Time". Let's do "All Time" for top cards, or maybe match period?
    // Let's match period for the cards too, makes more sense.
    
    const orders = await Order.find({ 
      createdAt: { $gte: startDate },
      status: 'completed' 
    }).populate('products.product');
    
    let totalRevenue = 0;
    let totalProfit = 0;
    
    for (const order of orders) {
      totalRevenue += order.totalAmount;
      let orderCost = 0;
      for (const item of order.products) {
        const product = item.product as any;
        if (product) {
          orderCost += (product.costPrice || 0) * item.quantity;
        }
      }
      totalProfit += (order.totalAmount - orderCost);
    }

    // 2. Get Chart Data using Aggregation
    const chartData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing gaps? (Optional, but good for UI)
    // For simplicity, we send what we have. Frontend can handle or just show bars.

    res.json({
      revenue: totalRevenue,
      profit: totalProfit,
      orderCount: orders.length,
      chartData: chartData.map(item => ({
        name: item._id,
        total: item.revenue
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

export default router;
