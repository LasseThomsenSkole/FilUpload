import { PrismaClient } from '@prisma/client';
import { auth } from '../lib/auth/auth.ts';

const prisma = new PrismaClient();

async function main() {
	const args = process.argv.slice(2);
	let response;
	if (!args.includes('--force')) {
		console.log('are u sure to delete all data? (y/n)');
		response = await new Promise<string>((resolve) => {
			process.stdin.once('data', (data) => {
				resolve(data.toString().trim());
			});
		});
	}

	if (args.includes('--force') || response?.toLowerCase() === 'y') {
		console.log('Seeding database...');

		//reset database
		await prisma.user.deleteMany({});
		await prisma.account.deleteMany({});
		await prisma.session.deleteMany({});
		await prisma.verification.deleteMany({});

		const admin = await auth.api.createUser({
			body: {
				email: 'admin@admin.dk',
				password: 'adminadmin',
				name: 'admin',
				role: 'admin'
			}
		});
		console.log('Created admin user:', admin.user.email);
		const user = await auth.api.createUser({
			body: {
				email: 'user@user.dk',
				password: 'useruser',
				name: 'user',
				role: 'user'
			}
		});
		console.log('Created normal user:', user.user.email);
	}
}

await main().finally(() => process.exit(0));
