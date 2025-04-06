import OpenAI from "openai";
import { AskQuestionResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key"
});

// Course structure with lesson details for OFM (Ortodontia Funcional dos Maxilares)
const courseStructure = [
  { 
    id: 1, 
    title: "Aula 01 - Introdução à Ortodontia Funcional dos Maxilares",
    topics: ["História da OFM", "Princípios básicos", "Diferenças entre Ortodontia Convencional e OFM"]
  },
  { 
    id: 2, 
    title: "Aula 02 - Diagnóstico em OFM",
    topics: ["Anamnese", "Exame clínico", "Documentação ortodôntica", "Análise cefalométrica funcional"]
  },
  { 
    id: 3, 
    title: "Aula 03 - Classificação das Maloclusões",
    topics: ["Classe I", "Classe II divisão 1", "Classe II divisão 2", "Classe III", "Mordida aberta", "Mordida cruzada"]
  },
  { 
    id: 4, 
    title: "Aula 04 - Aparelhos Funcionais",
    topics: ["Princípios de ação", "Pistas diretas", "SN1, SN2, SN3", "Bimler", "Planas", "Simões Network"]
  },
  { 
    id: 5, 
    title: "Aula 05 - Tratamento Precoce",
    topics: ["Tratamento preventivo", "Interceptivo", "Correção de hábitos deletérios", "Expansão maxilar"]
  },
  { 
    id: 6, 
    title: "Aula 06 - Tratamento da Classe II",
    topics: ["Aparelhos para Classe II", "Ativadores", "Bionator", "Twin Block", "Herbst", "Jasper Jumper"]
  },
  { 
    id: 7, 
    title: "Aula 07 - Tratamento da Classe III",
    topics: ["Aparelhos para Classe III", "Frankel III", "Máscara facial", "Mentoneira", "Expansão associada"]
  }
];

export async function askQuestion(question: string): Promise<AskQuestionResponse> {
  try {
    // Build a system prompt with course structure information
    const systemPrompt = `
      Você é o Professor OFM, especialista em Ortodontia Funcional dos Maxilares. 
      Seu papel é responder dúvidas dos alunos com base no conteúdo do curso de OFM.
      
      Responda com linguagem técnica apropriada para profissionais de odontologia, mas de forma clara e didática.
      Sempre que possível, mencione referências científicas e evidências clínicas.
      
      IMPORTANTE: Após responder a pergunta, você DEVE identificar em qual aula do curso esse conteúdo é abordado.
      Indique apenas UMA aula mais relevante relacionada à pergunta.
      
      Estrutura do curso:
      ${courseStructure.map(lesson => 
        `${lesson.title}: ${lesson.topics.join(", ")}`
      ).join("\n")}
      
      Responda no formato JSON com os seguintes campos:
      {
        "answer": "Sua resposta detalhada aqui",
        "lesson": "Título completo da aula mais relevante (ex: Aula 03 - Classificação das Maloclusões)"
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
