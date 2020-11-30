// onload
window.onload = function () {
    // constant
    const video = document.querySelector('#live-camera');
    const canvas = document.querySelector('#canvas');
    const img = document.querySelector('#screenshot');
    const worker = Tesseract.createWorker();
    (async () => {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
    })();


    function screenshot() {
        canvas.getContext("2d").drawImage(video, 0, 0);
        img.src = canvas.toDataURL("image/webp");
        recognize(img.src);
    }

    function recognize(dataUrl) {
        // console.log(dataUrl);
        // based on example code from
        // https://github.com/naptha/tesseract.js/blob/master/docs/examples.md
        (async () => {
            const {data: {text}} = await worker.recognize(dataUrl);
            let result = text.toString().replaceAll(/(\s{2,}|[^\sa-zA-Z0-9])/g, '');
            console.log('len = ' + result.length);
            console.log('result => ' + result);
        })();
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
        canvas.width = stream.getVideoTracks()[0].getSettings().width;
        canvas.height = stream.getVideoTracks()[0].getSettings().height;
        // This is a bug of HTML since it will obtain ZERO
        // console.log('videoWidth ' + video.videoWidth);
        // console.log('videoHeight ' + video.videoHeight);

        // trigger ocr engine
        setInterval(screenshot, 1000);
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
