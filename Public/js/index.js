// onload
window.onload = function () {
    // constant
    const video = document.querySelector('#live-camera');
    const processThreshold = 5;
    const canvasSelection = document.querySelector('#canvasSelection');
    const canvasLive = document.querySelector('#canvasLive');
    const captionText = document.querySelector('#captionText');
    const scheduler = Tesseract.createScheduler();
    const synth = window.speechSynthesis;
    const multilineSwitch = document.querySelector('#multiline');
    const speech = document.querySelector('#speech');
    const lowercase = document.querySelector('#lowercase');
    const fontsize = document.querySelector('#fontsize');

    fontsize.onchange = function () {
        captionText.style.fontSize = fontsize.value.toString() + 'vh';
    }


    // init workers
    for (let i = 0; i < 5; ++i) {
        (async () => {
            let worker = Tesseract.createWorker();
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            await scheduler.addWorker(worker);
        })();
    }

    // global var
    let cameraHeight;
    let cameraWidth;
    let processInterval = 1000;
    let processCounter = 0;
    // center the source section
    let sWidth = 240;
    let sHeight = 120;
    let sX;
    let sY;

    const speak = (msg) => {
        let u = new SpeechSynthesisUtterance(msg);
        if (!synth.speaking)
            synth.speak(u);
    };

    function preview() {
        // fill shade
        canvasLive.height = cameraHeight;
        canvasLive.width = cameraWidth;
        canvasLive.getContext("2d").drawImage(video, 0, 0);
        let canvasLiveContext = canvasLive.getContext('2d');
        canvasLiveContext.strokeStyle = 'red';
        canvasLiveContext.strokeRect(sX, sY, sWidth, sHeight);
    }

    function screenshot() {
        // center the source section
        let sWidth = 240;
        let sHeight = 120;
        let sX = (cameraWidth - sWidth) / 2;
        let sY = (cameraHeight - sHeight) / 2;
        // set css properties
        canvasSelection.height = sHeight;
        canvasSelection.width = sWidth;

        canvasSelection.getContext("2d").drawImage(video, sX, sY, sWidth, sHeight, 0, 0, sWidth, sHeight);
        if (processCounter <= processThreshold) {
            processCounter++; // increase counter

            // console.log(dataUrl);
            // based on example code from
            // https://github.com/naptha/tesseract.js/blob/master/docs/examples.md
            (async () => {
                const {data: {text}} = await scheduler.addJob('recognize', canvasSelection);
                let result = text;

                // check multiline
                if (multilineSwitch.checked)
                    result = text.toString().replaceAll(/\r?\n|\r/g, ' '); // replace new line with space
                else
                    result = result.split('\n')[0].trim();

                // check lowercase
                if (lowercase.checked)
                    result = result.toLowerCase();

                result = result.toString().replaceAll(/\s{2,}|[^\sa-zA-Z0-9]/g, ''); // replace abnormal char
                result = result.trim();
                t = result.split(' ');
                result = [];
                let len = 0;
                while (t.length > 0 && len < 10) {
                    result.push(t[0]);
                    len++;
                    t.shift();
                }
                result = result.join(' ');

                // remove short and sparse results
                let sparse = [...result.matchAll(/\s/g)].length;
                if (sparse >= result.length / 2 - 1) {
                    result = '';
                }

                console.log('result => ' + result);
                // update counter
                processCounter--; // decrease counter
                if (result.length > 3) {
                    handleResult(result);
                }
            })();
        }
    }

    function handleResult(result) {
        // update caption
        captionText.innerText = result;
        if (speech.checked)
            speak(result);
    }

    function handleSuccess(stream) {
        // log
        console.log('Open camera succeeded!');
        console.log(stream);
        video.videoWidth = stream.getVideoTracks()[0].getSettings().width;
        video.videoHeight = stream.getVideoTracks()[0].getSettings().height;
        mdui.snackbar('Camera access granted!')

        // attach stream to video element
        video.srcObject = stream;
        video.play();

        // screenshots
        cameraHeight = stream.getVideoTracks()[0].getSettings().height;
        cameraWidth = stream.getVideoTracks()[0].getSettings().width;
        // This is a bug of HTML since it will obtain ZERO
        // console.log('videoWidth ' + video.videoWidth);
        // console.log('videoHeight ' + video.videoHeight);

        // update sX sY
        sX = (cameraWidth - sWidth) / 2;
        sY = (cameraHeight - sHeight) / 2;

        // lazy load
        setTimeout(() => {
            document.querySelector('#loading').setAttribute('style', 'display: none');
            // update preview
            setInterval(preview, 33); // 30fps
            // trigger ocr engine
            setInterval(screenshot, processInterval);
        }, 4000);

    }

    function handleError(e) {
        // log
        console.log('Open camera failed!');
        console.log(e);
        mdui.snackbar('Camera access denied!');
    }

    // Media Streams API specification
    // https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API/Constraints
    let constraints = {
        video: true
    };

    // trigger camera
    navigator.mediaDevices.getUserMedia(constraints)
        .then(handleSuccess)
        .catch(handleError);
}
