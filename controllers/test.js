const ranklist = {
  '123456': { '2770': { wa: -1 }, uid: '123456', nick: '123456' },
  admin:
  { '2770': { wa: 0, create: 1517032498609 },
    '2771': { wa: 0, create: 1517035314962 },
    '2772': { wa: 0, create: 1517038483753 },
    '2773': { wa: -2 },
    '2774': { wa: -1 },
    '2775': { wa: 0, create: 1517044040139 },
    uid: 'admin',
    nick: '( ･_･)*――――――――――――' },
  test309: { '2770': { wa: -1 }, uid: 'test309', nick: '作为测试' }
}

Object.entries(ranklist).map(([uid, problems]) => {
  // const uid = item[0]
  // const problems = item[1]
  Object.entries(problems).map(([pid, sub]) => {
    // const pid = value[0]
    // const sub = value[1]
    if (sub.wa < 0) {
      console.log(pid + ': ' + sub.wa)
      console.log(ranklist[uid][pid])
    }
  })
  // for (const pid of ctx.state.contest.list) {
  //   if (value[pid] == null) continue // 这道题没有交过
  //   const submission = value[pid]
  //   if (submission.wa < 0) { // 没有ac
  //     res[key][pid].wa = submission.wa
  //   }
  // }
})
