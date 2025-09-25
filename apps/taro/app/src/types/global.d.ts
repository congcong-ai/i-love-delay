declare const process: {
  env: {
    NODE_ENV?: 'development' | 'production' | 'none'
    [key: string]: string | undefined
  }
}
