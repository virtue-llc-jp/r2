import { TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ConfigFormComponent } from './config-form/config-form.component';
import { MainViewComponent } from './main-view/main-view.component';
import { LogViewComponent } from './main-view/log-view/log-view.component';
import { DepthPriceCellComponent } from './main-view/depth/depth-price-cell/depth-price-cell.component';
import { DepthSizeCellComponent } from './main-view/depth/depth-size-cell/depth-size-cell.component';
import { DepthBrokerCellComponent } from './main-view/depth/depth-broker-cell/depth-broker-cell.component';
import { DepthComponent } from './main-view/depth/depth.component';
describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        DepthComponent,
        DepthBrokerCellComponent,
        DepthSizeCellComponent,
        DepthPriceCellComponent,
        LogViewComponent,
        MainViewComponent,
        ConfigFormComponent
      ],  imports: [AppRoutingModule]
    }).compileComponents();
  }));
  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
