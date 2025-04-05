import React, { useState } from "react";
import { Question } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface HistorySectionProps {
  questions: Question[];
}

export default function HistorySection({ questions }: HistorySectionProps) {
  // Keep track of which history items are expanded
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

  return (
    <div className="mt-8">
      <div className="border-b border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 pb-2">
          Histórico de perguntas
        </h2>
      </div>

      <ScrollArea className="max-h-96">
        <div className="space-y-4">
          {questions.map((item) => (
            <Card 
              key={item.id} 
              className="bg-white shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ease-in-out"
            >
              <CardHeader className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-800 truncate">
                  {item.question}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleItem(item.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedItems[item.id] ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </CardHeader>
              
              {expandedItems[item.id] && (
                <CardContent className="px-4 py-3">
                  <div className="prose prose-sm prose-indigo">
                    <p>{item.answer}</p>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div>
                    <p className="text-xs font-medium text-gray-500">CONTEÚDO RELACIONADO</p>
                    <div className="flex items-center mt-1">
                      <BookOpen className="h-4 w-4 text-secondary-500" />
                      <p className="text-sm text-gray-800 ml-2">{item.lesson}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
