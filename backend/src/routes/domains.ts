import express from 'express';

const router = express.Router();

// Placeholder para rutas de dominios
router.get('/', async (req: any, res: any) => {
  res.json({ message: 'Domains routes coming soon' });
});

export default router;
