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

    it('should\'t send without call "appKey"', () => {
      window.mkz('trackPageView')
      expect(tracker.send).not.toHaveBeenCalled()
    })

    it('should send with call "appKey"', () => {
      window.mkz('trackPageView')
      window.mkz('appKey', mock.appKey)
      expect(tracker.send).toHaveBeenCalled()
    })

    it('should get location href', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('trackPageView')
      expect(tracker.send).toHaveBeenCalledWith('trackPageView', {'page': {'url': 'http://localhost/'}}, undefined)
    })

    it('should send with arguments', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('trackPageView', {
        page: { url: 'http://test.com' }
      })
      expect(tracker.send).toHaveBeenCalledWith('trackPageView', {'page': {'url': 'http://test.com'}}, undefined)
    })

    it('should fix invalid url', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('trackPageView', {
        page: { url: 'http://example.net?test=%26' }
      })
      expect(tracker.send).toHaveBeenCalledWith('trackPageView', {'page': {'url': 'http://example.net?test=%2526'}}, undefined)
    })

    it('should return promise', () => {
      window.mkz('appKey', mock.appKey)
      expect(window.mkz('trackPageView')).resolve
    })

  })

  describe('"setCategoryView" event', () => {

    it('should set category in "trackPageView"', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('setCategoryView', {
        uid: 12
      })
      window.mkz('trackPageView', {
        page: { url: 'http://set-category-view.com' }
      })
      expect(tracker.send).toHaveBeenCalledWith('trackPageView', {'category': {'uid': '12'}, 'page': {'url': 'http://set-category-view.com'}}, undefined)
    })

    it('should require property "uid"', () => {
      window.mkz('appKey', mock.appKey)
      expect(() => { window.mkz('setCategoryView') }).toThrow(Error('"category.uid" property is required'))
    })

  })

  describe('"setOfferView" event', () => {

    it('should set offer in "trackPageView"', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('setOfferView', {
        variant_id: 'id999',
        price: 99.00,
        name: 'Product test',
        main_image_url: 'http://site-test.com/image.jpg'
      })
      window.mkz('trackPageView', {
        page: { url: 'http://set-offer-view.com' }
      })
      expect(tracker.send).toHaveBeenCalledWith('trackPageView', {'offer': {'variant_id': 'id999', 'price': 99, 'name': 'Product test', 'main_image_url': 'http://site-test.com/image.jpg'}, 'page': {'url': 'http://set-offer-view.com'}}, undefined)
    })

    it('should require property "variant_id"', () => {
      window.mkz('appKey', mock.appKey)
      expect(() => {
        window.mkz('setOfferView')
      }).toThrow(Error('"offer.variant_id" property is required'))
    })

    it('should fix invalid url', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('setOfferView', {
        variant_id: 'id999',
        url: 'http://example.net?test=%26'
      })
      window.mkz('trackPageView')
      expect(tracker.send).toHaveBeenCalledWith('trackPageView', {'offer': {'variant_id': 'id999', 'url': 'http://example.net?test=%2526'}, 'page': {'url': 'http://localhost/'}}, undefined)
    })

  })

  describe('"trackCartUpdate" event', () => {

    it('should call tracker', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('trackCartUpdate', {
        items: [{ variant_id: 'bb1', qnt: 2.0 }]
      })
      expect(tracker.send).toHaveBeenCalledWith('trackCartUpdate', {'items': [{'variant_id': 'bb1', 'qnt': 2}]}, undefined)
    })

    it('should return promise', () => {
      window.mkz('appKey', mock.appKey)
      expect(window.mkz('trackCartUpdate', {items: []})).resolve
    })

    it('should return reject with required field', () => {
      window.mkz('appKey', mock.appKey)
      expect(window.mkz('trackCartUpdate')).rejects.toThrow('"items" property is required')
    })

    it('should require property "variant_id"', () => {
      window.mkz('appKey', mock.appKey)
      expect(window.mkz('trackCartUpdate', {
        items: [
          { variant_id: 'bb1', qnt: 2.0 },
          { qnt: 2.0 }
        ]
      })).rejects.toThrow(Error('"item.variant_id" property is required'))
    })

    it('should require property "qnt"', () => {
      window.mkz('appKey', mock.appKey)
      expect(window.mkz('trackCartUpdate', {
        items: [
          { variant_id: 'bb1', qnt: 2.0 },
          { variant_id: 'bb2' }
        ]
      })).rejects.toThrow(Error('"item.qnt" property is required'))
    })

    it('should fix invalid url', () => {
      window.mkz('appKey', mock.appKey)
      window.mkz('trackCartUpdate', {
        items: [{ variant_id: 'bb1', qnt: 2.0, url: 'http://example.net?test=%26' }]
      })
      expect(tracker.send).toHaveBeenCalledWith('trackCartUpdate', {'items': [{'variant_id': 'bb1', 'qnt': 2, 'url': 'http://example.net?test=%2526'}]}, undefined)
    })

  })

  describe('"trackCartAddItem" event', () => {

    testTrackCartChanges('trackCartAddItem')

  })

  describe('"trackCartRemoveItem" event', () => {

    testTrackCartChanges('trackCartRemoveItem')

  })

})

function testTrackCartChanges(name) {
  it('should call tracker', () => {
    window.mkz('appKey', mock.appKey)
    window.mkz(name, {
      item: { variant_id: 'bb1', qnt: 2.0 }
    })
    expect(tracker.send).toHaveBeenCalledWith(name, {'item': {'variant_id': 'bb1', 'qnt': 2}}, undefined)
  })

  it('should return promise', () => {
    window.mkz('appKey', mock.appKey)
    expect(window.mkz(name, {item: {variant_id: 'item id', qnt: 12}})).resolve
  })

  it('should return reject with required field', () => {
    window.mkz('appKey', mock.appKey)
    expect(window.mkz(name)).rejects.toThrow('"item" property is required')
  })

  it('should require property "variant_id"', () => {
    window.mkz('appKey', mock.appKey)
    expect(window.mkz(name, {
      item: { qnt: 2.0 }
    })).rejects.toThrow(Error('"item.variant_id" property is required'))
  })

  it('should require property "qnt"', () => {
    window.mkz('appKey', mock.appKey)
    expect(window.mkz(name, {
      item: { variant_id: 'bb1' }
    })).rejects.toThrow(Error('"item.qnt" property is required'))
  })

  it('should fix invalid url', () => {
    window.mkz('appKey', mock.appKey)
    window.mkz(name, {
      item: { variant_id: 'bb1', qnt: 2.0, url: 'http://example.net?test=%26' }
    })
    expect(tracker.send).toHaveBeenCalledWith(name, {'item': {'variant_id': 'bb1', 'qnt': 2, 'url': 'http://example.net?test=%2526'}}, undefined)
  })
}