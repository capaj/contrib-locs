import { readFile } from 'fs/promises'
import JSON5 from 'json5'

export const getConfig = async () => {
  let config = { match: ['*'] }

  try {
    const dotFile = await readFile('./.contrib-locs', 'utf8')
    config = JSON5.parse(dotFile)
  } catch (err) {
    return config
  }

  return config
}
