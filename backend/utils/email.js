import nodemailer from "nodemailer";

const MENSAJES_ESTADO = {
  confirmado:     { emoji: "✅", titulo: "Tu pedido fue confirmado",        cuerpo: "Ya recibimos tu pedido y lo estamos procesando." },
  en_preparacion: { emoji: "📦", titulo: "Tu pedido está en preparación",   cuerpo: "Estamos preparando tu pedido con cuidado." },
  enviado:        { emoji: "🚚", titulo: "Tu pedido está en camino",         cuerpo: "Tu pedido ya fue despachado y está en camino a tu dirección." },
  entregado:      { emoji: "🎉", titulo: "Tu pedido fue entregado",          cuerpo: "Tu pedido fue entregado exitosamente. ¡Gracias por tu compra!" },
  cancelado:      { emoji: "❌", titulo: "Tu pedido fue cancelado",          cuerpo: "Lamentablemente tu pedido fue cancelado. Contáctanos si tienes dudas." },
};

const smtpConfigurado = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = smtpConfigurado
  ? nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || "email-smtp.us-east-1.amazonaws.com",
      port:   parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export async function enviarEmailRecuperacion(destinatario, nombre, token, baseUrl, ruta = "/tienda/resetear-contrasena") {
  if (!smtpConfigurado) return;
  const enlace = `${baseUrl}${ruta}?token=${token}`;

  await transporter.sendMail({
    from:    `"Merkai" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to:      destinatario,
    subject: "Recupera tu contraseña",
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Hola, ${nombre} 👋</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Recibimos una solicitud para restablecer tu contraseña. Si no la hiciste tú, puedes ignorar este correo.
        </p>
        <a href="${enlace}"
           style="display: inline-block; padding: 13px 28px; background-color: #0F6E56;
                  color: white; text-decoration: none; border-radius: 10px;
                  font-size: 15px; font-weight: 700; margin-bottom: 24px;">
          Restablecer contraseña
        </a>
        <p style="color: #94a3b8; font-size: 13px;">
          Este enlace expira en <strong>1 hora</strong>. Si no pediste esto, ignora el correo.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #cbd5e1; font-size: 12px;">Merkai · Sistema de gestión empresarial</p>
      </div>
    `,
  });
}

export async function enviarEmailNuevoPedido({ destinatario, empresaNombre, numeroPedido, total, clienteNombre, productos }) {
  if (!smtpConfigurado) return;

  const filasProductos = productos.map(p => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;">${p.nombre}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b;font-size:14px;">${p.cantidad}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#0f172a;font-size:14px;font-weight:600;">$${Number(p.precio_unitario).toLocaleString("es-CO")}</td>
    </tr>`).join("");

  await transporter.sendMail({
    from:    `"Merkai" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to:      destinatario,
    subject: `🛒 Nuevo pedido #${numeroPedido} en ${empresaNombre}`,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
        <h2 style="color:#0f172a;margin-bottom:4px;">🛒 Nuevo pedido recibido</h2>
        <p style="color:#64748b;font-size:15px;margin-bottom:24px;">
          <strong>${clienteNombre}</strong> acaba de hacer un pedido en <strong>${empresaNombre}</strong>.
        </p>

        <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:20px;">
          <div style="padding:12px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <span style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Pedido #${numeroPedido}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:8px 14px;text-align:left;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;">Producto</th>
                <th style="padding:8px 14px;text-align:center;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;">Cant.</th>
                <th style="padding:8px 14px;text-align:right;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;">Precio</th>
              </tr>
            </thead>
            <tbody>${filasProductos}</tbody>
          </table>
          <div style="padding:12px 14px;display:flex;justify-content:space-between;border-top:2px solid #f1f5f9;">
            <span style="font-size:14px;font-weight:700;color:#0f172a;">Total</span>
            <span style="font-size:16px;font-weight:700;color:#0F6E56;">$${Number(total).toLocaleString("es-CO")}</span>
          </div>
        </div>

        <a href="${process.env.FRONTEND_URL || "https://merkai.vercel.app"}/dashboard"
           style="display:inline-block;padding:12px 28px;background:#0F6E56;color:white;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;margin-bottom:24px;">
          Ver pedido en el panel →
        </a>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="color:#cbd5e1;font-size:12px;">Merkai · Plataforma de gestión comercial</p>
      </div>
    `,
  });
}

export async function enviarEmailEstadoPedido({ destinatario, nombre, numeroPedido, estado, empresaNombre }) {
  if (!smtpConfigurado) return;
  const info = MENSAJES_ESTADO[estado];
  if (!info) return; // estados sin notificación (pendiente)

  await transporter.sendMail({
    from:    `"${empresaNombre}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to:      destinatario,
    subject: `${info.emoji} Pedido #${numeroPedido} — ${info.titulo}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">${info.emoji} Hola, ${nombre}</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          ${info.cuerpo}
        </p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">NÚMERO DE PEDIDO</p>
          <p style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0;">#${numeroPedido}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #cbd5e1; font-size: 12px;">${empresaNombre} · Powered by Merkai</p>
      </div>
    `,
  });
}
