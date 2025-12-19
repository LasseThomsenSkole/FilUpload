import { test, expect } from '@playwright/test';

test('signup and persist keys', async ({ page }) => {
	await page.goto('/signup');

	await page.fill('[name="name"]', 'E2E User');
	await page.fill('[name="email"]', 'e2e@test.com');
	await page.fill('[name="password"]', 'password123!');

	await page.click('button[type="submit"]');

	await page.waitForURL('/dashboard');

	const { hasPrivateKey, mnemonic } = await page.evaluate(() => {
		return new Promise<{ hasPrivateKey: boolean; mnemonic: string | null }>((resolve) => {
			const req = indexedDB.open('keyval-store');

			req.onerror = () => resolve({ hasPrivateKey: false, mnemonic: null });

			req.onsuccess = () => {
				const db = req.result;
				const tx = db.transaction('keyval', 'readonly');
				const store = tx.objectStore('keyval');

				const keyReq = store.get('e2e_privateKey');
				const mnemonicReq = store.get('e2e_mnemonic');

				let privateKeyExists = false;
				let mnemonic: string | null = null;

				keyReq.onsuccess = () => {
					privateKeyExists = !!keyReq.result;
					maybeResolve();
				};

				mnemonicReq.onsuccess = () => {
					mnemonic = mnemonicReq.result ?? null;
					maybeResolve();
				};

				function maybeResolve() {
					if (keyReq.readyState === 'done' && mnemonicReq.readyState === 'done') {
						resolve({ hasPrivateKey: privateKeyExists, mnemonic });
					}
				}
			};
		});
	});

	expect(hasPrivateKey).toBe(true);
	expect(mnemonic).not.toBeNull();
	expect(mnemonic!.split(' ').length).toBe(12);

	await page.context().storageState({
		path: 'tests/.auth/state.json'
	});
});
