import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WsService } from '../../ws.service';
import { PositionComponent } from './position.component';
import { LoadingComponent } from '../../shared/loading/loading.component';

const wsServiceStub = {
  connect() {},
  position$: {
    subscribe(x) {
      return {
        unsubscribe() {}
      }
    }
  }
}

describe('PositionComponent', () => {
  let component: PositionComponent;
  let fixture: ComponentFixture<PositionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PositionComponent, LoadingComponent ],
      providers: [ {provide: WsService, useValue: wsServiceStub}],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
