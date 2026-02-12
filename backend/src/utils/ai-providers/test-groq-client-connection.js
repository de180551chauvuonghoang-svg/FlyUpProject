import { generateCompletion, checkGroqHealth } from './groq-client.js';

async function testGroqClient() {
  console.log('🧪 Testing Groq Client...\n');

  // Health check
  console.log('1. Health Check...');
  const isHealthy = await checkGroqHealth();
  console.log(`   Result: ${isHealthy ? '✅ Healthy' : '❌ Failed'}\n`);

  // Simple completion
  console.log('2. Simple Completion...');
  try {
    const response = await generateCompletion({
      messages: [
        { role: 'user', content: 'Say hello in Vietnamese' }
      ],
      max_tokens: 50
    });
    console.log(`   Response: ${response}\n`);
    console.log('   ✅ Success\n');
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Timeout test
  console.log('3. Timeout Handling...');
  try {
    await generateCompletion({
      messages: [{ role: 'user', content: 'test' }],
      timeout: 1 // Very short timeout
    });
  } catch (error) {
    console.log(`   Expected error: ${error.message}`);
    console.log('   ✅ Timeout handling works\n');
  }

  console.log('🎉 All tests completed!');
}

testGroqClient().catch(console.error);
