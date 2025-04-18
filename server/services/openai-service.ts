import OpenAI from "openai";
import { AskQuestionResponse } from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY não está definida no ambiente');
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

// Course structure with lesson details for OFM (Ortodontia Funcional dos Maxilares)
// IMPORTANTE: Somente as aulas 1 e 2 possuem conteúdo detalhado disponível no momento
const courseStructure = [
  { 
    id: 1, 
    title: "Aula 01 - Como funciona a Ortopedia Funcional dos Maxilares",
    topics: ["Princípios da OFM", "Objetivos", "Princípios fundamentais", "Indicações e contraindicações", "Tipos de aparelhos"]
  },
  { 
    id: 2, 
    title: "Aula 02 - Mudança de Postura Terapêutica na Ortopedia Funcional dos Maxilares",
    topics: ["Ajuste da posição mandibular", "Etapas do tratamento", "Limite de avanço", "Formas de mudança de postura", "Benefícios"]
  }
];

// Conteúdo do material do curso OFM
const courseContent = {
  aula1: `
  Aula 1 - Como funciona a Ortopedia Funcional dos Maxilares

  A Ortopedia Funcional dos Maxilares (OFM) usa aparelhos ortopédicos funcionais para corrigir disfunções maxilomandibulares. Atua no desenvolvimento ósseo, função muscular e oclusão, diferente da ortodontia, que alinha os dentes.

  Objetivos incluem: melhorar mastigação, tratar maloclusões com estímulos funcionais, obter resultados precoces e estáveis, com menos extrações.

  Princípios fundamentais: excitação neural, mudança de postura mandibular, e suporte bimaxilar.

  Indicações: distoclusão, mordida cruzada, mordida aberta funcional, DTM, etc. Contraindicações: pacientes com distúrbios neuromusculares graves, desvios esqueléticos acentuados, falta de colaboração.

  Aparelhos simples permitem movimento livre da mandíbula; compostos guiam a posição mandibular.

  A OFM é complementar à ortodontia, e o planejamento adequado é essencial para o sucesso.
  `,
  
  aula2: `
  Aula 2 - Mudança de Postura Terapêutica na Ortopedia Funcional dos Maxilares

  A mudança de postura terapêutica ajusta a posição mandibular para corrigir Classe II (distoclusão) ou Classe III (mesiooclusão).

  Etapas: diagnóstico, montagem do modelo com avanço mandibular (DA), confecção do aparelho, instalação e acompanhamento.

  Limite de avanço: máx. 7 mm por vez. Em overjets maiores, usa-se dois aparelhos ou ajustes progressivos.

  Formas de mudança de postura: avanço mandibular, lateralização da mandíbula, bloqueio frontal.

  Benefícios: correção funcional e estrutural, crescimento equilibrado, melhora mastigatória e respiratória.
  `
};

export async function askQuestion(question: string): Promise<AskQuestionResponse> {
  try {
    // Usando o assistente personalizado que contém conhecimento em Ortodontia Funcional dos Maxilares
    // A diferença é que usamos um modelo personalizado da OpenAI com instruções específicas
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Usamos o GPT-4o que é o modelo mais recente e eficiente
      messages: [
        { 
          role: "system", 
          content: `Você é o Professor OFM, especialista em Ortodontia Funcional dos Maxilares. 
Responda com base no CONTEÚDO DAS AULAS abaixo. Se a informação perguntada não estiver contida neste conteúdo, diga: 'Essa informação não está disponível no material do curso.'

CONTEÚDO DO CURSO DE OFM:
${courseContent.aula1}

${courseContent.aula2}

Estrutura do curso completo:
${courseStructure.map(lesson => 
  `${lesson.title}: ${lesson.topics.join(", ")}`
).join("\n")}

Suas respostas devem ser claras, precisas e com o rigor técnico esperado para profissionais de odontologia.
Ao responder, tente identificar de qual aula o conteúdo pertence.`
        },
        { role: "user", content: question }
      ],
      temperature: 0.3,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty response");
    }
    
    // Já que a resposta não virá em formato JSON, vamos mapear para o formato necessário
    // Tentaremos inferir qual aula do curso é mais relevante com base no conteúdo da resposta
    let matchedLesson = "Aula 01 - Como funciona a Ortopedia Funcional dos Maxilares";
    
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
