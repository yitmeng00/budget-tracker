import type { Request, Response, NextFunction } from 'express';
import pool from '../db/connection.js';

export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { year, month } = req.query;
    let sql = `
      SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
             a.name AS account_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN accounts   a ON t.account_id  = a.id
    `;
    const params: (string | number)[] = [];
    if (year && month) {
      sql += ' WHERE YEAR(t.tx_date) = ? AND MONTH(t.tx_date) = ?';
      params.push(Number(year), Number(month));
    }
    sql += ' ORDER BY t.tx_date DESC, t.tx_time DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { account_id, category_id, amount, note, tx_date, tx_time } = req.body;
    const [result] = (await pool.query(
      'INSERT INTO transactions (account_id, category_id, amount, note, tx_date, tx_time) VALUES (?, ?, ?, ?, ?, ?)',
      [account_id, category_id, amount, note ?? '', tx_date, tx_time ?? '00:00:00'],
    )) as unknown as [{ insertId: number }];
    await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
      amount,
      account_id,
    ]);
    const [rows] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              a.name AS account_name
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       JOIN accounts   a ON t.account_id  = a.id
       WHERE t.id = ?`,
      [result.insertId],
    );
    res.status(201).json((rows as unknown[])[0]);
  } catch (err) {
    next(err);
  }
};

export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { account_id, category_id, amount, note, tx_date, tx_time } = req.body;
    const [old] = (await pool.query('SELECT account_id, amount FROM transactions WHERE id = ?', [
      req.params.id,
    ])) as unknown as [{ account_id: number; amount: number }[]];
    if (old[0]) {
      await pool.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [
        old[0].amount,
        old[0].account_id,
      ]);
    }
    await pool.query(
      'UPDATE transactions SET account_id=?, category_id=?, amount=?, note=?, tx_date=?, tx_time=? WHERE id=?',
      [account_id, category_id, amount, note, tx_date, tx_time, req.params.id],
    );
    await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [
      amount,
      account_id,
    ]);
    const [rows] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
              a.name AS account_name
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       JOIN accounts   a ON t.account_id  = a.id
       WHERE t.id = ?`,
      [req.params.id],
    );
    res.json((rows as unknown[])[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [old] = (await pool.query('SELECT account_id, amount FROM transactions WHERE id = ?', [
      req.params.id,
    ])) as unknown as [{ account_id: number; amount: number }[]];
    if (old[0]) {
      await pool.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [
        old[0].amount,
        old[0].account_id,
      ]);
    }
    await pool.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
