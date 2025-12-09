import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { GET } from './+server';

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
			findUnique: vi.fn()
		}
	}
}));

const { auth } = await import('$lib/auth/auth.ts');
const { prisma } = await import('$lib/server/prisma');

describe('GET /api/file/[id]/manifest', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function makeEvent(id: string): RequestEvent {
		const request = new Request(`http://localhost/api/file/${id}/manifest`, {
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

		const response = await GET(makeEvent('file-1'));

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
		expect(prisma.file.findUnique).not.toHaveBeenCalled();
	});

	it('returns 404 when file is not found', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-1' }
		});

		(prisma.file.findUnique as any).mockResolvedValue(null);

		const response = await GET(makeEvent('file-1'));

		expect(prisma.file.findUnique).toHaveBeenCalledWith({
			where: { id: 'file-1' },
			include: { keyPackets: true }
		});
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: 'Not found' });
	});

	it('returns 403 when user is not owner or recipient', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-1' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'other-owner',
			s3Key: 'uploads/file-1.bin',
			encryptedMetadata: 'enc-meta',
			nonce: 'nonce-1',
			metaNonce: 'meta-nonce-1',
			keyPackets: [{ recipientId: 'someone-else', encryptedFek: 'fek-x' }]
		});

		const response = await GET(makeEvent('file-1'));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'Forbidden' });
	});

	it('returns manifest for owner (no keyPacket)', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'owner-1' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'owner-1',
			s3Key: 'uploads/file-1.bin',
			encryptedMetadata: 'enc-meta',
			nonce: 'nonce-1',
			metaNonce: 'meta-nonce-1',
			keyPackets: []
		});

		const response = await GET(makeEvent('file-1'));

		expect(prisma.file.findUnique).toHaveBeenCalledWith({
			where: { id: 'file-1' },
			include: { keyPackets: true }
		});

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({
			fileId: 'file-1',
			s3Key: 'uploads/file-1.bin',
			encryptedMetadata: 'enc-meta',
			keyPacket: null,
			nonce: 'nonce-1',
			metaNonce: 'meta-nonce-1'
		});
	});

	it('returns manifest for recipient with keyPacket', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-2' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'owner-1',
			s3Key: 'uploads/file-1.bin',
			encryptedMetadata: 'enc-meta',
			nonce: 'nonce-1',
			metaNonce: 'meta-nonce-1',
			keyPackets: [
				{ recipientId: 'user-2', encryptedFek: 'fek-2' },
				{ recipientId: 'someone-else', encryptedFek: 'fek-x' }
			]
		});

		const response = await GET(makeEvent('file-1'));

		expect(prisma.file.findUnique).toHaveBeenCalledWith({
			where: { id: 'file-1' },
			include: { keyPackets: true }
		});

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({
			fileId: 'file-1',
			s3Key: 'uploads/file-1.bin',
			encryptedMetadata: 'enc-meta',
			keyPacket: 'fek-2',
			nonce: 'nonce-1',
			metaNonce: 'meta-nonce-1'
		});
	});
});
