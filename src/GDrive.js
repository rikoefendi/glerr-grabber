const request = require('request')
const cherio = require('cherio')
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
const host = 'drive.google.com'
let baseUri = `https://${host}`
const path = require('path')
const headers = {
    Accept: '*/*',
    Connection: 'close',
    host,
    'User-Agent': userAgent
}
const Drive = class GDrive {
    constructor(id) {
        let uri = `${baseUri}/uc?id=${id}`
        this.opt = {
            method: "GET",
            uri,
            headers,
            followAllRedirects: false
        }
        this.$uri = uri
        return this.getLinkDownload()
    }
    getConfirmLinkDownload(body) {
        const $ = cherio.load(body)
        return baseUri + $('#uc-download-link').attr('href')

    }
    async getLinkDownload() {
        return new Promise(async (resolve, reject) => {
            try {
                const req = request(this.opt)
                    .on('response', response => {
                        const { headers } = response
                        const requestRedirect = response.request
                        if (headers['content-disposition']) {
                            
                            resolve(requestRedirect.uri.href)
                            req.abort()
                        } else {
                            const cookie = headers['set-cookie'].toString() || ''
                            let chunk;
                            req.on('data', data => {
                                chunk += data.toString()
                            })
                            req.on('end', () => {
                                const uri = this.getConfirmLinkDownload(chunk)
                                headers.Cookie = cookie
                                const ops = Object.assign({}, this.opt, {uri}, {headers})
                                const reqs = request(ops)
                                    reqs.on('response', ({request}) => {
                                        resolve(request.uri.href)
                                        reqs.abort()
                                    })
                                    reqs.on('error', e => reject(e))
                            })
                            req.on('error', e => reject(e))
                        }
                    })
            } catch (e) {
                reject(e)
            }
        })

    }
}
const GDrive = function (uri) {
    return new Drive(uri)
}
module.exports = GDrive
