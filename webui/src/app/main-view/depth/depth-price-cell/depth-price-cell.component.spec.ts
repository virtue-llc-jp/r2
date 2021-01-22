import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DepthPriceCellComponent } from './depth-price-cell.component';

describe('DepthPriceCellComponent', () => {
  let component: DepthPriceCellComponent;
  let fixture: ComponentFixture<DepthPriceCellComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthPriceCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthPriceCellComponent);
    component = fixture.componentInstance;
    component.priceCell = {
      value: 0,
      askTradable: true,
      bidTradable: true
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
