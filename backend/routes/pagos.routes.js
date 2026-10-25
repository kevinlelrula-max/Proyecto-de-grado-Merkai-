import { Router } from "express";
import express from "express";
import {
  crearPaymentIntent,
  webhookStripe,
  webhookWompi,
  webhookPayU,
  webhookMercadoPago,
  getEstadoPago,
  confirmarPagoStripe,
} from "../controllers/pagos.controller.js";

import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// ⚠️ IMPORTANTE: el webhook de Stripe necesita el raw body (sin parsear a JSON)
// Esta ruta debe ir ANTES de cualquier middleware que parsee JSON
router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  webhookStripe
);

// Webhooks de otras pasarelas (reciben JSON normal)
router.post("/webhook/wompi",       webhookWompi);
router.post("/webhook/payu",        webhookPayU);
router.post("/webhook/mercadopago", webhookMercadoPago);

// 🔐 Rutas privadas — requieren token del cliente
router.post("/crear-payment-intent", verificarToken, crearPaymentIntent);
router.get("/estado/:pedido_id",     verificarToken, getEstadoPago);
router.post("/confirmar-stripe",     verificarToken, confirmarPagoStripe);

export default router;