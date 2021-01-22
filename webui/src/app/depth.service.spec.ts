import { TestBed, inject } from '@angular/core/testing';
import { WsService } from './ws.service';
import { DepthService } from './depth.service';

const wsServiceStub = {
  connect() {},
  quote$: {
    pipe(x) {}
  }
}

describe('DepthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DepthService, {provide: WsService, useValue: wsServiceStub}]
    });
  });

  it('should be created', inject([DepthService], (service: DepthService) => {
    expect(service).toBeTruthy();
  }));
});
