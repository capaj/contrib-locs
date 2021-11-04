import NodeGit from 'nodegit'
import { LocsStatsPerUser, repoStatsFileName } from './LocsStats'
import execa from 'execa'
import path from 'path'

import micromatch from 'micromatch'
import { getConfig } from './getConfig'

export const execGit = (
  directory: string,
  args: readonly string[] | undefined
) =>
  execa.sync('git', args, {
    cwd: directory
  })

const stageFile = (directory: string, file: string) => {
  execGit(directory, ['add', file])
}

const getStagedPatches = async (repoRootPath: string) => {
  const repo = await NodeGit.Repository.open(
    path.resolve(path.join(repoRootPath, '.git'))
  )

  const head = await repo.getHeadCommit()
  if (!head) {
    return []
  }
  const diff = await NodeGit.Diff.treeToIndex(repo, await head.getTree())

  const patches = await diff.patches()

  return patches
}

export const onPreCommit = async ({ path: repoRootPath }: { path: string }) => {
  const [patches, config] = await Promise.all([
    getStagedPatches(repoRootPath),
    getConfig()
  ])

  const statInstance = new LocsStatsPerUser(true)
  const currentUser = execGit(process.cwd(), ['config', 'user.email']).stdout

  const filePaths = patches.map((patch) => {
    return patch.newFile().path()
  })

  const matchedFilePaths = micromatch(filePaths, config.match)
  const previousPercentageOfTotal =
    statInstance.output[currentUser].percentageOfTotal
  patches
    .filter((patch) => {
      return matchedFilePaths.includes(patch.newFile().path())
    })
    .forEach((patch) => {
      const lineStats = patch.lineStats()
      statInstance.addLineStat(currentUser, lineStats)
      console.log('contrib-locs added for you: ', {
        total_additions: lineStats.total_additions,
        total_deletions: lineStats.total_deletions
      })
    })

  statInstance.countPercentages()
  const newPercentage = statInstance.output[currentUser].percentageOfTotal

  if (previousPercentageOfTotal > newPercentage) {
    console.log(
      `your contribution increased from ${previousPercentageOfTotal} to ${newPercentage}`
    )
  }
  statInstance.saveAsFile()
  stageFile('.', repoStatsFileName)
}
