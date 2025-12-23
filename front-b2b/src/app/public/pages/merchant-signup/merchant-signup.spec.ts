import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MerchantSignup } from './merchant-signup';

describe('MerchantSignup', () => {
  let component: MerchantSignup;
  let fixture: ComponentFixture<MerchantSignup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MerchantSignup],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantSignup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
