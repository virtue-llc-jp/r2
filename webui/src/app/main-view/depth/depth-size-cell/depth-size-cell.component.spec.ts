import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DepthSizeCellComponent } from './depth-size-cell.component';

describe('DepthSizeCellComponent', () => {
  let component: DepthSizeCellComponent;
  let fixture: ComponentFixture<DepthSizeCellComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthSizeCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthSizeCellComponent);
    component = fixture.componentInstance;
    component.sizeCells = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
