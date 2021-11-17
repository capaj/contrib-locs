import { readFile } from 'fs/promises'
import JSON5 from 'json5'

interface IConfig {
  matchFiles: string[]
  matchUsers: string[]
}

export const defaultConfig: IConfig = {
  matchFiles: ['*'],
  matchUsers: ['*', '!*[bot]@users.noreply.github.com'] // filters out github bots
}

export const getConfig: () => Promise<IConfig> = async () => {
  try {
    const dotFile = await readFile('./.contrib-locs', 'utf8')
    const parsedConfig = JSON5.parse(dotFile)
    return {
      ...defaultConfig,
      ...parsedConfig
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return defaultConfig
    }
    throw err
  }
}
