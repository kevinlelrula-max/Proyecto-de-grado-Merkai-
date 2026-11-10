import jwt from "jsonwebtoken";

export const generarTokenMcp = (req, res) => {
  const { id, empresa_id, rol_id } = req.user;

  const token = jwt.sign(
    { id, empresa_id, rol_id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const mcpUrl = process.env.MCP_URL || "http://localhost:4001/sse";

  res.json({
    token,
    mcpUrl,
    comandoClaude: `claude mcp add --transport sse merkai ${mcpUrl} --header "Authorization: Bearer ${token}"`,
    expira: "30 días",
  });
};
