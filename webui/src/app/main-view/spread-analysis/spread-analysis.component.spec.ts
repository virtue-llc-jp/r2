import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WsService } from '../../ws.service';
import { SpreadAnalysisComponent } from './spread-analysis.component';

const wsServiceStub = {
  connect() {},
  limitCheck$: {
    subscribe(x) {}
  },
  spread$: {
    subscribe(x) {
      return {
        add(x) {},
        unsubscribe() {}
      }
    }
  }
}

describe('SpreadAnalysisComponent', () => {
  let component: SpreadAnalysisComponent;
  let fixture: ComponentFixture<SpreadAnalysisComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SpreadAnalysisComponent ],
      providers: [ {provide: WsService, useValue: wsServiceStub}],
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
