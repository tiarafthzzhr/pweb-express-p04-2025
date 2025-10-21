import { Request, Response } from "express";
import prisma from "../prisma/client";
import { response } from "../utils/response";

// POST /books
export const createBook = async (req: Request, res: Response) => {
  try {
    console.log("Request body:", req.body);
    const { title, writer, publisher, publication_year, description, price, stock_quantity, genre_id } = req.body;

    // Validasi input
    if (!title || !writer || !publisher || !publication_year || !price || !stock_quantity || !genre_id) {
      return res.status(400).json(response(false, "All required fields must be provided"));
    }

    // Cek apakah genre_id valid
    const genreExists = await prisma.genres.findUnique({ where: { id: genre_id } });
    if (!genreExists) {
      return res.status(400).json(response(false, "Invalid genre_id"));
    }

    // Cek duplikasi judul
    const existing = await prisma.books.findUnique({ where: { title } });
    if (existing) return res.status(400).json(response(false, "Book title already exists"));

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

    res.status(201).json(response(true, "Book created successfully", newBook));
  } catch (error) {
    console.error("Error creating book:", error);
    if (error && typeof error === 'object' && 'code' in error && error.code === "P2003") {
      return res.status(400).json(response(false, "Invalid genre_id: Genre does not exist"));
    }
    res.status(500).json(response(false, "Internal server error", error));
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
    if (!book || book.deleted_at)
      return res.status(404).json(response(false, "Book not found"));

    const updated = await prisma.books.update({
      where: { id: book_id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    res.json(response(true, "Book updated successfully", updated));
  } catch (error) {
    res.status(500).json(response(false, "Internal server error", error));
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