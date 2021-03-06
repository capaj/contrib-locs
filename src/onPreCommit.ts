import NodeGit from 'nodegit'
import { LocsStatsPerUser, repoStatsFileName } from './LocsStats'
import execa from 'execa'

import micromatch from 'micromatch'
import { getConfig } from './getConfig'

export const runGit = (
  directory: string,
  args: readonly string[] | undefined
) =>
  execa.sync('git', args, {
    cwd: directory
  })

const stageFile = (directory: string, file: string) => {
  runGit(directory, ['add', file])
}

const getStagedPatches = async (path: string) => {
  const repo = await NodeGit.Repository.open(path)

  const head = await repo.getHeadCommit()
  if (!head) {
    return []
  }
  const diff = await NodeGit.Diff.treeToIndex(repo, await head.getTree())

  const patches = await diff.patches()

  return patches
}

export const onPreCommit = async ({ path: gitPath }: { path: string }) => {
  const [patches, config] = await Promise.all([
    getStagedPatches(gitPath),
    getConfig()
  ])

  const statInstance = new LocsStatsPerUser(true)
  const currentUser = runGit(process.cwd(), ['config', 'user.email'])

  const filePaths = patches.map((patch) => {
    return patch.newFile().path()
  })

  const matchedFilePaths = micromatch(filePaths, config.match)

  patches
    .filter((patch) => {
      return matchedFilePaths.includes(patch.newFile().path())
    })
    .forEach((patch) => {
      statInstance.addLineStat(currentUser.stdout, patch.lineStats())
    })

  statInstance.saveAsFile()
  stageFile('.', repoStatsFileName)
}
