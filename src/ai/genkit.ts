
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Construct a Genkit global object. This is used to define and run Genkit code.
// This specific Genkit instance is configured to use Google AI (Gemini).
// TODO: Configure with an API key.
export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
