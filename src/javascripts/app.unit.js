import 'regenerator-runtime'
import app from './app'

jest.mock('./tracker', () => {
  return {
    send: jest.fn()
  }
})

import tracker from './tracker'

describe('mkz api', () => {

  beforeEach(() => {
    delete window.mkz
    app.ready('mkz')
  })

  afterEach(() => {
    tracker.send.mockClear()
  })

  it('should\t send any events before use api', () => {
    expect(tracker.calls).toBeUndefined()
  })

})
