import 'regenerator-runtime'
import app from './app'
import { default as store, reset as resetStore } from './store'
import { default as mock } from './../../test/store.mock'
import tracker from './tracker'
import eEmit from './libs/eEmit'

jest.mock('./tracker', () => {
  return {
    send: jest.fn()
  }
})

describe('mkz events api', () => {

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

  describe('"trackPageView" event', () => {

    it('should count page views', () => {
      window.mkz('trackPageView')
      window.mkz('trackPageView')
      expect(window.mkz('trackPageView')).toEqual(3)
    })

  })

})