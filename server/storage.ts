import { 
  users, 
  questions, 
  feedback, 
  suggestions, 
  type User, 
  type InsertUser, 
  type Question, 
  type InsertQuestion, 
  type Feedback, 
  type InsertFeedback,
  type Suggestion,
  type InsertSuggestion
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import pkg from "pg";
const { Pool } = pkg;

const PostgresSessionStore = connectPg(session);

// Configuração do pool PostgreSQL para sessões
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionById(id: number): Promise<Question | undefined>;
  getQuestionsByUserId(userId: number): Promise<Question[]>;
  
  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  
  // Suggestion operations
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  updateSuggestion(id: number, suggestion: InsertSuggestion): Promise<Suggestion | undefined>;
  deleteSuggestion(id: number): Promise<boolean>;
  getSuggestion(id: number): Promise<Suggestion | undefined>;
  listSuggestions(): Promise<Suggestion[]>;
  listActiveSuggestions(): Promise<Suggestion[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  private _sessionStore: session.Store;

  constructor() {
    this._sessionStore = new PostgresSessionStore({
      pool: sessionPool,
      tableName: 'sessions',
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Question operations
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [result] = await db.insert(questions).values(question).returning();
    return result;
  }

  async getQuestionById(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async getQuestionsByUserId(userId: number): Promise<Question[]> {
    return await db.select()
      .from(questions)
      .where(eq(questions.userId, userId))
      .orderBy(questions.createdAt);
  }

  // Feedback operations
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [result] = await db.insert(feedback).values(feedbackData).returning();
    return result;
  }
  
  // Suggestion operations
  async createSuggestion(suggestionData: InsertSuggestion): Promise<Suggestion> {
    const [result] = await db.insert(suggestions).values(suggestionData).returning();
    return result;
  }
  
  async updateSuggestion(id: number, suggestionData: InsertSuggestion): Promise<Suggestion | undefined> {
    const [result] = await db
      .update(suggestions)
      .set(suggestionData)
      .where(eq(suggestions.id, id))
      .returning();
    return result;
  }
  
  async deleteSuggestion(id: number): Promise<boolean> {
    try {
      await db.delete(suggestions).where(eq(suggestions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      return false;
    }
  }
  
  async getSuggestion(id: number): Promise<Suggestion | undefined> {
    const [suggestion] = await db.select().from(suggestions).where(eq(suggestions.id, id));
    return suggestion;
  }
  
  async listSuggestions(): Promise<Suggestion[]> {
    return await db.select().from(suggestions);
  }
  
  async listActiveSuggestions(): Promise<Suggestion[]> {
    return await db.select().from(suggestions).where(eq(suggestions.active, true));
  }

  get sessionStore(): session.Store {
    return this._sessionStore;
  }
}

export const storage = new DatabaseStorage();
