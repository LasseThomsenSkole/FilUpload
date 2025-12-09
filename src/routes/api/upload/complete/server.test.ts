// src/routes/api/upload/complete/%2Bserver.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { POST } from './+server';

vi.mock('$lib/auth/auth.ts', () => ({
	auth: {
		api: {
			getSession: vi.fn()
		}
	}
}));

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		file: {
			findUnique: vi.fn(),
			update: vi.fn()
		},
		fileKeyPacket: {
			create: vi.fn()
		}
	}
}));

const { auth } = await import('$lib/auth/auth.ts');
const { prisma } = await import('$lib/server/prisma');

describe('POST /api/upload/complete', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const baseBody = {
		fileId: 'file-1',
		encryptedMetadata: 'enc-meta',
		keyPackets: [
			{ recipientId: 'user-1', encryptedFek: 'fek-1' },
			{ recipientId: 'user-2', encryptedFek: 'fek-2' }
		],
		nonce: 'nonce-1',
		metaNonce: 'meta-nonce-1'
	};

	function makeRequest(body: any) {
		return new Request('http://localhost/api/upload/complete', {
			method: 'POST',
			headers: new Headers({ 'content-type': 'application/json' }),
			body: JSON.stringify(body)
		});
	}

	it('returns 401 when user is not authenticated', async () => {
		(auth.api.getSession as any).mockResolvedValue(null);

		const response = await POST({ request: makeRequest(baseBody) } as unknown as RequestEvent);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
	});

	it('returns 400 when body is invalid', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-123' }
		});

		const invalidBody = { ...baseBody, fileId: undefined };

		const response = await POST({ request: makeRequest(invalidBody) } as unknown as RequestEvent);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid body' });
	});

	it('returns 404 when file is not found', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-123' }
		});

		(prisma.file.findUnique as any).mockResolvedValue(null);

		const response = await POST({ request: makeRequest(baseBody) } as unknown as RequestEvent);

		expect(prisma.file.findUnique).toHaveBeenCalledWith({
			where: { id: 'file-1' }
		});
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: 'File not found' });
	});

	it('returns 403 when user is not the owner', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-123' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'other-user'
		});

		const response = await POST({ request: makeRequest(baseBody) } as unknown as RequestEvent);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'Forbidden' });
	});

	it('updates file and creates key packets on success', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-123' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'user-123'
		});

		(prisma.file.update as any).mockResolvedValue({});

		const response = await POST({ request: makeRequest(baseBody) } as unknown as RequestEvent);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });

		expect(prisma.file.findUnique).toHaveBeenCalledWith({
			where: { id: 'file-1' }
		});

		expect(prisma.file.update).toHaveBeenCalledWith({
			where: { id: 'file-1' },
			data: {
				encryptedMetadata: 'enc-meta',
				nonce: 'nonce-1',
				metaNonce: 'meta-nonce-1'
			}
		});

		expect(prisma.fileKeyPacket.create).toHaveBeenCalledTimes(2);
		expect(prisma.fileKeyPacket.create).toHaveBeenNthCalledWith(1, {
			data: {
				fileId: 'file-1',
				recipientId: 'user-1',
				encryptedFek: 'fek-1'
			}
		});
		expect(prisma.fileKeyPacket.create).toHaveBeenNthCalledWith(2, {
			data: {
				fileId: 'file-1',
				recipientId: 'user-2',
				encryptedFek: 'fek-2'
			}
		});
	});
});
