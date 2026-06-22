import type { Request, Response, NextFunction } from 'express';
import pool from '../db/connection.js';

export const getMonthlySummaries = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [rows] = await pool.query(`
      SELECT
        YEAR(tx_date)  AS year,
        MONTH(tx_date) AS month,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)  AS income,
        SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) AS expenses
      FROM transactions
      GROUP BY YEAR(tx_date), MONTH(tx_date)
      ORDER BY year DESC, month DESC
      LIMIT 36
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

export const getCategoryBreakdown = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { year, month } = req.query;
    const params: number[] = [Number(year)];
    let sql = `SELECT c.id, c.name, c.icon, c.color,
                      SUM(-t.amount) AS total
               FROM transactions t
               JOIN categories c ON t.category_id = c.id
               WHERE t.amount < 0
                 AND YEAR(t.tx_date) = ?`;

    if (month !== undefined) {
      sql += ' AND MONTH(t.tx_date) = ?';
      params.push(Number(month));
    }

    sql += ' GROUP BY c.id, c.name, c.icon, c.color ORDER BY total DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
