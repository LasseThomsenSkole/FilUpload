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
			findUnique: vi.fn()
		},
		user: {
			findUnique: vi.fn()
		},
		fileKeyPacket: {
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn()
		}
	}
}));

const { auth } = await import('$lib/auth/auth');
const { prisma } = await import('$lib/server/prisma');

describe('POST /api/file/[id]/share', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function makeEvent(id: string, body: any): RequestEvent {
		const request = new Request(`http://localhost/api/file/${id}/share`, {
			method: 'POST',
			headers: new Headers({ 'content-type': 'application/json' }),
			body: JSON.stringify(body)
		});

		return {
			params: { id },
			request
		} as unknown as RequestEvent;
	}

	const baseBody = {
		recipients: [
			{ recipientId: 'user-1', encryptedFek: 'fek-1' },
			{ recipientId: 'user-2', encryptedFek: 'fek-2' }
		]
	};

	it('returns 401 when user is not authenticated', async () => {
		(auth.api.getSession as any).mockResolvedValue(null);

		const response = await POST(makeEvent('file-1', baseBody));

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
		expect(prisma.file.findUnique).not.toHaveBeenCalled();
	});

	it('returns 400 when body is invalid', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'owner-1' }
		});

		const response = await POST(makeEvent('file-1', { foo: 'bar' }));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid body' });
		expect(prisma.file.findUnique).not.toHaveBeenCalled();
	});

	it('returns 404 when file is not found', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'owner-1' }
		});

		(prisma.file.findUnique as any).mockResolvedValue(null);

		const response = await POST(makeEvent('file-1', baseBody));

		expect(prisma.file.findUnique).toHaveBeenCalledWith({
			where: { id: 'file-1' }
		});
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: 'Not found' });
	});

	it('returns 403 when user is not the owner', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'owner-1' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'other-owner'
		});

		const response = await POST(makeEvent('file-1', baseBody));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'Forbidden' });
	});

	it('creates new key packets for existing users', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'owner-1' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'owner-1'
		});

		(prisma.user.findUnique as any)
			.mockResolvedValueOnce({ id: 'user-1' })
			.mockResolvedValueOnce({ id: 'user-2' });

		// none have existing packets
		(prisma.fileKeyPacket.findFirst as any).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

		(prisma.fileKeyPacket.create as any).mockResolvedValue({});

		const response = await POST(makeEvent('file-1', baseBody));

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({
			ok: true,
			created: [
				{ recipientId: 'user-1', created: true },
				{ recipientId: 'user-2', created: true }
			]
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

	it('updates existing key packet when it already exists', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'owner-1' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'owner-1'
		});

		(prisma.user.findUnique as any)
			.mockResolvedValueOnce({ id: 'user-1' })
			.mockResolvedValueOnce({ id: 'user-2' });

		(prisma.fileKeyPacket.findFirst as any)
			.mockResolvedValueOnce({ id: 'kp-1', recipientId: 'user-1' }) // updated
			.mockResolvedValueOnce(null); // created

		(prisma.fileKeyPacket.update as any).mockResolvedValue({});
		(prisma.fileKeyPacket.create as any).mockResolvedValue({});

		const response = await POST(makeEvent('file-1', baseBody));

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({
			ok: true,
			created: [
				{ recipientId: 'user-1', updated: true },
				{ recipientId: 'user-2', created: true }
			]
		});

		expect(prisma.fileKeyPacket.update).toHaveBeenCalledWith({
			where: { id: 'kp-1' },
			data: { encryptedFek: 'fek-1' }
		});
	});

	it('skips recipients that do not exist', async () => {
		(auth.api.getSession as any).mockResolvedValue({
			user: { id: 'owner-1' }
		});

		(prisma.file.findUnique as any).mockResolvedValue({
			id: 'file-1',
			ownerId: 'owner-1'
		});

		// first user does not exist, second does
		(prisma.user.findUnique as any)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: 'user-2' });

		(prisma.fileKeyPacket.findFirst as any).mockResolvedValueOnce(null); // user-2

		(prisma.fileKeyPacket.create as any).mockResolvedValue({});

		const response = await POST(makeEvent('file-1', baseBody));

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({
			ok: true,
			created: [{ recipientId: 'user-2', created: true }]
		});

		// ensure create only called for existing user
		expect(prisma.fileKeyPacket.create).toHaveBeenCalledTimes(1);
		expect((prisma.user.findUnique as any).mock.calls.length).toBe(2);
	});
});
