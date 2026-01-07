import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import { HeaderComponent } from '../../layout/components/header/header.component';
import { FooterComponent } from '../../layout/components/footer/footer.component';
import { LANDING_NAV_CONFIG } from '../../shared/menu.config';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslatePipe,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit, OnDestroy {
  @ViewChild('newsContainer') newsContainer!: ElementRef<HTMLElement>;
  readonly navItems = LANDING_NAV_CONFIG;
  readonly currentNewsIndex = signal(0);
  readonly isDesktop = signal(false);

  readonly newsPageSize = computed(() => (this.isDesktop() ? 3 : 1));
  readonly newsLimit = computed(() => (this.isDesktop() ? 9 : 3));
  readonly pagedNews = computed(() =>
    this.newsItems.slice(0, this.newsLimit())
  );
  readonly totalNewsPages = computed(() =>
    Math.max(1, Math.ceil(this.pagedNews().length / this.newsPageSize()))
  );
  readonly newsPages = computed(() =>
    Array.from({ length: this.totalNewsPages() }, (_, i) => i)
  );

  private mediaQuery?: MediaQueryList;
  private mediaListener = (event: MediaQueryListEvent) =>
    this.isDesktop.set(event.matches);

  readonly features = [
    {
      titleKey: 'LANDING.FEATURES.COST_CUT.TITLE',
      descriptionKey: 'LANDING.FEATURES.COST_CUT.DESC',
      icon: '/assets/images/landing/feature-cost-cut.png',
    },
    {
      titleKey: 'LANDING.FEATURES.SETTLEMENT.TITLE',
      descriptionKey: 'LANDING.FEATURES.SETTLEMENT.DESC',
      icon: '/assets/images/landing/feature-payment.png',
    },
    {
      titleKey: 'LANDING.FEATURES.FAST_DELIVERY.TITLE',
      descriptionKey: 'LANDING.FEATURES.FAST_DELIVERY.DESC',
      icon: '/assets/images/landing/feature-fast-delivery.png',
    },
    {
      titleKey: 'LANDING.FEATURES.SUPPORT.TITLE',
      descriptionKey: 'LANDING.FEATURES.SUPPORT.DESC',
      icon: '/assets/images/landing/feature-support.png',
    },
  ];

  readonly steps = [
    {
      step: '1STEP',
      titleKey: 'LANDING.STEPS.STEP1.TITLE',
      descriptionKey: 'LANDING.STEPS.STEP1.DESC',
      icon: '/assets/images/landing/process-step-1.svg',
    },
    {
      step: '2STEP',
      titleKey: 'LANDING.STEPS.STEP2.TITLE',
      descriptionKey: 'LANDING.STEPS.STEP2.DESC',
      icon: '/assets/images/landing/process-step-2.svg',
    },
    {
      step: '3STEP',
      titleKey: 'LANDING.STEPS.STEP3.TITLE',
      descriptionKey: 'LANDING.STEPS.STEP3.DESC',
      icon: '/assets/images/landing/process-step-3.svg',
    },
  ];

  readonly newsItems = [
    {
      titleKey: 'LANDING.NEWS.ITEM1.TITLE',
      descKey: 'LANDING.NEWS.ITEM1.DESC',
      image: '/assets/images/landing/news-item-1-56586a.png',
    },
    {
      titleKey: 'LANDING.NEWS.ITEM2.TITLE',
      descKey: 'LANDING.NEWS.ITEM2.DESC',
      image: '/assets/images/landing/news-item-2-56586a.png',
    },
    {
      titleKey: 'LANDING.NEWS.ITEM3.TITLE',
      descKey: 'LANDING.NEWS.ITEM3.DESC',
      image: '/assets/images/landing/news-item-3-56586a.png',
    },
    {
      titleKey: 'LANDING.NEWS.ITEM1.TITLE',
      descKey: 'LANDING.NEWS.ITEM1.DESC',
      image: '/assets/images/landing/news-item-1-56586a.png',
    },
    {
      titleKey: 'LANDING.NEWS.ITEM2.TITLE',
      descKey: 'LANDING.NEWS.ITEM2.DESC',
      image: '/assets/images/landing/news-item-2-56586a.png',
    },
    {
      titleKey: 'LANDING.NEWS.ITEM3.TITLE',
      descKey: 'LANDING.NEWS.ITEM3.DESC',
      image: '/assets/images/landing/news-item-3-56586a.png',
    },
    {
      titleKey: 'LANDING.NEWS.ITEM1.TITLE',
      descKey: 'LANDING.NEWS.ITEM1.DESC',
      image: '/assets/images/landing/news-item-1-56586a.png',
    },
    {
      titleKey: 'LANDING.NEWS.ITEM2.TITLE',
      descKey: 'LANDING.NEWS.ITEM2.DESC',
      image: '/assets/images/landing/news-item-2-56586a.png',
    },
    {
      titleKey: 'LANDING.NEWS.ITEM3.TITLE',
      descKey: 'LANDING.NEWS.ITEM3.DESC',
      image: '/assets/images/landing/news-item-3-56586a.png',
    },
  ];

  ngOnInit(): void {
    this.mediaQuery = window.matchMedia('(min-width: 768px)');
    this.isDesktop.set(this.mediaQuery.matches);
    this.mediaQuery.addEventListener('change', this.mediaListener);
    this.currentNewsIndex.set(0);
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.mediaListener);
  }

  onNewsScroll(event: Event) {
    const element = event.target as HTMLElement;
    const scrollLeft = element.scrollLeft;
    const width = element.clientWidth;
    const index = Math.round(scrollLeft / width);
    const totalPages = this.totalNewsPages();
    const clamped = Math.max(0, Math.min(index, totalPages - 1));
    this.currentNewsIndex.set(clamped);
  }

  scrollToNews(index: number) {
    if (!this.newsContainer?.nativeElement) return;
    const totalPages = this.totalNewsPages();
    const clamped = Math.max(0, Math.min(index, totalPages - 1));
    const container = this.newsContainer.nativeElement;
    const width = container.clientWidth;
    container.scrollTo({ left: clamped * width, behavior: 'smooth' });
    this.currentNewsIndex.set(clamped);
  }
}
