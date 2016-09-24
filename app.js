const ScreepsAPI = require('screeps-api')
const WebSocket = require('ws')
const request = require('request')
const config = require('./config')
const package = require('./package')
checkVersion()

let api = new ScreepsAPI()
api.auth(config.screeps.username,config.screeps.password,(res)=>{
  console.log(res,'Authenticated')
  tick()
  setInterval(tick,15000)
})

function getStats(){
  console.log('Getting stats')
  return new Promise((resolve,reject)=>{
    api.req('GET','/api/user/memory?path=stats',null,(err,data)=>{
      if(err || data.body.error) reject(err || data.body.error)
      else resolve(data.body.data)
    })
  }).then((data)=>{
    if(!data){
      console.log('No stats found, is Memory.stats defined?')
      return null
    }
    console.log(data)
    if(data.slice(0,3) == 'gz:'){
      data = JSON.parse(require('zlib').gunzipSync(new Buffer(data.slice(3),'base64')).toString())
    }
    return data
  })
}

function tick(){
  Promise.resolve()
    .then(getStats)
    .then(pushStats)
    .catch(err=>console.error(err))
}

function pushStats(stats){
  if(!stats) return
  console.log('Pushing stats',stats)
  let sconfig = config.service
  request({
    method: 'POST',
    url: sconfig.url + '/api/stats/submit',
    auth: {
      user: 'token',
      pass: sconfig.token
    },
    json: true,
    body: stats
  },(err,res,data)=>{
    console.log('Send Stats',data)
    if(err) console.error(err)
  })
}

function checkVersion(){
  let sconfig = config.service
  request({
    url: sconfig.url + '/version?agent=node',
    method: 'GET'
  },(err,resp,data)=>{
    if(package.version != data){
      console.warn('Newer Version Available:',data)
    }
  })
}
