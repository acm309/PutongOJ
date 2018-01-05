// TODO
async function getSolution () {}

async function getContest (cid) {}

async function main () {}

// 这个是从数据库拿到的
const example = {
  // contest.ranklist
  ranklist: {
    admin: {
      uid: 'admin',
      2000: {
        wa: 1, // Accepted, but get one wrong answer
        created: 1514762681120
      },
      2001: {
        wa: 0, // Accepted, and get no wrong answer before
        created: 1514762681120
      }
    },
    emerald: {
      uid: 'emerald',
      2000: {
        wa: 0,
        created: 1514762681100
      }, // NOTE: this user does not submit solutions for 2001
      2002: {
        wa: -3, // not Accepted and get three wrong answer
        created: 1514762681120
      }
    }
  }
}

// 这个是返回给前端的
// 这里多了一个 nick 字段
// nick 可能在比赛过程汇中更改
// 所以仅仅在每次请求 ranklist 时才添加 nick 字段
//
// 前端拿到后，比如 state.ranklist = request.data.ranklist
// 需要马上对其加工, 加工的方法参考 normailize
const returned = {
  ranklist: {
    admin: {
      // key is the uid
      uid: 'admin',
      nick: '<><><>', // append a Field called 'nick'
      2000: {
        wa: 1, // Accepted, but get one wrong answer
        created: 1514762681120
      },
      2001: {
        wa: 0, // Accepted, and get no wrong answer before
        created: 1514762681120
      }
    },
    emerald: {
      uid: 'emerald',
      nick: 'Emerald',
      2000: {
        wa: 0,
        created: 1514762681100
      }, // NOTE: this user does not submit solutions for 2001
      2002: {
        wa: -3, // not Accepted and get three wrong answer
        created: 1514762681120
      }
    }
  }
}

function normailize (ranklist, contest) {
  const list = Object.values(ranklist).map(row => {
    // 每一行，也就是每一个用户的成绩
    let solved = 0 // 记录 ac 几道题
    let penalty = 0 // 罚时，尽在 ac 时计算
    for (const pid of contest.list) {
      if (row[pid] == null) continue // 这道题没有交过
      const submission = row[pid]
      if (submission.wa >= 0) {
        // ac 了
        solved++
        penalty +=
          submission.created - contest.start + submission.wa * 20 * 60 * 1000
      }
    }
    row.solved = solved
    row.penalty = penalty
    return row
  })

  // 排序, 先按照 solved, 在按照 penalty
  list.sort((x, y) => {
    if (x.solved !== y.solved) {
      return -(x.solved - y.solved)
    }
    return x.penalty - y.penalty
  })

  // 接下来计算 primes
  const quickest = {} // 每到题最早提交的 ac 时间
  for (const pid of contest.list) {
    quickest[pid] = Infinity // init
  }
  list.forEach(row => {
    for (const pid of contest.list) {
      if (row[pid] == null || row[pid].wa < 0) continue
      quickest[pid] = Math.min(quickest[pid], row[pid].created)
    }
  })
  list.forEach(row => {
    for (const pid of contest.list) {
      if (row[pid] == null || row[pid].wa < 0) continue
      if (quickest[pid] === row[pid].created) {
        // 这就是最早提交的那个
        row[pid].prime = true // 打上标记
      }
    }
  })
  return list
}

// 从 state 里拿出来的，比如 state.contest.getters.ranklist
// 可以看出，从 state 里拿出来的是直接可以用的，已经排好序的
const ranklist = [
  {
    uid: 'amdin',
    nick: '<><><>',
    solved: 2,
    penalty: 100, // 这数字编的
    2000: {
      wa: 1,
      created: 1514762681120
    },
    2001: {
      wa: 0,
      created: 1514762681120,
      prime: true
    }
  },
  {
    emerald: {
      uid: 'emerald',
      nick: 'Emerald',
      solved: 1,
      penalty: 80,
      2000: {
        wa: 0,
        created: 1514762681100,
        prime: true
      },
      2002: {
        wa: -3,
        created: 1514762681120
      }
    }
  }
]

console.log(JSON.stringify(example, null, '  '))
console.log(JSON.stringify(returned, null, '  '))
