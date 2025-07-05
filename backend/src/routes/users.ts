import express from 'express';

const router = express.Router();

// Placeholder para rutas de usuarios
router.get('/profile', async (req: any, res: any) => {
  res.json({ message: 'User profile route coming soon' });
});

export default router;
