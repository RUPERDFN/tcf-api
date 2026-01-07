import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8);

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    it('should accept valid email formats', () => {
      expect(() => emailSchema.parse('user@example.com')).not.toThrow();
      expect(() => emailSchema.parse('user.name@domain.co')).not.toThrow();
      expect(() => emailSchema.parse('user+tag@example.org')).not.toThrow();
    });

    it('should reject invalid email formats', () => {
      expect(() => emailSchema.parse('invalid')).toThrow();
      expect(() => emailSchema.parse('no@domain')).toThrow();
      expect(() => emailSchema.parse('@nodomain.com')).toThrow();
      expect(() => emailSchema.parse('')).toThrow();
    });
  });

  describe('Password Validation', () => {
    it('should accept passwords with 8+ characters', () => {
      expect(() => passwordSchema.parse('12345678')).not.toThrow();
      expect(() => passwordSchema.parse('password123')).not.toThrow();
      expect(() => passwordSchema.parse('VeryLongPassword!')).not.toThrow();
    });

    it('should reject passwords under 8 characters', () => {
      expect(() => passwordSchema.parse('1234567')).toThrow();
      expect(() => passwordSchema.parse('short')).toThrow();
      expect(() => passwordSchema.parse('')).toThrow();
    });
  });
});

const profileSchema = z.object({
  diners: z.number().int().min(1).max(20),
  budgetWeekly: z.number().min(0),
  dietType: z.enum(['omnivora', 'vegetariana', 'vegana', 'pescetariana']),
  allergies: z.array(z.string()).optional(),
});

describe('Profile Schema Validation', () => {
  it('should accept valid profile data', () => {
    const validProfile = {
      diners: 4,
      budgetWeekly: 150,
      dietType: 'omnivora',
      allergies: ['gluten', 'lactose']
    };
    
    expect(() => profileSchema.parse(validProfile)).not.toThrow();
  });

  it('should reject invalid diners count', () => {
    const invalidProfile = {
      diners: 0,
      budgetWeekly: 100,
      dietType: 'omnivora'
    };
    
    expect(() => profileSchema.parse(invalidProfile)).toThrow();
  });

  it('should reject invalid diet type', () => {
    const invalidProfile = {
      diners: 2,
      budgetWeekly: 100,
      dietType: 'invalid-diet'
    };
    
    expect(() => profileSchema.parse(invalidProfile)).toThrow();
  });

  it('should reject negative budget', () => {
    const invalidProfile = {
      diners: 2,
      budgetWeekly: -50,
      dietType: 'vegana'
    };
    
    expect(() => profileSchema.parse(invalidProfile)).toThrow();
  });
});
