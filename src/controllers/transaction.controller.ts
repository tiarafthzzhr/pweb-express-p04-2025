import { Request, Response } from "express";
import prisma from "../prisma/client";
import { response } from "../utils/response";

// POST /transactions
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(response(false, "Authentication required"));
    }
    const { items } = req.body; // [{ book_id, quantity }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(response(false, "Items array is required"));
    }

    // Buat order baru
    const order = await prisma.orders.create({
      data: { user_id: user.id },
    });

    let totalAmount = 0;

    for (const item of items) {
      const book = await prisma.books.findUnique({ where: { id: item.book_id } });
      if (!book || book.deleted_at) {
        return res.status(404).json(response(false, `Book not found: ${item.book_id}`));
      }
      if (book.stock_quantity < item.quantity) {
        return res.status(400).json(response(false, `Insufficient stock for ${book.title}`));
      }

      // Kurangi stok buku
      await prisma.books.update({
        where: { id: item.book_id },
        data: { stock_quantity: book.stock_quantity - item.quantity },
      });

      // Tambahkan item ke order_items
      await prisma.order_items.create({
        data: {
          quantity: item.quantity,
          order_id: order.id,
          book_id: item.book_id,
        },
      });

      totalAmount += book.price * item.quantity;
    }

    res.status(201).json(response(true, "Transaction created successfully", {
      order_id: order.id,
      totalAmount,
    }));
  } catch (error) {
    res.status(500).json(response(false, "Internal Server Error", error));
  }
};

// GET /transactions
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(response(false, "Authentication required"));
    }
    const orders = await prisma.orders.findMany({
      where: { user_id: user.id },
      include: {
        items: {
          include: { book: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.json(response(true, "All transactions fetched", orders));
  } catch (error) {
    res.status(500).json(response(false, "Internal Server Error", error));
  }
};

// GET /transactions/:transaction_id
export const getTransactionDetail = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(response(false, "Authentication required"));
    }
    const { transaction_id } = req.params;

    const order = await prisma.orders.findUnique({
      where: { id: transaction_id },
      include: {
        items: {
          include: { book: true },
        },
      },
    });

    if (!order || order.user_id !== user.id)
      return res.status(404).json(response(false, "Transaction not found"));

    res.json(response(true, "Transaction detail", order));
  } catch (error) {
    res.status(500).json(response(false, "Internal Server Error", error));
  }
};

// GET /transactions/statistics
export const getTransactionStatistics = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json(response(false, "Authentication required"));
    }
    const totalTransactions = await prisma.orders.count();

    const orders = await prisma.orders.findMany({
      include: {
        items: {
          include: {
            book: {
              include: { genre: true },
            },
          },
        },
      },
    });

    if (orders.length === 0)
      return res.json(response(true, "No transactions found", {
        totalTransactions: 0,
        averageAmount: 0,
        topGenre: null,
        leastGenre: null,
      }));

    let totalAmount = 0;
    const genreCount: Record<string, number> = {};

    for (const order of orders) {
      let orderTotal = 0;
      for (const item of order.items) {
        orderTotal += item.book.price * item.quantity;
        const genreName = item.book.genre?.name || "Unknown";
        genreCount[genreName] = (genreCount[genreName] || 0) + item.quantity;
      }
      totalAmount += orderTotal;
    }

    const averageAmount = totalAmount / totalTransactions;

    const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
    const topGenre = sortedGenres[0]?.[0] || null;
    const leastGenre = sortedGenres[sortedGenres.length - 1]?.[0] || null;

    res.json(response(true, "Transaction statistics", {
      totalTransactions,
      averageAmount,
      topGenre,
      leastGenre,
    }));
  } catch (error) {
    res.status(500).json(response(false, "Internal Server Error", error));
  }
};