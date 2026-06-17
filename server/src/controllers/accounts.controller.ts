import type { Request, Response, NextFunction } from 'express';
import pool from '../db/connection.js';

export const getAccounts = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [rows] = await pool.query('SELECT * FROM accounts ORDER BY name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const createAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, type, icon, color, balance } = req.body;
    const [result] = (await pool.query(
      'INSERT INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)',
      [name, type, icon ?? 'wallet', color ?? '#2563eb', balance ?? 0],
    )) as unknown as [{ insertId: number }];
    const [rows] = await pool.query('SELECT * FROM accounts WHERE id = ?', [result.insertId]);
    res.status(201).json((rows as unknown[])[0]);
  } catch (err) {
    next(err);
  }
};

export const updateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, type, icon, color, balance } = req.body;
    await pool.query('UPDATE accounts SET name=?, type=?, icon=?, color=?, balance=? WHERE id=?', [
      name,
      type,
      icon,
      color,
      balance,
      req.params.id,
    ]);
    const [rows] = await pool.query('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
    res.json((rows as unknown[])[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await pool.query('DELETE FROM accounts WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
