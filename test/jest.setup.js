document.domain = 'localhost'

global.asyncImmediate = () => {
  return new Promise((resolve) => setImmediate(() => resolve()))
}

jest.mock('./../src/javascripts/tracker', () => {
  return {
    send: jest.fn().mockImplementation(() => Promise.resolve({post: {}, response: {}}))
  }
})

jest.mock('./../src/javascripts/libs/eEmit', () => {
  return {
    subscribe: jest.fn(),
    emit: jest.fn()
  }
})
