const request = require('request')
const extend = require('extend')
const crypto = require('crypto')
const fs = require('fs')
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
const host = 'drive.google.com'
let baseUri = `https://${host}`
const defHeaders = {
  Accept: '*/*',
  Connection: 'close',
  host,
  'User-Agent': userAgent,
  referer: baseUri
}

const Graber = function (id, headers, callback = null) {
  const params = initParams(id, headers, callback)
  this.id = params.id
  this.callback = params.callback
  delete params.id
  delete params.callback
  const opt = extend(this.defaultOpt, params)
  this.reloaded = 0
  return this.parseLink(opt)
}


Graber.prototype.defaultOpt = {
  method: "GET",
  headers: defHeaders,
  followRedirect: false,
  followAllRedirect: false,
}

Graber.prototype.cache = function (fileId, link = '') {
  const path = './tmp/drivecache/'
  let hash = crypto.createHash('md5').update(fileId).digest("hex")
  const expired = new Date().getTime() + 1000 * 60 * 25
  const toCache = expired + '~' + link

  if (!fs.existsSync(path)) fs.mkdirSync(path)
  if (!fs.existsSync(path + hash)) {
    if (link) {
      fs.writeFile(path + hash, toCache, (a, b) => {
        console.log('created');
      })
    }
    return null
  }
  const ready = fs.readFileSync(path + hash)
  if (ready) {
    const data = ready.toString()
    const datas = data.split('~')
    if (datas[0] > (new Date).getTime()) {
      return datas[1]
    } else {
      fs.unlink(path + hash, (a, b) => {
        console.log('deleted');
      })
    }
  }

}

Graber.prototype.parseLink = function (opt) {
  const cache = this.cache(this.id)
  if (cache) {
    return this.callback(false, cache)
  }
  if (this.reloaded > 3) {
    return this.callback(true, 'max excecution time')
  }
  this.reloaded += 1
  let redirect = ''
  request(opt, (err, res, body) => {
    if (err || res.statusCode >= 400 || body.toLowerCase().match(/domain administrator|quota exceeded|not found/)) {
      this.callback(true, body.toLowerCase().replace(/.*<title>|<\/title>[\s\S]*/gsm, '') || err)
      return
    }
    const confirm = escape(body).replace(/[\s\S]*confirm%3D|%26amp[\s\S]*/gsm, '')
    const { headers } = res
    Object.keys(headers).forEach(key => {
      if (key.toLowerCase() == 'set-cookie') {
        opt.headers.cookie = headers[key]
        opt.headers.referer = opt.uri
        opt.uri = `https://drive.google.com/uc?export=download&confirm=${confirm}&id=${this.id}`
      }
      if (key.toLowerCase() == 'location') {
        redirect = headers[key]
      }
    })
    if (!redirect) {
      return this.parseLink(opt)
    }
    this.cache(this.id, redirect)
    return this.callback(null, redirect)
  })
}

function initParams(id, headers, callback) {
  if (typeof headers === 'function') {
    callback = headers
  }
  headers = Object.assign({}, headers, defHeaders)
  var params = {}
  if (typeof headers === 'object') {
    extend(params, { headers, id })
  } else if (typeof id == 'string') {
    extend(params, { id })
  } else {
    extend(params, id)
  }
  params.uri = `${baseUri}/uc?id=${params.id}&export=download`
  params.callback = callback || params.callback
  return params
}

function GDrive(id, headers, callback) {
  return new Graber(id, headers, callback)
}
module.exports = GDrive

