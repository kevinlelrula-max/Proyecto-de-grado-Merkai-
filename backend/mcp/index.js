
import dotenv from "dotenv";  

dotenv.config();

import app from "./server.js";

const PORT= process.env.MCP_PORT || 4001;

app.listen(PORT, () => {
  console.log(`Merkai MCP corriendo en http://localhost:${PORT}/sse`);
});