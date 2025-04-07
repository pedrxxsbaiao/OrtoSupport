import React from "react";
import QuestionInput from "@/components/course-assistant/question-input";
import ResponseArea from "@/components/course-assistant/response-area";
import HistorySection from "@/components/course-assistant/history-section";
import { useQuery } from "@tanstack/react-query";
import { Question } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, LogOut, UserCircle, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [currentQuestion, setCurrentQuestion] = React.useState<string>("");
  const [currentResponse, setCurrentResponse] = React.useState<{ answer: string; lesson: string, questionId?: number } | null>(null);
  const [showResponse, setShowResponse] = React.useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  
  // Get questions history from authenticated user
  const { data: questionsHistory = [], isError, refetch } = useQuery<Question[]>({ 
    queryKey: ['/api/questions'],
    enabled: !!user, // Only enabled if user is authenticated
  });

  const handleQuestionSubmit = async (question: string) => {
    setCurrentQuestion(question);
    setShowResponse(false);
    setErrorMessage(null);
    
    try {
      const response = await fetch('/api/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar sua pergunta');
      }
      
      const data = await response.json();
      setCurrentResponse(data);
      setShowResponse(true);
    } catch (error) {
      console.error('Error submitting question:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Ocorreu um erro inesperado');
    }
  };

  const handleFeedback = async (isHelpful: boolean, comment?: string) => {
    if (!currentResponse || !user) return;
    
    setIsSubmittingFeedback(true);
    
    try {
      // Precisamos do questionId do banco de dados
      // Isso assume que a resposta já foi salva no banco quando a recebemos
      if (!currentResponse.questionId) {
        console.error('Question ID is missing from the response');
        setIsSubmittingFeedback(false);
        return;
      }
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          questionId: currentResponse.questionId,
          isHelpful, 
          comment 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar feedback');
      }
      
      // Atualize o histórico de perguntas após enviar feedback
      refetch();
      setIsSubmittingFeedback(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Menu do Usuário */}
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                <span>{user?.name || user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.role === "master" && (
                <DropdownMenuItem
                  onClick={() => navigate("/admin")}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Painel de Administração
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer flex items-center gap-2" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? "Saindo..." : "Sair"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
            Professor OFM - Assistente Virtual
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tire suas dúvidas sobre Ortodontia Funcional dos Maxilares com nosso assistente especializado.
          </p>
        </header>
        
        {/* Question Input */}
        <QuestionInput onSubmit={handleQuestionSubmit} />
        
        {/* Error Message */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-6 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {/* Response Area */}
        {showResponse && currentResponse && (
          <ResponseArea 
            answer={currentResponse.answer}
            lesson={currentResponse.lesson}
            onFeedback={handleFeedback}
            isSubmittingFeedback={isSubmittingFeedback}
          />
        )}
        
        {/* History Section */}
        {questionsHistory.length > 0 && (
          <HistorySection questions={questionsHistory} />
        )}
      </div>
    </div>
  );
}
