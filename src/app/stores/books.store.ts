import { Injectable, signal } from '@angular/core';
import { userChangedBus } from '../services/event-bus.service';
import { clientStore } from './client.store';
import { MockBooksService, UserBooksSnapshot } from '../services/mock-books.service';

export interface Book {
  id: string;
  title: string;
}

@Injectable({ providedIn: 'root' })
export class BooksStore {
  /**
   * Signal z aktualnie wypożyczonymi książkami.
   * Analogicznie do React useState([...]) ale współdzielone poprzez DI.
   */
  readonly borrowed = signal<Book[]>([]);

  /**
   * Lista książek dostępnych do wypożyczenia dla bieżącego użytkownika.
  * Można ją porównać do memoizowanego selektora w React.
   */
  readonly available = signal<Book[]>([]);

  /**
   * Mała pamięć podręczna – dzięki niej po zmianie użytkownika odzyskujemy
   * jego stan bez ponownego resetowania listy. Analogicznie do lokalnego storage
   * w hooku React useref/useState.
   */
  private readonly cache = new Map<string, UserBooksSnapshot>();

  private lastRequestedUserId: string | null = null;

  constructor(private readonly mock: MockBooksService) {
    // Store nasłuchuje pojedynczego zdarzenia z event busa i
    // reaguje przeładowaniem danych z mock serwisu.
    // Można myśleć o tym jak o useEffect(() => { ... }, [client]) w React.
    userChangedBus.subscribe(() => this.reload());
  }

  private reload() {
    // 1. Pobieramy aktualnie wybranego klienta ze store'u.
    const client = clientStore();
    if (!client) {
      // 2a. Jeśli nie ma klienta – czyścimy oba sygnały.
      this.lastRequestedUserId = null;
      this.borrowed.set([]);
      this.available.set([]);
      return;
    }

    const cached = this.cache.get(client.id);
    if (cached) {
      // 2b. Jeśli użytkownik był już odwiedzany – odtwarzamy jego stan.
      this.syncSignals(cached);
      return;
    }

    // 2b. Dla istniejącego klienta prosimy mock serwis o snapshot danych.
    const requestId = client.id;
    this.lastRequestedUserId = requestId;
    this.mock.getBooksForUser(requestId).then((snapshot: UserBooksSnapshot) => {
      // Jeśli w międzyczasie zdążono przełączyć użytkownika – ignorujemy odpowiedź.
      if (this.lastRequestedUserId !== requestId) {
        return;
      }
      const normalized = this.cloneSnapshot(snapshot);
      this.cache.set(requestId, normalized);
      this.syncSignals(normalized);
    });
  }

  addBorrowed(book: Book): boolean {
    // Minimalna logika biznesowa – coś jak reducer w Reduxie.
    // 1. Sprawdzamy ile książek ma już użytkownik.
    const current = this.borrowed();
    if (current.length >= 3) {
      return false;
    }
    // 2. Nie dodajemy duplikatów.
    if (current.some(b => b.id === book.id)) {
      return false;
    }

    // 3. Dopisujemy książkę do listy wypożyczonych (immutability jak w React setState).
    this.borrowed.set([...current, book]);
    // 4. Usuwamy ją z listy dostępnych.
    this.available.set(this.available().filter(b => b.id !== book.id));
    this.persistCurrentState();
    return true;
  }

  returnBorrowed(book: Book): boolean {
    // 1. Weryfikujemy czy dana książka faktycznie jest wypożyczona.
    const current = this.borrowed();
    if (!current.some(b => b.id === book.id)) {
      return false;
    }

    // 2. Usuwamy książkę z wypożyczeń.
    this.borrowed.set(current.filter(b => b.id !== book.id));
    // 3. Dodajemy ją z powrotem do listy dostępnych (push + sort opcjonalnie).
    const availableNow = this.available();
    if (!availableNow.some(b => b.id === book.id)) {
      this.available.set([...availableNow, book]);
    }
    this.persistCurrentState();
    return true;
  }

  private syncSignals(snapshot: UserBooksSnapshot) {
    this.borrowed.set([...snapshot.borrowed]);
    this.available.set([...snapshot.available]);
  }

  private persistCurrentState() {
    const client = clientStore();
    if (!client) {
      return;
    }
    this.cache.set(client.id, this.cloneSnapshot({
      borrowed: this.borrowed(),
      available: this.available()
    }));
  }

  private cloneSnapshot(snapshot: UserBooksSnapshot): UserBooksSnapshot {
    return {
      borrowed: [...snapshot.borrowed],
      available: [...snapshot.available]
    };
  }
}
