-- Create meal_plans table for managing meal plan cards
CREATE TABLE IF NOT EXISTS meal_plans (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  sku                 VARCHAR(191) NOT NULL UNIQUE,
  name                VARCHAR(191) NOT NULL,
  subtitle            VARCHAR(255) NULL,
  category            ENUM('dogs', 'cats', 'both') NOT NULL DEFAULT 'both',
  image_path          VARCHAR(500) NULL,
  ingredients         TEXT NULL,
  guaranteed_analysis TEXT NULL, -- JSON string or plain text
  benefits            TEXT NULL, -- JSON array or plain text
  nutrition_values    JSON NULL, -- {protein: "15%", fiber: "1%", moisture: "70%", fats: "8%", ash: "2.5%", taurine: null}
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  display_order       INT NOT NULL DEFAULT 0,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (is_active),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert existing meal plans from the HTML
INSERT INTO meal_plans (sku, name, subtitle, category, image_path, ingredients, guaranteed_analysis, benefits, nutrition_values, display_order) VALUES
('DOG-CHICKEN', 'Chicken & Brown Rice', 'Immunity Boost', 'dogs', 'assets/images/meals/Chicken dog.png',
 'Chicken meat (breast & thigh), brown rice, chicken liver, pumpkin, carrot, spinach, salmon oil, ground flaxseed, eggshell calcium, kelp powder, vitamin & mineral premix, water added for cooking.',
 'Crude Protein (min): 15.0%\nCrude Fat (min): 8.0%\nCrude Fiber (max): 1.0%\nMoisture (max): 70.0%\nAsh (max): 2.5%',
 'Supports immune system\nHigh-quality protein for muscle development\nRich in antioxidants\nPromotes healthy digestion',
 '{"protein": "15%", "fiber": "1%", "moisture": "70%", "fats": "8%", "ash": "2.5%", "taurine": null}',
 1),

('DOG-BEEF', 'Beef & Sweet Potato', 'Vitality & Energy', 'dogs', 'assets/images/meals/Beef Dog.png',
 'Beef meat, beef liver, beef heart/kidney, sweet potato, carrot, spinach, salmon oil, ground flaxseed, eggshell calcium, kelp powder, vitamin & mineral premix, water added for cooking.',
 'Crude Protein (min): 16.0%\nCrude Fat (min): 9.0%\nCrude Fiber (max): 1.5%\nMoisture (max): 71.0%\nAsh (max): 2.5%',
 'High-quality protein for energy\nRich in iron and B vitamins\nSupports muscle development\nPromotes overall vitality',
 '{"protein": "16%", "fiber": "1.5%", "moisture": "71%", "fats": "9%", "ash": "2.5%", "taurine": null}',
 2),

('DOG-FISH', 'White Fish & Quinoa', 'Skin & Coat Health', 'dogs', 'assets/images/meals/Fish Dog.png',
 'White fish, quinoa, pumpkin, carrot, spinach, salmon oil, ground flaxseed, eggshell calcium, kelp powder, vitamin & mineral premix, water added for cooking.',
 'Crude Protein (min): 13.0%\nCrude Fat (min): 6.0%\nCrude Fiber (max): 1.5%\nMoisture (max): 73.0%\nAsh (max): 2.5%',
 'Promotes healthy skin and coat\nRich in omega-3 fatty acids\nEasily digestible protein\nSupports joint health',
 '{"protein": "13%", "fiber": "1.5%", "moisture": "73%", "fats": "6%", "ash": "2.5%", "taurine": null}',
 3),

('CAT-FISH', 'White Fish & Sardine', 'Digestive Health', 'cats', 'assets/images/meals/Fish Cat.png',
 'White fish, sardine, pumpkin, spinach, salmon oil, ground flaxseed, taurine, eggshell calcium, kelp powder, vitamin & mineral premix, water added for cooking.',
 'Crude Protein (min): 17.0%\nCrude Fat (min): 9.0%\nCrude Fiber (max): 1.0%\nMoisture (max): 74.0%\nAsh (max): 2.2%\nTaurine (min): 0.12%',
 'Gentle on sensitive stomachs\nRich in omega-3 for skin and coat\nEasy to digest pumpkin and leafy greens\nSupports overall feline health',
 '{"protein": "17%", "fiber": "1%", "moisture": "74%", "fats": "9%", "ash": "2.2%", "taurine": "0.12%"}',
 4),

('CAT-CHICKEN', 'Chicken Recipe', 'Heart & Eye Health', 'cats', 'assets/images/meals/Chicken Cat.png',
 'Chicken meat (breast & thigh), chicken liver, chicken heart, pumpkin, spinach, salmon oil, ground flaxseed, taurine, eggshell calcium, kelp powder, vitamin & mineral premix, water added for cooking.',
 'Crude Protein (min): 18.0%\nCrude Fat (min): 10.0%\nCrude Fiber (max): 1.0%\nMoisture (max): 72.0%\nAsh (max): 2.5%\nTaurine (min): 0.12%',
 'Rich in taurine and essential amino acids for heart & vision health\nGentle on feline stomachs\nSpinach and flaxseed deliver natural antioxidants',
 '{"protein": "18%", "fiber": "1%", "moisture": "72%", "fats": "10%", "ash": "2.5%", "taurine": "0.12%"}',
 5),

('CAT-BEEF', 'Beef Recipe', 'Muscle & Strength', 'cats', 'assets/images/meals/Beef Cat.png',
 'Beef meat, beef liver, beef heart, pumpkin, spinach, salmon oil, ground flaxseed, taurine, eggshell calcium, kelp powder, vitamin & mineral premix, water added for cooking.',
 'Crude Protein (min): 17.0%\nCrude Fat (min): 9.0%\nCrude Fiber (max): 1.0%\nMoisture (max): 73.0%\nAsh (max): 2.2%\nTaurine (min): 0.12%',
 'High-quality protein for muscle maintenance\nRich in taurine for heart health\nSupports overall feline strength and vitality',
 '{"protein": "17%", "fiber": "1%", "moisture": "73%", "fats": "9%", "ash": "2.2%", "taurine": "0.12%"}',
 6)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  subtitle = VALUES(subtitle),
  category = VALUES(category),
  image_path = VALUES(image_path),
  ingredients = VALUES(ingredients),
  guaranteed_analysis = VALUES(guaranteed_analysis),
  benefits = VALUES(benefits),
  nutrition_values = VALUES(nutrition_values),
  display_order = VALUES(display_order);

