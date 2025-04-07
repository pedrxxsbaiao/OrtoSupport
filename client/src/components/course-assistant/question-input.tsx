import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, RefreshCcw, Lightbulb, BadgeHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { Suggestion } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface QuestionInputProps {
  onSubmit: (question: string) => Promise<void>;
}

// Perguntas de fallback caso não existam sugestões
const FALLBACK_QUESTIONS = [
  "Qual a diferença entre classe II divisão 1 e classe II divisão 2?",
  "Como funciona a ativação do SN3 para correção de classe III?",
  "Quais são as características clínicas da mordida aberta anterior?",
  "Quais as indicações do aparelho Bimler?"
];

export default function QuestionInput({ onSubmit }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Buscar sugestões do banco de dados
  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery<Suggestion[]>({
    queryKey: ["/api/suggestions"],
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Categorias disponíveis
  const categoriesMap = new Map<string, boolean>();
  const categories: string[] = [];
  
  if (suggestions.length > 0) {
    suggestions.forEach(suggestion => {
      if (suggestion.category && suggestion.active && !categoriesMap.has(suggestion.category)) {
        categoriesMap.set(suggestion.category, true);
        categories.push(suggestion.category);
      }
    });
  }

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
    // Usa sugestões personalizadas se existirem, caso contrário usa as padrão
    const activeSuggestions = suggestions.filter(s => s.active);
    const questionList = activeSuggestions.length > 0 
      ? activeSuggestions.map(s => s.text)
      : FALLBACK_QUESTIONS;
    
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * questionList.length);
    } while (newIndex === suggestionIndex && questionList.length > 1);
    
    setSuggestionIndex(newIndex);
    setQuestion(questionList[newIndex]);
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
              <div className="flex space-x-2">
                {/* Lista completa de sugestões */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 border-gray-200"
                    >
                      <BadgeHelp className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-xs">Ver todas as sugestões</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Sugestões de perguntas</DialogTitle>
                      <DialogDescription>
                        Selecione uma pergunta para iniciar sua consulta
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      {isLoadingSuggestions ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {categories.length > 0 ? (
                            categories.map((category) => (
                              <div key={category} className="space-y-2">
                                <h3 className="text-sm font-semibold text-primary">{category}</h3>
                                <ul className="space-y-2">
                                  {suggestions
                                    .filter(s => s.active && s.category === category)
                                    .map((suggestion) => (
                                      <li 
                                        key={suggestion.id}
                                        className="text-sm p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                                        onClick={() => {
                                          setQuestion(suggestion.text);
                                          setShowSuggestions(false);
                                        }}
                                      >
                                        {suggestion.text}
                                      </li>
                                    ))
                                  }
                                </ul>
                              </div>
                            ))
                          ) : (
                            <div>
                              <h3 className="text-sm font-semibold text-primary">Sugestões</h3>
                              <ul className="space-y-2 mt-2">
                                {suggestions
                                  .filter(s => s.active)
                                  .map((suggestion) => (
                                    <li 
                                      key={suggestion.id}
                                      className="text-sm p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                                      onClick={() => {
                                        setQuestion(suggestion.text);
                                        setShowSuggestions(false);
                                      }}
                                    >
                                      {suggestion.text}
                                    </li>
                                  ))
                                }
                              </ul>
                            </div>
                          )}
                          {suggestions.filter(s => s.active).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                              Nenhuma sugestão disponível no momento
                            </p>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                
                {/* Botão de sugestão rápida */}
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
