import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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

// Questions Schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  lesson: text("lesson").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  question: true,
  answer: true,
  lesson: true,
  userId: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// Feedback Schema
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  isHelpful: boolean("is_helpful").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  questionId: true,
  isHelpful: true,
  comment: true,
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

// API Request/Response Types
export type AskQuestionRequest = {
  question: string;
};

export type AskQuestionResponse = {
  answer: string;
  lesson: string;
};

export type SubmitFeedbackRequest = {
  questionId: number;
  isHelpful: boolean;
  comment?: string;
};

export type SubmitFeedbackResponse = {
  success: boolean;
};

export type GetQuestionsResponse = Question[];
