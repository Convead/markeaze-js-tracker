import 'regenerator-runtime'
import app from './app'
import { default as store, reset as resetStore } from './store'
import { default as mock } from './../../test/store.mock'
import tracker from './tracker'
import eEmit from './libs/eEmit'

describe('mkz option api', () => {

  beforeEach(() => {
    delete window.mkz

    resetStore()

    window.mkz = window.mkz || function() {
      window.mkz.q = window.mkz.q || []
      window.mkz.q.push(arguments)
    }

    app.ready('mkz')
  })

  afterEach(() => {
    tracker.send.mockClear()
    eEmit.subscribe.mockClear()
    eEmit.emit.mockClear()
  })

  describe('before use any api methods', () => {

    it('should not send any events', () => {
      expect(tracker.calls).toBeUndefined()
    })

    it('should not exist appKey', () => {
      expect(store.appKey).toBeUndefined()
    })

  })

  describe('"appKey" method', () => {

    it('should set appKey', () => {
      window.mkz('appKey', mock.appKey)
      expect(store.appKey).toBe(mock.appKey)
    })

  })

  describe('"setDeviceUid" method', () => {

    it('should set uid force', () => {
      window.mkz('setDeviceUid', mock.firstUid, true)
      expect(store.uid).toBe(mock.firstUid)
    })

    it('should\'t set uid without force if it exists', () => {
      window.mkz('setDeviceUid', mock.firstUid, true)
      window.mkz('setDeviceUid', mock.secondUid)
      expect(store.uid).toBe(mock.firstUid)
    })

    it('should set uid without force if it\'t exists', () => {
      window.mkz('setDeviceUid', mock.secondUid)
      expect(store.uid).toBe(mock.secondUid)
    })

  })

  describe('"debug" method', () => {

    it('should enable debug mod', () => {
      window.mkz('debug', true)
      expect(store.debugMode).toBeTruthy()
    })

    it('should disable debug mod', () => {
      window.mkz('debug', false)
      expect(store.debugMode).toBeFalsy()
    })

  })

  describe('function method', () => {

    it('should call function', () => {
      const fn = jest.fn()
      window.mkz(fn)
      expect(fn).toHaveBeenCalledTimes(1)
    })

  })

  describe('"setVisitorInfo" method', () => {

    it('should set visitor when it\'s empty', () => {
      window.mkz('setVisitorInfo', mock.firstVisitor)
      expect(store.visitor).toStrictEqual(mock.firstVisitor)
    })

    it('should update visitor fields', () => {
      window.mkz('setVisitorInfo', mock.firstVisitor)
      window.mkz('setVisitorInfo', mock.secondVisitor)
      expect(store.visitor).toStrictEqual({ ...mock.firstVisitor, ...mock.secondVisitor })
    })

  })

  describe('"clearVisitorInfo" method', () => {

    it('should clear visitor', () => {
      window.mkz('setVisitorInfo', mock.firstVisitor)
      window.mkz('clearVisitorInfo')
      expect(store.visitor).toStrictEqual({})
    })

  })

})
