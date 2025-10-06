import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BorrowComponent } from './borrow/borrow.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BorrowComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('my-app');
}
