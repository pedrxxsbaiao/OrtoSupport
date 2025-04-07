import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").default("user").notNull(), // "user" ou "master"
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  email: true,
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

// Suggestions Schema
export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  category: text("category"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  questionId: true,
  isHelpful: true,
  comment: true,
});

export const insertSuggestionSchema = createInsertSchema(suggestions).pick({
  text: true,
  category: true,
  active: true,
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestions.$inferSelect;

// API Request/Response Types
export type AskQuestionRequest = {
  question: string;
};

export type AskQuestionResponse = {
  answer: string;
  lesson: string;
  questionId?: number;
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

// Auth Types
export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  password: string;
  name: string;
  email: string;
};

export type UserResponse = Omit<User, "password">;

// User Management Types (for master user)
export type CreateUserRequest = {
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
};

export type GetUsersResponse = UserResponse[];

// Suggestion Types
export type CreateSuggestionRequest = InsertSuggestion;
export type UpdateSuggestionRequest = InsertSuggestion & { id: number };
export type GetSuggestionsResponse = Suggestion[];
export type DeleteUserRequest = { id: number };
export type DeleteUserResponse = { success: boolean };
