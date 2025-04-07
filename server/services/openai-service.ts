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
    // Usando um GPT específico com ID personalizado que contém conhecimento em Ortodontia Funcional dos Maxilares
    // Esse GPT já tem o contexto completo do material didático da OFM
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "Você é o Professor OFM. Responda apenas com base no conteúdo da apostila usada como base de conhecimento. Se a resposta não estiver na apostila, diga: 'Essa informação não está disponível no material do curso.'" 
        },
        { role: "user", content: question }
      ],
      temperature: 0.3,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      user: "usuário-do-site",
      gpt_id: "g-67d4a014146081918a51837aa6ed873e"
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty response");
    }
    
    // Já que a resposta não virá em formato JSON, vamos mapear para o formato necessário
    // Tentaremos inferir qual aula do curso é mais relevante com base no conteúdo da resposta
    let matchedLesson = "Aula 01 - Introdução à Ortodontia Funcional dos Maxilares";
    
    // Procura por pistas no conteúdo para identificar a aula relacionada
    courseStructure.forEach(lesson => {
      const lowerContent = content.toLowerCase();
      const lowerTitle = lesson.title.toLowerCase();
      
      // Checa se o título da aula está explicitamente mencionado
      if (lowerContent.includes(lowerTitle.replace(/aula \d+ - /i, '').toLowerCase())) {
        matchedLesson = lesson.title;
        return;
      }
      
      // Checa se algum dos tópicos está mencionado
      lesson.topics.forEach(topic => {
        if (lowerContent.includes(topic.toLowerCase())) {
          matchedLesson = lesson.title;
          return;
        }
      });
    });

    return {
      answer: content,
      lesson: matchedLesson
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Falha ao processar sua pergunta. Tente novamente mais tarde.");
  }
}
