import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, RefreshCcw, Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuestionInputProps {
  onSubmit: (question: string) => Promise<void>;
}

// Exemplos de perguntas para sugestão
const EXAMPLE_QUESTIONS = [
  "Qual a diferença entre classe II divisão 1 e classe II divisão 2?",
  "Como funciona a ativação do SN3 para correção de classe III?",
  "Quais são as características clínicas da mordida aberta anterior?",
  "Quais as indicações do aparelho Bimler?"
];

export default function QuestionInput({ onSubmit }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Atualiza o tamanho do textarea automaticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(question);
      // Limpa o campo após o envio bem-sucedido
      setQuestion("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setQuestion("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const getRandomSuggestion = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * EXAMPLE_QUESTIONS.length);
    } while (newIndex === suggestionIndex && EXAMPLE_QUESTIONS.length > 1);
    
    setSuggestionIndex(newIndex);
    setQuestion(EXAMPLE_QUESTIONS[newIndex]);
  };

  return (
    <Card className="bg-white shadow-lg border-t-4 border-t-primary rounded-lg">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="question" className="text-sm font-medium text-gray-700">
                Sua pergunta sobre OFM
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={getRandomSuggestion}
                      className="h-8 px-2 text-gray-500 hover:text-primary"
                    >
                      <Lightbulb className="h-4 w-4 mr-1" />
                      <span className="text-xs">Sugestão</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Clique para ver uma pergunta de exemplo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Textarea
                id="question"
                ref={textareaRef}
                rows={3}
                placeholder="Digite sua dúvida sobre Ortodontia Funcional dos Maxilares aqui..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full resize-none rounded-lg border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary pr-12 transition-all"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    if (question.trim()) {
                      handleSubmit(e);
                    }
                  }
                }}
              />
              {question && !isSubmitting && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Pressione Ctrl+Enter para enviar</p>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !question.trim()}
              className="px-6 py-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-md transition-all hover:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Perguntar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
