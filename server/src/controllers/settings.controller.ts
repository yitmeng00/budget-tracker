import type { Request, Response, NextFunction } from 'express';
import pool from '../db/connection.js';

export const getSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json((rows as unknown[])[0]);
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { week_start, currency_country, currency_code, currency_symbol, unit_position } =
      req.body;
    await pool.query(
      `UPDATE settings SET week_start=?, currency_country=?, currency_code=?,
       currency_symbol=?, unit_position=? WHERE id=1`,
      [week_start, currency_country, currency_code, currency_symbol, unit_position],
    );
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json((rows as unknown[])[0]);
  } catch (err) {
    next(err);
  }
};
