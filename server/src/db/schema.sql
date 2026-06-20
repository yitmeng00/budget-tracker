-- Ledgr database schema
-- Applied automatically on first Docker container start

CREATE DATABASE IF NOT EXISTS ledgr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ledgr;

-- ─── Settings ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  week_start      ENUM('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL DEFAULT 'Sunday',
  currency_country VARCHAR(100) NOT NULL DEFAULT 'Malaysia',
  currency_code   VARCHAR(10)  NOT NULL DEFAULT 'MYR',
  currency_symbol VARCHAR(10)  NOT NULL DEFAULT 'RM',
  unit_position   ENUM('prefix','suffix') NOT NULL DEFAULT 'prefix',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO settings (id, week_start, currency_country, currency_code, currency_symbol, unit_position)
VALUES (1, 'Sunday', 'Malaysia', 'MYR', 'RM', 'prefix');

-- ─── Categories ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  type  ENUM('income','expense') NOT NULL,
  icon  VARCHAR(50)  NOT NULL DEFAULT 'tag',
  color VARCHAR(20)  NOT NULL DEFAULT '#7b5cf0',
  UNIQUE KEY uq_name_type (name, type)
);

INSERT IGNORE INTO categories (name, type, icon, color) VALUES
  ('Salary',       'income',  'briefcase',    '#16a34a'),
  ('Freelance',    'income',  'laptop',       '#22c55e'),
  ('Investment',   'income',  'trending-up',  '#06b6d4'),
  ('Gift',         'income',  'gift',         '#f59e0b'),
  ('Refund',       'income',  'rotate-ccw',   '#7b5cf0'),
  ('Food & Dining','expense', 'utensils',     '#7b5cf0'),
  ('Transport',    'expense', 'car',          '#06b6d4'),
  ('Shopping',     'expense', 'shopping-bag', '#f59e0b'),
  ('Groceries',    'expense', 'shopping-cart','#22c55e'),
  ('Bills',        'expense', 'receipt',      '#ec4899'),
  ('Entertainment','expense', 'clapperboard', '#f43f5e'),
  ('Health',       'expense', 'heart-pulse',  '#14b8a6');

-- ─── Accounts ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  type       VARCHAR(50)  NOT NULL,
  icon       VARCHAR(50)  NOT NULL DEFAULT 'wallet',
  color      VARCHAR(20)  NOT NULL DEFAULT '#7b5cf0',
  balance    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO accounts (id, name, type, icon, color, balance) VALUES
  (1, 'Cash',            'Wallet',           'banknote',    '#22c55e',  1240.00),
  (2, 'Maybank Savings', 'Savings account',  'piggy-bank',  '#f59e0b', 18500.00),
  (3, 'CIMB Current',    'Current account',  'landmark',    '#06b6d4',  4320.50),
  (4, 'Touch ''n Go',    'E-wallet',         'smartphone',  '#7b5cf0',   380.00),
  (5, 'Maybank Credit',  'Credit card',      'credit-card', '#ef4444', -1150.00);

-- ─── Budgets ─────────────────────────────────────────────────────────────────

-- Time-series of default monthly limits.
-- Effective default for (year, month) = latest row where (start_year, start_month) <= (year, month).
-- This lets "update default in July" leave June's budget unchanged.
CREATE TABLE IF NOT EXISTS budget_defaults (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  start_year  SMALLINT UNSIGNED NOT NULL,
  start_month TINYINT UNSIGNED NOT NULL,  -- 1-indexed
  amount      DECIMAL(15,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cat_start (category_id, start_year, start_month),
  CONSTRAINT fk_bdef_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Month-specific overrides — take precedence over the default for that month only
CREATE TABLE IF NOT EXISTS budget_overrides (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  year        SMALLINT UNSIGNED NOT NULL,
  month       TINYINT UNSIGNED NOT NULL,  -- 1-indexed
  amount      DECIMAL(15,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cat_ym (category_id, year, month),
  CONSTRAINT fk_bover_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

INSERT IGNORE INTO budget_defaults (category_id, start_year, start_month, amount) VALUES
  (6,  2026, 6,  20.00),   -- Food & Dining:  RM 20/mo from Jun 2026
  (7,  2026, 6,  40.00),   -- Transport:      RM 40/mo from Jun 2026
  (9,  2026, 6,  50.00),   -- Groceries:      RM 50/mo from Jun 2026
  (11, 2026, 6, 150.00);   -- Entertainment:  RM 150/mo from Jun 2026

-- ─── Transactions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id  INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  amount      DECIMAL(15,2) NOT NULL,
  note        VARCHAR(255) NOT NULL DEFAULT '',
  tx_date     DATE NOT NULL,
  tx_time     TIME NOT NULL DEFAULT '00:00:00',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_account  FOREIGN KEY (account_id)  REFERENCES accounts(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_tx_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

INSERT IGNORE INTO transactions (id, account_id, category_id, amount, note, tx_date, tx_time) VALUES
  (1,  3, 1,  5200.00, 'Monthly salary — Acme Sdn Bhd',   '2026-06-16', '09:00:00'),
  (2,  5, 11,  -17.90, 'Netflix subscription',            '2026-06-16', '11:00:00'),
  (3,  1, 6,    -9.90, 'ZUS Coffee',                      '2026-06-16', '15:30:00'),
  (4,  4, 7,   -38.00, 'Shell petrol',                    '2026-06-16', '18:00:00'),
  (5,  4, 7,    -9.00, 'Grab to office',                  '2026-06-17', '08:10:00'),
  (6,  1, 6,   -12.50, 'Nasi Lemak Antarabangsa',         '2026-06-17', '08:30:00'),
  (7,  3, 9,   -65.80, 'Jaya Grocer · weekly shop',       '2026-06-17', '13:15:00');
