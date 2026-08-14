# SANITO❤️

## Equipo

- Maximiliano Weldt
- Benjamin Isaías Vega
- Rafael Lorca
- Benjamin Ponce

## Instrucciones para correr la prueba
- en el .env, poner GROQ_API_KEY = api_key_de_groq_aqui
- nvm install 22
- nvm use 22
- En el backend y el frontend (yarn)
- En el backend (yarn start)
- En el frontend (yarn dev)
- Abrir el localhost con el puerto del frontend

## 🩺 Asistente Virtual de Monitoreo de Pacientes Crónicos

Asistente conversacional que ayuda a pacientes con recordatorios y recomendaciones de chequeos médicos y le entrega al médico una ficha actualizada antes de la consulta.

## ¿Qué hace?

- **Paciente** — vía bot o con formulario reporta mediciones periódicas (glicemia, presión arterial), recibe recordatorios de medicación y citas, y alertas cuando algún valor se sale de rango.
- **Médico** — accede a un panel con sus pacientes agendados y su ficha (historial de mediciones y alertas), para llegar a la consulta con la información ya revisada.

## Estado actual

| Módulo | Estado |
|---|---|
| Bot de pacientes | ✅ Implementado |
| Panel médico | 🚧 En desarrollo |
| Validación de umbrales clínicos | ⏳ Pendiente de revisión médica |

## Stack

- **Bot**: Groq
- **Backend**: Node.js/TypeScript
- **Base de datos**: SQLite
- **Auth y cifrado**: bcrypt (contraseñas) + JWT (sesión)

## Seguridad y cumplimiento

Este proyecto trata datos de salud, que en Chile son **datos sensibles** (Ley 21.719) y están sujetos a la Ley 20.584 de ficha clínica. Antes de usarse con pacientes reales:

- [ ] Consentimiento explícito registrado por paciente
- [ ] Cifrado en reposo de campos sensibles
- [ ] Log de auditoría de accesos médicos
- [ ] Umbrales de alerta validados por un profesional médico

> Más detalle en [`01-investigacion-salud-publica-chile.md`](./01-investigacion-salud-publica-chile.md) y [`02-scope-claude-code.md`](./02-scope-claude-code.md).


## Licencia

Por definir.
