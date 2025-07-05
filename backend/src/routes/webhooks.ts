import express from 'express';

const router = express.Router();

// Placeholder para webhooks de Stripe
router.post('/stripe', async (req: any, res: any) => {
  res.json({ message: 'Stripe webhooks coming soon' });
});

export default router;
