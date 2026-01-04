-- Add questionnaire field to users table
-- This migration adds a JSON column to store user questionnaire data

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS questionnaire JSON NULL 
AFTER phone;

-- Add index for faster queries (optional, but recommended)
-- Note: MySQL 5.7+ supports JSON indexing via generated columns if needed

-- Example of questionnaire JSON structure:
-- {
--   "pet_type": "dog",
--   "pet_name": "Luna",
--   "breed": "Golden Retriever",
--   "custom_breed": null,
--   "size": "large",
--   "brachycephalic": false,
--   "activity": "active",
--   "age_group": "adult",
--   "weight_value": "25",
--   "weight_unit": "kg",
--   "ideal_weight_value": "23",
--   "neutered": "yes",
--   "allergies": ["chicken"],
--   "phone": "+96512345678",
--   "email": "user@example.com",
--   "recommendation": "Chicken & Brown Rice",
--   "recommendation_data": {
--     "meal": "Chicken & Brown Rice",
--     "reason": "Balanced, complete nutrition...",
--     "daily": {
--       "grams": 300,
--       "pouches": 2.5,
--       "pouchSize": 120,
--       "mealsPerDay": 2,
--       "gramsPerMeal": 150
--     }
--   },
--   "updated_at": "2025-01-15T10:30:00.000Z"
-- }

