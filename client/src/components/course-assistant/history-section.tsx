import React, { useState } from "react";
import { Question } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Clock, 
  Search, 
  HistoryIcon,
  RefreshCw
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HistorySectionProps {
  questions: Question[];
}

export default function HistorySection({ questions }: HistorySectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const toggleItem = (id: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (questions.length === 0) {
    return null;
  }

  const formatTimestamp = (timestamp: string | Date | null) => {
    if (!timestamp) return "Data não disponível";
    
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format the answer to remove HTML tags for preview
  const formatPreview = (text: string) => {
    return text
      .replace(/<[^>]*>/g, '')  // Remove HTML tags
      .replace(/\n/g, ' ')      // Replace line breaks with spaces
      .substring(0, 150)        // Limit to 150 chars
      + (text.length > 150 ? '...' : ''); // Add ellipsis if needed
  };

  // Filter questions based on search term
  const filteredQuestions = questions.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lesson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-10 bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <HistoryIcon className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">
            Histórico de Consultas OFM
          </h2>
        </div>
        
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
          {filteredQuestions.length} consulta{filteredQuestions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Pesquisar no histórico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white focus-visible:ring-primary"
        />
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-1 top-1 h-8 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchTerm("")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-[500px] pr-4">
        <Accordion type="multiple" className="space-y-3">
          {filteredQuestions.map((item) => (
            <AccordionItem 
              key={item.id} 
              value={item.id.toString()}
              className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-gray-900">{item.question}</div>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatTimestamp(item.createdAt)}</span>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 py-3 border-t border-gray-100">
                <div className="prose prose-sm max-w-none">
                  <div className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {formatPreview(item.answer)}
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">Conteúdo relacionado:</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {item.lesson}
                    </Badge>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        {filteredQuestions.length === 0 && searchTerm && (
          <div className="text-center py-10">
            <p className="text-gray-500">Nenhum resultado encontrado para "{searchTerm}"</p>
            <Button 
              variant="link" 
              onClick={() => setSearchTerm("")}
              className="mt-2 text-primary"
            >
              Limpar pesquisa
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
