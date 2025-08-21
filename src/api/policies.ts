// src/api/policies.ts
import express from 'express';
import { z } from 'zod';
import { CancellationPolicy, PolicyType } from '@/types/policy';
import { authenticateToken, requireRole } from '@/middleware/auth';
import { validateBody, validateParams } from '@/middleware/validate';
import { propertyRateLimiter } from '@/middleware/rate-limit';
import { UserRole } from '@/types/auth';
import { API_BASE_URL } from '@/config';

const router = express.Router();

// Validation schemas
const policyParamsSchema = z.object({
  propertyId: z.string(),
});

const updatePolicySchema = z.object({
  type: z.enum(['flexible', 'moderate', 'strict']),
  customRules: z.array(z.string()).optional(),
});

// Get property policy
router.get(
  '/properties/:propertyId/policy',
  authenticateToken,
  propertyRateLimiter,
  validateParams(policyParamsSchema),
  async (req, res) => {
    try {
      const { propertyId } = req.params;
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/policy`);
      if (!response.ok) {
        throw new Error('Failed to fetch policy');
      }
      const policy = await response.json();
      res.json(policy);
    } catch (error) {
      console.error('Error fetching property policy:', error);
      res.status(500).json({ error: 'Failed to fetch policy' });
    }
  }
);

// Update property policy (only host and admin)
router.put(
  '/properties/:propertyId/policy',
  authenticateToken,
  requireRole([UserRole.HOST, UserRole.ADMIN]),
  propertyRateLimiter,
  validateParams(policyParamsSchema),
  validateBody(updatePolicySchema),
  async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { type, customRules } = req.body;
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/policy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, customRules }),
      });
      if (!response.ok) {
        throw new Error('Failed to update policy');
      }
      const updatedPolicy = await response.json();
      res.json(updatedPolicy);
    } catch (error) {
      console.error('Error updating property policy:', error);
      res.status(500).json({ error: 'Failed to update policy' });
    }
  }
);

export default router;