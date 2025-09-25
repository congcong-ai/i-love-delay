const path = require('path')

const config = {
  projectName: 'i-love-delay-taro',
  date: '2025-09-24',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    // 关闭 H5 开发时的预编译（通过 external script 的模块联邦 remote），
    // 避免在不支持 async/await 的环境下导致运行时错误和白屏
    prebundle: {
      enable: false
    }
  },
  cache: {
    enable: true
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 10240 // 设定转换尺寸上限
        }
      },
      cssModules: {
        enable: false
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    esnextModules: [],
    template: path.resolve(__dirname, '..', 'src', 'index.html'),
    router: {
      mode: 'hash',
      customRoutes: {
        '/pages/index/index': '/'
      }
    },
    devServer: {
      host: '0.0.0.0',
      port: 10086,
      historyApiFallback: true
    },
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false
      }
    }
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
