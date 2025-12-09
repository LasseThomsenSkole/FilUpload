import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { POST } from './+server';

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
			create: vi.fn()
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

if (!globalThis.crypto) {
	globalThis.crypto = {} as Crypto;
}
(globalThis.crypto as any).randomUUID = vi.fn(() => 'test-file-id');

const { auth } = await import('$lib/auth/auth');
const { prisma } = await import('$lib/server/prisma');
const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

describe('POST /api/upload/init', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns 401 when user is not authenticated', async () => {
		(auth.api.getSession as any).mockResolvedValue(null);

		const request = new Request('http://localhost/api/upload/init', {
			method: 'POST',
			headers: new Headers()
		});

		const response = await POST({ request } as unknown as RequestEvent);

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body).toEqual({ error: 'Unauthorized' });
	});

	it('creates preliminary file record and returns upload url', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'user-123' }
		});

		(getSignedUrl as any).mockResolvedValue('https://signed.url/upload');

		(prisma.file.create as any).mockResolvedValue({
			id: 'test-file-id'
		});

		const request = new Request('http://localhost/api/upload/init', {
			method: 'POST',
			headers: new Headers()
		});

		const response = await POST({ request } as unknown as RequestEvent);

		expect(response.status).toBe(200);
		const body = await response.json();

		expect(body.fileId).toBe('test-file-id');
		expect(body.s3Key).toBe('uploads/test-file-id.bin');
		expect(body.uploadUrl).toBe('https://signed.url/upload');

		expect(prisma.file.create).toHaveBeenCalledWith({
			data: {
				id: 'test-file-id',
				ownerId: 'user-123',
				s3Key: 'uploads/test-file-id.bin',
				encryptedMetadata: '',
				nonce: '',
				metaNonce: ''
			}
		});
	});
});
