const ws = require('ws');
const cp = require('node:child_process')

const server = new ws.Server(
    {
        host: 'localhost',
        port: 4242
    },
).on(
    'connection',
    ( sock, req ) => {
        /** @type {cp.ChildProcess} */
        let proc;
        let width,height,frames;
        sock.on('message',(dat,bin)=>{
            if (bin) {
                if (dat.slice(0,4).toString('utf-8') == 'INIT') {
                    width  = dat.readUint32BE(4);
                    height = dat.readUint32BE(8);
                    frames = dat.readUint32BE(12);
                    proc = cp.spawn('ffmpeg',[
                        '-framerate', '60',
                        '-threads', '12',
                        '-s', `${width}x${height}`,
                        '-f', 'rawvideo',
                        '-pix_fmt', 'rgba',
                        '-i', '-',
                        '-video_size', `${width}x${height}`,
                        ...process.argv.slice(2),
                        `${Date.now().toString(36)}.mp4`
                    ],{
                        stdio: 'pipe'
                    });
                    // proc.stderr.on('data',m=>console.log(m.toString('utf-8')));
                }
                else if (dat.slice(0,4).toString('utf-8') == 'DATA') {
                    proc.stdin.write(dat.slice(4));
                }
                else if (dat.slice(0,4).toString('utf-8') == 'END\0') {
                    proc.stdin.end();
                }
            }
        });
        sock.on('error',console.error);
    }
).on(
    'error',
    console.error
).on(
    'listening',
    () => console.log('ready !')
);