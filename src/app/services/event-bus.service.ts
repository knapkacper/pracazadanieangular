type Handler = () => void;

// Bardzo prosty event bus: komponenty mogą subscribe() i emit() zdarzeń.
// Daje nam mechanizm podobny do EventEmittera z React context/Redux.
export class EventBus {
  private handlers: Handler[] = [];

  subscribe(h: Handler) {
    // 1. Rejestrujemy handler w tablicy.
    this.handlers.push(h);
    return () => {
      // 2. Zwracamy funkcję czyszczącą – identycznie jak cleanup w useEffect.
      this.handlers = this.handlers.filter(x => x !== h);
    };
  }

  emit() {
    // emitujemy synchronnie – każdy listener otrzymuje zdarzenie raz.
    this.handlers.slice().forEach(h => h());
  }
}

export const userChangedBus = new EventBus();
