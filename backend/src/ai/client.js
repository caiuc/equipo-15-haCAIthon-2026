import Groq from 'groq-sdk';
import 'dotenv/config';
import { toolDeclarations, callTool, buildPatientContext } from './tools.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Free tier, no meaningful rate limit for a demo — quality isn't the point here.
const MODEL = 'llama-3.1-8b-instant';

const tools = toolDeclarations.map((decl) => ({ type: 'function', function: decl }));

const SYSTEM_INSTRUCTION = `Eres Dr Longa, el asistente de salud de Sanito. Hablas español, cálido y directo.

REGLA ESTRICTA E INNEGOCIABLE: nunca das diagnósticos ni reemplazas a un médico. En cualquier
respuesta que toque síntomas, medicación o resultados, recuerda brevemente que esto no sustituye
la opinión de un profesional de salud y que ante urgencias debe contactar servicios médicos.

Ya tienes toda la información del paciente (medicamentos, mediciones, citas, edad, etc.) en
"[Contexto actual del paciente]" más abajo. Para preguntas sobre esos datos, respóndelas
directamente desde ese contexto — nunca inventes ni llames una función para "leer" o "consultar"
información, las funciones disponibles son solo para GUARDAR datos nuevos o cambios.

Tu trabajo:
- Deducir datos de salud del lenguaje natural del paciente (medicamentos, síntomas, mediciones) y
  hacer preguntas de seguimiento cuando la info es ambigua (ej. "la pastilla de la botella naranja")
  antes de guardar nada con las funciones disponibles.
- Cuando definas cada cuánto debería chequearse el paciente (edad, condiciones, medicación),
  llama a schedule_checkup con tu frecuencia sugerida en meses — PERO revisa primero
  "openAppointment" en el contexto del paciente: si ya hay un ciclo abierto (no está en null),
  no llames schedule_checkup de nuevo para el mismo motivo, solo coméntaselo al paciente.
- Si el paciente dice que ya agendó hora, usa confirm_appointment_scheduled.
- Si el paciente cuenta cómo le fue en una cita ya realizada, usa complete_appointment_followup.
- Usa las funciones para persistir cualquier dato nuevo o cambio; no lo dejes solo en la conversación.`;

// Small free models occasionally emit a tool call for a function that isn't declared (seen:
// llama-3.1-8b-instant hallucinating a "list_medications" it was never given), which Groq
// rejects as a 400 before we even get a message back. Not worth crashing the chat over —
// surface it as a normal, in-character reply instead of a raw API error.
async function createCompletion(messages) {
  try {
    return await groq.chat.completions.create({ model: MODEL, messages, tools });
  } catch {
    return {
      choices: [
        { message: { role: 'assistant', content: 'Perdón, se me trabó la respuesta. ¿Puedes repetir o reformular la pregunta?' } },
      ],
    };
  }
}

export async function runChat(userId, message, history = []) {
  const patientContext = await buildPatientContext(userId);
  const systemMessage = {
    role: 'system',
    content: `${SYSTEM_INSTRUCTION}\n\n[Contexto actual del paciente]\n${JSON.stringify(patientContext)}`,
  };

  // Kept separate from `messages` sent to the API: this is what gets returned to the
  // client, so the (rebuilt-fresh-every-request) system prompt never ends up persisted
  // and resent by the frontend.
  const conversation = [...history, { role: 'user', content: message }];

  let completion = await createCompletion([systemMessage, ...conversation]);
  let responseMessage = completion.choices[0].message;

  // ponytail: bounded loop, not recursion — a model that keeps calling functions forever can't hang the request.
  for (let i = 0; i < 5 && responseMessage.tool_calls?.length; i++) {
    conversation.push(responseMessage);

    for (const call of responseMessage.tool_calls) {
      const args = JSON.parse(call.function.arguments || '{}');
      const toolResult = await callTool(call.function.name, userId, args);
      conversation.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(toolResult) });
    }

    completion = await createCompletion([systemMessage, ...conversation]);
    responseMessage = completion.choices[0].message;
  }

  conversation.push(responseMessage);

  return { reply: responseMessage.content, history: conversation };
}
