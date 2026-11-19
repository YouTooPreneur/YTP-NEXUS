import { getAuth } from './auth.js';

// Adds a person who may sign in (CORE-001, USR-001): invited, of one company, their email in lower case, and, when a
// password is given, their password account (`credential`, keyed by the person's ID as Better Auth looks it up) with
// the password scrambled by Better Auth's own hasher. Gives back the person's ID. A second person with the same email
// is refused: the email is unique across Nexus.
export async function createSigninUser(person: {
  companyId: string;
  email: string;
  name: string;
  password?: string;
}): Promise<string> {
  const { internalAdapter, password } = await getAuth().$context;
  const scrambled =
    person.password === undefined ? undefined : await password.hash(person.password);
  const created = await internalAdapter.createUser(
    { name: person.name, email: person.email.toLowerCase(), companyId: person.companyId },
    { method: 'admin' },
  );
  if (scrambled !== undefined) {
    await internalAdapter.linkAccount({
      userId: created.id,
      providerId: 'credential',
      accountId: created.id,
      password: scrambled,
    });
  }
  return created.id;
}
