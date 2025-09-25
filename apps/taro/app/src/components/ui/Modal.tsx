import { View, Text } from '@tarojs/components'

interface ModalProps {
  open: boolean
  title?: string
  onClose: () => void
  children?: any
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null as any
  return (
    <View className="fixed inset-0 z-[1000]">
      <View className="absolute inset-0 bg-black/40" onClick={onClose} />
      <View className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-screen-md">
        <View className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">{title || ''}</Text>
            <Text className="text-sm text-gray-500" onClick={onClose}>关闭</Text>
          </View>
          <View className="max-h-[70vh] overflow-y-auto p-4">
            {children}
          </View>
        </View>
      </View>
    </View>
  )
}
