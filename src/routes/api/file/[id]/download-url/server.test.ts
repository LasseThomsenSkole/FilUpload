import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { GET } from './+server';
//todo muligvis extract duplicate code i test utils
vi.mock('$lib/auth/auth', () => ({
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

vi.mock('$lib/S3/S3-client', () => ({
	s3: {}
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
	getSignedUrl: vi.fn()
}));

vi.mock('$env/static/private', () => ({
	BUCKET_NAME: 'test-bucket'
}));

const { auth } = await import('$lib/auth/auth');
const { prisma } = await import('$lib/server/prisma');
const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

describe('GET /api/file/[id]/download-url', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function makeEvent(id: string): RequestEvent {
		const request = new Request(`http://localhost/api/file/${id}/download-url`, {
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
			keyPackets: [{ recipientId: 'someone-else' }]
		});

		const response = await GET(makeEvent('file-1'));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'Forbidden' });
	});

	it('returns signed download url when user is owner', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-1' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'user-1',
			s3Key: 'uploads/file-1.bin',
			keyPackets: []
		});

		(getSignedUrl as any).mockResolvedValue('https://signed.url/download');

		const response = await GET(makeEvent('file-1'));

		expect(prisma.file.findUnique).toHaveBeenCalledWith({
			where: { id: 'file-1' },
			include: { keyPackets: true }
		});

		expect(getSignedUrl).toHaveBeenCalledTimes(1);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ url: 'https://signed.url/download' });
	});

	it('returns signed download url when user is recipient', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-2' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'owner-id',
			s3Key: 'uploads/file-1.bin',
			keyPackets: [{ recipientId: 'user-2' }, { recipientId: 'another-user' }]
		});

		(getSignedUrl as any).mockResolvedValue('https://signed.url/download');

		const response = await GET(makeEvent('file-1'));

		expect(prisma.file.findUnique).toHaveBeenCalledWith({
			where: { id: 'file-1' },
			include: { keyPackets: true }
		});

		expect(getSignedUrl).toHaveBeenCalledTimes(1);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ url: 'https://signed.url/download' });
	});
});
