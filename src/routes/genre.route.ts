import { Router } from "express";
import {
  createGenre,
  getAllGenre,
  getGenreDetail,
  updateGenre,
  deleteGenre,
} from "../controllers/genre.controller";

const router = Router();

router.post("/", createGenre);
router.get("/", getAllGenre);
router.get("/:genre_id", getGenreDetail);
router.patch("/:genre_id", updateGenre);
router.delete("/:genre_id", deleteGenre);

export default router;