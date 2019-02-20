
var App = function(){
    this.init();
}
App.prototype = {
    URL: {
        key: '<key url>'
    },
    appId: '',
    channelKey: null,
    channelId: '',
    userId: 0,
    isHost: false,
    client: null,
    localStream: null,
    audioList: [],
    videoList: [],
    $statusWrap: $('[agora-status-check-wrap]'),
    $audioWrap : $('select[select-audio-source]'),
    $videoWrap: $('select[select-video-source]'),    
    appendCheckStatus(word, status = 1){

        let statusClassName = 'alert-success';
        let statusIconClassName = 'glyphicon-ok'
        if(status == 1) {
            statusClassName = 'alert-success';
            statusIconClassName = 'glyphicon-ok-sign'
        } else if(status == 2) {
            statusClassName = 'alert-warning';
            statusIconClassName = 'glyphicon-exclamation-sign'
        } else if(status == 3) {
            statusClassName = 'alert-danger';
            statusIconClassName = 'glyphicon-remove-sign'
        }

        let html = `
        <div class="alert ${statusClassName} inline-alert" role="alert">
            <span class="glyphicon ${statusIconClassName}" aria-hidden="true"></span>
            <span> ${word}</span>
        </div>`;
        this.$statusWrap.append(html);
        
    },
   
    init (){

        let app_id = $('input[input-app-id]').val();

        this.appId = app_id ? app_id.toString() : "";
        this.client = AgoraRTC.createClient({
            mode: 'interop'
        });

        this.client.init(this.appId, ()=> {
            console.log("AgoraRTC client initialized");
            this.appendCheckStatus('AgoraRTC client initialized');
           
        },  (err) => {
            console.log("AgoraRTC client init failed", err);
            this.appendCheckStatus('AgoraRTC client init failed: ' + err, 3);
        });
        
        this.bindEvent();
        this.bindClientEvent();
        this.getDevices();
    
       
    },
    
    bindEvent(){
        $('body').on('click', '[btn-join]', (e)=>{
            this.join();
            $(e.currentTarget).attr('disabled', true);
            $('button[btn-leave]').attr('disabled', null);

            if(this.isHost) {
                $('button[btn-publish]').attr('disabled', null);
                $('button[btn-unpublish]').attr('disabled', null);
            }
            
            
        }).on('click', '[btn-leave]', (e)=>{
            $(e.currentTarget).attr('disabled', true);
            $('button[btn-join]').attr('disabled', null);
            $('button[btn-publish]').attr('disabled', true);
            $('button[btn-unpublish]').attr('disabled', true);

            this.leave();
        }).on('click', '[btn-publish]', (e)=>{
            $(e.currentTarget).attr('disabled', true);
            $('button[btn-unpublish]').attr('disabled', null);

            this.publish();
        }).on('click', '[btn-unpublish]', (e)=>{
            $(e.currentTarget).attr('disabled', true);
            $('button[btn-publish]').attr('disabled', null);
            this.unpublish();
        })
    },
    bindClientEvent(){
         // channelKey = "";
        let client = this.client;
        client.on('error', (err)  => {
            console.log("Got error msg:", err.reason);
            if (err.reason === 'DYNAMIC_KEY_TIMEOUT') {
                this.getChannelKey(()=>{
                    this.client.renewChannelKey(channelKey, function(){
                        console.log("Renew channel key successfully");
                    }, function(err){
                        console.log("Renew channel key failed: ", err);
                    });
                });
               
            }
        });
    
        client.on('stream-added', function (evt) {
            let stream = evt.stream;
            console.log("New stream added: " + stream.getId());
            console.log("Subscribe ", stream);
            client.subscribe(stream, function (err) {
                console.log("Subscribe stream failed", err);
            });
        });
    
        client.on('stream-subscribed', function (evt) {
            let stream = evt.stream;
            console.log("Subscribe remote stream successfully: " + stream.getId());
            if ($('#video_remote_'+stream.getId()).length === 0) {
                $('[video-remote-wrap]').append(`
                <div class="video-remote" id="video_remote_${stream.getId()}"></div>
                `);
            }
            stream.play(`video_remote_${stream.getId()}`);
        });
    
        client.on('stream-removed', function (evt) {
            let stream = evt.stream;
            stream.stop();
            $(`#video_remote_${stream.getId()}`).remove();
            console.log("Remote stream is removed " + stream.getId());
        });
    
        client.on('peer-leave', function (evt) {
            let stream = evt.stream;
            if (stream) {
                stream.stop();
                $(`#video_remote_${stream.getId()}`).remove();
                console.log(evt.uid + " leaved from this channel");
            }
        });
    },
    getDevices () {
        AgoraRTC.getDevices((devices) => {
            for (let i = 0; i !== devices.length; ++i) {
                let device = devices[i];
                if (device.kind === 'audioinput') {
                    this.audioList.push({
                        text: device.label || 'microphone ' + (this.audioList.length + 1),
                        value: device.deviceId
                    });
                    
                } else if (device.kind === 'videoinput') {
                    this.videoList.push({
                        text: device.label || 'camera ' + (this.videoList.length + 1),
                        value: device.deviceId
                    });
                } else {
                    console.log('Some other kind of source/device: ', device);
                }
            }

            if(this.audioList.length) {
                this.appendCheckStatus('Audio device ok');
                for(let v of this.audioList) {
                    this.$audioWrap.append(`<option value="${v.value}" >${v.text}</option>`);
                }
            } else {
                this.appendCheckStatus('Audio device disabled', 2);
            }

            if(this.videoList.length) {
                this.appendCheckStatus('Video device ok');
                for(let v of this.videoList) {
                    this.$videoWrap.append(`<option value="${v.value}" >${v.text}</option>`);
                }
            } else {
                this.appendCheckStatus('Audio device disabled', 2);
            }
        });
    },
    setup (callback){
        
        let channel_id = $('input[input-channel-id]').val();
        let user_id = $('input[input-user-id]').val();
        let is_host = $('input[checkbox-is-host]')[0].checked;

        this.isHost = is_host;
        this.channelId = channel_id ? channel_id.toString() : null;
        this.userId = user_id ? parseInt(user_id) : null;

        if(this.channelId) {
            this.appendCheckStatus('Channel Id ok');
        } else {
            this.appendCheckStatus('Channel Id is empty ', 2);
        }

        if(this.userId) {
            this.appendCheckStatus('User Id  ok');
        } else {
            this.appendCheckStatus('User Id is empty', 2);
        }

        if(this.appId) {
            this.appendCheckStatus('App Id ok');
        } else {
            this.appendCheckStatus('App Id is empty', 2);
        }

        this.getChannelKey(callback);
    },
    getChannelKey (callback) {
        $.get(this.URL.key, {
            'channel_id': this.channelId,
            'user_id': this.userId,
        }, (ret) => {
            if(ret && ret.errno == 0) {
                this.channelKey = ret.data.channel_key
                if(this.channelKey) {
                    this.appendCheckStatus('channel key = ' + this.channelKey);
                } else {
                    this.appendCheckStatus('channel key = ' + this.channelKey, 3);
                }
                callback && callback();
            } else {
                this.appendCheckStatus('channel key init error', 3);
                // alert(JSON.stringify(ret));
            }
        });
    },
    join (){
        this.setup(()=>{
            this.client.join(this.channelKey, this.channelId, this.userId, (streamID) => {
                console.log("User " + streamID + " join channel successfully");
                this.appendCheckStatus("Join channel successfully");

                if (this.isHost) {
                    let camera = this.$videoWrap.val();
                    let microphone = this.$audioWrap.val();
                    console.log('AgoraRTC.createStream');
                    let param = {
                        streamID: streamID, 
                        audio: true, 
                        cameraId: camera, 
                        microphoneId: microphone, 
                        video: true, 
                        screen: false
                    }
                    this.localStream = AgoraRTC.createStream(param);
                    this.localStream.setVideoProfile('320p_3');
                    this.localStream.init(()=> {
                        console.log("getUserMedia successfully");
                        this.localStream.play('video_local');
                        this.client.publish(this.localStream, (err) => {
                            console.log("Publish local stream error: " + err);
                        });
    
                        this.client.on('stream-published', (evt) => {
                            console.log("Publish local stream successfully");
                        });
                    }, (err) => {
                        console.log("getUserMedia failed", err);
                    });
                } else {
                    this.appendCheckStatus("not Host", 2);
                }
            }, function(err) {
                console.log("Join channel failed", err);
            });
        });
        
    },
    leave() {
        this.client.leave(function () {
            console.log("Leavel channel successfully");
        }, function (err) {
            console.log("Leave channel failed");
        });
    },
    unpublish() {
        this.client.unpublish(this.localStream,  (err) => {
          console.log("Unpublish local stream failed" + err);
        });
    },
    publish() {
        this.client.publish(this.localStream, function (err) {
            console.log("Publish local stream error: " + err);
        });
    }
      
}


$(document).ready(function(){
    const app = new App();
});