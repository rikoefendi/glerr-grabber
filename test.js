const {GDrive} = require('./')
//https://drive.google.com/open?id=1bkKaQrRb1jSa4HlSS8DsQ3CLGHPmvpWm
    GDrive('1bkKaQrRb1jSa4HlSS8DsQ3CLGHPmvpWm')
    .then(url => {
        console.log(url);
    })
    .catch(e => {
        console.log(e);
    })