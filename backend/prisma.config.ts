import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	migrations: {
		seed: 'ts-node --project tsconfig.scripts.json prisma/seed.ts',
	},
});
