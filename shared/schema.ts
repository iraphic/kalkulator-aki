import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const financialAnalysis = pgTable("financial_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investmentCost: decimal("investment_cost", { precision: 15, scale: 2 }).notNull(),
  monthlyRevenue: decimal("monthly_revenue", { precision: 15, scale: 2 }).notNull(),
  contractPeriod: integer("contract_period").notNull(),
  npv: decimal("npv", { precision: 15, scale: 2 }),
  irr: decimal("irr", { precision: 5, scale: 2 }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFinancialAnalysisSchema = createInsertSchema(financialAnalysis).omit({
  id: true,
  npv: true,
  irr: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FinancialAnalysis = typeof financialAnalysis.$inferSelect;
export type InsertFinancialAnalysis = z.infer<typeof insertFinancialAnalysisSchema>;
