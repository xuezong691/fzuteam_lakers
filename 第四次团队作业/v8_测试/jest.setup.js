global.alert = jest.fn();
global.confirm = jest.fn(() => true);
global.fetch = jest.fn();

jest.spyOn(console, 'error').mockImplementation(() => {});

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = value.toString();
  }
}

global.localStorage = new LocalStorageMock();
