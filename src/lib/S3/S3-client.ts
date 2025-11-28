import { S3Client } from '@aws-sdk/client-s3';
import { ACCESS_KEY, SECRET_KEY, STORAGE_URL } from '$env/static/private';

export const s3 = new S3Client({ region: 'auto',
	endpoint: STORAGE_URL,
	credentials: {
		accessKeyId: ACCESS_KEY,
		secretAccessKey: SECRET_KEY
	},
	forcePathStyle: true
});