import OpenAI from "openai";
import { AskQuestionResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key"
});

// Course structure with lesson details - in a real application this would come from a database
const courseStructure = [
  { 
    id: 1, 
    title: "Aula 01 - Introdução à Programação",
    topics: ["Conceitos básicos de programação", "Algoritmos", "Lógica de programação"]
  },
  { 
    id: 2, 
    title: "Aula 02 - Variáveis e Tipos de Dados em JavaScript",
    topics: ["var, let e const", "Tipos primitivos", "Strings, Numbers, Booleans", "Operadores"]
  },
  { 
    id: 3, 
    title: "Aula 03 - Estruturas de Controle",
    topics: ["Condicionais (if, else, switch)", "Loops (for, while, do-while)", "Break e continue"]
  },
  { 
    id: 4, 
    title: "Aula 04 - Funções em JavaScript",
    topics: ["Declaração de funções", "Arrow functions", "Parâmetros e retorno", "Callbacks"]
  },
  { 
    id: 5, 
    title: "Aula 05 - Métodos de Arrays em JavaScript",
    topics: ["map()", "filter()", "reduce()", "forEach()", "find() e findIndex()"]
  }
];

export async function askQuestion(question: string): Promise<AskQuestionResponse> {
  try {
    // Build a system prompt with course structure information
    const systemPrompt = `
      Você é um assistente especializado para o curso de JavaScript. 
      Responda perguntas dos alunos de forma clara e objetiva.
      
      IMPORTANTE: Após responder a pergunta, você DEVE identificar em qual aula do curso esse conteúdo é abordado.
      Indique apenas UMA aula mais relevante relacionada à pergunta.
      
      Estrutura do curso:
      ${courseStructure.map(lesson => 
        `${lesson.title}: ${lesson.topics.join(", ")}`
      ).join("\n")}
      
      Responda no formato JSON com os seguintes campos:
      {
        "answer": "Sua resposta detalhada aqui",
        "lesson": "Título completo da aula mais relevante (ex: Aula 05 - Métodos de Arrays em JavaScript)"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    const parsedResponse = JSON.parse(content) as AskQuestionResponse;
    return parsedResponse;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Falha ao processar sua pergunta. Tente novamente mais tarde.");
  }
}
