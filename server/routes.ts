import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AskQuestionRequest, AskQuestionResponse, SubmitFeedbackRequest, SubmitFeedbackResponse, insertQuestionSchema, insertFeedbackSchema } from "@shared/schema";
import { askQuestion } from "./services/openai-service";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Question endpoint - Get answer from ChatGPT
  app.post('/api/question', async (req, res) => {
    try {
      // Validate request
      const questionSchema = z.object({
        question: z.string().min(3, "A pergunta deve ter pelo menos 3 caracteres")
      });
      
      const validationResult = questionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Entrada inválida", 
          errors: validationResult.error.errors 
        });
      }
      
      const { question } = req.body as AskQuestionRequest;
      
      // Get response from OpenAI
      const response = await askQuestion(question);
      
      // Save question in storage (optionally tied to a user if authenticated)
      const userId = req.session?.user?.id; // Optional, depends on authentication setup
      if (userId) {
        await storage.createQuestion({
          question,
          answer: response.answer,
          lesson: response.lesson,
          userId
        });
      }
      
      return res.json(response);
    } catch (error) {
      console.error("Error processing question:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao processar sua pergunta" 
      });
    }
  });

  // Get user's question history
  app.get('/api/questions', async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const questions = await storage.getQuestionsByUserId(userId);
      return res.json(questions);
    } catch (error) {
      console.error("Error getting questions:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar histórico de perguntas" 
      });
    }
  });

  // Submit feedback for a question
  app.post('/api/feedback', async (req, res) => {
    try {
      // Validate request
      const feedbackSchema = z.object({
        questionId: z.number(),
        isHelpful: z.boolean(),
        comment: z.string().optional()
      });
      
      const validationResult = feedbackSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Entrada inválida", 
          errors: validationResult.error.errors 
        });
      }
      
      const { questionId, isHelpful, comment } = req.body as SubmitFeedbackRequest;
      
      // Save feedback
      await storage.createFeedback({
        questionId,
        isHelpful,
        comment
      });
      
      return res.json({ success: true } as SubmitFeedbackResponse);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return res.status(500).json({ 
        message: "Erro ao enviar feedback" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
