import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SpreadAnalysisComponent } from './spread-analysis.component';

describe('SpreadAnalysisComponent', () => {
  let component: SpreadAnalysisComponent;
  let fixture: ComponentFixture<SpreadAnalysisComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SpreadAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpreadAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
