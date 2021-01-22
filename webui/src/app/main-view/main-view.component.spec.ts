import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { WsService } from "../ws.service";
import { MainViewComponent } from "./main-view.component";

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
};

describe("MainViewComponent", () => {
  let component: MainViewComponent;
  let fixture: ComponentFixture<MainViewComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [MainViewComponent],
        providers: [{ provide: WsService, useValue: wsServiceStub }],
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
