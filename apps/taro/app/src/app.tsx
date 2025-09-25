import { PropsWithChildren } from 'react'
// 注册 Taro H5 自定义元素（side-effect 引入）
import '@tarojs/components'
// H5 需要引入 Taro 组件样式，否则自定义元素（taro-view-core 等）可能不可见
import '@tarojs/components/dist/taro-components/taro-components.css'
// 补充 TabBar 样式，确保底部导航在 H5 可见
import '@tarojs/components/dist/collection/components/tabbar/style/index.css'
import './styles/tailwind.css'

function App(props: PropsWithChildren<any>) {
  return (
    <>
      {/* 调试浮层（仅开发环境显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{position:'fixed',left:4,top:4,zIndex:9999,fontSize:10,background:'#22c55e',color:'#fff',padding:'2px 6px',borderRadius:4,opacity:0.85}}>Taro H5 Running</div>
      )}
      {props.children as any}
    </>
  )
}

export default App
