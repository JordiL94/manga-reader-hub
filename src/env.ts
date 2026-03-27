import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  // Using the updated Zod error formatting method
  console.error(
    '❌ Invalid environment variables:\n',
    z.treeifyError(_env.error)
  );
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
