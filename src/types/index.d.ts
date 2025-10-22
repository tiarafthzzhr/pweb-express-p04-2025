import "express";

// Deklarasi ulang modul Express untuk menambah properti `user`
declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}