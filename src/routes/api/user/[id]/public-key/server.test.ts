import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { GET } from './+server';

vi.mock('$lib/auth/auth', () => ({
	auth: {
		api: {
			getSession: vi.fn()
		}
	}
}));

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		user: {
			findUnique: vi.fn()
		}
	}
}));

const { auth } = await import('$lib/auth/auth');
const { prisma } = await import('$lib/server/prisma');

describe('GET /api/user/[id]/public-key', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function makeEvent(id: string): RequestEvent {
		const request = new Request(`http://localhost/api/user/${id}/public-key`, {
			method: 'GET',
			headers: new Headers()
		});

		return {
			params: { id },
			request
		} as unknown as RequestEvent;
	}

	it('returns 401 when user is not authenticated', async () => {
		(auth.api.getSession as any).mockResolvedValue(null);

		const response = await GET(makeEvent('user-1'));

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
		expect(prisma.user.findUnique).not.toHaveBeenCalled();
	});

	it('returns 404 when user is not found', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'session-user' }
		});

		(prisma.user.findUnique as any).mockResolvedValue(null);

		const response = await GET(makeEvent('user-1'));

		expect(prisma.user.findUnique).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			select: { publicKey: true }
		});
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: 'Not found' });
	});

	it('returns public key when user exists', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'session-user' }
		});

		(prisma.user.findUnique as any).mockResolvedValue({
			publicKey: 'test-public-key'
		});

		const response = await GET(makeEvent('user-1'));

		expect(prisma.user.findUnique).toHaveBeenCalledWith({
			where: { id: 'user-1' },
			select: { publicKey: true }
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ publicKey: 'test-public-key' });
	});
});
