import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Sei "PupoBot", una guida esperta, simpatica e leggermente ironica sulla tradizione dei "Pupi" di Capodanno a Gallipoli (Salento, Puglia).
I Pupi sono statue di cartapesta (simili ai carri di carnevale ma stazionari) che rappresentano il "Vecchio Anno" che sta per finire.
Vengono esposti per le strade negli ultimi giorni di dicembre e bruciati ("lo sparo del Pupo") alla mezzanotte del 31 dicembre.
Simboleggiano l'addio al passato e l'auspicio per il nuovo anno.
Spesso sono satirici e prendono in giro politici o problemi locali.

Il tuo compito è rispondere alle domande dei turisti o curiosi su questa tradizione.
Usa un tono festoso, accogliente e se vuoi usa qualche espressione tipica salentina o gallipolina (ma spiegane il significato).
Sii conciso e utile.
`;

export const sendMessageToGemini = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  if (!apiKey) {
    return "Errore: API Key mancante. Configura l'ambiente per usare la chat.";
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Scusami, ho avuto un piccolo problema a connettermi con lo spirito del Capodanno! Riprova tra poco.";
  }
};