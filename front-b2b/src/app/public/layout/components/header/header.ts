import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent } from '../../../shared/custom-select.component';
import { MENU_CONFIG, MenuItem } from '../../../shared/menu.config';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CustomSelectComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header {
  menus: MenuItem[] = MENU_CONFIG;
  lang: string = 'vi';
  langs = [
    { value: 'vi', label: 'VI' },
    { value: 'ko', label: 'CO' },
    { value: 'en', label: 'EN' },
  ];

  isMenuOpen = false;
  activeIndex: number | null = null;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.activeIndex = null;
    document.body.style.overflow = '';
  }

  toggleSub(index: number): void {
    this.activeIndex = this.activeIndex === index ? null : index;
  }

}
