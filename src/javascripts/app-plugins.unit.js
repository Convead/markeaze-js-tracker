import 'regenerator-runtime'
import app from './app'
import { default as store, reset as resetStore } from './store'
import { default as mock } from './../../test/store.mock'
import tracker from './tracker'
import eEmit from './libs/eEmit'

describe('mkz plugin api', () => {

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

  describe('"setPluginSettings" method', () => {

    it('should\'t set plugin settings before set appKey', () => {
      window.mkz('setPluginSettings', 'chat', mock.firstChatPluginSettings)
      expect(store.plugins.chat.settings).toStrictEqual({})
    })

    it('should\'t set undefined plugin settings', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('setPluginSettings', 'undefinedPlugin', mock.firstChatPluginSettings)
      expect(store.plugins.undefinedPlugin).toBeUndefined()
    })

    it('should set plugin settings', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('setPluginSettings', 'chat', mock.firstChatPluginSettings)
      expect(store.plugins.chat.settings).toStrictEqual(mock.firstChatPluginSettings)
    })

    it('should update plugin settings', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('setPluginSettings', 'chat', mock.firstChatPluginSettings)
      window.mkz('setPluginSettings', 'chat', mock.secondChatPluginSettings)
      expect(store.plugins.chat.settings).toStrictEqual({ ...mock.firstChatPluginSettings, ...mock.secondChatPluginSettings })
    })

    it('should call event', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('setPluginSettings', 'chat', mock.firstChatPluginSettings)
      expect(eEmit.emit).toHaveBeenCalledTimes(1)
    })

  })

})
