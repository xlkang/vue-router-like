// console.dir(Vue)
let _Vue = null
export default class VueRouter {
  static install (Vue, opts) {
    console.log('install')
    // 1 判断当前插件是否被安装
    if (VueRouter.install.installed) {
      return
    }
    VueRouter.install.installed = true
    // 2 把Vue的构造函数记录在全局
    _Vue = Vue
    // 3 把创建Vue的实例传入的router对象注入到Vue实例
    // 很重要
    // _Vue.prototype.$router = this.$options.router
    // 混入
    _Vue.mixin({
      beforeCreate () {
        // 只执行一次
        if (this.$options.router) {
          _Vue.prototype.$router = this.$options.router
          // 调用实例方法
          this.$options.router.init()
        }
      }
    })
  }

  constructor (options) {
    // 初始化
    this.options = options
    this.routeMap = {}
    // observable
    // 创建响应式的对象
    this.data = _Vue.observable({
      current: '/'
    })
    // this.init()
  }

  init () {
    this.createRouteMap()
    this.initComponent(_Vue)
    this.initEvent()
  }

  // 遍历所有的路由规则routes，将routes转换成键值对存储到routeMap，其实最好叫initRouteMap
  createRouteMap () {
    this.options.routes.forEach(route => {
      this.routeMap[route.path] = route.component
    })
  }

  initComponent (Vue) {
    Vue.component('router-link', {
      props: {
        to: String
      },
      // template: '<a :href="to"><slot></slot></a>'
      // 使用运行时版本Vue，直接使用render函数
      // h -> 创建虚拟dom
      render (h) {
        return h('a', {
          // 注册属性
          attrs: {
            href: this.to
          },
          // 注册事件
          on: {
            click: this.clickhander
          }
        }, [this.$slots.default])
      },
      methods: {
        clickhander (e) {
          // this.$router 相当于 this.prototype.$router
          // 参考install方法 注释3.
          const mode = this.$router.options.mode
          // 根据mode，采用不同的修改url方式
          if (mode === 'hashHistory') {
            location.hash = this.to
          } else {
            history.pushState({}, '', this.to)
          }
          // 记录到current中去响应加载组件
          this.$router.data.current = this.to

          e.preventDefault()
        }
      }
    })
    const self = this // vue 实例
    Vue.component('router-view', {
      render (h) {
        // 这里使用了响应式属性current
        // self.data.current
        // 找到当前路由地址，然后在routeMap中找到组件
        const component = self.routeMap[self.data.current] || self.routeMap['*']
        return h(component)
      }
    })
  }

  initEvent () {
    //
    const mode = this.options.mode
    if (mode === 'hashHistory') {
      // 监听hashchange事件
      // 截取url hash值后面的路由
      // 修改current响应式加载组件
      window.addEventListener('hashchange', () => {
        this.data.current = window.location.hash.replace(/#/, '')
      })
    } else {
      window.addEventListener('popstate', () => {
        this.data.current = window.location.pathname
      })
    }
  }
}
