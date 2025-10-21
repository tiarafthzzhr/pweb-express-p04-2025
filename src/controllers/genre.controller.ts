import { Request, Response } from "express";
import prisma from "../prisma/client";
import { response } from "../utils/response";

// POST /genre
export const createGenre = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json(response(false, "Genre name is required"));

    // Cek duplikasi
    const existing = await prisma.genres.findUnique({ where: { name } });
    if (existing) return res.status(400).json(response(false, "Genre already exists"));

    const genre = await prisma.genres.create({ data: { name } });
    res.status(201).json(response(true, "Genre created successfully", genre));
  } catch (error) {
    res.status(500).json(response(false, "Internal Server Error", error));
  }
};

// GET /genre
export const getAllGenre = async (req: Request, res: Response) => {
  try {
    const genres = await prisma.genres.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
    });
    res.json(response(true, "All genres fetched", genres));
  } catch (error) {
    res.status(500).json(response(false, "Internal Server Error", error));
  }
};

// GET /genre/:genre_id
export const getGenreDetail = async (req: Request, res: Response) => {
  try {
    const { genre_id } = req.params;
    console.log("Requested genre_id:", genre_id);

    const genre = await prisma.genres.findUnique({
      where: { id: genre_id },
      include: { books: true },
    });

    console.log("Genre found:", genre);

    if (!genre || genre.deleted_at)
      return res.status(404).json(response(false, "Genre not found"));

    res.json(response(true, "Genre detail", genre));
  } catch (error) {
    console.error("Error getting genre detail:", error);
    res.status(500).json(response(false, "Internal Server Error", error));
  }
};

// PATCH /genre/:genre_id
export const updateGenre = async (req: Request, res: Response) => {
  try {
    const { genre_id } = req.params;
    const { name } = req.body;

    const genre = await prisma.genres.findUnique({ where: { id: genre_id } });
    if (!genre || genre.deleted_at)
      return res.status(404).json(response(false, "Genre not found"));

    const updated = await prisma.genres.update({
      where: { id: genre_id },
      data: { name, updated_at: new Date() },
    });

    res.json(response(true, "Genre updated successfully", updated));
  } catch (error) {
    res.status(500).json(response(false, "Internal Server Error", error));
  }
};

// DELETE /genre/:genre_id (soft delete)
export const deleteGenre = async (req: Request, res: Response) => {
  try {
    const { genre_id } = req.params;

    const genre = await prisma.genres.findUnique({ where: { id: genre_id } });
    if (!genre || genre.deleted_at)
      return res.status(404).json(response(false, "Genre not found"));

    await prisma.genres.update({
      where: { id: genre_id },
      data: { deleted_at: new Date() },
    });

    res.json(response(true, "Genre deleted successfully (soft delete)"));
  } catch (error) {
    res.status(500).json(response(false, "Internal Server Error", error));
  }
};