import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DepthComponent } from './depth.component';
import { DepthService } from '../../depth.service';
import { LoadingComponent } from '../../shared/loading/loading.component';

const depthServiceStub = {
  depth$: {
    subscribe(x) {
      return {
        unsubscribe() {}
      }
    }
  }
}

describe('DepthComponent', () => {
  let component: DepthComponent;
  let fixture: ComponentFixture<DepthComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DepthComponent, LoadingComponent ],
      providers: [{provide: DepthService, useValue: depthServiceStub}],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
