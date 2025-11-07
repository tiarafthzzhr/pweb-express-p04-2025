import { Request, Response } from "express";
import prisma from "../prisma/client";
import { response } from "../utils/response";

// POST /books
export const createBook = async (req: Request, res: Response) => {
  try {
    const {
      title,
      writer,
      publisher,
      publication_year,
      description,
      price,
      stock_quantity,
      genre_id,
    } = req.body;

    // VALIDASI DASAR
    if (!title || !writer || !publisher || !price || !stock_quantity || !genre_id) {
      return res.status(400).json(response(false, "All required fields must be filled"));
    }

    if (price < 0) {
      return res.status(400).json(response(false, "Price cannot be negative"));
    }

    if (stock_quantity < 0) {
      return res.status(400).json(response(false, "Stock cannot be negative"));
    }

    if (publication_year && (publication_year < 0 || publication_year > new Date().getFullYear())) {
      return res.status(400).json(response(false, "Invalid publication year"));
    }

    // CHECK UNIQUE TITLE
    const existing = await prisma.books.findUnique({ where: { title } });
    if (existing) {
      return res.status(400).json(response(false, "Book title already exists"));
    }

    // CHECK GENRE EXISTS
    const genre = await prisma.genres.findUnique({ where: { id: genre_id } });
    if (!genre || genre.deleted_at) {
      return res.status(404).json(response(false, "Genre not found"));
    }

    const newBook = await prisma.books.create({
      data: {
        title,
        writer,
        publisher,
        publication_year,
        description,
        price,
        stock_quantity,
        genre_id,
      },
    });

    return res.status(201).json(response(true, "Book created", newBook));
  } catch (error) {
    return res.status(500).json(response(false, "Internal server error", error));
  }
};

// GET /books
export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = "", order = "asc" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const books = await prisma.books.findMany({
      where: {
        deleted_at: null,
        title: { contains: String(search), mode: "insensitive" },
      },
      orderBy: { title: order === "desc" ? "desc" : "asc" },
      skip,
      take: Number(limit),
      include: { genre: true },
    });

    const total = await prisma.books.count({ where: { deleted_at: null } });

    res.json(response(true, "Books fetched successfully", { total, page, limit, books }));
  } catch (error) {
    res.status(500).json(response(false, "Internal server error", error));
  }
};

// GET /books/:book_id
export const getBookById = async (req: Request, res: Response) => {
  try {
    const { book_id } = req.params;

    const book = await prisma.books.findUnique({
      where: { id: book_id },
      include: { genre: true },
    });

    if (!book || book.deleted_at)
      return res.status(404).json(response(false, "Book not found"));

    res.json(response(true, "Book detail", book));
  } catch (error) {
    res.status(500).json(response(false, "Internal server error", error));
  }
};

// GET /books/genre/:genre_id
export const getBooksByGenre = async (req: Request, res: Response) => {
  try {
    const { genre_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const books = await prisma.books.findMany({
      where: { genre_id, deleted_at: null },
      skip,
      take: Number(limit),
      include: { genre: true },
    });

    if (books.length === 0)
      return res.status(404).json(response(false, "No books found for this genre"));

    res.json(response(true, "Books by genre", books));
  } catch (error) {
    res.status(500).json(response(false, "Internal server error", error));
  }
};

// PATCH /books/:book_id
export const updateBook = async (req: Request, res: Response) => {
  try {
    const { book_id } = req.params;
    const data = req.body;

    const book = await prisma.books.findUnique({ where: { id: book_id } });

    if (!book || book.deleted_at) {
      return res.status(404).json(response(false, "Book not found"));
    }

    if (data.price !== undefined && data.price < 0) {
      return res.status(400).json(response(false, "Price cannot be negative"));
    }

    if (data.stock_quantity !== undefined && data.stock_quantity < 0) {
      return res.status(400).json(response(false, "Stock cannot be negative"));
    }

    if (data.publication_year !== undefined) {
      if (data.publication_year < 0 || data.publication_year > new Date().getFullYear()) {
        return res.status(400).json(response(false, "Invalid publication year"));
      }
    }

    if (data.title) {
      const duplicate = await prisma.books.findUnique({ where: { title: data.title } });
      if (duplicate && duplicate.id !== book_id) {
        return res.status(400).json(response(false, "Title already used by another book"));
      }
    }

    const updated = await prisma.books.update({
      where: { id: book_id },
      data,
    });

    return res.json(response(true, "Book updated", updated));
  } catch (error) {
    return res.status(500).json(response(false, "Internal server error", error));
  }
};

// DELETE /books/:book_id (soft delete)
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const { book_id } = req.params;

    const book = await prisma.books.findUnique({ where: { id: book_id } });
    if (!book || book.deleted_at)
      return res.status(404).json(response(false, "Book not found"));

    await prisma.books.update({
      where: { id: book_id },
      data: { deleted_at: new Date() },
    });

    res.json(response(true, "Book deleted (soft delete)"));
  } catch (error) {
    res.status(500).json(response(false, "Internal server error", error));
  }
};