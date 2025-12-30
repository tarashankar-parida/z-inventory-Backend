import express from 'express';
import StockTransaction from '../models/StockTransaction.js';
import Product from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all transactions
router.get('/', authenticate, async (req, res) => {
  try {
    const transactions = await StockTransaction.find()
      .populate('productId')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single transaction
router.get('/:id', authenticate, async (req, res) => {
  try {
    const transaction = await StockTransaction.findById(req.params.id).populate('productId');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create transaction
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, type, quantity, date, notes } = req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update stock
    if (type === 'IN') {
      product.currentStock += quantity;
    } else if (type === 'OUT') {
      if (product.currentStock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      product.currentStock -= quantity;
    }

    await product.save();

    // Create transaction
    const transaction = new StockTransaction({
      productId,
      type,
      quantity,
      date: date || new Date(),
      notes
    });
    
    await transaction.save();
    await transaction.populate('productId');
    
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete transaction (and reverse stock change)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const transaction = await StockTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Reverse stock change
    const product = await Product.findById(transaction.productId);
    if (product) {
      if (transaction.type === 'IN') {
        product.currentStock -= transaction.quantity;
      } else {
        product.currentStock += transaction.quantity;
      }
      await product.save();
    }

    await StockTransaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

