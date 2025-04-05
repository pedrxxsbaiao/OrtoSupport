import React from "react";
import QuestionInput from "@/components/course-assistant/question-input";
import ResponseArea from "@/components/course-assistant/response-area";
import HistorySection from "@/components/course-assistant/history-section";
import { useQuery } from "@tanstack/react-query";
import { Question } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const [currentQuestion, setCurrentQuestion] = React.useState<string>("");
  const [currentResponse, setCurrentResponse] = React.useState<{ answer: string; lesson: string } | null>(null);
  const [showResponse, setShowResponse] = React.useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  
  // Get questions history (will only work if user is authenticated)
  const { data: questionsHistory = [], isError } = useQuery<Question[]>({ 
    queryKey: ['/api/questions'],
    enabled: false, // Disable for now since we don't have authentication set up
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
    setIsSubmittingFeedback(true);
    
    try {
      // In a real app with authentication, we would have questionId from the database
      // For now, we'll just console.log the feedback
      console.log('Feedback:', { isHelpful, comment });
      
      // After implementing auth, this would be the actual code:
      // await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ 
      //     questionId: savedQuestionId, 
      //     isHelpful, 
      //     comment 
      //   }),
      // });
      
      setIsSubmittingFeedback(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
            Assistente Virtual do Curso
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tire suas dúvidas sobre o conteúdo do curso com nosso assistente inteligente.
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
