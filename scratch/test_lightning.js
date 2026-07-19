async function testLightning() {
  const key = 'sk-lit-261a2b22-349b-42a4-8ea7-a2cc78967717';
  const url = 'https://lightning.ai/api/v1/chat/completions';
  
  console.log('Enviando petición de prueba a Lightning.ai...');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'google/gemini-3.5-flash',
        messages: [
          { role: 'system', content: 'Eres Jarvis. Responde con un JSON simple {"text": "Hola, la conexión con Lightning AI funciona perfectamente."}' },
          { role: 'user', content: 'Prueba de conexión' }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Respuesta recibida:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error en la llamada:', e.message);
  }
}

testLightning();
