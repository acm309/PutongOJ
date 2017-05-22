async function loginRequired (ctx, next) {
  if (!ctx.session.user) {
    ctx.throw(400, 'Please Login first')
  }
  await next()
}

async function adminRequired (ctx, next) {
  if (ctx.session.user.privilege !== ctx.config.privilege.Admin) {
    ctx.throw(400, 'Only admins are allowed to do this')
  }
  await next()
}

function idNumberRequired (item) {
  return async function (ctx, next) {
    if (isNaN(+ctx.params[item])) {
      ctx.throw(400, `${item} should be a number`)
    }
    await next()
  }
}

async function browserSupport (ctx, next) {
  const browserDetect = function (ua) {
    var Sys = {}
    ua = ua.toLowerCase()
    var s
    (s = ua.match(/rv:([\d.]+)\) like gecko/)) ? Sys.ie = +s[1].split('.')[0]
    : (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = +s[1].split('.')[0]
    : (s = ua.match(/firefox\/([\d.]+)/)) ? Sys.firefox = +s[1].split('.')[0]
    : (s = ua.match(/chrome\/([\d.]+)/)) ? Sys.chrome = +s[1].split('.')[0]
    : (s = ua.match(/opera.([\d.]+)/)) ? Sys.opera = +s[1].split('.')[0]
    : (s = ua.match(/version\/([\d.]+).*safari/)) ? Sys.safari = +s[1].split('.')[0]
    : 0
    return Sys
  }

  const sys = browserDetect(ctx.request.header['user-agent'])
  const recommendation = `
      <h2>你可以使用其它现代浏览器访问本网站，比如最新版的 <a href="http://www.firefox.com.cn/download/">Firefox</a></h2>
    `
  if (sys.ie) {
    ctx.body = `
      <h1>IE 已被微软淘汰，请转跳其它阵营</h1>
    ` + recommendation
    return
  } else if (sys.chrome && sys.chrome < 50) {
    ctx.body = `
      <h1>你的 Chrome 版本过低，（至少 Chrome 50）</h1>
    ` + recommendation
    return
  } else if (sys.firefox && sys.firefox < 43) {
    ctx.body = `
      <h1>你的 Firefox 版本过低，（至少 Firefox 43</h1>
    ` + recommendation
    return
  }
  await next()
}

module.exports = {
  loginRequired,
  adminRequired,
  idNumberRequired,
  browserSupport
}
