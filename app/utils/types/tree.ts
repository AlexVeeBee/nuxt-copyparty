
export interface TreeItem {
  id?: string
  name: string
  path?: string
  kind: 'file' | 'directory'
  children?: TreeItem[]
}
