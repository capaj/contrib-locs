import git, { Commit } from 'nodegit'
import path from 'path'
import micromatch from 'micromatch'
import { LocsStatsPerUser } from './LocsStats'
import { getConfig } from './getConfig'
import execa from 'execa'
import debug from 'debug'

const log = debug('contrib-locs')

export const initializeInRepo = async (repoRootPath: string) => {
  const statInstance = new LocsStatsPerUser(false)
  const config = await getConfig()

  const defaultBranchName = execa.sync(
    'git',
    ['symbolic-ref', '--short', 'HEAD'],
    { cwd: path.resolve(repoRootPath) }
  ).stdout
  log('using default branch', defaultBranchName)

  const repo = await git.Repository.open(
    path.resolve(path.join(repoRootPath, '.git'))
  )
  const firstCommitOnMaster = await repo.getBranchCommit(defaultBranchName)
  const revwalk = git.Revwalk.create(repo)
  revwalk.reset()
  revwalk.sorting(git.Revwalk.SORT.TIME, git.Revwalk.SORT.REVERSE)
  revwalk.push(firstCommitOnMaster.id())

  // step through all OIDs for the given reference
  const allOids = []
  let hasNext = true
  let commit: Commit | undefined
  while (hasNext) {
    try {
      const oid = await revwalk.next()
      log(`commit: ${oid.tostrS()}`)
      commit = await repo.getCommit(oid)
      const authorEmail = commit.author().email()

      const diff = await commit.getDiff()
      await Promise.all(
        diff.map(async (d) => {
          const patches = await d.patches()

          await Promise.all(
            patches.map(async (patch) => {
              const path = patch.newFile().path()
              if (micromatch.isMatch(path, config.match)) {
                log(`adding a diff for ${path}: `, patch.lineStats())
                statInstance.addLineStat(authorEmail, patch.lineStats())
              }
            })
          )
        })
      )

      allOids.push(oid)
    } catch (err) {
      hasNext = false
      if (!commit) {
        throw err
      } else {
        statInstance.setLastCommit(commit)
      }
    }
  }
  statInstance.countPercentages()
  return statInstance
}
