import { TestBed } from '@angular/core/testing';

import { Ipfs } from './ipfs';

describe('Ipfs', () => {
  let service: Ipfs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ipfs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
