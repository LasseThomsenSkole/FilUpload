export async function getUsersFromEmails(emails: string[]): Promise<string[]> {
		const response = await fetch(`/api/user?emails=${encodeURIComponent(emails.join(','))}`);
		if (!response.ok) {
			throw new Error('Failed to fetch users');
		}
		const users: { id: string; name: string; email: string }[] = await response.json();
		return users.map(user => user.id);
}