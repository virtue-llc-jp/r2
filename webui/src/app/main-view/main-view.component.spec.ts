import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { WsService } from "../ws.service";
import { MainViewComponent } from "./main-view.component";
import { LogViewComponent } from "./log-view/log-view.component";
import { LogService } from "../log.service";
import { PositionComponent } from "./position/position.component";

const wsServiceStub = {
  connect() {},
  error$: {
    pipe(x) {
      return {
        subscribe(x) {
          return {
            unsubscribe() {},
          };
        },
      };
    },
  },
  position$: {
    subscribe(x) {
      return {
        unsubscribe() {},
      };
    },
  },
};

const logServiceStub = {
  connect() {},
  log$: {
    subscribe(x) {
      return {
        unsubscribe() {},
      };
    },
  },
};

describe("MainViewComponent", () => {
  let component: MainViewComponent;
  let fixture: ComponentFixture<MainViewComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [MainViewComponent, LogViewComponent, PositionComponent],
        providers: [
          { provide: WsService, useValue: wsServiceStub },
          { provide: LogService, useValue: logServiceStub },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MainViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
