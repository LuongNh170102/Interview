import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-stores-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stores-list.component.html',
})
export class StoresListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly cart = inject(CartService);

  readonly stores = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly searchQuery = signal('');

  readonly filteredStores = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.stores();
    return this.stores().filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.businessCategory?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.isLoading.set(true);
    this.http.get<any[]>('/api/merchants/public/list').subscribe({
      next: (data) => {
        this.stores.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load stores:', err);
        this.isLoading.set(false);
      },
    });
  }

  goToStore(store: any): void {
    this.router.navigate(['/store', store.externalId]);
  }
}
