import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MerchantSignup } from './merchant-signup.component';

describe('MerchantSignup', () => {
  let component: MerchantSignup;
  let fixture: ComponentFixture<MerchantSignup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantSignup],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantSignup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
