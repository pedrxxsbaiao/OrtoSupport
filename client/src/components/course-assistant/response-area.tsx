import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { BookOpen, ThumbsDown, ThumbsUp, CheckCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

interface ResponseAreaProps {
  answer: string;
  lesson: string;
  onFeedback: (isHelpful: boolean, comment?: string) => Promise<void>;
  isSubmittingFeedback: boolean;
}

export default function ResponseArea({ 
  answer, 
  lesson, 
  onFeedback, 
  isSubmittingFeedback 
}: ResponseAreaProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<boolean | null>(null);

  const handleThumbsUp = async () => {
    setSelectedFeedback(true);
    await onFeedback(true);
    setFeedbackSubmitted(true);
  };

  const handleThumbsDown = () => {
    setSelectedFeedback(false);
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = async () => {
    await onFeedback(false, feedbackComment);
    setShowFeedbackForm(false);
    setFeedbackSubmitted(true);
  };

  // Convert line breaks to proper HTML
  const formattedAnswer = answer
    .replace(/<br>/g, '\n')
    .replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '```\n$1\n```');

  return (
    <Card className="bg-white shadow-md mb-8 mt-6 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
        <h2 className="text-lg font-medium text-gray-800">Resposta</h2>
      </div>
      
      <CardContent className="p-4 sm:p-6">
        {/* Answer content */}
        <div className="prose prose-indigo max-w-none">
          {formattedAnswer.split('\n').map((line, index) => {
            if (line.startsWith('```') && line.endsWith('```')) {
              // Handle single-line code blocks
              return (
                <pre key={index} className="bg-gray-100 p-2 rounded">
                  <code>{line.slice(3, -3)}</code>
                </pre>
              );
            } else if (line === '```') {
              // Start or end of multi-line code block - we'll handle this in the codeBlock logic
              return null;
            } else {
              return <p key={index}>{line}</p>;
            }
          })}
        </div>

        {/* Related content */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Conteúdo relacionado
          </h3>
          <div className="flex items-start">
            <BookOpen className="h-5 w-5 text-secondary-500 mt-1" />
            <div className="ml-3">
              <p className="text-base font-medium text-gray-800">
                {lesson}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-600">
              Essa resposta foi útil?
            </h3>
            {!feedbackSubmitted && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleThumbsUp}
                  className={`${
                    selectedFeedback === true
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  disabled={isSubmittingFeedback}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" /> Sim
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleThumbsDown}
                  className={`${
                    selectedFeedback === false
                      ? "bg-red-100 text-red-800 border-red-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  disabled={isSubmittingFeedback}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" /> Não
                </Button>
              </div>
            )}
          </div>

          {/* Feedback form */}
          {showFeedbackForm && (
            <div className="mt-4">
              <label
                htmlFor="improvement-feedback"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Como podemos melhorar?
              </label>
              <Textarea
                id="improvement-feedback"
                rows={3}
                className="w-full resize-none"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                disabled={isSubmittingFeedback}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={isSubmittingFeedback || !feedbackComment.trim()}
                  size="sm"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar feedback"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Feedback success message */}
          {feedbackSubmitted && (
            <div className="mt-3">
              <div className="rounded-md bg-green-50 p-3">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Obrigado pelo seu feedback!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
