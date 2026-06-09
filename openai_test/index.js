require('dotenv').config();
const { OpenAI } = require('openai');

// Inicializamos el cliente de OpenAI. Automáticamente tomará process.env.OPENAI_API_KEY
const openai = new OpenAI();

async function main() {
  try {
    console.log("Iniciando prueba de conexión con la API de OpenAI...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Escribe exactamente: '¡Conexión exitosa!' y luego da una muy breve explicación de qué es una API."
        }
      ],
      max_tokens: 60
    });

    console.log("\n================ RESULTADO ================\n");
    console.log(response.choices[0].message.content);
    console.log("\n===========================================\n");

  } catch (error) {
    console.error("Error al interactuar con la API:", error.message);
  }
}

main();
