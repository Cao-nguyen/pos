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
          _id: { $dateToString: { format: groupByFormat, date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Get Top Selling Products (all time or current period?) -> Let's do current period
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalSold: { $sum: "$products.quantity" },
          revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products", // The actual collection name in MongoDB
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          _id: 1,
          name: "$productInfo.name",
          totalSold: 1,
          revenue: 1
        }
      }
    ]);

    // 4. Get Recent Orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name phone')
      .populate('products.product', 'name');

    res.json({
      revenue: totalRevenue,
      profit: totalProfit,
      orderCount: orders.length,
      chartData: chartData.map(item => ({
        name: item._id,
        total: item.revenue
      })),
      topProducts,
      recentOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

export default router;
