import { Commit } from 'nodegit'
import fs from 'fs'
import { execGit } from './onPreCommit'
import chalk from 'chalk'
// import debug from 'debug'

// const log = debug('contrib-locs')

export interface ILineStats {
  total_additions: number
  total_deletions: number
}
export interface ISingleUserStat extends ILineStats {
  email: string
  loc: number
  percentageOfTotal: number
}
export const repoStatsFileName = './contrib-locs.json'

export class LocsStatsPerUser {
  lastCommit: Commit | undefined
  totalCommits = 0

  setLastCommit(commit: Commit) {
    this.lastCommit = commit
  }
  usersMap: Record<string, ISingleUserStat>

  constructor(isPreCommit: boolean) {
    let parsed
    if (isPreCommit) {
      try {
        const previousOutput = fs.readFileSync(repoStatsFileName, 'utf8')
        parsed = JSON.parse(previousOutput)
      } catch (err) {
        console.warn(
          chalk.yellow(
            `seems like the "${repoStatsFileName}" file does not exist, please run 'contrib-locs first'`
          )
        ) // TODO ask user if we should run the whole init
        throw err
      }
    }

    const initial: Record<string, ISingleUserStat> = {}
    if (parsed && parsed.contributors) {
      parsed.contributors.forEach((contributor: ISingleUserStat) => {
        initial[contributor.email] = contributor
      })
      this.totalCommits = parsed.totalCommits
    }
    this.usersMap = initial
  }

  // async addHunk(email: string, hunk: ConvenientHunk) {
  //   if (!this.output[email]) {
  //     this.output[email] = {
  //       email: email,
  //       loc: hunk.newLines(),
  //       percentageOfTotal: 0,
  //     }
  //   } else {
  //     this.output[email].loc += hunk.newLines()
  //   }
  //   log('added line/s', hunk.newLines())
  // }
  async addLineStat(email: string, lineStats: ILineStats) {
    if (!this.usersMap[email]) {
      this.usersMap[email] = {
        email: email,
        loc: lineStats.total_additions + lineStats.total_deletions,
        total_additions: lineStats.total_additions,
        total_deletions: lineStats.total_deletions,
        percentageOfTotal: 0
      }
    } else {
      this.usersMap[email].total_additions += lineStats.total_additions
      this.usersMap[email].total_deletions += lineStats.total_deletions
      this.usersMap[email].loc +=
        lineStats.total_additions + lineStats.total_deletions
    }
  }

  countPercentages() {
    const totalLinesAddedOrRemoved = this.getTotalLinesAddedOrRemoved()

    Object.values(this.usersMap).forEach((singleUserStat) => {
      const linesChangedByUser =
        singleUserStat.total_additions + singleUserStat.total_deletions
      singleUserStat.loc = linesChangedByUser
      singleUserStat.percentageOfTotal =
        (linesChangedByUser / totalLinesAddedOrRemoved) * 100
    })
  }

  getTotalLinesAddedOrRemoved() {
    return Object.values(this.usersMap).reduce((sum, contributorStat) => {
      return (
        sum + contributorStat.total_additions + contributorStat.total_deletions
      )
    }, 0)
  }

  saveAsFile() {
    const execaResult = execGit(process.cwd(), ['rev-parse', 'HEAD'])

    const data = {
      lastCommit: execaResult.stdout.substr(0, 7),
      updatedAt: new Date().toISOString(),
      totalCommits: this.totalCommits,
      totalLinesAddedOrRemoved: this.getTotalLinesAddedOrRemoved(),
      contributors: Object.values(this.usersMap).sort((a, b) => {
        return b.loc - a.loc
      })
    }
    return fs.writeFileSync(repoStatsFileName, JSON.stringify(data, null, 4))
  }
}
