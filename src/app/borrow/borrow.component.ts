import { Component, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BooksStore } from '../stores/books.store';
import { setClient, type ClientModel } from '../stores/client.store';
import type { Book } from '../stores/books.store';
import { userChangedBus } from '../services/event-bus.service';

/**
 * Component analogiczny do React function component:
 * - signals = useState
 * - effect() = useEffect
 * - computed() = useMemo
 */
@Component({
  selector: 'app-borrow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './borrow.component.html',
  styleUrls: ['./borrow.component.css']
})
export class BorrowComponent {
  private booksStore = inject(BooksStore); // tu korzystamy z signal store'a poprzez DI

  // Trzymamy listę użytkowników w sygnale – coś jak useState w React.
  users = signal<ClientModel[]>([
    { id: 'user1', name: 'Paweł' },
    { id: 'user2', name: 'Kasia' }
  ]);

  selectedUser = signal<ClientModel | null>(null);

  // obserwuj zmiany selectedUser i emituj pojedyncze zdarzenie
  constructor() {
    // effect uruchomi się automatycznie przy zmianie selectedUser()
    // 1. Pobieramy aktualną wartość użytkownika.
    // 2. Zapisujemy ją w globalnym store.
    // 3. Emitujemy sygnał aby inne elementy (np. BooksStore) mogły się odświeżyć.
    effect(() => {
      const u = this.selectedUser();
      // ustawiamy globalny clientStore — analogia do React context + setState
      setClient(u);
      // Emitujemy pojedynczy Event – odpowiednik np. dispatcha w Redux/React.
      userChangedBus.emit();
    });

    // ustawiamy początkowego użytkownika, żeby UI od razu pokazało dane
    this.selectedUser.set(this.users()[0] ?? null);
  }

  // Handler wywoływany z template kiedy zmieni się select
  onUserChange(event: Event) {
    // 1. Odczytujemy element <select> z eventu.
    const target = event.target as HTMLSelectElement | null;
    // 2. Pobieramy wartość (id użytkownika) albo pusty string jeśli nic nie wybrano.
    const val = target?.value ?? '';
    // 3. Szukamy użytkownika o danym id w lokalnym sygnale users().
    const user = this.users().find(u => u.id === val) ?? null;
    // 4. Aktualizujemy sygnał selectedUser – efekt wyżej zajmie się resztą.
    this.selectedUser.set(user);
  }

  // Akcja dodająca książkę do wypożyczeń — sprawdza limit 3
  borrow(book: Book) {
    // 1. Delegujemy zapis do BooksStore, aby zachować pojedyncze źródło prawdy.
    const success = this.booksStore.addBorrowed(book);
    if (!success) {
      // proste powiadomienie — w prawdziwej aplikacji użyj toast
      alert('Osiągnięto limit wypożyczonych książek (3)');
    }
  }

  // Akcja usuwająca książkę z wypożyczeń (kliknięcie w "X").
  remove(book: Book) {
    this.booksStore.returnBorrowed(book);
  }

  // Wyprowadzamy sygnały ze store'u do template – computed zachowuje reactivity.
  borrowed = computed(() => this.booksStore.borrowed());
  available = computed(() => this.booksStore.available());
  // computed pilnuje limitu – reaguje, gdy borrowed() się zmieni.
  limitReached = computed(() => this.borrowed().length >= 3);
  // helper do czytelnego wyświetlania aktualnego użytkownika.
  currentUserName = computed(() => this.selectedUser()?.name ?? '---');
}
