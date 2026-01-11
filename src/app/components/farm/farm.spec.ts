import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmComponent } from './farm'; 
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('FarmComponent', () => {
  let component: FarmComponent;
  let fixture: ComponentFixture<FarmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmComponent, HttpClientTestingModule] 
    })
    .compileComponents();

    fixture = TestBed.createComponent(FarmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});