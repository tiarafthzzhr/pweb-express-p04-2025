import app from "./app";
import prisma from "./prisma/client";

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Tutup koneksi Prisma saat server berhenti
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});