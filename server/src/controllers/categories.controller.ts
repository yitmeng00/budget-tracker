import type { Request, Response, NextFunction } from 'express';
import pool from '../db/connection.js';

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY type, name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, type, icon, color } = req.body;
    const [result] = (await pool.query(
      'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
      [name, type, icon ?? 'tag', color ?? '#2563eb'],
    )) as unknown as [{ insertId: number }];
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json((rows as unknown[])[0]);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, icon, color } = req.body;
    await pool.query('UPDATE categories SET name=?, icon=?, color=? WHERE id=?', [
      name,
      icon,
      color,
      req.params.id,
    ]);
    const [rows] = await pool.query('SELECT * FROM categories WHERE id=?', [req.params.id]);
    res.json((rows as unknown[])[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reassignTo } = (req.body ?? {}) as { reassignTo?: number };

    if (reassignTo !== undefined) {
      await pool.query('UPDATE transactions SET category_id = ? WHERE category_id = ?', [
        reassignTo,
        id,
      ]);
    } else {
      const [[row]] = (await pool.query(
        'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?',
        [id],
      )) as unknown as [[{ count: number }]];
      if (row.count > 0) {
        res.status(409).json({ transactionCount: row.count });
        return;
      }
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
