import pool from "../config/db.js";
import bcrypt from "bcrypt";

const hashPasswords = async () => {
  try {
    const result = await pool.query("SELECT id, contrasena FROM persona");

    for (const user of result.rows) {

      // 🔒 Si ya está hasheada, la saltamos
      if (user.contrasena.startsWith("$2b$")) continue;

      const hash = await bcrypt.hash(user.contrasena, 10);

      await pool.query(
        "UPDATE persona SET contrasena = $1 WHERE id = $2",
        [hash, user.id]
      );

      console.log(`✅ Usuario ${user.id} actualizado`);
    }

    console.log("🎉 Todas las contraseñas fueron hasheadas");
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

hashPasswords();