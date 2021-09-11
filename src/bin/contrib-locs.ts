#!/usr/bin/env node

import git, { Commit } from 'nodegit'
import path from 'path'
import micromatch from 'micromatch'
import debug from 'debug'
import Yargs from 'yargs'
import { LocsStatsPerUser, repoStatsFileName } from '../LocsStats'
import { onPreCommit } from '../onPreCommit'
import { getConfig } from '../getConfig'
import execa from 'execa'

const log = debug('contrib-locs')

const initializeInRepo = async (gitPath: string) => {
  const statInstance = new LocsStatsPerUser(false)
  const config = await getConfig()
  const defaultBranchName = execa.sync('git', [
    'symbolic-ref',
    '--short',
    'HEAD'
  ]).stdout

  const repo = await git.Repository.open(path.resolve(__dirname, gitPath))
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

Yargs.scriptName('contrib-locs')
  .command(
    ['init', 'i'],
    'initialize a contributors ledger in this repo',
    {
      path: {
        alias: 'p',
        default: `${process.cwd()}/.git`
      }
    },
    async ({ path: gitPath }) => {
      const statInstance = await initializeInRepo(gitPath)
      log(statInstance.output)
      statInstance.saveAsFile()
      console.log(`Saved in ${repoStatsFileName}`)
    }
  )

  .demandCommand(1)
  .command(
    ['preCommit', 'c'],
    'update contributors ledger and stage it for commit',
    {
      path: {
        alias: 'p',
        default: `${process.cwd}/.git`
      }
    },
    onPreCommit
  )
  .fail(function (msg, err) {
    if (err) {
      throw err
    }
    console.error(msg)
    process.exit(1)
  })
  .help()
  .parse()
