import cleanupAuth from './TeardownScripts/cleanupAuth.ts';

export default async function globalTeardown() {
	console.log('Running global teardown');

	try {
		//await cleanupS3();
		//await cleanupDatabase();
		await cleanupAuth();
	} catch (err) {
		console.error('Teardown failed', err);
	} finally {
		process.exit(0);
	}
}
