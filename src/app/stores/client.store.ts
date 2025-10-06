import { signal } from '@angular/core';

// Signal store przechowujący aktualnego klienta (id i imię)
// Zastępuje nam np. React useContext + useState na globalne dane użytkownika.

export interface ClientModel {
  id: string;
  name: string;
}

export const clientStore = signal<ClientModel | null>(null);

// Helper: ustaw klienta – dzięki temu zachowujemy jedno miejsce aktualizacji.
export function setClient(client: ClientModel | null) {
  clientStore.set(client);
}
