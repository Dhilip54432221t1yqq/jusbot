import { testRequest } from '../src/services/content.js';

async function run() {
  try {
    const result = await testRequest({
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      params: [],
      headers: [
        { key: 'Accept', value: 'application/json', testValue: 'application/json' }
      ],
      bodyType: 'none',
      authType: 'none'
    });
    console.log("Result success:", result.success);
    console.log("Result status:", result.status);
    console.log("Result body ID:", result.body?.id);
    console.log("Result latency:", result.timeMs, "ms");
  } catch (err) {
    console.error("Error executing test request:", err);
  }
}
run();
