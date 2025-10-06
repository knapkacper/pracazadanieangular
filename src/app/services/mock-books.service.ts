import { Injectable } from '@angular/core';
import type { Book } from '../stores/books.store';

export interface UserBooksSnapshot {
  borrowed: Book[];
  available: Book[];
}

@Injectable({ providedIn: 'root' })
export class MockBooksService {
  /**
   * Dwa przykładowe konta użytkowników i przypisane im listy.
   * borrowed - książki już wypożyczone
   * available - kolejne pozycje, które mogą wypożyczyć
   */
  private userBooks: Record<string, UserBooksSnapshot> = {
    user1: {
      borrowed: [
        { id: 'b1', title: 'Pan Tadeusz' }
      ],
      available: [
        { id: 'b2', title: 'Lalka' },
        { id: 'b3', title: 'Ballady i romanse' }
      ]
    },
    user2: {
      borrowed: [
        { id: 'b4', title: 'Zemsta' },
        { id: 'b5', title: 'Krzyżacy' }
      ],
      available: [
        { id: 'b6', title: 'Ferdydurke' },
        { id: 'b7', title: 'Solaris' }
      ]
    }
  };

  /**
   * Symulowany call HTTP – w prawdziwej aplikacji tutaj byłby HttpClient.
   * Zwracamy klona obiektu żeby nie mutować magazynu w pamięci.
   */
  getBooksForUser(userId: string): Promise<UserBooksSnapshot> {
    // 1. Pobieramy snapshot z mapy lub tworzymy pusty.
    const snapshot = this.userBooks[userId] ?? { borrowed: [], available: [] };
    return Promise.resolve({
      // 2. Tworzymy kopię wypożyczonych książek (aby uniknąć mutacji zewnętrznej).
      borrowed: snapshot.borrowed.map(b => ({ ...b })),
      // 3. Analogicznie kopiujemy listę dostępnych.
      available: snapshot.available.map(b => ({ ...b }))
    });
  }
}
