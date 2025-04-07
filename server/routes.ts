import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  AskQuestionRequest, 
  AskQuestionResponse, 
  SubmitFeedbackRequest, 
  SubmitFeedbackResponse, 
  CreateSuggestionRequest,
  UpdateSuggestionRequest,
  DeleteUserRequest,
  DeleteUserResponse,
  insertQuestionSchema, 
  insertFeedbackSchema,
  insertSuggestionSchema
} from "@shared/schema";
import { askQuestion } from "./services/openai-service";
import { z } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure a autenticação e as rotas relacionadas
  setupAuth(app);
  // Question endpoint - Get answer from ChatGPT
  app.post('/api/question', async (req: Request, res: Response) => {
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
      
      // Save question in storage if user is authenticated
      let questionId: number | undefined;
      if (req.isAuthenticated() && req.user) {
        const savedQuestion = await storage.createQuestion({
          question,
          answer: response.answer,
          lesson: response.lesson,
          userId: req.user.id
        });
        questionId = savedQuestion.id;
      }
      
      // Incluir o ID da pergunta na resposta, se disponível
      return res.json({
        ...response,
        questionId
      });
    } catch (error) {
      console.error("Error processing question:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erro ao processar sua pergunta" 
      });
    }
  });

  // Get user's question history
  app.get('/api/questions', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const questions = await storage.getQuestionsByUserId(req.user.id);
      return res.json(questions);
    } catch (error) {
      console.error("Error getting questions:", error);
      return res.status(500).json({ 
        message: "Erro ao buscar histórico de perguntas" 
      });
    }
  });

  // Submit feedback for a question
  app.post('/api/feedback', async (req: Request, res: Response) => {
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

  // Admin routes - all require master user role
  // -- User Management --
  // List all users
  app.get('/api/users', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'master') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const users = await storage.listUsers();
      // Omit password from response
      const safeUsers = users.map(({ password, ...rest }) => rest);
      return res.json(safeUsers);
    } catch (error) {
      console.error("Error listing users:", error);
      return res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });

  // Delete user
  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'master') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const userId = parseInt(req.params.id);
      
      // Prevent deleting self
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Não é possível excluir o próprio usuário" });
      }
      
      const success = await storage.deleteUser(userId);
      return res.json({ success } as DeleteUserResponse);
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // -- Suggestion Management --
  // List all suggestions
  app.get('/api/suggestions', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      // Regular users can only see active suggestions
      if (req.user.role !== 'master') {
        const activeSuggestions = await storage.listActiveSuggestions();
        return res.json(activeSuggestions);
      }
      
      // Master users can see all suggestions
      const suggestions = await storage.listSuggestions();
      return res.json(suggestions);
    } catch (error) {
      console.error("Error listing suggestions:", error);
      return res.status(500).json({ message: "Erro ao listar sugestões" });
    }
  });

  // Create suggestion (master only)
  app.post('/api/suggestions', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'master') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const validationResult = insertSuggestionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dados de sugestão inválidos", 
          errors: validationResult.error.errors 
        });
      }
      
      const suggestion = await storage.createSuggestion(req.body as CreateSuggestionRequest);
      return res.status(201).json(suggestion);
    } catch (error) {
      console.error("Error creating suggestion:", error);
      return res.status(500).json({ message: "Erro ao criar sugestão" });
    }
  });

  // Update suggestion (master only)
  app.put('/api/suggestions/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'master') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const id = parseInt(req.params.id);
      const validationResult = insertSuggestionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dados de sugestão inválidos", 
          errors: validationResult.error.errors 
        });
      }
      
      const updatedSuggestion = await storage.updateSuggestion(id, req.body as CreateSuggestionRequest);
      
      if (!updatedSuggestion) {
        return res.status(404).json({ message: "Sugestão não encontrada" });
      }
      
      return res.json(updatedSuggestion);
    } catch (error) {
      console.error("Error updating suggestion:", error);
      return res.status(500).json({ message: "Erro ao atualizar sugestão" });
    }
  });

  // Delete suggestion (master only)
  app.delete('/api/suggestions/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== 'master') {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteSuggestion(id);
      
      if (!success) {
        return res.status(404).json({ message: "Sugestão não encontrada" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      return res.status(500).json({ message: "Erro ao excluir sugestão" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
