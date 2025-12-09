import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { GET } from './+server';

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		user: {
			findMany: vi.fn()
		}
	}
}));

const { prisma } = await import('$lib/server/prisma');

describe('GET /api/user', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function makeEvent(search: string): RequestEvent {
		const url = new URL(`http://localhost/api/user${search}`);
		return { url } as unknown as RequestEvent;
	}

	it('returns empty array when no emails param is provided', async () => {
		const response = await GET(makeEvent(''));

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual([]);
		expect(prisma.user.findMany).not.toHaveBeenCalled();
	});

	it('queries users by emails and returns result', async () => {
		(prisma.user.findMany as any).mockResolvedValue([
			{ id: '1', name: 'Alice', email: 'alice@test.com' },
			{ id: '2', name: 'Bob', email: 'bob@test.com' }
		]);

		const response = await GET(makeEvent('?emails=alice@test.com,bob@test.com'));

		expect(prisma.user.findMany).toHaveBeenCalledWith({
			where: { email: { in: ['alice@test.com', 'bob@test.com'] } },
			select: { id: true, name: true, email: true }
		});

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual([
			{ id: '1', name: 'Alice', email: 'alice@test.com' },
			{ id: '2', name: 'Bob', email: 'bob@test.com' }
		]);
	});
});
