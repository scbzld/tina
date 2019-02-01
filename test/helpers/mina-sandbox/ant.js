import { spy } from 'sinon'
import set from 'set-value'
import clone from 'clone'

class Unit {
  constructor (options) {
    for (let key in options) {
      this[key] = options[key]
    }
  }

  setData (data, callback) {
    let next = clone(this.data)
    for (let key in data) {
      if (key.includes('[') || key.includes('.')) {
        set(next, key, data[key])
      } else {
        next[key] = data[key]
      }
    }
    this.data = next
    if (typeof callback === 'function') {
      callback()
    }
  }

  async _emit (name, ...argv) {
    return this[name].call(this, ...argv)
  }
}

class App extends Unit {
  setData () {
    throw new Error('`setData` of App is not a function')
  }
}

class Page extends Unit {
  constructor (options) {
    super(options)
    this.data = this.data || {}
    this.route = '/'
  }
}

class Component extends Unit {
  constructor (options) {
    super(options)
    this.data = this.data || {}
    this.props = this.props || {}
  }
  _property (key, value) {
    let prev = clone(this.props)
    this.props[key] = value
    this.didUpdate(prev, this.data)
  }
}

export default class MinaSandbox {
  constructor ({ Tina }) {
    const sandbox = this

    sandbox._apps = []
    sandbox._pages = []
    sandbox._components = []

    // globals function of mina
    sandbox.globals = {
      App: spy(function (options) {
        sandbox._apps.push(new App(options))
      }),
      Page: spy(function (options) {
        sandbox._pages.push(new Page(options))
      }),
      Component: spy(function (options) {
        sandbox._components.push(new Component(options))
      }),
      getApp: () => sandbox.getApp(-1),
      getCurrentPages: () => [sandbox.getPage(-1)],
    }

    // replace Tina.globals
    sandbox._original = {
      Tina,
      App: Tina.globals.App,
      Page: Tina.globals.Page,
      Component: Tina.globals.Component,
      getApp: Tina.globals.getApp,
      getCurrentPages: Tina.globals.getCurrentPages,
    }
    Tina.config.globals = {
      App: sandbox.globals.App,
      Page: sandbox.globals.Page,
      Component: sandbox.globals.Component,
      getApp: sandbox.globals.getApp,
      getCurrentPages: sandbox.globals.getCurrentPages,
    }
  }

  // shortcut methods of sandbox
  getApp (index) {
    return this._apps[index >= 0 ? index : this._apps.length + index]
  }
  getPage (index) {
    return this._pages[index >= 0 ? index : this._pages.length + index]
  }
  getComponent (index) {
    return this._components[index >= 0 ? index : this._components.length + index]
  }

  restore () {
    this._original.Tina.globals = {
      App: this._original.App,
      Page: this._original.Page,
      Component: this._original.Component,
      getApp: this._original.getApp,
      getCurrentPages: this._original.getCurrentPages,
    }
  }
}
