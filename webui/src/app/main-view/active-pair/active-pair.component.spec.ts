import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WsService } from '../../ws.service';
import { ActivePairComponent } from './active-pair.component';

const wsServiceStub = {
  connect() {},
  activePair$: {
    subscribe(x) {
      return {
        unsubscribe() {}
      }
    }
  }
}

describe('ActivePairComponent', () => {
  let component: ActivePairComponent;
  let fixture: ComponentFixture<ActivePairComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivePairComponent ],
      providers: [ {provide: WsService, useValue: wsServiceStub}],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivePairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
