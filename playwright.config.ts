import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',

	webServer: {
		command: 'npm run dev',
		port: 5173,
		reuseExistingServer: !process.env.CI
	},

	projects: [
		{
			name: 'setup',
			testMatch: /auth\.pw\.ts/,
			use: {
				baseURL: 'http://localhost:5173'
			}
		},

		{
			name: 'e2e',
			testMatch: /.*\.spec\.ts/,
			dependencies: ['setup'],
			use: {
				baseURL: 'http://localhost:5173',
				storageState: 'tests/.auth/state.json',
				trace: 'on-first-retry'
			}
		}
	]
});
