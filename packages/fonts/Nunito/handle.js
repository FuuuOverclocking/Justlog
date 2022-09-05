const https = require('https');
const path = require('path-nice');

const thisDir = path(__dirname);

let css = thisDir.join('Nunito.css').readFileToStringSync();
const URLs = [];

css = css.replace(/(https?.+\.woff2)/g, (match) => {
    URLs.push(match);
    match = match.split('/').pop();
    return `/assets/fonts/nunito/${match}`;
});

function dl(URL) {
    const file = thisDir.join('nunito/' + URL.split('/').pop());
    const ws = file.createWriteStream();
    const request = https.get(URL, (response) => {
        response.pipe(ws);

        ws.on('finish', () => {
            ws.close();
        });
    });
}

URLs.forEach(URL => dl(URL));
thisDir.join('Nunito.local.css').writeFileSync(css);
