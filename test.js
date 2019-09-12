const {GDrive} = require('./')
let i = 0;
function loop(){
    GDrive(urlshare).getLinkDownload().then(url => {
    
        console.log(url);
        console.log(i);
        i+=1
        if(i < 1000){

            loop()
        }
    }).catch(e => {
        console.log(e);
        console.log(i);
        i+=1
        if(i < 1000){

            loop()
        }
    })
}

loop()