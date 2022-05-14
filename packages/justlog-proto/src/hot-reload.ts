interface WSMessage {
    channel: string;
    message: any;
}

export function startListening() {
    const ws = new WebSocket('ws://localhost/');
    ws.onopen = function () {
        console.log('connected');
    };
    ws.onmessage = function (e) {
        const msg = JSON.parse(e.data) as WSMessage;
        if (msg.channel === 'blog-bundle' && msg.message === 'updated') {
            window.location.reload();
        }
    };
}
