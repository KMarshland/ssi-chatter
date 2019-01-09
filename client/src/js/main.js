import Erizo from './erizo';

const SERVER_URL = window.location.host === 'chatter.stanfordssi.org' ?
    'https://chatter.stanfordssi.org/' :
    'http://localhost:3001/';

const MEDIA_CONFIG = {
    audio: true,
    video: true,
    data: true,
    screen: false,
    videoSize: [640, 480, 640, 480],
    videoFrameRate: [10, 20]
};

export default function initialize() {
    fetch(SERVER_URL + 'getRooms')
        .then(response => response.json())
        .then((rooms) => {
            getToken(rooms[0])
        })
}

function getToken(room) {
    console.log('Fetching token for', room);

    const roomConfig = {
        username: 'user',
        role: 'presenter',
        room: room.name,
        type: 'erizo',
        mediaConfiguration: room.mediaConfiguration
    };

    fetch(SERVER_URL + 'createToken', {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(roomConfig)
    })
        .then((response) => response.text())
        .then((token) => {
            setUpRoom(token);
        });
}


function setUpRoom(token) {
    console.log('Setting up room with token', token);

    const room = Erizo.Room({ token });
    const localStream = Erizo.Stream(MEDIA_CONFIG);



    room.addEventListener('room-connected', (roomEvent) => {
        console.log('Room connected');

        const options = { metadata: { type: 'publisher' } };
        room.publish(localStream, options);

        subscribeToStreams({
            room,
            localStream,
            streams: roomEvent.streams
        });
    });

    room.addEventListener('stream-subscribed', (streamEvent) => {
        console.log('Stream subscribed');

        const stream = streamEvent.stream;
        const div = document.createElement('div');
        div.setAttribute('style', 'width: 320px; height: 240px;float:left;');
        div.setAttribute('id', `test${stream.getID()}`);

        document.getElementById('videoContainer').appendChild(div);
        stream.show(`test${stream.getID()}`);
    });

    room.addEventListener('stream-added', (streamEvent) => {
        console.log('Stream added');

        const streams = [];
        streams.push(streamEvent.stream);
        subscribeToStreams({
            room,
            localStream,
            streams
        });
    });

    room.addEventListener('stream-removed', (streamEvent) => {
        console.log('Stream removed');

        // Remove stream from DOM
        const stream = streamEvent.stream;
        if (stream.elementID !== undefined) {
            const element = document.getElementById(stream.elementID);
            document.getElementById('videoContainer').removeChild(element);
        }
    });

    room.addEventListener('stream-failed', () => {
        console.error('Stream failed');
    });

    window.room = room;

    const div = document.createElement('div');
    // div.setAttribute('style', 'width: 320px; height: 240px; float:left');
    // div.setAttribute('id', 'myVideo');
    document.getElementById('videoContainer').appendChild(div);

    localStream.addEventListener('access-accepted', () => {
        room.connect();
        // localStream.show('myVideo');
    });
    localStream.init();
}

function subscribeToStreams({room, localStream, streams}) {
    streams.forEach((stream) => {
        if (localStream.getID() !== stream.getID()) {
            window.stream = stream;
            window.testRecording = () => {
                room.startRecording(stream, (recordingID) => {
                    setTimeout(() => {
                        room.stopRecording(recordingID, (result, err) => {
                            console.log(result, err);

                            const stream2 = Erizo.Stream({
                                audio:true,
                                video:true,
                                recording: recordingID
                            });

                            room.publish(stream2);
                        });
                    }, 1000);
                });
            };

            room.subscribe(stream, { metadata: { type: 'subscriber' } });
            stream.addEventListener('bandwidth-alert', () => console.log('Bandwidth alert'));
        }
    });
}
