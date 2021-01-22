import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WsService } from '../ws.service';
import { ConfigFormComponent } from './config-form.component';
import { FormsModule } from '@angular/forms';

const wsServiceStub = {
  connect() {},
  config$: {
    subscribe(x) {
      return {
        unsubscribe() {}
      }
    }
  }
}

describe('ConfigFormComponent', () => {
  let component: ConfigFormComponent;
  let fixture: ComponentFixture<ConfigFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigFormComponent ],
      providers: [ {provide: WsService, useValue: wsServiceStub}],
      imports: [FormsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
