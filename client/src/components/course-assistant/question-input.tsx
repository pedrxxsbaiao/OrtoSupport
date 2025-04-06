import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface QuestionInputProps {
  onSubmit: (question: string) => Promise<void>;
}

export default function QuestionInput({ onSubmit }: QuestionInputProps) {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(question);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
              Sua pergunta
            </Label>
            <Textarea
              id="question"
              rows={3}
              placeholder="Digite sua dúvida sobre Ortodontia Funcional dos Maxilares aqui..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full resize-none focus:ring-primary focus:border-primary"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !question.trim()}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Perguntar"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
