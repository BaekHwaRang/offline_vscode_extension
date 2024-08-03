/**
 * @author 백화랑
 * vscode extension vsix 다운로드(오프라인 내부망 환경 vsix 옮기기용)
 * 마켓 플레이스에서 주섬주섬 담기 귀찮아서 만듬
 */

const {default: axios} = require("axios")
const archiver = require("archiver");

const fs = require("fs")
const { exec } = require('node:child_process');
const path = require("node:path")

exec('code --list-extensions --show-versions', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }

    if(stderr){
        console.error(stderr);
        return;
    }

    const job = [];
    stdout.split("\n").slice(0, -1).forEach((ext) => {
        const [identifier, version] = ext.split("@");
        const [publisher, name] = identifier.split(".");
        const url = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${name}/${version}/vspackage`
        
        const result = fileDownload(url);
        result.then(({fileName}) => {
            console.log("identifier", identifier)
            console.log("fileName", fileName)
            console.log("==========================")
        })
        job.push(result);
    });

    Promise.all(job)
    .then((result) => {
        const archive = archiver('zip', {
            zlib: { level: 9 } // 압축 수준: 0-9 (0은 압축 없음, 9는 최대 압축)
        });

        const output = fs.createWriteStream(path.join(__dirname, 'output.zip'));
        archive.pipe(output);

        result.forEach(({fileName, data}) => {
            archive.append(data, {name: fileName});
        })

        output.on('close', () => {
            console.log(`ZIP 파일이 ${archive.pointer()} 바이트로 생성되었습니다.`);
          });
          
        archive.on('error', (err) => {
            console.error(err);
            throw err;
        });

        archive.finalize();
    })
});

/**
 * 마켓 플레이스에 등록된 ㄷ
 * @param {string} url 마켓플레이스 다운로드 경로
 * @returns 
 */
const fileDownload = (url) => {
    return axios.get(url, {
        responseType: "stream"
    })
    .then((response) => {
        const {data, headers} = response;
        const fileName = headers["content-disposition"].replace(/(.*filename=)(.*)(;.*)/, "$2")
        
        return {fileName, data}
    })
    .catch((error) => {
        console.error(error)
    })
}