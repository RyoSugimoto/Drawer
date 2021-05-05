import fixBackface from './fix-backface.js'

export default class Drawer {
  public drawerElement: HTMLElement | null
  public switchElements?: NodeListOf<HTMLElement> | null
  public inertElements?: NodeListOf<HTMLElement> | null
  public isExpanded: boolean = false
  public enableFixBackface:boolean = true
  public enableHistory: boolean = false
  constructor(args: {
    drawer: string
    switch?: string
    inert?: string
    enableFixBackface?: boolean
    enableHistory?: boolean
  }) {
    // Drawer body
    if (typeof args !== 'object' || args.drawer === undefined) throw new Error(`${this.constructor.name}: The "drawer" parameter is required. => ex: new Drawer({ drawer: '#drawer' })`)
    if (typeof args.drawer !== 'string' || '' ) throw new Error(`${this.constructor.name}: The "drawer" parameter must be "string" type and "CSS selector".`)
    if (args.drawer === '' ) throw new Error(`${this.constructor.name}: The "drawer" parameter is empty.`)
    this.drawerElement = document.querySelector(args.drawer)
    if (!this.drawerElement) throw new Error(`${this.constructor.name}: The Element for "drawer" is not found.`)
    this.drawerElement.setAttribute('aria-expanded', String(this.isExpanded))
    this.isExpanded ? this.drawerElement.removeAttribute('inert') : this.drawerElement.setAttribute('inert', '')

    // Switches for toggle
    this.switchElements = typeof args.switch === 'string' ?
      document.querySelectorAll(args.switch) : null
    if (this.switchElements) {
      this.switchElements.forEach(element => {
        element.addEventListener('click', this.toggle.bind(this))
      })
    }

    // Elements that are set "inert" attribute when the drawer is expanded
    this.inertElements = typeof args.inert === 'string' ?
      document.querySelectorAll(args.inert) : null
    if (this.inertElements) {
      this.inertElements.forEach(element => {
        if (this.isExpanded) {
          element.setAttribute('inert', '')
        } else {
          element.removeAttribute('inert')
        }
      })
    }

    // Preventing scroll when the drawer is expanded
    this.enableFixBackface = args.enableFixBackface ?? true

    // Adding the state of the drawer to the history of your browser
    if (args.enableHistory) {
      this.enableHistory = true
      window.addEventListener('popstate', this._popstateHandler.bind(this))
    }
  }
  toggle(event: Event) {
    event.preventDefault()
    if (this.isExpanded) {
      this.close()
    } else {
      this.open()
    }
  }
  open() {
    this._changeState(true)
    if (this.enableHistory) this._pushState(true)
  }
  close() {
    this._changeState(false)
    if (this.enableHistory) this._pushState(false)
  }
  private _changeState(isExpanded: boolean) {
    if (isExpanded) {
      this.drawerElement?.removeAttribute('inert')
      document.addEventListener('keyup', this._keyupHandler.bind(this))
    } else {
      this.drawerElement?.setAttribute('inert', '')
      document.removeEventListener('keyup', this._keyupHandler.bind(this))
    }
    if (this.inertElements) {
      this.inertElements.forEach(element => {
        if (isExpanded) {
          element.setAttribute('inert', '')
        } else {
          element.removeAttribute('inert')
        }
      })
    }
    if ( typeof fixBackface === 'function' && this.enableFixBackface ) fixBackface(isExpanded)
    this.drawerElement?.setAttribute('aria-expanded', String(isExpanded))
    this.isExpanded = isExpanded
  }
  private _keyupHandler(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Esc') this.close()
  }
  private _popstateHandler(event: PopStateEvent) {
    this._changeState(!this.isExpanded);
  }
  private _pushState(isExpanded: boolean) {
    history.pushState({
      isExpanded: isExpanded
    }, 'drawerState')
  }
}