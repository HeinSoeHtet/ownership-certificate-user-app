import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vault } from './vault';

describe('Vault', () => {
  let component: Vault;
  let fixture: ComponentFixture<Vault>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vault]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Vault);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
