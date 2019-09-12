const Http = require('http-scraper')
const request = require('request')
const cherio = require('cherio')
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
const host = 'drive.google.com'
let baseUri = `https://${host}`
const path = require('path')
const options = {
    type: 'test',
    Accept: '*/*',
    Connection: 'close',
    host,
    uri: 'https://drive.google.com',
    'User-Agent': userAgent,
    capture: true,
    capturePath: path.resolve(__dirname, '')

}
const Drive = class GDrive {
    constructor(id) {
        let uri = `${baseUri}/uc?id=${id}`
        this.opt = Object.assign({}, options, { uri })
        this.$uri = uri
        this.http = Http(this.opt)
    }
    getConfirmLinkDownload() {
        const opt = {
            url: this.$uri,
        }
        return this.http.get(opt)
            .get('body')
            .then(body => {
                const $ = cherio.load(body)
                return baseUri + $('#uc-download-link').attr('href')
            })

    }
    async getLinkDownload() {
        return new Promise(async (resolve, reject) => {
            try {
                const url = await this.getConfirmLinkDownload()
                const cookie = this.http.getCookies()[0].toString() || null;
                const headers = {
                    'User-Agent': userAgent,
                    Cookie: cookie,
                    'Accept': '*/*',
                    Connection: 'close'
                }

                const req = request({
                    method: 'GET',
                    url,
                    headers,
                    followAllRedirects: true
                })
                req.on('response', ({ request }) => {
                    let cbUri = request.uri.href
                    req.abort()
                    resolve(cbUri)
                })
                .on('error', e => {
                    reject(e)
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