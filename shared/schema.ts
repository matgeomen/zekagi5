import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Message types
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
  feedback?: number; // -1: negatif, 0: nötr, 1: pozitif
  module?: 'info' | 'humor' | 'advice' | 'feedback' | 'learning_request'; // Modül tipi
  isSpoken?: boolean; // Sesli yanıt verildi mi
  analysis?: any;
  confidence?: number;
  reasoning?: string[];
}

// Training types
export interface TrainingPair {
  input: string;
  output: string;
  timestamp?: number;
}
