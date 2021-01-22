import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { WsService } from "../ws.service";
import { MainViewComponent } from "./main-view.component";
import { LogViewComponent } from "./log-view/log-view.component";
import { LogService } from "../log.service";
import { PositionComponent } from "./position/position.component";
import { DepthComponent } from "./depth/depth.component";
import { DepthService } from "../depth.service";
import { ActivePairComponent } from "./active-pair/active-pair.component";
import { SpreadAnalysisComponent } from "./spread-analysis/spread-analysis.component";
import { LoadingComponent } from "../shared/loading/loading.component";

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
  activePair$: {
    subscribe(x) {
      return {
        unsubscribe() {},
      };
    },
  },
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

const depthServiceStub = {
  depth$: {
    subscribe(x) {
      return {
        unsubscribe() {}
      }
    }
  }
}

describe("MainViewComponent", () => {
  let component: MainViewComponent;
  let fixture: ComponentFixture<MainViewComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [MainViewComponent, LogViewComponent, PositionComponent, DepthComponent, ActivePairComponent, SpreadAnalysisComponent, LoadingComponent],
        providers: [
          { provide: WsService, useValue: wsServiceStub },
          { provide: DepthService, useValue: depthServiceStub },
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
