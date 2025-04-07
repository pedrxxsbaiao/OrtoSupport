import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, ThumbsDown, ThumbsUp, CheckCircle, Copy, Check } from "lucide-react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Badge } from "@/components/ui/badge";

// Adicionando definições de tipo faltantes para React Markdown
interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Tipos personalizados para outros componentes de markdown
interface MarkdownComponentProps {
  node?: any;
  children?: React.ReactNode;
}

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
  const [copied, setCopied] = useState(false);

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

  // Prepare the answer for markdown rendering
  const prepareMarkdown = (text: string) => {
    // Convert HTML tags to markdown - using global regex without 's' flag
    let result = text
      .replace(/<br>/g, '\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
    
    // Handle complex replacements with multiple RegExp calls instead of 's' flag
    // Replace unordered lists
    const ulRegex = /<ul>([\s\S]*?)<\/ul>/g;
    result = result.replace(ulRegex, function(match: string, p1: string) {
      return p1.replace(/<li>([\s\S]*?)<\/li>/g, '- $1\n');
    });
    
    // Replace ordered lists
    const olRegex = /<ol>([\s\S]*?)<\/ol>/g;
    result = result.replace(olRegex, function(match: string, p1: string) {
      let counter = 1;
      return p1.replace(/<li>([\s\S]*?)<\/li>/g, function(matchInner: string, p1Inner: string) {
        return `${counter++}. ${p1Inner}\n`;
      });
    });
    
    // Replace code blocks
    const codeRegex = /<pre><code>([\s\S]*?)<\/code><\/pre>/g;
    result = result.replace(codeRegex, '```\n$1\n```');
    
    return result;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedAnswer = prepareMarkdown(answer);

  return (
    <Card className="bg-white shadow-lg mb-8 mt-6 overflow-hidden border-t-4 border-t-amber-500 rounded-lg transition-all">
      <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white px-4 py-3 sm:px-6 flex justify-between items-center">
        <h2 className="text-lg font-medium text-amber-800">Resposta do Assistente OFM</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 hover:bg-amber-100 text-amber-700"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" /> Copiar
            </>
          )}
        </Button>
      </div>
      
      <CardContent className="p-4 sm:p-6">
        {/* Answer content */}
        <div className="prose prose-blue max-w-none">
          <ReactMarkdown
            components={{
              code: function CodeBlock(props: CodeProps) {
                const {node, inline, className, children, ...rest} = props;
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="rounded-md text-sm !mt-0">
                    <pre>
                      <code {...rest}>
                        {String(children).replace(/\n$/, '')}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <code className="bg-blue-50 text-blue-800 px-1 py-0.5 rounded text-sm" {...rest}>
                    {children}
                  </code>
                );
              },
              h1: function H1(props: MarkdownComponentProps) {
                const {node, ...rest} = props;
                return <h1 className="text-xl font-bold text-primary mt-6 mb-4" {...rest} />;
              },
              h2: function H2(props: MarkdownComponentProps) {
                const {node, ...rest} = props;
                return <h2 className="text-lg font-bold text-primary mt-5 mb-3" {...rest} />;
              },
              h3: function H3(props: MarkdownComponentProps) {
                const {node, ...rest} = props;
                return <h3 className="text-md font-bold text-primary mt-4 mb-2" {...rest} />;
              },
              p: function P(props: MarkdownComponentProps) {
                const {node, ...rest} = props;
                return <p className="mb-4 leading-relaxed" {...rest} />;
              },
              ul: function UL(props: MarkdownComponentProps) {
                const {node, ...rest} = props;
                return <ul className="list-disc pl-6 mb-4" {...rest} />;
              },
              ol: function OL(props: MarkdownComponentProps) {
                const {node, ...rest} = props;
                return <ol className="list-decimal pl-6 mb-4" {...rest} />;
              },
              li: function LI(props: MarkdownComponentProps) {
                const {node, ...rest} = props;
                return <li className="mb-1" {...rest} />;
              },
              strong: function Strong(props: MarkdownComponentProps) {
                const {node, ...rest} = props;
                return <strong className="font-bold text-primary-700" {...rest} />;
              },
              blockquote: function Blockquote(props: MarkdownComponentProps) {
                const {node, ...rest} = props;
                return <blockquote className="pl-4 border-l-4 border-amber-300 italic text-gray-700 my-4" {...rest} />;
              },
            }}
          >
            {formattedAnswer}
          </ReactMarkdown>
        </div>

        {/* Related content */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wider mb-3 flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Conteúdo relacionado
          </h3>
          <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100 py-2 px-4">
            {lesson}
          </Badge>
        </div>

        {/* Feedback section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-gray-600">
              Essa resposta foi útil para o seu aprendizado?
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
                      : "bg-gray-100 hover:bg-green-50 hover:border-green-300 text-gray-700"
                  } transition-all`}
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
                      : "bg-gray-100 hover:bg-red-50 hover:border-red-300 text-gray-700"
                  } transition-all`}
                  disabled={isSubmittingFeedback}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" /> Não
                </Button>
              </div>
            )}
          </div>

          {/* Feedback form */}
          {showFeedbackForm && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 animated fadeIn">
              <label
                htmlFor="improvement-feedback"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Como podemos melhorar esta resposta?
              </label>
              <Textarea
                id="improvement-feedback"
                rows={3}
                className="w-full resize-none border-gray-300 focus:border-primary focus:ring-primary"
                placeholder="Seu feedback nos ajuda a melhorar o assistente..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                disabled={isSubmittingFeedback}
              />
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={isSubmittingFeedback || !feedbackComment.trim()}
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white"
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
              <div className="rounded-md bg-green-50 p-4 border border-green-200 animated fadeIn">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Obrigado pelo seu feedback! Isso nos ajuda a melhorar o assistente OFM.
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
